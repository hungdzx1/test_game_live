using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using TuTienLive.Models;
using TuTienLive.Network;
using TuTienLive.Scenes;

namespace TuTienLive.Characters
{
    public sealed class CharacterManager : MonoBehaviour
    {
        public CharacterView characterPrefab;
        public UnityWebSocketClient network;
        public SectSceneController scene;
        public Transform[] seats;
        public TribulationController tribulation;
        public CameraDirector director;
        public int TotalPlayers { get; private set; }
        public int HiddenPlayers => Mathf.Max(0, TotalPlayers - active.Count);
        public int CreatedCount { get; private set; }
        public int PooledCount => pool.Count;
        public IReadOnlyDictionary<string, CharacterView> Views => active;
        public int AcceptedEffects { get; private set; }
        private readonly Dictionary<string, CharacterView> active = new Dictionary<string, CharacterView>(StringComparer.Ordinal);
        private readonly Stack<CharacterView> pool = new Stack<CharacterView>();
        private readonly Dictionary<string, PlayerState> selected = new Dictionary<string, PlayerState>(StringComparer.Ordinal);
        private readonly HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
        private readonly Queue<string> seenOrder = new Queue<string>();
        private ProtocolSession bound;
        private Snapshot snapshot;
        private string session;
        private long revision = -1;
        private float receivedTime, frozenTime;
        private void Update()
        {
            if (!network || network.Protocol == null) return;
            if (bound != network.Protocol)
            {
                if (bound != null) bound.Events.Received -= HandleEvent;
                bound = network.Protocol; bound.Events.Received += HandleEvent;
                revision = -1;
            }
            if (revision != bound.State.Revision)
            {
                revision = bound.State.Revision; receivedTime = Time.realtimeSinceStartup;
                ApplySnapshot(bound.State.Snapshot, bound.State.SessionId);
            }
            bool running = snapshot != null && snapshot.Phase != "paused" && snapshot.Phase != "stopped";
            float speed = (float?)(snapshot?.CopyField("demoSpeed")) ?? 1;
            float offset = running ? Mathf.Min(.25f, Mathf.Max(0, Time.realtimeSinceStartup - receivedTime)) * 1000 * speed : 0;
            Sample(offset, running ? Time.deltaTime : 0);
        }
        public void ApplySnapshot(Snapshot value, string newSession)
        {
            if (session != newSession)
            { ReleaseAll(); seen.Clear(); seenOrder.Clear(); director.ResetFocus(); session = newSession; AcceptedEffects = 0; }
            snapshot = value; TotalPlayers = value?.Players.Count ?? 0;
            if(value!=null)frozenTime=(float)value.ElapsedMs;
            if (value == null) { ReleaseAll(); selected.Clear(); tribulation.Sample(null,0); return; }
            tribulation.Sample(value, 0);
            director.Sample(tribulation.UserId, value.CameraUserId, 0);
            SyncRoster();
        }
        private int Limit => scene && scene.quality == SectQuality.Low ? 6 : TotalPlayers >= 500 ? 8 : scene && scene.quality == SectQuality.Medium || TotalPlayers >= 100 ? 10 : 12;
        private void SyncRoster()
        {
            selected.Clear();
            if (snapshot == null) return;
            // No battle visuals in this phase. Keep server roster, release sect visuals during battle.
            if (snapshot.EffectivePhase == "battle") { ReleaseAll(); return; }
            var players = snapshot.Players.Values.ToArray();
            var chosen = new Dictionary<string,int>(StringComparer.Ordinal);
            for (int i=0;i<Mathf.Min(Limit,players.Length);i++) chosen[players[i].UserId]=i;
            // A hidden followed player occupies their modulo-12 seat, replacing its illustrative occupant.
            foreach (string priorityId in new[]{director.FollowUserId, tribulation.UserId})
            {
                int index = Array.FindIndex(players,p=>p.UserId==priorityId);
                if (index<0 || chosen.ContainsKey(priorityId)) continue;
                int slot=index%12;
                var occupant=chosen.FirstOrDefault(p=>p.Value==slot);
                if(occupant.Key!=null) chosen.Remove(occupant.Key);
                else if(chosen.Count>=Limit) chosen.Remove(chosen.Last().Key);
                chosen[priorityId]=slot;
            }
            foreach(var id in active.Keys.Where(id=>!chosen.ContainsKey(id)).ToArray()) Release(id);
            foreach(var choice in chosen)
            {
                var player=snapshot.Players[choice.Key]; selected[choice.Key]=player;
                var seat=seats[choice.Value%seats.Length].position;
                if(!active.TryGetValue(choice.Key,out var view))
                {
                    view=pool.Count>0?pool.Pop():Create(); view.Bind(player,seat);
                    active.Add(choice.Key,view); view.gameObject.SetActive(true); view.Effect("appearance");
                }
                view.Seat=seat;
                view.SeatIndex=choice.Value;
                if(player.Animation=="teleport"&&view.LastAnimation!="teleport")view.Effect("teleport");
                view.LastAnimation=player.Animation;
            }
        }
        private CharacterView Create()
        { CreatedCount++; return Instantiate(characterPrefab, transform); }
        private void Release(string id)
        { var view=active[id];active.Remove(id);view.ResetVisual();view.gameObject.SetActive(false);pool.Push(view); }
        private void ReleaseAll() { foreach(var id in active.Keys.ToArray())Release(id); }
        public void Sample(float offsetMs, float delta)
        {
            if(snapshot==null)return;
            if(snapshot.Phase=="paused"||snapshot.Phase=="stopped") { offsetMs=0;delta=0; }
            else frozenTime=(float)snapshot.ElapsedMs+offsetMs;
            tribulation.Sample(snapshot,offsetMs);
            director.Sample(tribulation.UserId,snapshot.CameraUserId,delta);
            // Selection is snapshot/event driven, never Instantiate/Destroy per frame.
            foreach(var pair in active)
            {
                var view=pair.Value;var p=selected[pair.Key];
                string pose=p.Animation??"idle";
                if(pair.Key==tribulation.UserId)
                {
                    view.transform.position=tribulation.Position(view.Seat);view.WasOnPlatform=true;view.ReturnSeconds=0;
                    pose=tribulation.Pose;
                }
                else
                {
                    if(view.WasOnPlatform){view.WasOnPlatform=false;view.ReturnSeconds=.8f;view.ReturnFrom=view.transform.position;}
                    view.ReturnSeconds=Mathf.Max(0,view.ReturnSeconds-delta);
                    if(view.ReturnSeconds>0)
                    {float t=Mathf.SmoothStep(0,1,1-view.ReturnSeconds/.8f);view.transform.position=Vector3.Lerp(view.ReturnFrom,view.Seat,t)+Vector3.up*Mathf.Sin(t*Mathf.PI)*.35f;pose="fly";}
                    else view.transform.position=view.Seat;
                }
                view.Sample(p,pose,frozenTime/1000,delta,scene&&scene.quality==SectQuality.Low,view.SeatIndex<4&&pose=="meditate");
            }
        }
        public void HandleEvent(GameEvent e)
        {
            if(snapshot==null||e==null||string.IsNullOrEmpty(e.EventId)||!seen.Add(e.EventId))return;
            seenOrder.Enqueue(e.EventId);if(seenOrder.Count>200)seen.Remove(seenOrder.Dequeue());
            string effect=null;int priority=1;
            switch(e.Kind)
            {
                case "player:joined":case "player:returned":effect="appearance";break;
                case "stage:up":effect="realm up";priority=2;break;
                case "live:gift":effect="gift";priority=3;break;
                case "breakthrough:completed":
                    var outcome=e.CopyField("outcome");
                    if(outcome?.Type==Newtonsoft.Json.Linq.JTokenType.Boolean)effect=(bool)outcome?"victory":"failure";
                    priority=4;break;
                case "teleport":effect="teleport";break;
                case "celebrate":effect="victory";break;
            }
            if(effect==null)return;
            AcceptedEffects++;director.Request(e.UserId,priority,effect);director.Sample(tribulation.UserId,snapshot.CameraUserId,0);SyncRoster();
            if(e.UserId!=null&&active.TryGetValue(e.UserId,out var view))view.Effect(effect);
        }
        private void OnDestroy() { if(bound!=null)bound.Events.Received-=HandleEvent; }
    }
}
