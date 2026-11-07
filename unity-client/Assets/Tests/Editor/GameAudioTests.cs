using System;
using System.Collections;
using System.IO;
using System.Linq;
using System.Text;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.TestTools;
using TuTienLive.Audio;
using TuTienLive.Models;
using TuTienLive.Network;
using TuTienLive.Scenes;
using Object=UnityEngine.Object;

namespace TuTienLive.Tests
{
    public sealed class GameAudioTests
    {
        private const string Scene="Assets/Scenes/SectScene_Concept02.unity",Fixtures="Assets/Tests/Fixtures/Audio/";
        private static JObject Raw(string name)=>JObject.Parse(File.ReadAllText(Fixtures+name+".json"));
        private static Envelope Read(string name){Assert.That(StateMapper.TryParse(Raw(name).ToString(),out var value,out var error),Is.True,error);return value;}
        private static bool EffectsStopped(GameAudioManager audio)=>audio.EffectSources.All(s=>s.clip==null&&!s.isPlaying);
        // Keep closures out of the UnityTest iterator: EnterPlayMode reloads its domain.
        private static bool PlayingClip(GameAudioManager audio,AudioClip clip)=>audio.EffectSources.Any(s=>s.clip==clip&&s.isPlaying);
        private static void Accept(GameAudioManager audio,string name,long seq)
        {var raw=Raw(name);raw["seq"]=seq;Assert.That(audio.network.Protocol.Accept(raw.ToString(),9701,0),Is.True,name);}
        private static void Inject(GameAudioManager audio,JObject raw,long seq)
        {raw["seq"]=seq;Assert.That(audio.network.Protocol.Accept(raw.ToString(),9701,0),Is.True);}
        private static void StartRecorded()
        {
            var audio=Object.FindAnyObjectByType<GameAudioManager>();Assert.That(audio,Is.Not.Null);Assert.That(audio.network,Is.Not.Null);
            // Give every test a fresh protocol even if the Editor restored a disabled component.
            audio.network.enabled=false;audio.network.enabled=true;audio.network.enabled=false;
            Assert.That(audio.network.Protocol,Is.Not.Null,"Fresh protocol initialization");
            audio.network.Protocol.Open(9701);audio.Refresh();Accept(audio,"initial",1);
        }
        [UnityTearDown] public IEnumerator LeavePlayAfterFailure(){if(EditorApplication.isPlaying)yield return new ExitPlayMode();}
        [TestCase("Assets/Scenes/SectScene_Main.unity")][TestCase(Scene)]
        public void SavedSceneHasEditableClipsAndOneListenerWithoutChangingExistingObjects(string path)
        {
            EditorSceneManager.OpenScene(path);var all=Object.FindObjectsByType<GameAudioManager>(FindObjectsSortMode.None);Assert.That(all.Length,Is.EqualTo(1));
            var audio=all[0];Assert.That(audio.transform.parent.name,Is.EqualTo("08_Systems"));
            Assert.That(audio.network,Is.Not.Null);Assert.That(audio.characters,Is.Not.Null);Assert.That(audio.musicSource.loop,Is.True);Assert.That(audio.musicSource.playOnAwake,Is.False);
            Assert.That(new[]{audio.bgm,audio.banPhuc,audio.breakthroughSuccess,audio.sectLevelUp,audio.fly}.Select(AssetDatabase.GetAssetPath),Is.EqualTo(new[]{"Assets/Musics/BGM.mp3","Assets/Musics/Sfx_banphuc.mp3","Assets/Musics/sfx_SDokiep.mp3","Assets/Musics/sfx_lv_up_TM.mp3","Assets/Musics/sfx_fly.wav"}));
            Assert.That(Object.FindObjectsByType<AudioListener>(FindObjectsSortMode.None).Count(l=>l.enabled),Is.EqualTo(1));
            var bytes=File.ReadAllBytes(path);var type=AppDomain.CurrentDomain.GetAssemblies().Select(a=>a.GetType("TuTienLive.Editor.GameAudioSetup")).First(t=>t!=null);
            Assert.That(type.GetMethod("Install").Invoke(null,new object[]{audio.gameObject.scene}),Is.SameAs(audio));Assert.That(File.ReadAllBytes(path),Is.EqualTo(bytes));
        }
        [Test] public void SuppliedAudioDecodesToNonSilentSamples()
        {
            EditorSceneManager.OpenScene(Scene);var audio=Object.FindAnyObjectByType<GameAudioManager>();
            foreach(var clip in new[]{audio.bgm,audio.banPhuc,audio.breakthroughSuccess,audio.sectLevelUp,audio.fly})
            {
                Assert.That(clip.length,Is.GreaterThan(.1f));Assert.That(clip.LoadAudioData(),Is.True,clip.name);
                var data=new float[4096];Assert.That(clip.GetData(data,clip.samples/2),Is.True,clip.name);
                Assert.That(data.Any(n=>Math.Abs(n)>.0001f),Is.True,"Silent decoded audio: "+clip.name);
            }
        }
        [UnityTest] public IEnumerator RealServerEventsAndRitualMotionPlayOnceAndReconnectDoesNotReplay()
        {
            EditorSceneManager.OpenScene(Scene);yield return new EnterPlayMode();yield return null;StartRecorded();yield return null;
            var audio=Object.FindAnyObjectByType<GameAudioManager>();
            Assert.That(audio,Is.Not.Null,"Audio manager missing after initial snapshot; playing="+Application.isPlaying);
            Assert.That(audio.musicSource,Is.Not.Null,"Music source missing after initial snapshot");
            bool music=audio.musicSource.isPlaying&&audio.musicSource.loop&&Math.Abs(audio.musicSource.volume-.1f)<.001;
            Accept(audio,"banphuc",2);bool blessing=audio.LastEffect=="banphuc"&&PlayingClip(audio,audio.banPhuc);
            int count=audio.PlayedEffects;audio.HandleEvent(Read("banphuc").Event);bool dedup=audio.PlayedEffects==count;
            Accept(audio,"level",3);bool level=audio.LastEffect=="tongmon";
            Accept(audio,"ritual-start",4);yield return null;count=audio.PlayedEffects;
            Accept(audio,"ritual-fly",5);yield return null;bool ascent=audio.LastEffect=="fly"&&audio.PlayedEffects==count+1;
            for(int i=0;i<5;i++){audio.Refresh();yield return null;}bool noFrameSpam=audio.PlayedEffects==count+1;
            Accept(audio,"success",6);bool success=audio.LastEffect=="dokiep"&&PlayingClip(audio,audio.breakthroughSuccess);
            Accept(audio,"ritual-result",7);yield return null;count=audio.PlayedEffects;
            double deadline=EditorApplication.timeSinceStartup+.25;while(EditorApplication.timeSinceStartup<deadline)yield return null;
            Accept(audio,"ritual-return",8);deadline=EditorApplication.timeSinceStartup+3;
            while(audio.PlayedEffects==count&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool descent=audio.LastEffect=="fly"&&audio.PlayedEffects==count+1;
            string descentDetails=$"last={audio.LastEffect}, count={audio.PlayedEffects}, expected={count+1}, pose={audio.characters.Views.Values.FirstOrDefault()?.pose.Pose}";
            count=audio.PlayedEffects;audio.network.Protocol.Disconnect(9701);bool disconnected=!audio.musicSource.isPlaying&&EffectsStopped(audio);
            audio.network.Protocol.Open(9701);Accept(audio,"ritual-result",1);yield return null;bool reconnect=audio.musicSource.isPlaying&&audio.PlayedEffects==count;
            var negative=Raw("success");negative["payload"]["eventId"]="failed-result";negative["payload"]["outcome"]=false;Inject(audio,negative,2);bool failureSilent=audio.PlayedEffects==count;
            negative=Raw("level");negative["payload"]["eventId"]="last-max";negative["payload"]["level"]=3;negative["payload"]["completedLevel"]=3;Inject(audio,negative,3);bool maxSilent=audio.PlayedEffects==count;
            audio.enabled=false;bool disposed=!audio.musicSource.isPlaying&&EffectsStopped(audio);audio.enabled=true;yield return null;
            bool bounded=audio.EffectSources.Length==16&&audio.GetComponentsInChildren<AudioSource>().Length==17;
            yield return new ExitPlayMode();Assert.That(music&&blessing&&dedup&&level&&ascent&&descent&&noFrameSpam&&success&&disconnected&&reconnect&&failureSilent&&maxSilent&&disposed&&bounded,Is.True,
                $"music={music} blessing={blessing} dedup={dedup} level={level} ascent={ascent} descent={descent} ({descentDetails}) frameSpam={noFrameSpam} success={success} disconnect={disconnected} reconnect={reconnect} failure={failureSilent} max={maxSilent} disposed={disposed} bounded={bounded}");
        }
        [UnityTest] public IEnumerator VolumeChannelsMissingClipsMalformedSettingsAndVoiceBudgetAreSafe()
        {
            EditorSceneManager.OpenScene(Scene);yield return new EnterPlayMode();yield return null;StartRecorded();yield return null;
            var audio=Object.FindAnyObjectByType<GameAudioManager>();Accept(audio,"volume",2);Accept(audio,"banphuc",3);Accept(audio,"level",4);
            bool volumes=Math.Abs(audio.musicSource.volume-.24f)<.001&&audio.EffectSources.Where(s=>s.clip).All(s=>Math.Abs(s.volume-.48f)<.001)&&audio.VoiceLimit==2;
            int count=audio.PlayedEffects;Accept(audio,"success",5);bool priority=audio.PlayedEffects==count+1&&audio.EffectSources.Count(s=>s.clip)<=2;
            count=audio.PlayedEffects;var flood=Raw("success");
            for(int i=0;i<30;i++){flood["payload"]["eventId"]="sound-burst-"+i;Inject(audio,flood,6+i);}bool budget=audio.PlayedEffects==count&&audio.EffectSources.Count(s=>s.clip)<=2;
            Accept(audio,"muted",40);bool mute=!audio.musicSource.isPlaying&&EffectsStopped(audio);count=audio.PlayedEffects;
            var hidden=Raw("banphuc");hidden["payload"]["eventId"]="muted-event";Inject(audio,hidden,41);Accept(audio,"volume",42);audio.HandleEvent(ReadEvent(hidden));bool noQueue=audio.PlayedEffects==count;
            Accept(audio,"channels-off",43);bool channels=!audio.musicSource.isPlaying&&EffectsStopped(audio);
            var bad=Raw("volume");bad["payload"]["config"]["audio"]["effectsVolume"]=2;Inject(audio,bad,44);bool malformed=!audio.musicSource.isPlaying&&EffectsStopped(audio);
            Accept(audio,"volume",45);audio.banPhuc=null;double settleAt=EditorApplication.timeSinceStartup+.18;while(EditorApplication.timeSinceStartup<settleAt)yield return null;count=audio.PlayedEffects;hidden["payload"]["eventId"]="missing-clip";Inject(audio,hidden,46);bool missing=audio.PlayedEffects==count;
            var zero=Raw("volume");zero["payload"]["config"]["audio"]["masterVolume"]=0;Inject(audio,zero,47);bool zeroMute=!audio.musicSource.isPlaying&&EffectsStopped(audio);
            Accept(audio,"volume",48);audio.bgm=audio.fly;audio.Refresh();float duration=audio.fly.length;
            double deadline=EditorApplication.timeSinceStartup+2;bool signal=false;var samples=new float[1024];
            while(!signal&&EditorApplication.timeSinceStartup<deadline){audio.musicSource.GetOutputData(samples,0);signal=samples.Any(n=>Math.Abs(n)>.00001f);yield return null;}
            double loopAt=EditorApplication.timeSinceStartup+duration+.25;while(EditorApplication.timeSinceStartup<loopAt)yield return null;bool loop=audio.musicSource.isPlaying&&audio.musicSource.loop;
            yield return new ExitPlayMode();Assert.That(volumes&&priority&&budget&&mute&&noQueue&&channels&&malformed&&missing&&zeroMute&&loop&&signal,Is.True,
                $"volume={volumes} priority={priority} budget={budget} mute={mute} noQueue={noQueue} channels={channels} malformed={malformed} missing={missing} zero={zeroMute} loop={loop} outputSignal={signal}");
        }
        private static GameEvent ReadEvent(JObject raw){Assert.That(StateMapper.TryParse(raw.ToString(),out var e,out var error),Is.True,error);return e.Event;}
        private static IEnumerator Post(string url,string action,JToken value)
        {
            var data=new JObject{["action"]=action,["value"]=value};
            using var request=new UnityWebRequest(url+"/api/control","POST"){uploadHandler=new UploadHandlerRaw(Encoding.UTF8.GetBytes(data.ToString())),downloadHandler=new DownloadHandlerBuffer()};
            request.SetRequestHeader("Content-Type","application/json");request.timeout=5;request.SendWebRequest();
            while(!request.isDone)yield return null;
            Assert.That(request.responseCode,Is.EqualTo(200),request.url+" · "+request.error+" · "+request.downloadHandler.text);
        }
        [UnityTest] public IEnumerator ActualNodeHttpSettingsAndWebSocketControlPlayingSources()
        {
            string url=Environment.GetEnvironmentVariable("TUTIEN_AUDIO_TEST_URL");if(string.IsNullOrEmpty(url))Assert.Ignore("Needs disposable Node server: scripts/unity-audio-test-server.js");
            var uri=new Uri(url);Assert.That(uri.IsLoopback,Is.True);EditorSceneManager.OpenScene(Scene);
            var network=Object.FindAnyObjectByType<SectSceneBindings>().network;var serialized=new SerializedObject(network);serialized.FindProperty("endpoint").stringValue="ws://"+uri.Authority+"/ws";serialized.ApplyModifiedPropertiesWithoutUndo();
            yield return new EnterPlayMode();url=Environment.GetEnvironmentVariable("TUTIEN_AUDIO_TEST_URL");
            var audio=Object.FindAnyObjectByType<GameAudioManager>();Assert.That(audio,Is.Not.Null);Assert.That(audio.musicSource,Is.Not.Null);double deadline=EditorApplication.timeSinceStartup+10;
            while(!audio.musicSource.isPlaying&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool connected=audio.musicSource.isPlaying;
            yield return Post(url,"audioSettings",new JObject{["enabled"]=true,["music"]=true,["effects"]=true,["masterVolume"]=.6,["musicVolume"]=.4,["effectsVolume"]=.3});
            deadline=EditorApplication.timeSinceStartup+5;while(Math.Abs(audio.musicSource.volume-.24f)>.001&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool volume=Math.Abs(audio.musicSource.volume-.24f)<.001;
            yield return Post(url,"demoLiveEvent",new JObject{["loai"]="tim",["eventId"]="unity-audio-level",["userId"]="audio-demo",["soLuong"]=1000});
            deadline=EditorApplication.timeSinceStartup+5;while(audio.PlayedEffects<2&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool sounds=audio.PlayedEffects==2&&audio.EffectSources.Where(s=>s.clip).All(s=>Math.Abs(s.volume-.18f)<.001);
            yield return Post(url,"audioSettings",new JObject{["enabled"]=false});deadline=EditorApplication.timeSinceStartup+5;while(audio.musicSource.isPlaying&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool muted=!audio.musicSource.isPlaying&&EffectsStopped(audio);
            yield return Post(url,"audioSettings",new JObject{["enabled"]=true,["music"]=false,["effects"]=false});yield return null;
            bool channels=!audio.musicSource.isPlaying&&EffectsStopped(audio);
            yield return new ExitPlayMode();Assert.That(connected&&volume&&sounds&&muted&&channels,Is.True,$"connection={connected} volume={volume} sounds={sounds} mute={muted} channels={channels}");
        }
    }
}
