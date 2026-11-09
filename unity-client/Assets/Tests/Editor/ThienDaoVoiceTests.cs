using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.TestTools;
using TuTienLive.Audio;
using TuTienLive.Models;
using TuTienLive.Network;
using Object=UnityEngine.Object;

namespace TuTienLive.Tests
{
    public sealed class ThienDaoVoiceTests
    {
        private const string Key="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        private static long seq;
        private static JObject State(string phase="cultivation")
        {
            var raw=JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/Audio/initial.json"));raw["seq"]=++seq;raw["serverTime"]=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();raw["payload"]["phase"]=phase;raw["payload"]["effectivePhase"]=phase=="paused"?"cultivation":phase;raw["payload"]["config"]["audio"]["speech"]=true;return raw;
        }
        private static GameEvent Line(int id,int priority=1,string type="join",string key=Key,long age=0)
        {
            long now=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()-age;
            var raw=State();raw["type"]="game:event";raw["payload"]=new JObject{{"kind","voice:announcement"},{"eventId","voice:"+id},{"timestamp",now},{"voiceId","id-"+id},{"voiceType",type},{"text","Chào mừng đạo hữu Thanh Vân cùng mười người khác gia nhập tông môn!"},{"priority",priority},{"count",11},{"createdAt",now},{"deadlineAt",now+2000},{"expiresAt",now+15000},{"clips",new JArray(key)},{"fallback",Key},{"cycleId","667be3ae-0a98-4c78-98c7-a907b56fa110"}};
            Assert.That(StateMapper.TryParse(raw.ToString(),out var env,out var error),Is.True,error);return env.Event;
        }
        private static void Inject(ThienDaoVoicePlayer voice,JObject raw)
        {Assert.That(voice.network.Protocol.Accept(raw.ToString(),192,DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()),Is.True);voice.Refresh();}
        private static ThienDaoVoicePlayer Create(string endpoint=null)
        {
            endpoint??=Environment.GetEnvironmentVariable("TUTIEN_VOICE_TEST_URL").Replace("http:","ws:")+"/ws";
            var go=new GameObject("Voice test");go.SetActive(false);var net=go.AddComponent<UnityWebSocketClient>();typeof(UnityWebSocketClient).GetField("endpoint",BindingFlags.NonPublic|BindingFlags.Instance).SetValue(net,endpoint);var voice=go.AddComponent<ThienDaoVoicePlayer>();voice.network=net;go.SetActive(true);net.enabled=false;net.Protocol.Open(192);voice.Refresh();Inject(voice,State());return voice;
        }
        private static Dictionary<string,AudioClip> Cache(ThienDaoVoicePlayer voice)=>(Dictionary<string,AudioClip>)typeof(ThienDaoVoicePlayer).GetField("clips",BindingFlags.NonPublic|BindingFlags.Instance).GetValue(voice);
        private static void Prime(ThienDaoVoicePlayer voice)
        {var clip=AudioClip.Create("test voiced PCM",22050*2,1,22050,false);var data=new float[clip.samples];for(int i=0;i<data.Length;i++)data[i]=.1f*Mathf.Sin(i*.05f);clip.SetData(data,0);Cache(voice)[Key]=clip;}
        [UnityTearDown] public IEnumerator LeavePlay(){if(EditorApplication.isPlaying){foreach(var voice in Object.FindObjectsByType<ThienDaoVoicePlayer>(FindObjectsSortMode.None))Object.Destroy(voice.gameObject);yield return null;yield return new ExitPlayMode();}}

        [Test] public void RejectsUnsafeUrlsAndClipLists()
        {
            Assert.That(ThienDaoVoicePlayer.BaseUrl("ws://localhost:32123/ws"),Is.EqualTo("http://localhost:32123"));
            foreach(string url in new[]{"ws://evil.invalid/ws","file:///private","ws://127.0.0.1.evil.invalid/ws","ws://user:pass@localhost/ws",null})Assert.That(ThienDaoVoicePlayer.BaseUrl(url),Is.Null);
            Assert.That(ThienDaoVoicePlayer.ValidKeys(new JArray(Key)),Is.True);
            foreach(var list in new[]{new JArray(),new JArray("../data/players"),new JArray("http://localhost/a"),new JArray(Enumerable.Repeat(Key,9))})Assert.That(ThienDaoVoicePlayer.ValidKeys(list),Is.False);
        }
        [Test] public void WavDecoderRejectsInvalidAndTruncatedInput()
        {Assert.That(ThienDaoVoicePlayer.DecodeWav(new byte[44],"bad"),Is.Null);Assert.That(ThienDaoVoicePlayer.DecodeWav(null,"bad"),Is.Null);}

        [UnityTest] public IEnumerator QueueIsBoundedDeduplicatedPrioritizedAndExpiredNoticesNeverSpeak()
        {
            yield return new EnterPlayMode();var voice=Create();Inject(voice,State("paused"));
            for(int i=0;i<30;i++)voice.HandleEvent(Line(i));Assert.That(voice.QueueCount,Is.EqualTo(20));
            voice.HandleEvent(Line(29));Assert.That(voice.QueueCount,Is.EqualTo(20));voice.HandleEvent(Line(999,age:16000));Assert.That(voice.QueueCount,Is.EqualTo(20));
            voice.HandleEvent(Line(100,3,"donor"));Assert.That(voice.QueueCount,Is.EqualTo(20));Prime(voice);Inject(voice,State());yield return new WaitForSecondsRealtime(.3f);
            Assert.That(voice.Played,Is.EqualTo(1));var active=typeof(ThienDaoVoicePlayer).GetField("active",BindingFlags.NonPublic|BindingFlags.Instance).GetValue(voice);Assert.That((int)active.GetType().GetField("Priority").GetValue(active),Is.EqualTo(3));
            Object.Destroy(voice.gameObject);yield return new ExitPlayMode();
        }
        [UnityTest] public IEnumerator PlaybackPausesResumesMutesAndDisconnectCancelsWithoutReplay()
        {
            yield return new EnterPlayMode();var voice=Create();Prime(voice);voice.HandleEvent(Line(1));yield return new WaitForSecondsRealtime(.3f);Assert.That(voice.IsSpeaking,Is.True);Assert.That(voice.Sources.Length,Is.EqualTo(1));
            yield return new WaitForSecondsRealtime(.25f);Inject(voice,State("paused"));Assert.That(voice.IsPaused,Is.True);Assert.That(voice.Sources.All(s=>!s.isPlaying),Is.True);
            yield return new WaitForSecondsRealtime(.1f);Inject(voice,State());yield return new WaitForSecondsRealtime(.15f);Assert.That(voice.IsSpeaking,Is.True);Assert.That(voice.Sources[0].timeSamples,Is.GreaterThan(0));
            var muted=State();muted["payload"]["config"]["audio"]["speechVolume"]=0;Inject(voice,muted);Assert.That(voice.Sources.All(s=>s.volume==0),Is.True);
            voice.network.Protocol.Disconnect(192);Assert.That(voice.IsSpeaking,Is.False);Assert.That(voice.QueueCount,Is.Zero);int played=voice.Played;voice.network.Protocol.Open(193);var fresh=State();Assert.That(voice.network.Protocol.Accept(fresh.ToString(),193,DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()),Is.True);voice.Refresh();yield return null;Assert.That(voice.Played,Is.EqualTo(played));
            Object.Destroy(voice.gameObject);yield return new ExitPlayMode();
        }
        [UnityTest] public IEnumerator BossInterruptsLowerPriorityAndCannotPlayAfterBattleBegins()
        {
            yield return new EnterPlayMode();var voice=Create();Prime(voice);voice.HandleEvent(Line(1));yield return new WaitForSecondsRealtime(.3f);Assert.That(voice.IsSpeaking,Is.True);
            voice.HandleEvent(Line(2,4,"boss"));Assert.That(voice.IsSpeaking,Is.False);yield return new WaitForSecondsRealtime(.3f);Assert.That(voice.Played,Is.EqualTo(2));
            Inject(voice,State("battle"));voice.Refresh();Assert.That(voice.IsSpeaking,Is.False);voice.HandleEvent(Line(3,4,"boss"));Assert.That(voice.QueueCount,Is.Zero);
            var fast=State();fast["payload"]["remainingMs"]=1000;fast["payload"]["demoSpeed"]=10;Inject(voice,fast);voice.HandleEvent(Line(4,4,"boss"));yield return new WaitForSecondsRealtime(.3f);Assert.That(voice.Played,Is.EqualTo(2),"Never begin a warning that cannot finish before accelerated battle");
            Object.Destroy(voice.gameObject);yield return new ExitPlayMode();
        }
        [UnityTest] public IEnumerator DynamicRamCacheEvictsToThirtyTwoAndDisableCleansClips()
        {
            yield return new EnterPlayMode();var voice=Create();for(int i=0;i<40;i++)Cache(voice)[i.ToString("x64")]=AudioClip.Create("small",2205,1,22050,false);
            typeof(ThienDaoVoicePlayer).GetMethod("TrimCache",BindingFlags.NonPublic|BindingFlags.Instance).Invoke(voice,null);Assert.That(voice.CachedDynamicCount,Is.EqualTo(32));voice.enabled=false;Assert.That(voice.CachedDynamicCount,Is.Zero);Object.Destroy(voice.gameObject);yield return new ExitPlayMode();
        }
        [UnityTest] public IEnumerator SubtitleUsesExistingFontAndKeepsFullGroupText()
        {
            yield return new EnterPlayMode();var canvas=new GameObject("Voice test canvas",typeof(Canvas));canvas.GetComponent<Canvas>().renderMode=RenderMode.ScreenSpaceOverlay;
            var label=new GameObject("Existing font",typeof(RectTransform),typeof(TMPro.TextMeshProUGUI));label.transform.SetParent(canvas.transform,false);label.GetComponent<TMPro.TextMeshProUGUI>().font=AssetDatabase.LoadAssetAtPath<TMPro.TMP_FontAsset>("Assets/SceneAuthoring/Nameplate SDF.asset");
            var voice=Create();voice.HandleEvent(Line(71));Assert.That(voice.subtitle,Is.Not.Null);Assert.That(voice.subtitle.richText,Is.False);Assert.That(voice.subtitle.text,Does.Contain("Thanh Vân cùng mười người khác"));Assert.That(voice.subtitle.font,Is.SameAs(label.GetComponent<TMPro.TextMeshProUGUI>().font));Object.Destroy(voice.gameObject);Object.Destroy(canvas);yield return new ExitPlayMode();
        }
        [UnityTest] public IEnumerator AudioManagerDucksMusicAndDisablingItStopsVoiceToo()
        {
            yield return new EnterPlayMode();var voice=Create();var net=voice.network;var audio=voice.gameObject.AddComponent<GameAudioManager>();audio.network=net;audio.bgm=AudioClip.Create("test music",22050*2,1,22050,false);audio.Refresh();voice.Refresh();Prime(voice);voice.HandleEvent(Line(75));yield return new WaitForSecondsRealtime(.3f);audio.Refresh();Assert.That(voice.IsSpeaking,Is.True);Assert.That(audio.musicSource.volume,Is.EqualTo(.04f).Within(.001f));
            audio.enabled=false;Assert.That(voice.enabled,Is.False);Assert.That(voice.IsSpeaking,Is.False);Assert.That(voice.QueueCount,Is.Zero);audio.enabled=true;audio.Refresh();voice.Refresh();Assert.That(voice.enabled,Is.True);Assert.That(audio.musicSource.volume,Is.EqualTo(.1f).Within(.001f));Object.Destroy(audio.bgm);Object.Destroy(voice.gameObject);yield return new ExitPlayMode();
        }
        [UnityTest] public IEnumerator RealHttpCommandsBecomeOneWebSocketGroupAndSchedulePiperSpeech()
        {
            yield return new EnterPlayMode();string url=Environment.GetEnvironmentVariable("TUTIEN_VOICE_TEST_URL");Assert.That(url,Is.Not.Null.And.Not.Empty);
            var go=new GameObject("Voice end to end");go.SetActive(false);var net=go.AddComponent<UnityWebSocketClient>();typeof(UnityWebSocketClient).GetField("endpoint",BindingFlags.NonPublic|BindingFlags.Instance).SetValue(net,url.Replace("http:","ws:")+"/ws");var voice=go.AddComponent<ThienDaoVoicePlayer>();voice.network=net;go.SetActive(true);
            float limit=Time.realtimeSinceStartup+10;while(net.State?.IsSynchronized!=true&&Time.realtimeSinceStartup<limit)yield return null;Assert.That(net.State.IsSynchronized,Is.True);
            using(var web=UnityWebRequest.Get(url+"/api/voice/manifest")){yield return web.SendWebRequest();Assert.That(web.result,Is.EqualTo(UnityWebRequest.Result.Success));}
            var phase=new JObject{{"action","phase"},{"value","cultivation"}};
            using(var web=Post(url,phase)){yield return web.SendWebRequest();Assert.That(web.responseCode,Is.EqualTo(200));}
            string group=Guid.NewGuid().ToString("N");
            for(int i=0;i<3;i++)
            {
                var command=new JObject{{"action","command"},{"userId","voice-e2e-"+group+"-"+i},{"value",new JObject{{"text","nhap mon"},{"name",i==0?"Thanh Vân":"Nguyễn Minh"},{"eventId",Guid.NewGuid().ToString()}}}};
                using(var web=Post(url,command)){yield return web.SendWebRequest();Assert.That(web.responseCode,Is.EqualTo(200),web.downloadHandler.text);}
            }
            limit=Time.realtimeSinceStartup+8;while(voice.Played<1&&Time.realtimeSinceStartup<limit)yield return null;
            Assert.That(voice.Played,Is.EqualTo(1),voice.Status);Assert.That(voice.LastText,Does.Contain("Thanh Vân cùng hai người khác"));Assert.That(voice.Sources.Length,Is.EqualTo(5));Assert.That(voice.Sources.All(s=>s.clip&&s.clip.frequency==22050),Is.True);
            Object.Destroy(go);yield return new ExitPlayMode();
        }
        private static UnityWebRequest Post(string url,JObject body)
        {
            var request=new UnityWebRequest(url+"/api/control","POST");request.uploadHandler=new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(body.ToString()));request.downloadHandler=new DownloadHandlerBuffer();request.SetRequestHeader("Content-Type","application/json");return request;
        }
        [UnityTest] public IEnumerator ActualHttpPiperWavDecodesSchedulesAndFallbackKeepsSentenceComplete()
        {
            yield return new EnterPlayMode();string url=Environment.GetEnvironmentVariable("TUTIEN_VOICE_TEST_URL");Assert.That(url,Is.Not.Null.And.Not.Empty,"Start disposable ai-voice-test-server.js first");var voice=Create(url.Replace("http:","ws:")+"/ws");
            JObject manifest;using(var web=UnityWebRequest.Get(url+"/api/voice/manifest")){yield return web.SendWebRequest();Assert.That(web.result,Is.EqualTo(UnityWebRequest.Result.Success));manifest=JObject.Parse(web.downloadHandler.text);}
            string key=(string)manifest["clips"]["fallbackJoin"];voice.HandleEvent(Line(42,key:key));float limit=Time.realtimeSinceStartup+8;
            while(!voice.IsSpeaking&&Time.realtimeSinceStartup<limit)yield return null;Assert.That(voice.IsSpeaking,Is.True,voice.Status);Assert.That(Cache(voice).ContainsKey(key),Is.True);Assert.That(voice.Sources[0].clip.frequency,Is.EqualTo(22050));
            var data=new float[voice.Sources[0].clip.samples];voice.Sources[0].clip.GetData(data,0);Assert.That(data.Any(v=>Math.Abs(v)>.001f),Is.True);
            // Missing personalized clip must use the real preloaded fallback, without a partial prefix.
            typeof(ThienDaoVoicePlayer).GetMethod("StopPlayback",BindingFlags.NonPublic|BindingFlags.Instance).Invoke(voice,null);
            var fallback=Line(43,key:new string('b',64));var json=fallback.CopyJson();json["fallback"]=key;var wrapper=State();wrapper["type"]="game:event";wrapper["payload"]=json;Assert.That(StateMapper.TryParse(wrapper.ToString(),out var env,out var error),Is.True,error);voice.HandleEvent(env.Event);
            limit=Time.realtimeSinceStartup+6;while(voice.Played<2&&Time.realtimeSinceStartup<limit)yield return null;Assert.That(voice.Played,Is.EqualTo(2));Assert.That(voice.Sources.Length,Is.EqualTo(1));Assert.That(voice.Sources[0].clip,Is.SameAs(Cache(voice)[key]));Object.Destroy(voice.gameObject);yield return new ExitPlayMode();
        }
    }
}
