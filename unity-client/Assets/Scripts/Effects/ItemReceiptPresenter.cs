using System;
using System.Collections.Generic;
using System.Globalization;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using TuTienLive.Characters;
using TuTienLive.Models;
using TuTienLive.Network;
using TuTienLive.Scenes;

namespace TuTienLive.Effects
{
    // Cosmetic receipt playback only. Never infer awards from inventory or replay them from snapshots.
    [DefaultExecutionOrder(100), DisallowMultipleComponent]
    public sealed class ItemReceiptPresenter : MonoBehaviour
    {
        public UnityWebSocketClient network;
        public CharacterManager characters;
        public CameraRig cameraRig;
        public Canvas canvas;
        public RectTransform visualRoot, iconTransform;
        public CanvasGroup visual;
        public Image icon, glow;
        public TMP_Text label;
        public Sprite tea, pill, root;
        [Range(2,6)] public float zoomHalfHeight=2.4f;
        [Min(1)] public int maxQueuedReceipts=32;
        public bool mergeReceipts=true;
        public bool waitForTribulation=false;
        public float Elapsed { get; private set; }
        public string ActiveUserId => active?.UserId;
        public string ActiveItem => active?.Item;
        public long ActiveCount => active?.Count ?? 0;
        public int QueuedCount => pending.Count;
        public int DroppedVisuals { get; private set; }
        private sealed class Receipt { public string UserId, Item; public long Count; public float ReceivedAt; }
        private readonly LinkedList<Receipt> pending=new LinkedList<Receipt>();
        private readonly HashSet<string> seen=new HashSet<string>(StringComparer.Ordinal);
        private readonly Queue<string> seenOrder=new Queue<string>();
        private readonly Dictionary<Transform,Vector3> nameplates=new Dictionary<Transform,Vector3>();
        private readonly Vector3[] nameCorners=new Vector3[4];
        private Receipt active;
        private Snapshot snapshot;
        private string session;
        private ProtocolSession bound;
        private static readonly CultureInfo Vietnamese=CultureInfo.GetCultureInfo("vi-VN");
        private void OnEnable(){Bind();Hide();}
        private void LateUpdate()
        {
            Bind();if(bound!=null&&snapshot!=bound.State.Snapshot)ApplySnapshot(bound.State.Snapshot,bound.State.SessionId);
            Advance(Mathf.Min(.1f,Time.unscaledDeltaTime));
        }
        private void Bind()
        {
            var protocol=network?network.Protocol:null;if(bound==protocol)return;
            Unbind();bound=protocol;
            if(bound!=null){bound.Events.Received+=HandleEvent;bound.State.Changed+=StateChanged;StateChanged();}
        }
        private void StateChanged(){ApplySnapshot(bound?.State.Snapshot,bound?.State.SessionId);}
        public void ApplySnapshot(Snapshot value,string newSession)
        {
            if(session!=newSession){ResetPresentation();seen.Clear();seenOrder.Clear();session=newSession;}
            snapshot=value;if(value==null)ResetPresentation();
        }
        public void HandleEvent(GameEvent value)
        {
            if(snapshot==null||value==null||value.Kind!="item:received"||string.IsNullOrEmpty(value.UserId)||string.IsNullOrEmpty(value.EventId))return;
            if((string)value.CopyField("scope")=="all"||(string)value.CopyField("source")=="boss_reward"||(string)value.CopyField("source")=="sect_reward")return;
            var item=value.CopyField("item");var count=value.CopyField("count");
            if(item?.Type!=JTokenType.String||SpriteFor((string)item)==null||count?.Type!=JTokenType.Integer||(double)count<1||(double)count>1e9)return;
            if(!seen.Add(value.EventId))return;seenOrder.Enqueue(value.EventId);if(seenOrder.Count>200)seen.Remove(seenOrder.Dequeue());
            var receipt=new Receipt{UserId=value.UserId,Item=(string)item,Count=(long)count,ReceivedAt=Time.realtimeSinceStartup};
            if(mergeReceipts)
            {
                // Only merge into an active receipt before the icon appears; never extend the 3-second camera lock.
                if(active!=null&&Elapsed<.8f&&Same(active,receipt)){Add(active,receipt);return;}
                foreach(var waiting in pending)if(Same(waiting,receipt)){Add(waiting,receipt);return;}
            }
            if(pending.Count>=Mathf.Max(1,maxQueuedReceipts)){pending.RemoveFirst();DroppedVisuals++;}
            pending.AddLast(receipt);
        }
        private static bool Same(Receipt a,Receipt b)=>a.UserId==b.UserId&&a.Item==b.Item;
        private static void Add(Receipt a,Receipt b){a.Count=Math.Min(9007199254740991L,a.Count+b.Count);}
        private Sprite SpriteFor(string item)=>item=="tea"?tea:item=="pill"?pill:item=="root"?root:null;
        private static string NameFor(string item)=>item=="tea"?"Trà ngộ đạo":item=="pill"?"Độ kiếp đan":"Biến dị linh căn";
        public void Advance(float delta)
        {
            if(snapshot==null||!characters||!cameraRig){ResetPresentation();return;}
            bool blocked=snapshot.EffectivePhase!="cultivation"||(waitForTribulation&&characters.tribulation&&characters.tribulation.HasCeremony);
            if(blocked)
            {
                if(active!=null){if(pending.Count>=Mathf.Max(1,maxQueuedReceipts)){pending.RemoveLast();DroppedVisuals++;}pending.AddFirst(active);active=null;Elapsed=0;ReleaseFocus();}
                Hide();return;
            }
            if(snapshot.Phase=="paused"||snapshot.Phase=="stopped"){Render();return;}
            if(active!=null&&!snapshot.Players.ContainsKey(active.UserId)){active=null;ReleaseFocus();Hide();}
            if(active==null)
            {
                while(pending.Count>0)
                {
                    var receipt=pending.First.Value;
                    // A committed grant may arrive just before the snapshot introducing its recipient.
                    if(!snapshot.Players.ContainsKey(receipt.UserId)&&Time.realtimeSinceStartup-receipt.ReceivedAt<2)return;
                    pending.RemoveFirst();
                    if(!snapshot.Players.ContainsKey(receipt.UserId))continue;
                    characters.SetItemFocus(receipt.UserId);
                    if(!characters.Views.ContainsKey(receipt.UserId)){characters.SetItemFocus(null);continue;}
                    active=receipt;Elapsed=0;break;
                }
                if(active==null){Hide();return;}
            }
            Elapsed=Mathf.Min(3,Elapsed+Mathf.Clamp(delta,0,3));
            if(Elapsed>=3){active=null;Elapsed=0;ReleaseFocus();Hide();return;}
            Render();
        }
        private void Render()
        {
            if(active==null||!characters.Views.TryGetValue(active.UserId,out var target)){Hide();return;}
            var body=target.pose.Body;var bounds=body.localBounds;
            var center=body.transform.TransformPoint(bounds.center);
            var head=body.transform.TransformPoint(new Vector3(bounds.center.x,bounds.max.y,bounds.center.z));
            float weight=Elapsed<.8f?Mathf.SmoothStep(0,1,Elapsed/.8f):Elapsed<2.2f?1:1-Mathf.SmoothStep(0,1,(Elapsed-2.2f)/.8f);
            cameraRig.SetReceiptFocus(center,zoomHalfHeight,weight,Elapsed>=2.2f);
            // Retain every name/realm card, compensating zoom without changing authored positions.
            float cardScale=cameraRig.GetComponent<Camera>().orthographicSize/Mathf.Max(.1f,cameraRig.ReceiptBaseHalfHeight);
            foreach(var view in characters.Views.Values)
            {
                var card=view.nameLabel?view.nameLabel.GetComponentInParent<Canvas>():null;
                if(!card)continue;var cardTransform=card.transform;
                if(!nameplates.ContainsKey(cardTransform))nameplates.Add(cardTransform,cardTransform.localScale);
                cardTransform.localScale=nameplates[cardTransform]*cardScale;
            }
            if(!visual||!visualRoot||!icon||!label||!canvas)return;
            float pop=Mathf.Clamp01((Elapsed-.8f)/.4f),rise=Mathf.Clamp01((Elapsed-1.2f));
            visual.alpha=Elapsed<.8f||Elapsed>=2.2f?0:1-Mathf.SmoothStep(0,1,rise);
            var sprite=SpriteFor(active.Item);icon.sprite=sprite;if(glow)glow.sprite=sprite;
            iconTransform.localScale=Vector3.one*Mathf.Lerp(.08f,1,Mathf.SmoothStep(0,1,pop));
            if(glow)glow.rectTransform.localScale=Vector3.one*(1.12f+Mathf.Sin(Elapsed*7)*.035f);
            label.text=snapshot.Players[active.UserId].Name+"\n"+NameFor(active.Item)+" ×"+active.Count.ToString("N0",Vietnamese);
            label.alpha=Mathf.Clamp01((Elapsed-1.1f)/.1f);
            if(target.nameLabel){target.nameLabel.rectTransform.GetWorldCorners(nameCorners);foreach(var corner in nameCorners)head.y=Mathf.Max(head.y,corner.y);}
            var camera=cameraRig.GetComponent<Camera>();
            var point=camera.WorldToScreenPoint(head+Vector3.up*(.22f+rise*.38f));
            if(point.z<=0){visual.alpha=0;return;}
            var parent=(RectTransform)visualRoot.parent;
            if(RectTransformUtility.ScreenPointToLocalPointInRectangle(parent,point,canvas.renderMode==RenderMode.ScreenSpaceOverlay?null:canvas.worldCamera,out var position))
                visualRoot.localPosition=new Vector3(position.x,position.y,0);
        }
        private void ReleaseFocus()
        {
            if(cameraRig)cameraRig.ClearReceiptFocus();
            foreach(var pair in nameplates)if(pair.Key)pair.Key.localScale=pair.Value;nameplates.Clear();
            if(characters)characters.SetItemFocus(null);
        }
        private void Hide(){if(visual)visual.alpha=0;}
        public void ResetPresentation(){active=null;pending.Clear();Elapsed=0;ReleaseFocus();Hide();}
        private void Unbind(){if(bound!=null){bound.Events.Received-=HandleEvent;bound.State.Changed-=StateChanged;}bound=null;}
        private void OnDisable(){Unbind();ResetPresentation();snapshot=null;}
    }
}
