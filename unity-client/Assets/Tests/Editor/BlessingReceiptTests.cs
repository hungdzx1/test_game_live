using System;
using System.IO;
using System.Text;
using System.Collections;
using System.Linq;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.TestTools;
using TuTienLive.Audio;
using TuTienLive.Effects;
using TuTienLive.Models;
using TuTienLive.Network;
using TuTienLive.Scenes;
using Object=UnityEngine.Object;

namespace TuTienLive.Tests
{
    public sealed class BlessingReceiptTests
    {
        private BlessingReceiptPresenter fx;
        private Envelope initial;
        [SetUp] public void Open()
        {
            if(Application.isPlaying)return;
            EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");
            fx=Object.FindAnyObjectByType<BlessingReceiptPresenter>();Assert.That(fx,Is.Not.Null);
            fx.network.enabled=false;initial=Parse(File.ReadAllText("Assets/Tests/Fixtures/ItemReceipts/initial.json"));
            fx.ApplySnapshot(initial.Snapshot,initial.SessionId);fx.cameraRig.driftEnabled=false;fx.cameraRig.Sample(0);
        }
        [TearDown] public void Close(){if(!Application.isPlaying)EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");}
        [UnityTearDown] public IEnumerator LeavePlay(){if(Application.isPlaying)yield return new ExitPlayMode();}
        private static Envelope Parse(string raw){Assert.That(StateMapper.TryParse(raw,out var value,out var error),Is.True,error);return value;}
        private static JObject RawEvent()=>JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/Audio/banphuc.json"));
        // EnterPlayMode reloads the domain; keep captured lambdas out of the test iterator.
        private static bool PlayingBlessing(GameAudioManager audio)=>audio.EffectSources.Any(s=>s.clip==audio.banPhuc&&s.isPlaying);
        private static GameEvent Event(int count=1,string kind="blessing:activated")
        {var raw=RawEvent();raw["payload"]["eventId"]=Guid.NewGuid().ToString();raw["payload"]["count"]=count;raw["payload"]["kind"]=kind;return Parse(raw.ToString()).Event;}
        [Test] public void SavedArtAndTwoSecondPopCountShakeAndCleanup()
        {
            Assert.That(AssetDatabase.GetAssetPath(fx.artwork.sprite),Is.EqualTo("Assets/Art/Items/tbao_ban_phuc.png"));
            Assert.That(fx.visual.blocksRaycasts||fx.visual.interactable,Is.False);Assert.That(fx.duration,Is.EqualTo(2));
            var start=fx.cameraRig.transform.position;var rotation=fx.cameraRig.transform.rotation;float zoom=fx.cameraRig.GetComponent<Camera>().orthographicSize;
            string before=initial.Snapshot.CopyJson().ToString();fx.HandleEvent(Event(3));fx.Advance(.05f);
            Assert.That(fx.IsVisible,Is.True);Assert.That(fx.Count,Is.EqualTo(3));Assert.That(fx.countLabel.text,Is.EqualTo("Ban Phúc ×3"));
            Assert.That(fx.visual.alpha,Is.GreaterThan(0));Assert.That(fx.popRoot.localScale.x,Is.LessThan(1));
            Assert.That(fx.cameraRig.BlessingShake.magnitude,Is.InRange(.001f,.04f));
            for(int i=0;i<100;i++)fx.cameraRig.Sample(0);
            Assert.That(Vector3.Distance(start,fx.cameraRig.transform.position),Is.LessThan(.04f));
            fx.Advance(.75f);Assert.That(fx.visual.alpha,Is.EqualTo(1));Assert.That(fx.popRoot.localScale.x,Is.EqualTo(1));Assert.That(fx.cameraRig.BlessingShake,Is.EqualTo(Vector2.zero));
            fx.Advance(.9f);Assert.That(fx.visual.alpha,Is.InRange(.1f,.9f));fx.Advance(.32f);
            Assert.That(fx.IsVisible,Is.False);Assert.That(fx.visual.alpha,Is.Zero);Assert.That(Vector3.Distance(start,fx.cameraRig.transform.position),Is.LessThan(.0001f));
            Assert.That(fx.cameraRig.transform.rotation,Is.EqualTo(rotation));Assert.That(fx.cameraRig.GetComponent<Camera>().orthographicSize,Is.EqualTo(zoom));
            Assert.That(initial.Snapshot.CopyJson().ToString(),Is.EqualTo(before));
        }
        [Test] public void BurstAddsCountDeduplicatesAndDoesNotExtendPulse()
        {
            var e=Event(2);fx.HandleEvent(e);fx.Advance(1.6f);fx.HandleEvent(e);fx.HandleEvent(Event(3));
            Assert.That(fx.Count,Is.EqualTo(5));Assert.That(fx.Elapsed,Is.EqualTo(1.6f));fx.Advance(.41f);Assert.That(fx.IsVisible,Is.False);
            fx.HandleEvent(e);Assert.That(fx.IsVisible,Is.False);fx.HandleEvent(Event());Assert.That(fx.Count,Is.EqualTo(1));
        }
        [Test] public void SnapshotReconnectInvalidCountsAndItemGrantNeverReplayActivation()
        {
            foreach(var count in new[]{0,-1})fx.HandleEvent(Event(count));fx.HandleEvent(Event(kind:"item:received"));Assert.That(fx.IsVisible,Is.False);
            var invalid=RawEvent();invalid["payload"]["count"]=1.5;fx.HandleEvent(Parse(invalid.ToString()).Event);Assert.That(fx.IsVisible,Is.False);
            fx.ApplySnapshot(Parse(File.ReadAllText("Assets/Tests/Fixtures/Blessing/active-30.json")).Snapshot,initial.SessionId);Assert.That(fx.IsVisible,Is.False);
            var e=Event();fx.HandleEvent(e);fx.Advance(.05f);fx.ApplySnapshot(null,initial.SessionId);
            Assert.That(fx.IsVisible,Is.False);Assert.That(fx.cameraRig.BlessingShake,Is.EqualTo(Vector2.zero));
            fx.ApplySnapshot(initial.Snapshot,initial.SessionId);fx.HandleEvent(e);Assert.That(fx.IsVisible,Is.False);
            fx.ApplySnapshot(initial.Snapshot,"new-session");fx.HandleEvent(e);Assert.That(fx.IsVisible,Is.True);fx.Hide();
            Assert.That(fx.IsVisible,Is.False);Assert.That(fx.cameraRig.BlessingShake,Is.EqualTo(Vector2.zero));
        }
        [Test] public void LowQualityDisablesShakeAndPopExpiresWhilePausedOrBattling()
        {
            fx.scene.quality=SectQuality.Low;fx.HandleEvent(Event());fx.Advance(.05f);Assert.That(fx.IsVisible,Is.True);Assert.That(fx.cameraRig.BlessingShake,Is.EqualTo(Vector2.zero));
            foreach(var phase in new[]{"paused","stopped","battle"})
            {
                var raw=JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/ItemReceipts/initial.json"));raw["payload"]["phase"]=phase;
                fx.ApplySnapshot(Parse(raw.ToString()).Snapshot,initial.SessionId);fx.HandleEvent(Event());fx.Advance(2.1f);Assert.That(fx.IsVisible,Is.False,phase);
            }
        }
        [Test] public void ShakePreservesAndRestoresConcurrentItemCameraFocus()
        {
            var start=fx.cameraRig.transform.position;float zoom=fx.cameraRig.GetComponent<Camera>().orthographicSize;
            fx.cameraRig.SetReceiptFocus(new Vector3(2,-4,0),2.4f,1);var close=fx.cameraRig.transform.position;
            fx.HandleEvent(Event());fx.Advance(.05f);Assert.That(fx.cameraRig.HasReceiptFocus,Is.True);Assert.That(Vector3.Distance(close,fx.cameraRig.transform.position),Is.LessThan(.04f));
            fx.Advance(2);Assert.That(Vector3.Distance(close,fx.cameraRig.transform.position),Is.LessThan(.0001f));Assert.That(fx.cameraRig.GetComponent<Camera>().orthographicSize,Is.EqualTo(2.4f));
            fx.cameraRig.ClearReceiptFocus();Assert.That(Vector3.Distance(start,fx.cameraRig.transform.position),Is.LessThan(.0001f));Assert.That(fx.cameraRig.GetComponent<Camera>().orthographicSize,Is.EqualTo(zoom));
        }
        [UnityTest] public IEnumerator PlayProtocolPopsAndPlaysExistingSfxExactlyOnce()
        {
            yield return new EnterPlayMode();yield return null;
            var live=Object.FindAnyObjectByType<BlessingReceiptPresenter>();var audio=Object.FindAnyObjectByType<GameAudioManager>();
            Assert.That(live,Is.Not.Null,"Presenter after EnterPlayMode");Assert.That(audio,Is.Not.Null,"Audio manager after EnterPlayMode");Assert.That(live.network,Is.Not.Null,"Network reference after EnterPlayMode");
            live.network.enabled=false;live.network.enabled=true;live.network.enabled=false;live.Refresh();audio.Refresh();
            var protocol=live.network.Protocol;protocol.Open(9701);protocol.Accept(File.ReadAllText("Assets/Tests/Fixtures/ItemReceipts/initial.json"),9701,0);yield return null;
            int played=audio.PlayedEffects;var raw=RawEvent();raw["sessionId"]=protocol.State.SessionId;raw["seq"]=999;raw["payload"]["count"]=4;
            Assert.That(protocol.Accept(raw.ToString(),9701,0),Is.True);
            bool popup=live.IsVisible&&live.Count==4;bool sound=audio.PlayedEffects==played+1&&audio.LastEffect=="banphuc"&&PlayingBlessing(audio);
            protocol.Accept(raw.ToString(),9701,0);bool dedup=audio.PlayedEffects==played+1&&live.Count==4;
            double until=EditorApplication.timeSinceStartup+5;while(live.IsVisible&&EditorApplication.timeSinceStartup<until)yield return null;
            bool expired=!live.IsVisible&&live.visual.alpha==0&&live.cameraRig.BlessingShake==Vector2.zero;
            protocol.Disconnect(9701);yield return null;bool clean=!live.IsVisible;
            protocol.Open(9701);protocol.Accept(File.ReadAllText("Assets/Tests/Fixtures/ItemReceipts/initial.json"),9701,0);
            raw["payload"]["eventId"]="disable-live";raw["seq"]=1000;protocol.Accept(raw.ToString(),9701,0);
            bool visibleBeforeDisable=live.IsVisible;live.enabled=false;clean&=visibleBeforeDisable&&!live.IsVisible&&live.cameraRig.BlessingShake==Vector2.zero;
            yield return new ExitPlayMode();
            Assert.That(popup&&sound&&dedup&&expired&&clean,Is.True,$"popup={popup} sound={sound} dedup={dedup} expired={expired} clean={clean}");
        }
        private static IEnumerator Control(string url,string action,string item)
        {
            var json=new JObject{["action"]=action,["userId"]="receipt:29",["value"]=item};
            using var request=new UnityWebRequest(url+"/api/control","POST"){uploadHandler=new UploadHandlerRaw(Encoding.UTF8.GetBytes(json.ToString())),downloadHandler=new DownloadHandlerBuffer()};
            request.SetRequestHeader("Content-Type","application/json");request.timeout=5;request.SendWebRequest();while(!request.isDone)yield return null;
            Assert.That(request.responseCode,Is.EqualTo(200),request.error+" "+request.downloadHandler.text);
        }
        [UnityTest] public IEnumerator ActualHttpBlessingActivationUsesServerEventAndAudio()
        {
            string url=Environment.GetEnvironmentVariable("TUTIEN_RECEIPT_TEST_URL");if(string.IsNullOrEmpty(url))Assert.Ignore("Needs disposable receipt test server.");
            var uri=new Uri(url);Assert.That(uri.IsLoopback,Is.True);
            var config=new SerializedObject(fx.network);config.FindProperty("endpoint").stringValue="ws://"+uri.Authority+"/ws";config.ApplyModifiedPropertiesWithoutUndo();fx.network.enabled=true;
            yield return new EnterPlayMode();var live=Object.FindAnyObjectByType<BlessingReceiptPresenter>();var audio=Object.FindAnyObjectByType<GameAudioManager>();
            url=Environment.GetEnvironmentVariable("TUTIEN_RECEIPT_TEST_URL");double deadline=EditorApplication.timeSinceStartup+10;
            while(live.network.Protocol?.State.Snapshot==null&&EditorApplication.timeSinceStartup<deadline)yield return null;
            Assert.That(live.network.Protocol.State.Snapshot,Is.Not.Null);int played=audio.PlayedEffects;
            // Newly received blessings activate immediately; no inventory copy remains to use again.
            yield return Control(url,"grantItem","blessing");
            deadline=EditorApplication.timeSinceStartup+5;while(!live.IsVisible&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool activated=live.IsVisible&&live.Count==1&&audio.PlayedEffects==played+1&&audio.LastEffect=="banphuc";
            string details=$"visible={live.IsVisible} count={live.Count} effects={audio.PlayedEffects} before={played} last={audio.LastEffect}";
            deadline=EditorApplication.timeSinceStartup+5;while(live.IsVisible&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool expired=!live.IsVisible&&live.network.Protocol.State.Snapshot.Blessing.RemainingMs>0;
            yield return new ExitPlayMode();Assert.That(activated&&expired,Is.True,$"activated={activated} expired={expired} {details}");
        }
    }
}
