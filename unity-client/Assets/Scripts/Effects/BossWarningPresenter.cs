using TMPro;
using UnityEngine;
using UnityEngine.UI;
using TuTienLive.Audio;
using TuTienLive.Models;
using TuTienLive.Network;
using TuTienLive.Scenes;

namespace TuTienLive.Effects
{
    // TB02 presentation only. The server gates damage, cooldowns and the encounter timer.
    [DefaultExecutionOrder(60),DisallowMultipleComponent]
    public sealed class BossWarningPresenter : MonoBehaviour
    {
        public UnityWebSocketClient network;
        public CameraRig cameraRig;
        public GameAudioManager audioManager;
        public CanvasGroup warning;
        public TMP_Text bossName,countdown;
        public Image progress;
        public bool IsVisible { get; private set; }
        public int Seconds { get; private set; }
        public float RemainingMs { get; private set; }
        private Snapshot current;
        private float receivedAt;
        private void LateUpdate()
        {
            var state=network?network.State?.Snapshot:null;
            if(!ReferenceEquals(state,current)){current=state;receivedAt=Time.realtimeSinceStartup;}
            float speed=(float?)(state?.CopyField("demoSpeed"))??1;
            float offset=state?.Phase=="battle"?Mathf.Min(.25f,Mathf.Max(0,Time.realtimeSinceStartup-receivedAt))*1000*speed:0;
            Sample(state,offset);
        }
        public void Sample(Snapshot state,float offsetMs)
        {
            var battle=state?.Battle;var boss=battle?.View?.ActiveBoss;
            if(state?.EffectivePhase!="battle"||battle?.SharedBoss!=true||battle.Status!="running"||boss==null||boss.Status!="alive"||!boss.IsWarning){Hide();return;}
            bool paused=state.Phase=="paused"||state.Phase=="stopped";
            if(paused)offsetMs=0;
            // Wait for the server's reveal snapshot even if interpolation reaches the boundary.
            float elapsed=Mathf.Clamp((float)boss.WarningElapsedMs+offsetMs,0,(float)boss.WarningDurationMs);
            RemainingMs=Mathf.Max(0,(float)boss.WarningDurationMs-elapsed);Seconds=Mathf.Max(1,Mathf.CeilToInt(RemainingMs/1000));
            IsVisible=true;if(warning)warning.alpha=1;if(bossName)bossName.text=boss.Name?.ToUpperInvariant();if(countdown)countdown.text=Seconds.ToString();
            if(progress){progress.fillAmount=RemainingMs/(float)boss.WarningDurationMs;progress.rectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal,524*progress.fillAmount);}
            if(cameraRig)cameraRig.SetBossWarningShake(paused?Vector2.zero:new Vector2(Mathf.Sin(elapsed*.073f),Mathf.Sin(elapsed*.097f))*.018f);
            if(audioManager)audioManager.PresentBossWarning(boss.Id,elapsed,true,paused);
        }
        public void Hide()
        {
            IsVisible=false;Seconds=0;RemainingMs=0;if(warning)warning.alpha=0;
            if(cameraRig)cameraRig.SetBossWarningShake(Vector2.zero);if(audioManager)audioManager.StopBossWarning();
        }
        private void OnDisable(){Hide();current=null;}
    }
}
