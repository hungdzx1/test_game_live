using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Collections;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.TestTools;
using TuTienLive.Effects;
using TuTienLive.Models;
using TuTienLive.Network;
using TuTienLive.Scenes;
using Object=UnityEngine.Object;

namespace TuTienLive.Tests
{
    public sealed class LevelUpTests
    {
        private LevelUpPresenter fx;
        private const string Folder="Assets/Tests/Fixtures/LevelUp/";
        private static Envelope Parse(string raw){Assert.That(StateMapper.TryParse(raw,out var value,out var error),Is.True,error);return value;}
        private static Envelope Read(string name)=>Parse(File.ReadAllText(Folder+name+".json"));
        [SetUp] public void Open()
        {
            if(Application.isPlaying)return;EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");
            fx=Object.FindAnyObjectByType<LevelUpPresenter>();Assert.That(fx,Is.Not.Null);fx.enabled=false;fx.network.enabled=false;fx.characters.enabled=false;fx.characters.scene.quality=SectQuality.High;
            State("initial");
        }
        [TearDown] public void Close(){if(!Application.isPlaying)EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");}
        [UnityTearDown] public IEnumerator LeavePlay(){if(Application.isPlaying)yield return new ExitPlayMode();}
        private void State(string name){var data=Read(name);fx.characters.ApplySnapshot(data.Snapshot,data.SessionId);fx.characters.Sample(0,0);fx.ApplySnapshot(data.Snapshot,data.SessionId);}
        private static GameEvent Stage(string user,int index=1)
        {var raw=JObject.Parse(File.ReadAllText(Folder+"stage.json"));raw["payload"]["userId"]=user;raw["payload"]["eventId"]=Guid.NewGuid().ToString();raw["payload"]["stageIndex"]=index;return Parse(raw.ToString()).Event;}
        private static SpriteRenderer[] Visible(LevelUpPresenter presenter)=>presenter.GetComponentsInChildren<SpriteRenderer>().Where(r=>r.enabled).ToArray();
        [Test] public void SevenSuppliedLayersAndOptionalMissingBeamAreSavedWithoutGeneratedTextures()
        {
            Assert.That(fx.layers.Length,Is.EqualTo(8));Assert.That(fx.layers[4],Is.Null);Assert.That(fx.layers.Count(s=>s),Is.EqualTo(7));Assert.That(fx.duration,Is.EqualTo(2));
            for(int i=0;i<8;i++)if(fx.layers[i]){Assert.That(AssetDatabase.GetAssetPath(fx.layers[i]),Does.StartWith("Assets/Art/Characters/LVUP/levelup_"));Assert.That(fx.visibleRegions[i].width,Is.InRange(.01f,1));}
        }
        [Test] public void StageAndSuccessfulRealmEventsTriggerOnceWhileFailuresAndSnapshotsNeverDo()
        {
            Assert.That(fx.ActiveCount,Is.Zero);State("stage-after");fx.Advance(.2f);Assert.That(fx.ActiveCount,Is.Zero);
            var stage=Read("stage").Event;fx.HandleEvent(stage);fx.HandleEvent(stage);fx.Advance(0);fx.Advance(.2f);
            Assert.That(fx.AcceptedCount,Is.EqualTo(1));Assert.That(fx.IsActive("level:12"),Is.True);Assert.That(Visible(fx).Length,Is.EqualTo(7));
            fx.Advance(2);State("realm-after");var realm=Read("realm").Event;fx.characters.HandleEvent(realm);fx.characters.Sample(0,0);fx.HandleEvent(realm);fx.Advance(0);fx.Advance(.2f);
            Assert.That(fx.IsActive("level:29"),Is.True);Assert.That(fx.ActiveCount,Is.EqualTo(1));
            fx.Advance(2);fx.HandleEvent(Read("failure").Event);fx.HandleEvent(Stage("level:1",0));fx.Advance(.2f);Assert.That(fx.ActiveCount,Is.Zero);
        }
        [Test] public void PopFadeAndLayersFollowActualMovingRecipientWithoutChangingSnapshotOrCamera()
        {
            var original=Read("initial").Snapshot;string before=original.CopyJson().ToString();var camera=fx.characters.scene.cameraRig.GetComponent<Camera>();var position=camera.transform.position;float zoom=camera.orthographicSize;
            fx.HandleEvent(Read("stage").Event);fx.Advance(0);fx.Advance(.15f);var renderer=Visible(fx).First(r=>r.sprite==fx.layers[0]);var start=renderer.transform.position;
            var recipient=fx.characters.Views["level:12"];recipient.transform.position+=Vector3.up;fx.Advance(0);
            Assert.That(Vector3.Distance(renderer.transform.position,start+Vector3.up),Is.LessThan(.001));
            var corners=new Vector3[4];recipient.nameLabel.rectTransform.GetWorldCorners(corners);var region=fx.visibleRegions[0];var title=renderer.sprite.bounds;
            var lower=renderer.transform.TransformPoint(new Vector3(title.center.x,title.min.y+title.size.y*region.y,0));Assert.That(lower.y,Is.GreaterThan(corners.Max(p=>p.y)),"LV UP must remain above the recipient name card.");
            Assert.That(renderer.color.a,Is.GreaterThan(.9f));fx.Advance(1.6f);Assert.That(renderer.color.a,Is.InRange(.1f,.8f));fx.Advance(.3f);
            Assert.That(fx.ActiveCount,Is.Zero);Assert.That(Visible(fx).Length,Is.Zero);Assert.That(original.CopyJson().ToString(),Is.EqualTo(before));Assert.That(camera.transform.position,Is.EqualTo(position));Assert.That(camera.orthographicSize,Is.EqualTo(zoom));
        }
        [Test] public void ConsecutiveSubStagesMergeWithoutExtendingLifetimeAndHiddenRecipientUsesExistingRosterPriority()
        {
            fx.HandleEvent(Read("stage").Event);fx.Advance(0);fx.Advance(1);fx.HandleEvent(Read("multi-1").Event);fx.HandleEvent(Read("multi-2").Event);fx.Advance(.2f);
            Assert.That(fx.ActiveCount,Is.EqualTo(1));Assert.That(fx.QueuedCount,Is.Zero);fx.Advance(.81f);Assert.That(fx.ActiveCount,Is.Zero);
            Assert.That(fx.characters.Views.ContainsKey("level:29"),Is.False);var hidden=Read("hidden").Event;fx.HandleEvent(hidden);fx.Advance(.1f);Assert.That(fx.QueuedCount,Is.EqualTo(1));
            fx.characters.HandleEvent(hidden);fx.characters.Sample(0,0);fx.Advance(0);Assert.That(fx.IsActive("level:29"),Is.True);Assert.That(fx.characters.Views.Count,Is.EqualTo(25));
        }
        [Test] public void BurstPoolAndQueueAreBoundedAndLowQualityUsesTwoFourLayerCelebrations()
        {
            for(int i=0;i<25;i++)fx.HandleEvent(Stage("level:"+i));fx.Advance(0);fx.Advance(.2f);Assert.That(fx.ActiveCount,Is.EqualTo(8));Assert.That(fx.CreatedCount,Is.EqualTo(8));Assert.That(Visible(fx).Length,Is.EqualTo(56));
            for(int i=0;i<500;i++)fx.HandleEvent(Stage("hidden:"+i));Assert.That(fx.QueuedCount,Is.LessThanOrEqualTo(32));Assert.That(fx.SkippedVisuals,Is.GreaterThan(0));
            fx.Advance(9);Assert.That(fx.ActiveCount+fx.QueuedCount,Is.Zero);Assert.That(fx.GetComponentsInChildren<SpriteRenderer>().Length,Is.EqualTo(64));
            fx.characters.scene.quality=SectQuality.Low;for(int i=0;i<3;i++)fx.HandleEvent(Stage("level:"+i));fx.Advance(0);fx.Advance(.2f);Assert.That(fx.ActiveCount,Is.EqualTo(2));Assert.That(Visible(fx).Length,Is.EqualTo(8));
        }
        [Test] public void PauseFreezesAndSessionDisconnectOrBattleClearsVisualsWithoutReplayingLevels()
        {
            fx.HandleEvent(Read("stage").Event);fx.Advance(0);fx.Advance(.2f);var raw=JObject.Parse(File.ReadAllText(Folder+"initial.json"));raw["payload"]["phase"]="paused";raw["payload"]["effectivePhase"]="cultivation";
            fx.ApplySnapshot(Parse(raw.ToString()).Snapshot,Read("initial").SessionId);fx.Advance(100);Assert.That(fx.ActiveCount,Is.EqualTo(1));
            raw["payload"]["phase"]="battle";raw["payload"]["effectivePhase"]="battle";fx.ApplySnapshot(Parse(raw.ToString()).Snapshot,Read("initial").SessionId);fx.Advance(0);Assert.That(Visible(fx).Length,Is.Zero);
            State("initial");fx.HandleEvent(Stage("level:0"));fx.Advance(0);fx.ApplySnapshot(null,Read("initial").SessionId);Assert.That(fx.ActiveCount+fx.QueuedCount,Is.Zero);
            fx.ApplySnapshot(Read("stage-after").Snapshot,"new-session");fx.Advance(.5f);Assert.That(fx.ActiveCount,Is.Zero);
        }
        [UnityTest] public IEnumerator PlayProtocolPromotionDisableAndReconnectNeverReplayOldLevelEffects()
        {
            yield return new EnterPlayMode();var live=Object.FindAnyObjectByType<LevelUpPresenter>();live.characters.scene.quality=SectQuality.High;live.characters.enabled=true;
            live.network.enabled=true;live.network.enabled=false;live.enabled=false;live.enabled=true;var protocol=live.network.Protocol;protocol.Open(9740);
            Assert.That(protocol.Accept(File.ReadAllText(Folder+"initial.json"),9740,0),Is.True);yield return null;Assert.That(protocol.Accept(File.ReadAllText(Folder+"stage.json"),9740,1),Is.True);
            double until=EditorApplication.timeSinceStartup+5;while(!live.IsActive("level:12")&&EditorApplication.timeSinceStartup<until)yield return null;
            bool shown=live.IsActive("level:12");live.enabled=false;bool cleared=live.ActiveCount==0&&Visible(live).Length==0;live.enabled=true;
            protocol.Disconnect(9740);yield return null;protocol.Open(9741);Assert.That(protocol.Accept(File.ReadAllText(Folder+"stage-after.json"),9741,2),Is.True);yield return null;
            bool noReplay=live.ActiveCount==0;yield return new ExitPlayMode();Assert.That(shown&&cleared&&noReplay,Is.True,$"shown={shown} cleared={cleared} noReplay={noReplay}");
        }
        private static IEnumerator Control(string url,string action,string value=null)
        {
            var json=new JObject{["action"]=action,["userId"]="level:12",["value"]=value};using var request=new UnityWebRequest(url+"/api/control","POST"){uploadHandler=new UploadHandlerRaw(Encoding.UTF8.GetBytes(json.ToString())),downloadHandler=new DownloadHandlerBuffer()};
            request.SetRequestHeader("Content-Type","application/json");request.timeout=5;request.SendWebRequest();while(!request.isDone)yield return null;Assert.That(request.responseCode,Is.EqualTo(200),request.error+" "+request.downloadHandler.text);
        }
        [UnityTest] public IEnumerator ActualHttpPreparationAndWebSocketShowSubStageAndSuccessfulRealmPromotions()
        {
            string url=Environment.GetEnvironmentVariable("TUTIEN_LEVELUP_TEST_URL");if(string.IsNullOrEmpty(url))Assert.Ignore("Needs disposable level-up server.");var uri=new Uri(url);Assert.That(uri.IsLoopback,Is.True);
            var settings=new SerializedObject(fx.network);settings.FindProperty("endpoint").stringValue="ws://"+uri.Authority+"/ws";settings.ApplyModifiedPropertiesWithoutUndo();fx.network.enabled=true;fx.characters.enabled=true;fx.enabled=true;
            yield return new EnterPlayMode();var live=Object.FindAnyObjectByType<LevelUpPresenter>();url=Environment.GetEnvironmentVariable("TUTIEN_LEVELUP_TEST_URL");
            double deadline=EditorApplication.timeSinceStartup+10;while(live.characters.TotalPlayers!=30&&EditorApplication.timeSinceStartup<deadline)yield return null;
            yield return Control(url,"phase","resume");yield return Control(url,"prepareBreakthrough");deadline=EditorApplication.timeSinceStartup+5;
            while(!live.IsActive("level:12")&&EditorApplication.timeSinceStartup<deadline)yield return null;bool stage=live.IsActive("level:12")&&live.AcceptedCount>=3;
            deadline=EditorApplication.timeSinceStartup+20;while(live.AcceptedCount<4&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool realm=live.AcceptedCount>=4;deadline=EditorApplication.timeSinceStartup+3;while(!live.IsActive("level:12")&&EditorApplication.timeSinceStartup<deadline)yield return null;realm&=live.IsActive("level:12");
            yield return Control(url,"phase","paused");yield return new ExitPlayMode();Assert.That(stage&&realm,Is.True,$"substage={stage} realm={realm}");
        }
    }
}
