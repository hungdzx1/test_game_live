using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using UnityEngine;
using TuTienLive.Characters;
using TuTienLive.Models;
using TuTienLive.Network;
using TuTienLive.Scenes;

namespace TuTienLive.Effects
{
    // Server promotion events only. Cosmetic layers never calculate levels or mutate player state.
    [DefaultExecutionOrder(110), DisallowMultipleComponent]
    public sealed class LevelUpPresenter : MonoBehaviour
    {
        public UnityWebSocketClient network;
        public CharacterManager characters;
        // title, magic circle, aura, ribbons, beams (optional), sparkles, arrows, lotus.
        public Sprite[] layers=new Sprite[8];
        [Tooltip("Visible alpha bounds in the full source PNG; no PNG pixels are cropped or changed.")]
        public Rect[] visibleRegions=new Rect[8];
        [Range(1,4)] public float duration=2;
        [Range(1,8)] public int simultaneousLimit=8;
        [Range(1,64)] public int queueLimit=32;
        public int ActiveCount { get; private set; }
        public int AcceptedCount { get; private set; }
        public int SkippedVisuals { get; private set; }
        public int QueuedCount=>waiting.Count;
        public int CreatedCount=>pool?.Length??0;
        private sealed class Request { public string user;public float received; }
        private sealed class Visual { public string user;public float elapsed;public SpriteRenderer[] renderers; }
        private readonly List<Request> waiting=new List<Request>();
        private readonly HashSet<string> seen=new HashSet<string>(StringComparer.Ordinal);
        private readonly Queue<string> seenOrder=new Queue<string>();
        private Visual[] pool;
        private Snapshot snapshot;
        private string session;
        private ProtocolSession bound;
        private float clock;
        private readonly Vector3[] nameCorners=new Vector3[4];
        private void OnEnable(){Bind();}
        private void LateUpdate(){Bind();Advance(Time.unscaledDeltaTime);}
        private void Bind()
        {
            var next=network?network.Protocol:null;if(bound==next)return;
            Unbind();bound=next;
            if(bound!=null){bound.Events.Received+=HandleEvent;bound.State.Changed+=StateChanged;StateChanged();}
        }
        private void StateChanged(){ApplySnapshot(bound?.State.Snapshot,bound?.State.SessionId);}
        public void ApplySnapshot(Snapshot value,string newSession)
        {
            if(session!=newSession){ResetPresentation();seen.Clear();seenOrder.Clear();session=newSession;AcceptedCount=0;SkippedVisuals=0;}
            snapshot=value;if(value==null)ResetPresentation();
        }
        private static bool Index(JToken token,int min,int max)=>token?.Type==JTokenType.Integer&&(double)token>=min&&(double)token<=max;
        public void HandleEvent(GameEvent value)
        {
            if(snapshot==null||value==null||string.IsNullOrEmpty(value.UserId)||string.IsNullOrEmpty(value.EventId))return;
            bool promotion=value.Kind=="stage:up"&&Index(value.CopyField("stageIndex"),1,3)
                ||value.Kind=="breakthrough:completed"&&value.CopyField("outcome")?.Type==JTokenType.Boolean&&(bool)value.CopyField("outcome")&&Index(value.CopyField("realmIndex"),1,10);
            if(!promotion||!seen.Add(value.EventId))return;
            seenOrder.Enqueue(value.EventId);if(seenOrder.Count>256)seen.Remove(seenOrder.Dequeue());AcceptedCount++;
            // Multiple earned sub-stages in one server tick share a single bounded celebration.
            if(IsActive(value.UserId)||waiting.Exists(r=>r.user==value.UserId))return;
            if(waiting.Count>=Mathf.Clamp(queueLimit,1,64)){waiting.RemoveAt(0);SkippedVisuals++;}
            waiting.Add(new Request{user=value.UserId,received=clock});
        }
        public bool IsActive(string user){if(pool!=null)foreach(var v in pool)if(v.user==user)return true;return false;}
        public void Advance(float delta)
        {
            if(snapshot==null||!characters){ResetPresentation();return;}
            delta=Mathf.Max(0,delta);if(snapshot.Phase=="paused"||snapshot.Phase=="stopped")delta=0;clock+=delta;
            bool low=characters.scene&&characters.scene.quality==SectQuality.Low;
            int limit=low?Math.Min(2,Mathf.Clamp(simultaneousLimit,1,8)):Mathf.Clamp(simultaneousLimit,1,8);
            if(snapshot.EffectivePhase!="cultivation")
            {
                if(pool!=null)foreach(var v in pool)Release(v);ActiveCount=0;
                ExpireWaiting();return;
            }
            if(pool==null&&waiting.Count>0)CreatePool();ActiveCount=0;
            if(pool!=null)for(int i=0;i<pool.Length;i++)
            {
                var visual=pool[i];if(visual.user==null)continue;visual.elapsed+=delta;
                if(i>=limit||visual.elapsed>=Mathf.Max(.1f,duration)||!characters.Views.TryGetValue(visual.user,out var view)||!view||view.UserId!=visual.user){Release(visual);continue;}
                Render(visual,view,low);ActiveCount++;
            }
            ExpireWaiting();
            if(pool==null||snapshot.Phase=="paused"||snapshot.Phase=="stopped")return;
            for(int i=0;i<waiting.Count;)
            {
                var request=waiting[i];if(!characters.Views.TryGetValue(request.user,out var view)){i++;continue;}
                Visual free=null;for(int n=0;n<limit;n++)if(pool[n].user==null){free=pool[n];break;}
                if(free==null)break;
                free.user=request.user;free.elapsed=0;waiting.RemoveAt(i);Render(free,view,low);ActiveCount++;
            }
        }
        private void ExpireWaiting(){for(int i=waiting.Count-1;i>=0;i--)if(clock-waiting[i].received>8){waiting.RemoveAt(i);SkippedVisuals++;}}
        private void CreatePool()
        {
            pool=new Visual[8];
            for(int n=0;n<pool.Length;n++)
            {
                var visual=new Visual{renderers=new SpriteRenderer[8]};pool[n]=visual;
                var root=new GameObject("Level up pooled "+n){hideFlags=HideFlags.DontSave};root.transform.SetParent(transform,false);
                for(int i=0;i<8;i++)
                {
                    var go=new GameObject("Level up layer "+i){hideFlags=HideFlags.DontSave};go.transform.SetParent(root.transform,false);
                    var renderer=go.AddComponent<SpriteRenderer>();renderer.sprite=layers!=null&&i<layers.Length?layers[i]:null;renderer.enabled=false;visual.renderers[i]=renderer;
                }
            }
        }
        private void Render(Visual visual,CharacterView view,bool low)
        {
            var body=view.pose.Body;if(!body||!body.sprite){Release(visual);return;}
            var bounds=body.bounds;float height=Mathf.Clamp(bounds.size.y,.25f,5);
            float t=visual.elapsed,life=Mathf.Max(.1f,duration),alpha=Mathf.Clamp01(t/.12f)*Mathf.Clamp01((life-t)/.45f);
            float pop=Mathf.Lerp(.8f,1,Mathf.SmoothStep(0,1,t/.22f));
            var foot=new Vector3(bounds.center.x,bounds.min.y,body.transform.position.z);
            for(int i=0;i<8;i++)
            {
                var renderer=visual.renderers[i];bool reduced=i==0||i==1||i==2||i==7;
                renderer.enabled=renderer.sprite&&(!low||reduced)&&alpha>0;if(!renderer.enabled)continue;
                float width=height,up=.5f,opacity=1,angle=0;
                switch(i)
                {
                    case 0:width=height*1.18f;up=1.15f+Mathf.Clamp01(t/life)*.08f;break;
                    case 1:width=height*1.35f*(1+Mathf.Sin(t*7)*.025f);up=.015f;opacity=.9f;break;
                    case 2:width=height*1.08f;up=.52f;opacity=.48f;break;
                    case 3:width=height*1.3f;up=.43f;opacity=.72f;angle=Mathf.Sin(t*3)*4;break;
                    case 4:width=height*1.05f;up=.6f;opacity=.5f;break;
                    case 5:width=height*1.18f;up=.55f;opacity=.6f+.3f*Mathf.Sin(t*9);break;
                    case 6:width=height*1.25f;up=.65f+Mathf.Sin(t*4)*.045f;opacity=.9f;break;
                    case 7:width=height*1.18f;up=-.08f;opacity=.9f;break;
                }
                var region=visibleRegions!=null&&i<visibleRegions.Length?visibleRegions[i]:new Rect(0,0,1,1);
                if(region.width<=0||region.height<=0)region=new Rect(0,0,1,1);
                var sprite=renderer.sprite.bounds;float scale=width*pop/Mathf.Max(.01f,sprite.size.x*region.width);
                var offset=new Vector3(sprite.min.x+sprite.size.x*region.center.x,sprite.min.y+sprite.size.y*region.center.y,0)*scale;
                var anchor=foot+Vector3.up*(height*up);
                if(i==0&&view.nameLabel)
                {
                    view.nameLabel.rectTransform.GetWorldCorners(nameCorners);float top=nameCorners[0].y;
                    foreach(var corner in nameCorners)top=Mathf.Max(top,corner.y);
                    float visibleHeight=sprite.size.y*region.height*scale;
                    anchor.y=Mathf.Max(anchor.y,top+visibleHeight*.5f+height*.06f);
                }
                var rotation=Quaternion.Euler(0,0,angle);renderer.transform.SetPositionAndRotation(anchor-rotation*offset,rotation);renderer.transform.localScale=Vector3.one*scale;
                renderer.sortingLayerID=body.sortingLayerID;renderer.sortingOrder=body.sortingOrder+(i==1||i==2||i==4||i==7?-2:3);
                renderer.color=new Color(1,1,1,alpha*opacity);
            }
        }
        private static void Release(Visual visual){visual.user=null;visual.elapsed=0;foreach(var renderer in visual.renderers)if(renderer)renderer.enabled=false;}
        public void ResetPresentation(){waiting.Clear();if(pool!=null)foreach(var v in pool)Release(v);ActiveCount=0;clock=0;}
        private void Unbind(){if(bound!=null){bound.Events.Received-=HandleEvent;bound.State.Changed-=StateChanged;}bound=null;}
        private void OnDisable(){Unbind();ResetPresentation();snapshot=null;}
    }
}
