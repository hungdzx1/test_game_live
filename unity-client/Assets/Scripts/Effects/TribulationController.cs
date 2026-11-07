using UnityEngine;
using TuTienLive.Models;

namespace TuTienLive.Characters
{
    public sealed class TribulationController : MonoBehaviour
    {
        public LineRenderer lightning;
        public SpriteRenderer[] clouds;
        [Tooltip("Optional Concept02 storm art. Legacy scenes keep their procedural clouds.")]
        public SpriteRenderer stormCloud;
        [Tooltip("Four authored PNG frames, in order 01 to 04. Timing follows each server-scheduled strike.")]
        public SpriteRenderer[] lightningFrames = System.Array.Empty<SpriteRenderer>();
        public Transform platformSeat;
        public string ActiveId { get; private set; }
        public bool LightningVisible { get; private set; }
        public int LightningIndex { get; private set; } = -1;
        public int LightningFrameIndex { get; private set; } = -1;
        public bool? Outcome { get; private set; }
        public string UserId { get; private set; }
        public bool HasCeremony => UserId != null;
        public bool IsActive { get; private set; }
        public float ElapsedMs { get; private set; }
        public Vector3 Platform => platformSeat ? platformSeat.position : new Vector3(2.05f,2.7f,8);
        public void Sample(Snapshot snapshot, float offsetMs)
        {
            if(!isActiveAndEnabled){ClearVisuals();return;}
            var active = snapshot?.EffectivePhase == "cultivation" ? snapshot.Breakthrough : null;
            var result = snapshot?.EffectivePhase == "cultivation" ? snapshot.BreakthroughResult : null;
            ActiveId = active?.Id ?? result?.Id; UserId = active?.UserId ?? result?.UserId;
            IsActive = active != null; Outcome = result?.Outcome; LightningVisible = false; LightningIndex = -1; LightningFrameIndex = -1;
            if(snapshot?.Phase=="paused"||snapshot?.Phase=="stopped")offsetMs=0;
            ElapsedMs = Mathf.Min((float)(active?.DurationMs ?? 0), (float)(active?.ElapsedMs ?? 0) + offsetMs);
            if(clouds!=null)foreach (var cloud in clouds) if(cloud)cloud.enabled = active != null && !stormCloud;
            if(stormCloud)stormCloud.enabled=active!=null;
            bool useFrames=lightningFrames!=null&&lightningFrames.Length==4;
            if(lightningFrames!=null)foreach(var frame in lightningFrames)
            { if(frame)frame.enabled=false;else useFrames=false; }
            if (active != null)
            {
                float duration = (float)(active.DurationMs ?? 0); int count = active.LightningCount ?? 0;
                // Matches breakthroughScene.js scheduling, using server duration/count only.
                if (count > 0 && duration > 2500 && ElapsedMs >= 1800)
                {
                    float interval = (duration - 2500) / count;
                    int index = Mathf.FloorToInt((ElapsedMs - 1800) / interval);
                    LightningVisible = index < count && (ElapsedMs - 1800) % interval < 180;
                    if (LightningVisible)
                    {
                        LightningIndex = index;
                        if(useFrames)LightningFrameIndex=Mathf.Clamp(Mathf.FloorToInt(((ElapsedMs-1800)%interval)/45),0,3);
                    }
                }
            }
            if(lightning)lightning.enabled = LightningVisible && !useFrames;
            if(LightningFrameIndex>=0)lightningFrames[LightningFrameIndex].enabled=true;
            // FX root is positioned in the Scene (normally parented under the platform seat).
        }
        private void OnDisable(){ClearVisuals();}
        private void ClearVisuals()
        {
            if(clouds!=null)foreach(var cloud in clouds)if(cloud)cloud.enabled=false;
            if(stormCloud)stormCloud.enabled=false;
            if(lightning)lightning.enabled=false;
            if(lightningFrames!=null)foreach(var frame in lightningFrames)if(frame)frame.enabled=false;
            LightningVisible=false;LightningIndex=-1;LightningFrameIndex=-1;
        }
        public Vector3 Position(Vector3 seat)
        {
            if (!IsActive) return Platform;
            float t = Mathf.SmoothStep(0, 1, Mathf.Clamp01((ElapsedMs - 300) / 1200));
            return Vector3.Lerp(seat, Platform, t) + Vector3.up * Mathf.Sin(t * Mathf.PI) * .5f;
        }
        public string Pose => !IsActive ? Outcome == true ? "celebrate" : Outcome == false ? "hit" : "idle" : ElapsedMs < 300 ? "standUp" : ElapsedMs < 1500 ? "fly" : "cast";
    }
}
