using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using UnityEngine;
using TuTienLive.Characters;
using TuTienLive.Models;
using TuTienLive.Network;

namespace TuTienLive.Audio
{
    // Presentation only: settings and events come from Node; nothing is written back.
    [DisallowMultipleComponent]
    public sealed class GameAudioManager : MonoBehaviour
    {
        [Header("Nguồn dữ liệu")]
        public UnityWebSocketClient network;
        public CharacterManager characters;
        [Header("Kéo AudioClip vào đây để thay âm thanh")]
        [InspectorName("BGM — Nhạc nền (loop)")] public AudioClip bgm;
        [InspectorName("Sfx_banphuc — Ban Phúc")] public AudioClip banPhuc;
        [InspectorName("sfx_SDokiep — Độ kiếp thành công")] public AudioClip breakthroughSuccess;
        [InspectorName("sfx_lv_up_TM — Tông môn tăng cấp")] public AudioClip sectLevelUp;
        [InspectorName("sfx_fly — Bay lên / xuống")] public AudioClip fly;
        [Header("TB02 — Cảnh báo và đòn đánh boss")]
        public AudioClip bossWarning,attackNormal,attackSkill1,attackSkill2;
        [Header("Âm lượng nhận từ Cài đặt → Âm thanh trên server")]
        public AudioSource musicSource;
        public AudioSource[] EffectSources => sources;
        public int PlayedEffects { get; private set; }
        public string LastEffect { get; private set; }
        public int VoiceLimit { get; private set; } = 8;
        private AudioSource[] sources;
        private ThienDaoVoicePlayer voicePlayer;
        private readonly double[] ends = new double[16];
        private readonly int[] priorities = new int[16];
        private readonly HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
        private readonly Queue<string> seenOrder = new Queue<string>();
        private readonly Dictionary<string,double> lastPlayed = new Dictionary<string,double>(StringComparer.Ordinal);
        private readonly HashSet<string> flying = new HashSet<string>(StringComparer.Ordinal);
        private readonly HashSet<string> nextFlying = new HashSet<string>(StringComparer.Ordinal);
        private ProtocolSession bound;
        private Snapshot snapshot;
        private string session;
        private bool primeFlight = true, enabledAudio, music, effects;
        private float masterVolume, musicVolume, effectsVolume;
        private int warningSlot=-1,lastEffectSlot=-1;
        private string warningKey;
        private bool warningPaused;
        public bool BossWarningPlaying=>warningSlot>=0&&sources!=null&&sources[warningSlot].isPlaying;

        // Driven by the authoritative warning clock; seeks on reconnect and uses the existing voice budget.
        public void PresentBossWarning(string key,float elapsedMs,bool active,bool paused)
        {
            if(!Application.isPlaying)return;
            if(key!=warningKey){StopBossWarning();warningKey=key;}
            if(!active||!CanPlay()||!effects||masterVolume<=0||effectsVolume<=0){StopBossWarning();return;}
            if(warningSlot>=0)
            {
                var source=sources[warningSlot];
                if(paused&&!warningPaused)source.Pause();else if(!paused&&warningPaused)source.UnPause();
                warningPaused=paused;ends[warningSlot]=Time.realtimeSinceStartupAsDouble+Mathf.Max(.1f,3-elapsedMs/1000);
                return;
            }
            if(paused||!bossWarning||elapsedMs>=bossWarning.length*1000)return;
            if(PlayEffect("boss-warning",bossWarning,5,Mathf.Max(0,elapsedMs/1000)))warningSlot=lastEffectSlot;
        }
        public void StopBossWarning(){if(warningSlot>=0){int slot=warningSlot;warningSlot=-1;StopVoice(slot);}warningPaused=false;}

        private void Awake(){if(Application.isPlaying)EnsureSources();}
        private void OnEnable(){Refresh();}
        private void LateUpdate(){Refresh();}
        private void EnsureSources()
        {
            if(isActiveAndEnabled)
            {
                if(!voicePlayer){voicePlayer=GetComponent<ThienDaoVoicePlayer>();if(!voicePlayer)voicePlayer=gameObject.AddComponent<ThienDaoVoicePlayer>();}
                voicePlayer.network=network;if(!voicePlayer.enabled)voicePlayer.enabled=true;
            }
            if(!musicSource)musicSource=gameObject.AddComponent<AudioSource>();
            if(sources!=null)return;
            ConfigureSource(musicSource);musicSource.loop=true;
            sources=new AudioSource[16];
            for(int i=0;i<sources.Length;i++)
            {
                var child=new GameObject("SFX "+(i+1).ToString("00"));child.transform.SetParent(transform,false);
                sources[i]=child.AddComponent<AudioSource>();ConfigureSource(sources[i]);
            }
        }
        private static void ConfigureSource(AudioSource source)
        {source.playOnAwake=false;source.spatialBlend=0;source.dopplerLevel=0;source.volume=0;source.loop=false;}
        public void Refresh()
        {
            if(!Application.isPlaying||!isActiveAndEnabled)return;EnsureSources();
            var protocol=network?network.Protocol:null;
            if(bound!=protocol)
            {
                Unbind();bound=protocol;
                if(bound!=null){bound.Events.Received+=HandleEvent;bound.State.Changed+=StateChanged;}
                StateChanged();
            }
            UpdateMusic();SampleFlight();
        }
        private void StateChanged()
        {
            var current=bound?.State.Snapshot;string id=bound?.State.SessionId;
            if(id!=session){seen.Clear();seenOrder.Clear();lastPlayed.Clear();session=id;StopAll();primeFlight=true;}
            if(snapshot==null||current==null){flying.Clear();primeFlight=true;}
            snapshot=current;ApplySettings(current);UpdateMusic();
        }
        private void ApplySettings(Snapshot state)
        {
            var config=state?.CopyField("config") as JObject;var raw=config?["audio"];
            var settings=raw as JObject;
            bool valid=raw==null||raw.Type==JTokenType.Null||settings!=null;
            enabledAudio=Flag(settings,"enabled",true,ref valid);music=Flag(settings,"music",true,ref valid);effects=Flag(settings,"effects",true,ref valid);
            masterVolume=Volume(settings,"masterVolume",.5f,ref valid);musicVolume=Volume(settings,"musicVolume",.2f,ref valid);effectsVolume=Volume(settings,"effectsVolume",.7f,ref valid);
            var limit=settings?["maxVoices"];VoiceLimit=8;
            if(limit!=null){if(limit.Type!=JTokenType.Integer||(double)limit<2||(double)limit>16)valid=false;else VoiceLimit=(int)limit;}
            enabledAudio&=valid&&state!=null;
            for(int i=0;i<sources.Length;i++)
            {
                sources[i].volume=enabledAudio&&effects?masterVolume*effectsVolume:0;
                if(!enabledAudio||!effects||masterVolume==0||effectsVolume==0||i>=VoiceLimit)StopVoice(i);
            }
        }
        private static bool Flag(JObject value,string key,bool fallback,ref bool valid)
        {var token=value?[key];if(token==null)return fallback;if(token.Type==JTokenType.Boolean)return (bool)token;valid=false;return false;}
        private static float Volume(JObject value,string key,float fallback,ref bool valid)
        {
            var token=value?[key];if(token==null)return fallback;
            if(token.Type==JTokenType.Float||token.Type==JTokenType.Integer){double n=(double)token;if(!double.IsNaN(n)&&!double.IsInfinity(n)&&n>=0&&n<=1)return (float)n;}
            valid=false;return 0;
        }
        private void UpdateMusic()
        {
            if(!musicSource)return;
            musicSource.volume=enabledAudio&&music?masterVolume*musicVolume*(voicePlayer&&voicePlayer.IsSpeaking?.4f:1f):0;
            if(musicSource.clip!=bgm){musicSource.Stop();musicSource.clip=bgm;}
            if(!CanPlay()||!music||musicSource.volume<=0||!bgm){if(musicSource.isPlaying)musicSource.Stop();return;}
            musicSource.loop=true;if(!musicSource.isPlaying)musicSource.Play();
        }
        private bool CanPlay()=>snapshot!=null&&enabledAudio&&isActiveAndEnabled;
        public void HandleEvent(GameEvent value)
        {
            if(snapshot==null||!isActiveAndEnabled||value==null||string.IsNullOrEmpty(value.EventId)||!seen.Add(value.EventId))return;
            seenOrder.Enqueue(value.EventId);if(seenOrder.Count>256)seen.Remove(seenOrder.Dequeue());
            switch(value.Kind)
            {
                case "blessing:activated":PlayEffect("banphuc",banPhuc,3);break;
                case "breakthrough:completed":if(value.CopyField("outcome")?.Type==JTokenType.Boolean&&(bool)value.CopyField("outcome"))PlayEffect("dokiep",breakthroughSuccess,4);break;
                case "sect:level":
                    // Completing the final row is MAX, not another promotion.
                    var from=value.CopyField("completedLevel");var to=value.CopyField("level");
                    if(from?.Type==JTokenType.Integer&&to?.Type==JTokenType.Integer&&(double)to>(double)from)PlayEffect("tongmon",sectLevelUp,4);
                    break;
                case "battle:hit":
                    if(snapshot.Phase!="battle"||snapshot.Battle?.SharedBoss!=true||snapshot.Battle.View?.ActiveBoss?.IsWarning==true)break;
                    string skill=(string)value.CopyField("skill");
                    PlayEffect(skill=="1"?"attack-1":skill=="2"?"attack-2":"attack",skill=="1"?attackSkill1:skill=="2"?attackSkill2:attackNormal,skill=="1"||skill=="2"?2:1);
                    break;
            }
        }
        private void SampleFlight()
        {
            nextFlying.Clear();
            if(snapshot!=null&&characters)
                foreach(var pair in characters.Views)
                    if(pair.Value.pose&&pair.Value.pose.Pose=="fly")
                    {
                        nextFlying.Add(pair.Key);
                        if(!primeFlight&&!flying.Contains(pair.Key)&&snapshot.Phase!="paused"&&snapshot.Phase!="stopped")PlayEffect("fly",fly,1);
                    }
            flying.Clear();foreach(var id in nextFlying)flying.Add(id);primeFlight=false;
        }
        private bool PlayEffect(string kind,AudioClip clip,int priority,float offset=0)
        {
            if(!CanPlay()||!effects||masterVolume<=0||effectsVolume<=0||!clip)return false;
            double now=Time.realtimeSinceStartupAsDouble;
            if(lastPlayed.TryGetValue(kind,out var last)&&now-last<.15)return false;
            int slot=-1;
            for(int i=0;i<VoiceLimit;i++)if(i!=warningSlot&&ends[i]<=now){slot=i;break;}
            if(slot<0)
            {
                for(int i=0;i<VoiceLimit;i++)if(i!=warningSlot&&priorities[i]<priority&&(slot<0||priorities[i]<priorities[slot]||priorities[i]==priorities[slot]&&ends[i]<ends[slot]))slot=i;
                if(slot<0)return false;
            }
            StopVoice(slot);var source=sources[slot];source.clip=clip;source.volume=masterVolume*effectsVolume;source.time=Mathf.Clamp(offset,0,Mathf.Max(0,clip.length-.001f));source.Play();
            ends[slot]=now+clip.length-offset;priorities[slot]=priority;lastPlayed[kind]=now;PlayedEffects++;LastEffect=kind;lastEffectSlot=slot;return true;
        }
        private void StopVoice(int index){if(index==warningSlot){warningSlot=-1;warningPaused=false;}if(sources==null)return;sources[index].Stop();sources[index].clip=null;ends[index]=0;priorities[index]=0;}
        private void StopAll(){if(musicSource)musicSource.Stop();if(sources!=null)for(int i=0;i<sources.Length;i++)StopVoice(i);}
        private void Unbind(){if(bound!=null){bound.Events.Received-=HandleEvent;bound.State.Changed-=StateChanged;}bound=null;}
        private void OnDisable(){Unbind();snapshot=null;enabledAudio=false;StopAll();if(voicePlayer)voicePlayer.enabled=false;flying.Clear();primeFlight=true;}
    }
}
