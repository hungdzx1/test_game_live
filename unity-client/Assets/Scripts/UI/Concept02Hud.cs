using System;
using System.Globalization;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using TuTienLive.Models;
using TuTienLive.Network;
using TuTienLive.Characters;

namespace TuTienLive.UI
{
    // Presentation only: no clock advancement, gameplay calculations or network writes.
    public sealed class Concept02Hud : MonoBehaviour
    {
        public UnityWebSocketClient network;
        public CharacterManager characters;
        public TMP_Text phaseLabel, timerLabel, connectionLabel, rosterLabel, ritualLabel;
        public TMP_Text[] rankRows = new TMP_Text[0];
        public RawImage[] rankIcons = new RawImage[0];
        public TMP_Text energyTitle, energyLabel;
        public RawImage energyFill;
        public float energyFillWidth = 396;
        public Rect energyFillUv;
        public GameObject breakthroughBeam;
        private Snapshot rendered;
        private bool hasRendered;
        private static readonly CultureInfo Vietnamese=CultureInfo.GetCultureInfo("vi-VN");
        private void OnEnable(){hasRendered=false;}
        private void LateUpdate() { Render(network ? network.State?.Snapshot : null); }
        public void Render(Snapshot snapshot)
        {
            if(hasRendered&&ReferenceEquals(rendered,snapshot))return;
            rendered=snapshot;hasRendered=true;
            bool connected = snapshot != null;
            phaseLabel.text = !connected ? "CHỜ MÁY CHỦ" : snapshot.Phase == "paused" ? "TẠM DỪNG" :
                snapshot.Phase == "stopped" ? "ĐÃ DỪNG" : snapshot.EffectivePhase == "battle" ? snapshot.Battle?.SharedBoss==true?snapshot.Battle.View?.ActiveBoss?.IsWarning==true?"CẢNH BÁO BOSS":"ĐÁNH BOSS":"DIỆT MA" : "TU LUYỆN";
            if (connected)
            {
                bool untimed=snapshot.EffectivePhase=="battle"&&snapshot.Battle?.EndOnKill==true&&snapshot.Battle.View?.ActiveBoss?.IsWarning!=true;
                var seconds = Math.Max(0, untimed?(long)Math.Floor((snapshot.Battle.View?.ActiveBoss?.ElapsedMs??0)/1000):(long)Math.Ceiling(snapshot.RemainingMs / 1000));
                timerLabel.text = (seconds / 60).ToString("00") + ":" + (seconds % 60).ToString("00");
            }
            else timerLabel.text = "--:--";
            if(rankRows!=null&&rankRows.Length>0)
            {
                // All server players, including those outside the visible character pool. No rewards or state mutation.
                var top=snapshot?.Players.Values.OrderByDescending(p=>p.RealmIndex).ThenByDescending(p=>p.StageIndex)
                    .ThenByDescending(p=>p.Cultivation).ThenBy(p=>p.UserId,StringComparer.Ordinal).Take(3).ToArray();
                for(int i=0;i<rankRows.Length;i++)
                {
                    bool occupied=top!=null&&i<top.Length;
                    if(rankRows[i])rankRows[i].text=occupied?top[i].Name+"\n"+top[i].Realm+" · "+top[i].Stage:
                        i==0?(connected?"Chưa có đệ tử":"Đang chờ máy chủ"):"—";
                    if(rankIcons!=null&&i<rankIcons.Length&&rankIcons[i])rankIcons[i].color=new Color(1,1,1,occupied?1:.35f);
                }
            }
            else
            {
                // Keep previously saved scene layouts usable until their HUD is upgraded.
                if(connectionLabel)connectionLabel.text=connected?"Máy chủ đã đồng bộ":"Đang chờ kết nối máy chủ";
                if(rosterLabel)rosterLabel.text=connected?snapshot.Players.Count+" đệ tử trong tông môn":"Chưa có dữ liệu đệ tử";
                string user=snapshot?.Breakthrough?.UserId;
                if(ritualLabel)ritualLabel.text=user!=null&&snapshot.Players.TryGetValue(user,out var player)?player.Name+" · Độ kiếp":"Chưa có người độ kiếp";
            }
            var energy=snapshot?.SectEnergy;
            if(energyTitle)energyTitle.text=energy==null?"NGUYÊN LỰC TÔNG MÔN":"NGUYÊN LỰC TÔNG MÔN · CẤP "+energy.Level;
            if(energyLabel)energyLabel.text=energy==null?"-- / -- TIM":energy.Power.ToString("N0",Vietnamese)+" / "+energy.Threshold.ToString("N0",Vietnamese)+" TIM"+(energy.Full?" · MAX":"");
            if(energyFill)
            {
                float fraction=energy==null?0:(float)((double)energy.Power/energy.Threshold);
                energyFill.gameObject.SetActive(fraction>0);
                energyFill.rectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal,energyFillWidth*fraction);
                var uv=energyFillUv;uv.width*=fraction;energyFill.uvRect=uv;
            }
            breakthroughBeam.SetActive(connected && snapshot.EffectivePhase == "cultivation" && snapshot.Breakthrough != null);
        }
    }
}
