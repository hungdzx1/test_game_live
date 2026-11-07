using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using TuTienLive.Models;
using TuTienLive.Network;

namespace TuTienLive.UI
{
    // Timer and progress are server values; no local buff countdown or gameplay mutation.
    public sealed class BlessingPanelHud : MonoBehaviour
    {
        public UnityWebSocketClient network;
        public GameObject panel;
        public TMP_Text timerLabel,effectLabel;
        public RawImage progressFill;
        public float progressWidth;
        public Rect progressUv;
        private Snapshot rendered;
        private bool hasRendered;
        private void OnEnable(){hasRendered=false;}
        private void LateUpdate(){Render(network?network.State?.Snapshot:null);}
        public void Render(Snapshot snapshot)
        {
            if(hasRendered&&ReferenceEquals(rendered,snapshot))return;
            rendered=snapshot;hasRendered=true;
            var blessing=snapshot?.Blessing;bool active=blessing!=null&&blessing.RemainingMs>0;
            panel.SetActive(active);if(!active)return;
            long seconds=(long)Math.Ceiling(blessing.RemainingMs/1000);
            timerLabel.text="Còn lại: "+(seconds/60).ToString("00")+":"+(seconds%60).ToString("00");
            effectLabel.text="x"+blessing.Multiplier+" tốc độ tu luyện";
            float fraction=(float)(blessing.RemainingMs/blessing.DurationMs);
            progressFill.rectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal,progressWidth*fraction);
            var uv=progressUv;uv.width*=fraction;progressFill.uvRect=uv;
        }
        private void OnDisable(){if(panel)panel.SetActive(false);}
    }
}
