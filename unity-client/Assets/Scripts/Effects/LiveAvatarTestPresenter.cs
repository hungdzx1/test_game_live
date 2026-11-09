using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;
using TuTienLive.Models;
using TuTienLive.Network;

namespace TuTienLive.Effects
{
    // An opt-in diagnostic for a real LIVE comment, using the same photo loader as Ban Phuc.
    // Never focuses a camera, creates a disciple, grants an item or writes player data.
    [DefaultExecutionOrder(210),DisallowMultipleComponent]
    public sealed class LiveAvatarTestPresenter : MonoBehaviour
    {
        public UnityWebSocketClient network;
        public CanvasGroup visual;
        public TMP_Text nameLabel,statusLabel;
        public DonorAvatarView avatar;
        public bool IsVisible { get; private set; }
        public string UserId { get; private set; }
        public float Elapsed { get; private set; }
        private Snapshot snapshot;
        private string session;
        private ProtocolSession bound;
        private float lastTick;
        private readonly HashSet<string> seen=new HashSet<string>(StringComparer.Ordinal);
        private readonly Queue<string> order=new Queue<string>();
        private bool Allowed
        {
            get
            {
                var mode=snapshot?.CopyField("mode");var live=(snapshot?.CopyField("config") as JObject)?["live"] as JObject;
                return mode?.Type==JTokenType.String&&(string)mode=="live"&&live?["avatarTestEnabled"]?.Type==JTokenType.Boolean&&(bool)live["avatarTestEnabled"];
            }
        }
        private void OnEnable(){lastTick=Time.realtimeSinceStartup;Hide();Refresh();}
        public void Refresh()
        {
            var next=network?network.Protocol:null;if(next==bound)return;Unbind();bound=next;
            if(bound!=null){bound.State.Changed+=Changed;bound.Events.Received+=HandleEvent;Changed();}
            else ApplySnapshot(null,null);
        }
        private void Changed()=>ApplySnapshot(bound?.State.Snapshot,bound?.State.SessionId);
        private void LateUpdate(){Refresh();float now=Time.realtimeSinceStartup;float delta=Mathf.Max(0,now-lastTick);lastTick=now;Advance(delta);}
        public void ApplySnapshot(Snapshot value,string id)
        {
            if(session!=id){Hide();seen.Clear();order.Clear();session=id;}
            snapshot=value;if(!Allowed)Hide();
        }
        public void HandleEvent(GameEvent value)
        {
            if(!isActiveAndEnabled||!Allowed||value==null||value.Kind!="avatar:test"||string.IsNullOrEmpty(value.EventId)||string.IsNullOrEmpty(value.UserId))return;
            var name=value.CopyField("name");var image=value.CopyField("avatar");
            if((string)value.CopyField("source")!="tiktok"||(int?)value.CopyField("durationMs")!=10000||!value.UserId.StartsWith("tt:",StringComparison.Ordinal)||name?.Type!=JTokenType.String||string.IsNullOrWhiteSpace((string)name)||((string)name).Length>100||image!=null&&image.Type!=JTokenType.Null&&image.Type!=JTokenType.String||!seen.Add(value.EventId))return;
            order.Enqueue(value.EventId);if(order.Count>256)seen.Remove(order.Dequeue());
            UserId=value.UserId;Elapsed=0;IsVisible=true;lastTick=Time.realtimeSinceStartup;
            if(nameLabel)nameLabel.text=(string)name;if(visual)visual.alpha=1;
            if(avatar)avatar.Present((string)name,(string)image);RenderStatus();
        }
        public void Advance(float delta)
        {
            if(!Allowed){Hide();return;}if(!IsVisible)return;
            Elapsed+=Mathf.Max(0,delta);if(Elapsed>=10){Hide();return;}RenderStatus();
        }
        private void RenderStatus(){if(statusLabel)statusLabel.text=avatar?avatar.StatusText:"Không có ảnh";}
        public void Hide(){IsVisible=false;UserId=null;Elapsed=0;if(visual)visual.alpha=0;if(avatar)avatar.Hide();if(nameLabel)nameLabel.text="";if(statusLabel)statusLabel.text="";}
        private void Unbind(){if(bound!=null){bound.State.Changed-=Changed;bound.Events.Received-=HandleEvent;}bound=null;}
        private void OnDisable(){Unbind();snapshot=null;Hide();}
    }
}
