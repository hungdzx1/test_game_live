using System;
using System.Collections.Generic;
using System.Globalization;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using TuTienLive.Models;
using TuTienLive.Network;
using TuTienLive.Scenes;

namespace TuTienLive.Effects
{
    // A short cosmetic pulse from the committed activation event. Buff math stays on Node.
    // GameAudioManager already owns the blessing SFX; this presenter never plays another copy.
    [DefaultExecutionOrder(200), DisallowMultipleComponent]
    public sealed class BlessingReceiptPresenter : MonoBehaviour
    {
        public UnityWebSocketClient network;
        public CameraRig cameraRig;
        public SectSceneController scene;
        public RectTransform popRoot;
        public CanvasGroup visual;
        public Image artwork;
        public TMP_Text countLabel;
        public CanvasGroup donorVisual;
        public TMP_Text donorLabel;
        public DonorAvatarView donorAvatar;
        public string DonorName { get; private set; }
        public int QueuedCount=>pending.Count;
        public int DroppedVisuals { get; private set; }
        [Range(.5f,2)] public float duration=2;
        public bool shakeCamera=true;
        public bool IsVisible { get; private set; }
        public long Count { get; private set; }
        public float Elapsed { get; private set; }
        private ProtocolSession bound;
        private Snapshot snapshot;
        private string session;
        private bool serverAllowsShake=true;
        private readonly HashSet<string> seen=new HashSet<string>(StringComparer.Ordinal);
        private readonly Queue<string> seenOrder=new Queue<string>();
        private sealed class Pulse { public long count;public string id,name,avatar; }
        private readonly Queue<Pulse> pending=new Queue<Pulse>();
        private string donorId;
        private static readonly CultureInfo Vietnamese=CultureInfo.GetCultureInfo("vi-VN");
        private void OnEnable(){Hide();Refresh();}
        public void Refresh()
        {
            var protocol=network?network.Protocol:null;
            if(bound==protocol)return;
            Unbind();bound=protocol;
            if(bound!=null){bound.State.Changed+=StateChanged;bound.Events.Received+=HandleEvent;StateChanged();}
            else ApplySnapshot(null,null);
        }
        private void LateUpdate(){Refresh();Advance(Time.unscaledDeltaTime);}
        private void StateChanged()=>ApplySnapshot(bound?.State.Snapshot,bound?.State.SessionId);
        public void ApplySnapshot(Snapshot value,string newSession)
        {
            if(session!=newSession){Hide();seen.Clear();seenOrder.Clear();session=newSession;}
            snapshot=value;serverAllowsShake=(string)(value?.CopyField("config") as JObject)?["graphics"]!="low";if(value==null)Hide();
        }
        public void HandleEvent(GameEvent value)
        {
            if(!isActiveAndEnabled||snapshot==null||value==null||value.Kind!="blessing:activated"||string.IsNullOrEmpty(value.EventId))return;
            var count=value.CopyField("count");
            if(count?.Type!=JTokenType.Integer||(double)count<1||(double)count>9007199254740991d||!seen.Add(value.EventId))return;
            seenOrder.Enqueue(value.EventId);if(seenOrder.Count>256)seen.Remove(seenOrder.Dequeue());
            var donor=value.CopyField("donor") as JObject;var pulse=new Pulse{count=(long)count,id=(string)donor?["userId"],name=(string)donor?["name"],avatar=(string)donor?["avatar"]};
            if(IsVisible&&pulse.id!=donorId){if(pending.Count<32)pending.Enqueue(pulse);else DroppedVisuals++;return;}
            if(!IsVisible)StartPulse(pulse);
            // Burst activations share a pulse without extending its lifetime indefinitely.
            Count=Math.Min(9007199254740991L,Count+(long)count);Render();
        }
        private void StartPulse(Pulse pulse)
        {
            Elapsed=0;Count=0;IsVisible=true;donorId=pulse.id;DonorName=pulse.name;
            bool attributed=!string.IsNullOrWhiteSpace(pulse.id)&&!string.IsNullOrWhiteSpace(pulse.name);
            if(donorVisual)donorVisual.alpha=attributed?1:0;if(donorLabel)donorLabel.text=attributed?pulse.name:"";
            if(donorAvatar){if(attributed)donorAvatar.Present(pulse.name,pulse.avatar);else donorAvatar.Hide();}
        }
        public void Advance(float delta)
        {
            if(snapshot==null){Hide();return;}if(!IsVisible)return;
            Elapsed+=Mathf.Max(0,delta);
            if(Elapsed>=Mathf.Clamp(duration,.5f,2))
            {
                ClearPulse();if(pending.Count>0){var next=pending.Dequeue();StartPulse(next);Count=next.count;Render();}return;
            }Render();
        }
        private void Render()
        {
            float length=Mathf.Clamp(duration,.5f,2),t=Elapsed/length;
            if(visual)visual.alpha=t<.1f?Mathf.SmoothStep(0,1,t/.1f):1-Mathf.SmoothStep(0,1,(t-.7f)/.3f);
            float scale=t<.18f?Mathf.Lerp(.25f,1.08f,Mathf.SmoothStep(0,1,t/.18f)):t<.32f?Mathf.Lerp(1.08f,1,(t-.18f)/.14f):1;
            if(popRoot)popRoot.localScale=Vector3.one*scale;
            if(countLabel)countLabel.text="Ban Phúc ×"+Count.ToString("N0",Vietnamese);
            bool allowed=shakeCamera&&serverAllowsShake&&(!scene||scene.quality!=SectQuality.Low);
            float strength=cameraRig?Mathf.Min(.035f,cameraRig.GetComponent<Camera>().orthographicSize*.0035f):0;
            float envelope=allowed?Mathf.Clamp01(1-Elapsed/.28f):0;
            if(cameraRig)cameraRig.SetBlessingShake(new Vector2(Mathf.Sin(Elapsed*94),Mathf.Sin(Elapsed*123))*(strength*envelope));
        }
        public void Hide()
        {pending.Clear();ClearPulse();}
        private void ClearPulse()
        {
            IsVisible=false;Count=0;Elapsed=0;if(visual)visual.alpha=0;
            donorId=DonorName=null;if(donorVisual)donorVisual.alpha=0;if(donorAvatar)donorAvatar.Hide();
            if(popRoot)popRoot.localScale=Vector3.one;if(cameraRig)cameraRig.SetBlessingShake(Vector2.zero);
        }
        private void Unbind(){if(bound!=null){bound.State.Changed-=StateChanged;bound.Events.Received-=HandleEvent;}bound=null;}
        private void OnDisable(){Unbind();snapshot=null;Hide();}
    }
}
