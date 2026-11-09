using System;
using System.Collections.Generic;
using System.Globalization;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using TuTienLive.Characters;
using TuTienLive.Models;
using TuTienLive.Network;

namespace TuTienLive.Effects
{
    // Pure presentation: HP, timer, damage, boss order and rewards are authoritative Node state.
    [DefaultExecutionOrder(50), DisallowMultipleComponent]
    public sealed class BossBattlePresenter : MonoBehaviour
    {
        public UnityWebSocketClient network;
        public CharacterManager characters;
        public Transform podium;
        public SpriteRenderer body;
        public Sprite[] boss1Frames,boss2Frames,boss3Frames;
        public Texture2D[] informationFrames;
        public CanvasGroup information;
        public RawImage informationFrame,hpFill;
        public TMP_Text hpLabel;
        public Graphic[] energyWidgets;
        public Rect fillUv;
        public float fullFillWidth;
        [Min(.1f)] public float bossHeight=3.5f;
        [Tooltip("Six supplied sprites over 60 frames at 60 FPS: one second per loop, ten frames per sprite.")]
        [Range(1,20)] public float framesPerSecond=6;
        [Range(0,32)] public int projectileLimit=32;
        public bool IsVisible { get; private set; }
        public int FrameIndex { get; private set; }=-1;
        public int BossIndex { get; private set; }=-1;
        public float HpFraction { get; private set; }
        public int ProjectileCount { get; private set; }
        private sealed class Bolt { public LineRenderer line;public Vector3 start,end;public float age;public bool active; }
        private Bolt[] bolts;
        private Material boltMaterial;
        private readonly Dictionary<Graphic,bool> previousEnabled=new Dictionary<Graphic,bool>();
        private string bossId;
        private double lastVolley=-1;
        private float lastReceivedAt;
        private Snapshot current;
        private static readonly CultureInfo Vietnamese=CultureInfo.GetCultureInfo("vi-VN");
        private void LateUpdate()
        {
            var snapshot=network?network.State?.Snapshot:null;
            if(!ReferenceEquals(snapshot,current)){current=snapshot;lastReceivedAt=Time.realtimeSinceStartup;}
            bool running=snapshot?.Phase=="battle";
            float speed=(float?)(snapshot?.CopyField("demoSpeed"))??1;
            float offset=running?Mathf.Min(.25f,Mathf.Max(0,Time.realtimeSinceStartup-lastReceivedAt))*1000*speed:0;
            Sample(snapshot,offset,running?Time.unscaledDeltaTime:0);
        }
        public void Sample(Snapshot snapshot,float offsetMs,float delta)
        {
            var battle=snapshot?.Battle;var boss=battle?.View?.ActiveBoss;
            if(snapshot?.EffectivePhase!="battle"||battle?.SharedBoss!=true||battle.Status!="running"||boss==null||boss.Status!="alive"||boss.IsWarning){Hide();return;}
            int index=boss.Type??-1;var frames=index==0?boss1Frames:index==1?boss2Frames:boss3Frames;
            if(index<0||index>2||frames==null||frames.Length==0||!body){Hide();return;}
            if(bossId!=boss.Id){ClearBolts();bossId=boss.Id;lastVolley=-1;}
            IsVisible=true;BossIndex=index;body.enabled=true;if(information)information.alpha=1;
            if(snapshot.Phase=="paused"||snapshot.Phase=="stopped"){offsetMs=0;delta=0;}
            double elapsed=boss.EndOnKill?(boss.ElapsedMs??0)+offsetMs:Math.Min(boss.DurationMs??0,(boss.ElapsedMs??0)+offsetMs);
            FrameIndex=(int)Math.Floor(elapsed/1000*framesPerSecond)%frames.Length;body.sprite=frames[FrameIndex];
            float canvasHeight=frames[0].rect.height/frames[0].pixelsPerUnit;
            body.transform.localScale=Vector3.one*(bossHeight/Mathf.Max(.01f,canvasHeight));
            if(podium)body.transform.position=podium.position+new Vector3(0,bossHeight*.48f,-.1f);
            HpFraction=Mathf.Clamp01((float)((boss.Hp??0)/(boss.MaxHp??1)));
            if(informationFrame&&informationFrames!=null&&index<informationFrames.Length)informationFrame.texture=informationFrames[index];
            if(hpLabel)hpLabel.text=(boss.Hp??0).ToString("N0",Vietnamese)+" / "+(boss.MaxHp??0).ToString("N0",Vietnamese)+" HP";
            if(hpFill){hpFill.rectTransform.SetSizeWithCurrentAnchors(RectTransform.Axis.Horizontal,fullFillWidth*HpFraction);var uv=fillUv;uv.width*=HpFraction;hpFill.uvRect=uv;hpFill.enabled=HpFraction>0;}
            if(energyWidgets!=null)foreach(var widget in energyWidgets){if(!widget)continue;if(!previousEnabled.ContainsKey(widget))previousEnabled.Add(widget,widget.enabled);widget.enabled=false;}
            EnsureBolts();
            // A bounded representative volley follows server battle time, never deals damage.
            double volley=Math.Floor((battle.ElapsedMs??0)/1000);
            if(lastVolley<0)lastVolley=volley-1;
            if(delta>0&&volley>lastVolley)
            {
                lastVolley=volley;int emitted=0,limit=characters&&characters.scene&&characters.scene.quality==TuTienLive.Scenes.SectQuality.Low?Math.Min(6,projectileLimit):projectileLimit;
                if(characters)foreach(var pair in characters.Views)
                {
                    if(emitted++>=limit)break;var renderer=pair.Value.pose.Body;
                    SpawnBolt(renderer.transform.TransformPoint(renderer.sprite.bounds.center),body.transform.position,emitted);
                }
            }
            SampleBolts(Mathf.Max(0,delta));
        }
        private void EnsureBolts()
        {
            if(bolts!=null)return;bolts=new Bolt[32];boltMaterial=new Material(Shader.Find("Sprites/Default")){hideFlags=HideFlags.DontSave};
            for(int i=0;i<bolts.Length;i++)
            {
                var go=new GameObject("Boss projectile "+i){hideFlags=HideFlags.DontSave};go.transform.SetParent(transform,false);
                var line=go.AddComponent<LineRenderer>();line.sharedMaterial=boltMaterial;line.useWorldSpace=true;line.positionCount=3;line.startWidth=.075f;line.endWidth=.015f;line.numCapVertices=2;
                line.sortingLayerID=body.sortingLayerID;line.sortingOrder=body.sortingOrder+1;line.enabled=false;bolts[i]=new Bolt{line=line};
            }
        }
        private void SpawnBolt(Vector3 start,Vector3 end,int seed)
        {
            if(bolts==null)return;foreach(var bolt in bolts)if(!bolt.active)
            {
                bolt.start=start;bolt.end=end;bolt.age=0;bolt.active=true;bolt.line.enabled=true;
                var color=seed%2==0?new Color(.4f,.94f,1):new Color(1,.84f,.35f);bolt.line.startColor=bolt.line.endColor=color;return;
            }
        }
        private void SampleBolts(float delta)
        {
            ProjectileCount=0;if(bolts==null)return;
            foreach(var bolt in bolts)
            {
                if(!bolt.active)continue;bolt.age+=delta;float t=bolt.age/.65f;
                if(t>=1){bolt.active=false;bolt.line.enabled=false;continue;}
                ProjectileCount++;var head=Vector3.Lerp(bolt.start,bolt.end,t)+Vector3.up*Mathf.Sin(t*Mathf.PI)*.65f;
                var direction=(bolt.end-bolt.start).normalized;bolt.line.SetPosition(0,head-direction*.65f);bolt.line.SetPosition(1,head-direction*.25f+Vector3.up*.035f);bolt.line.SetPosition(2,head);
            }
        }
        private void ClearBolts(){ProjectileCount=0;if(bolts!=null)foreach(var bolt in bolts){bolt.active=false;if(bolt.line)bolt.line.enabled=false;}}
        public void Hide()
        {
            IsVisible=false;BossIndex=-1;FrameIndex=-1;bossId=null;lastVolley=-1;if(body)body.enabled=false;if(information)information.alpha=0;ClearBolts();
            foreach(var pair in previousEnabled)if(pair.Key)pair.Key.enabled=pair.Value;previousEnabled.Clear();
        }
        private void OnDisable(){Hide();}
        private void OnDestroy(){if(boltMaterial){if(Application.isPlaying)Destroy(boltMaterial);else DestroyImmediate(boltMaterial);}}
    }
}
