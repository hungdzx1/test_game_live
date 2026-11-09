using System;
using System.Linq;
using UnityEngine;
using TuTienLive.Characters;
using TuTienLive.Models;
using TuTienLive.Network;
using TuTienLive.Scenes;

namespace TuTienLive.Effects
{
    // Gift receipts own the high-priority channel. Arrivals and occasional random shots share ambient focus.
    [DefaultExecutionOrder(90),DisallowMultipleComponent]
    public sealed class IdleCameraPresenter : MonoBehaviour
    {
        public UnityWebSocketClient network;
        public CharacterManager characters;
        public CameraRig rig;
        public ItemReceiptPresenter receipts;
        [Min(1)] public float idleSeconds=15;
        [Min(1),Tooltip("Time moving across the scene, excluding the 0.8-second entry and return.")] public float panSeconds=20;
        [Min(1),Tooltip("Time holding the random zoom, excluding the 0.8-second entry and return.")] public float zoomSeconds=5;
        [Min(3),Tooltip("Total duration of a random tribulation-follow shot, including transitions.")] public float followSeconds=8;
        [Range(.1f,1)] public float returnSeconds=.35f;
        public float IdleTime { get; private set; }
        public string Mode { get; private set; }="overview";
        public string Subject { get; private set; }
        public Func<int,int> ChooseIndex;
        private readonly System.Random random=new System.Random();
        private ProtocolSession bound;
        private Snapshot snapshot;
        private string session,focusUser;
        private Vector3 origin,start,target,returnStart;
        private float originalHalf,startHalf,currentHalf,shot,hold,focusLeft,returnAge,returnHalf;
        private bool captured;
        private void OnEnable(){Bind();}
        private void LateUpdate(){Bind();Advance(Time.unscaledDeltaTime);}
        private void Bind(){var next=network?network.Protocol:null;if(next==bound)return;Unbind();bound=next;if(bound!=null){bound.Events.Received+=HandleEvent;bound.State.Changed+=Changed;Changed();}}
        private void Changed()=>ApplySnapshot(bound?.State.Snapshot,bound?.State.SessionId);
        public void ApplySnapshot(Snapshot value,string id){if(id!=session){ResetPresentation();session=id;}snapshot=value;if(value==null)ResetPresentation();}
        public void HandleEvent(GameEvent value)
        {
            if(snapshot==null||value==null)return;
            if(value.Kind=="player:joined"){IdleTime=0;return;}
            if(value.Kind=="blessing:activated"){hold=2;IdleTime=0;return;}
            if(value.Kind=="item:received")
            {
                bool all=(string)value.CopyField("scope")=="all"||(string)value.CopyField("source")=="boss_reward"||(string)value.CopyField("source")=="sect_reward";
                if(all){hold=2;IdleTime=0;return;}
                if((string)value.CopyField("item")=="blessing")return;
                IdleTime=0;
            }
            if(value.Kind=="camera:focus"&&value.UserId!=null){focusUser=value.UserId;focusLeft=3;IdleTime=0;}
        }
        private int Pick(int count)=>Mathf.Clamp(ChooseIndex!=null?ChooseIndex(count):random.Next(count),0,count-1);
        private static Vector3 Center(CharacterView view)=>view.pose.Body.transform.TransformPoint(view.pose.Body.localBounds.center);
        private void StartShot(string mode,string user)
        {
            Mode=mode;Subject=user;shot=0;start=rig.transform.position;startHalf=rig.GetComponent<Camera>().orthographicSize;
            target=start;currentHalf=startHalf;characters.SetAmbientFocus(user);
        }
        private void Return()
        {
            if(Mode=="return")return;Mode="return";Subject=null;returnAge=0;returnStart=rig.transform.position;returnHalf=rig.GetComponent<Camera>().orthographicSize;characters.SetAmbientFocus(null);
        }
        private void MoveTo(Vector3 center,float half,float delta)
        {
            float t=1-Mathf.Exp(-Mathf.Max(0,delta)*7);target=Vector3.Lerp(rig.transform.position,center,t);currentHalf=Mathf.Lerp(rig.GetComponent<Camera>().orthographicSize,half,t);rig.SetAmbientFocus(target,currentHalf,1);
        }
        public void Advance(float delta)
        {
            if(snapshot==null||!characters||!rig){ResetPresentation();return;}
            if(!captured){if(rig.HasReceiptFocus)return;origin=rig.OverviewPosition;originalHalf=rig.OverviewHalfHeight;captured=true;}
            delta=Mathf.Clamp(delta,0,60);
            if(snapshot.EffectivePhase!="cultivation")
            {
                rig.ClearAmbientFocus();characters.SetAmbientFocus(null);Mode="overview";Subject=null;IdleTime=shot=0;return;
            }
            if(snapshot.Phase=="paused"||snapshot.Phase=="stopped")return;
            // Preserve the current pose until the receipt presenter captures it for a direct handoff.
            if(rig.HasReceiptFocus||receipts&&(receipts.ActiveUserId!=null||receipts.QueuedCount>0))
            {Mode="gift";Subject=null;IdleTime=shot=0;characters.SetAmbientFocus(null);return;}
            string arrival=characters.NewestArrivalUserId;
            if(arrival!=null&&!(focusLeft>0&&focusUser!=null))
            {
                IdleTime=0;if(Mode!="arrival"||Subject!=arrival)StartShot("arrival",arrival);
                if(characters.Views.TryGetValue(arrival,out var arriving))MoveTo(Center(arriving),Mathf.Min(originalHalf,4.5f),delta);
                return;
            }
            if(focusLeft>0&&focusUser!=null)
            {
                if(Mode!="focus"||Subject!=focusUser)StartShot("focus",focusUser);focusLeft=Mathf.Max(0,focusLeft-delta);IdleTime=0;
                if(characters.Views.TryGetValue(focusUser,out var focused))MoveTo(Center(focused),Mathf.Min(originalHalf,4.5f),delta);return;
            }
            if(Mode=="arrival"||Mode=="focus"||Mode=="gift"){if(rig.HasAmbientFocus)Return();else{Mode="overview";IdleTime=0;}}
            if(Mode=="return"||rig.AmbientReturnRequested)
            {
                if(Mode!="return")Return();returnAge+=delta;float t=Mathf.Clamp01(returnAge/Mathf.Max(.1f,returnSeconds));
                rig.SetAmbientFocus(Vector3.Lerp(returnStart,origin,Mathf.SmoothStep(0,1,t)),Mathf.Lerp(returnHalf,originalHalf,Mathf.SmoothStep(0,1,t)),1);
                if(t>=1){rig.ClearAmbientFocus();Mode="overview";IdleTime=0;}return;
            }
            if(hold>0){hold=Mathf.Max(0,hold-delta);IdleTime=0;return;}
            if(Mode=="overview")
            {
                IdleTime+=delta;if(IdleTime<idleSeconds)return;
                var ritual=characters.tribulation?characters.tribulation.UserId:null;
                bool canZoom=snapshot.Players.Count>0,canFollow=ritual!=null&&characters.Views.ContainsKey(ritual);
                int choice=Pick(1+(canZoom?1:0)+(canFollow?1:0));
                string mode=choice==0?"pan":choice==1&&canZoom?"zoom":"follow";
                string user=mode=="follow"?ritual:mode=="zoom"?snapshot.Players.Keys.ElementAt(Pick(snapshot.Players.Count)):null;
                float overflow=IdleTime-idleSeconds;StartShot(mode,user);delta=Mathf.Max(0,overflow);IdleTime=0;
            }
            const float transition=.8f;
            float length=Mode=="pan"?Mathf.Max(1,panSeconds)+2*transition:Mode=="zoom"?Mathf.Max(1,zoomSeconds)+2*transition:Mathf.Max(3,followSeconds);
            shot+=delta;float time=Mathf.Clamp01(shot/length);
            Vector3 center=origin;float half=originalHalf*.94f;
            if(Mode=="pan")
            {
                float travel=Mathf.Clamp01((shot-transition)/Mathf.Max(1,panSeconds));
                center=origin+new Vector3(Mathf.Sin(travel*Mathf.PI*2)*.7f,Mathf.Sin(travel*Mathf.PI)*.35f,0);
            }
            else if(Subject!=null&&characters.Views.TryGetValue(Subject,out var view)){center=Center(view);half=Mathf.Min(originalHalf,Mode=="zoom"?4.2f:4.5f);}
            else{Return();return;}
            float zoomIn=Mathf.SmoothStep(0,1,shot/transition),zoomOut=Mathf.SmoothStep(0,1,(shot-(length-transition))/transition);
            var point=Vector3.Lerp(Vector3.Lerp(start,center,zoomIn),origin,zoomOut);float size=Mathf.Lerp(Mathf.Lerp(startHalf,half,zoomIn),originalHalf,zoomOut);
            rig.SetAmbientFocus(point,size,1);
            if(time>=1){rig.ClearAmbientFocus();characters.SetAmbientFocus(null);Mode="overview";Subject=null;shot=IdleTime=0;}
        }
        public void ResetPresentation(){if(rig)rig.ClearAmbientFocus();if(characters)characters.SetAmbientFocus(null);IdleTime=shot=hold=focusLeft=returnAge=0;Mode="overview";Subject=focusUser=null;captured=false;}
        private void Unbind(){if(bound!=null){bound.Events.Received-=HandleEvent;bound.State.Changed-=Changed;}bound=null;}
        private void OnDisable(){Unbind();ResetPresentation();snapshot=null;}
    }
}
