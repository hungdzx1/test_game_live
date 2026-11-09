using System;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using TuTienLive.Characters;
using TuTienLive.Models;
using TuTienLive.Network;

namespace TuTienLive.Effects
{
    // Whole-sect receipts never request roster focus or touch a camera transform.
    [DefaultExecutionOrder(115),DisallowMultipleComponent]
    public sealed class GroupReceiptPresenter : MonoBehaviour
    {
        public UnityWebSocketClient network;
        public CharacterManager characters;
        public ItemReceiptPresenter items;
        public Canvas canvas;
        public RectTransform template;
        public int ActiveCount { get; private set; }
        public int CreatedCount=>pool.Count;
        private sealed class Visual { public RectTransform root;public CanvasGroup alpha;public Image icon;public TMP_Text text;public string user,item;public long count;public float age; }
        private sealed class Receipt { public string user,item;public long count;public float age; }
        private readonly List<Receipt> pending=new List<Receipt>();
        private readonly List<Visual> pool=new List<Visual>();
        private readonly HashSet<string> seen=new HashSet<string>(StringComparer.Ordinal);
        private readonly Queue<string> seenOrder=new Queue<string>();
        private readonly Vector3[] corners=new Vector3[4];
        private Snapshot snapshot;
        private string session;
        private ProtocolSession bound;
        private void OnEnable(){Bind();}
        private void LateUpdate(){Bind();Advance(Time.unscaledDeltaTime);}
        private void Bind(){var next=network?network.Protocol:null;if(next==bound)return;Unbind();bound=next;if(bound!=null){bound.Events.Received+=HandleEvent;bound.State.Changed+=Changed;Changed();}}
        private void Changed(){ApplySnapshot(bound?.State.Snapshot,bound?.State.SessionId);}
        public void ApplySnapshot(Snapshot value,string id){if(session!=id){ResetPresentation();seen.Clear();seenOrder.Clear();session=id;}snapshot=value;if(value==null)ResetPresentation();}
        public void HandleEvent(GameEvent value)
        {
            if(snapshot==null||value?.Kind!="item:received"||value.UserId==null||value.EventId==null||!characters||!items)return;
            if((string)value.CopyField("scope")!="all"&&(string)value.CopyField("source")!="boss_reward"&&(string)value.CopyField("source")!="sect_reward")return;
            string item=(string)value.CopyField("item");var count=value.CopyField("count");var sprite=SpriteFor(item);
            if((!sprite&&item!="camera")||count?.Type!=Newtonsoft.Json.Linq.JTokenType.Integer||(double)count<1||(double)count>1e9||!seen.Add(value.EventId))return;
            seenOrder.Enqueue(value.EventId);if(seenOrder.Count>1000)seen.Remove(seenOrder.Dequeue());
            Visual visual=pool.Find(v=>v.user==value.UserId&&v.item==item);
            if(visual!=null){visual.count=Math.Min(9007199254740991L,visual.count+(long)count);return;}
            var waiting=pending.Find(v=>v.user==value.UserId&&v.item==item);
            if(waiting!=null){waiting.count=Math.Min(9007199254740991L,waiting.count+(long)count);return;}
            if(pending.Count>=500)pending.RemoveAt(0);pending.Add(new Receipt{user=value.UserId,item=item,count=(long)count});
        }
        private void StartReceipt(Receipt receipt)
        {
            Visual visual;
            visual=pool.Find(v=>v.user==null);
            if(visual==null&&pool.Count<25&&template)
            {
                var root=Instantiate(template,template.parent);root.name="Whole sect receipt pooled "+pool.Count;root.gameObject.hideFlags=HideFlags.DontSave;root.gameObject.SetActive(true);
                visual=new Visual{root=root,alpha=root.GetComponent<CanvasGroup>(),icon=root.GetComponentInChildren<Image>(),text=root.GetComponentInChildren<TMP_Text>()};pool.Add(visual);
            }
            if(visual==null)return;visual.user=receipt.user;visual.item=receipt.item;visual.count=receipt.count;visual.age=0;visual.icon.sprite=SpriteFor(receipt.item);visual.icon.enabled=visual.icon.sprite;
        }
        private Sprite SpriteFor(string item)=>item=="tea"?items.tea:item=="root"?items.root:item=="pill"?items.pill:null;
        public void Advance(float delta)
        {
            if(snapshot==null||!characters||!items||!canvas){ResetPresentation();return;}
            ActiveCount=0;var camera=items.cameraRig.GetComponent<Camera>();
            foreach(var receipt in pending)receipt.age+=Mathf.Max(0,delta);
            for(int i=pending.Count-1;i>=0;i--)
            {
                var receipt=pending[i];
                if(characters.Views.ContainsKey(receipt.user)&&(pool.Count<25||pool.Exists(v=>v.user==null))){StartReceipt(receipt);pending.RemoveAt(i);}
                else if(receipt.age>2)pending.RemoveAt(i);
            }
            foreach(var visual in pool)
            {
                if(visual.user==null)continue;visual.age+=Mathf.Max(0,delta);
                if(visual.age>=1.8f||!characters.Views.TryGetValue(visual.user,out var view)){Release(visual);continue;}
                ActiveCount++;float t=visual.age;visual.alpha.alpha=Mathf.Clamp01(t/.15f)*Mathf.Clamp01((1.8f-t)/.5f);
                visual.root.localScale=Vector3.one*Mathf.Lerp(.7f,1,Mathf.SmoothStep(0,1,t/.2f));
                var body=view.pose.Body;float top=body.bounds.max.y;
                if(view.nameLabel){view.nameLabel.rectTransform.GetWorldCorners(corners);foreach(var corner in corners)top=Mathf.Max(top,corner.y);}
                var point=camera.WorldToScreenPoint(new Vector3(body.bounds.center.x,top+.6f+t*.14f,body.transform.position.z));
                if(point.z<=0){visual.alpha.alpha=0;continue;}
                if(RectTransformUtility.ScreenPointToLocalPointInRectangle((RectTransform)template.parent,point,canvas.renderMode==RenderMode.ScreenSpaceOverlay?null:canvas.worldCamera,out var local))visual.root.localPosition=new Vector3(local.x,local.y,0);
                visual.text.text=(visual.item=="camera"?"Quay Cam ":"")+"×"+visual.count.ToString("N0");
                visual.text.fontSize=visual.item=="camera"?14:20;visual.text.rectTransform.anchoredPosition=new Vector2(0,visual.item=="camera"?8:-28);
            }
        }
        private static void Release(Visual visual){visual.user=visual.item=null;visual.alpha.alpha=0;}
        public void ResetPresentation(){pending.Clear();foreach(var v in pool)Release(v);ActiveCount=0;}
        private void Unbind(){if(bound!=null){bound.Events.Received-=HandleEvent;bound.State.Changed-=Changed;}bound=null;}
        private void OnDisable(){Unbind();ResetPresentation();snapshot=null;}
    }
}
