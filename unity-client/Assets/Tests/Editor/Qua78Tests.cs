using System;
using System.IO;
using System.Linq;
using System.Collections;
using System.Text;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.TestTools;
using UnityEngine.Networking;
using TuTienLive.Effects;
using TuTienLive.Models;
using TuTienLive.Network;
using TuTienLive.Scenes;
using Object=UnityEngine.Object;

namespace TuTienLive.Tests
{
    public sealed class Qua78Tests
    {
        private GroupReceiptPresenter group;private IdleCameraPresenter idle;private ItemReceiptPresenter items;
        private const string Folder="Assets/Tests/Fixtures/Qua78/";
        private static Envelope Read(string name){Assert.That(StateMapper.TryParse(File.ReadAllText(Folder+name+".json"),out var value,out var error),Is.True,error);return value;}
        [SetUp] public void Open(){if(Application.isPlaying)return;EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");group=Object.FindAnyObjectByType<GroupReceiptPresenter>();idle=Object.FindAnyObjectByType<IdleCameraPresenter>();Assert.That(group&&idle,Is.True);items=group.items;group.enabled=idle.enabled=items.enabled=false;group.network.enabled=false;group.characters.enabled=false;group.characters.scene.quality=SectQuality.High;items.cameraRig.driftEnabled=false;State("initial");idle.ChooseIndex=n=>0;}
        [TearDown] public void Close(){if(!Application.isPlaying)EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");}
        [UnityTearDown] public IEnumerator LeavePlay(){if(Application.isPlaying)yield return new ExitPlayMode();}
        private void State(string name){var message=Read(name);group.characters.ApplySnapshot(message.Snapshot,message.SessionId);group.characters.Sample(0,0);group.ApplySnapshot(message.Snapshot,message.SessionId);items.ApplySnapshot(message.Snapshot,message.SessionId);idle.ApplySnapshot(message.Snapshot,message.SessionId);}
        [Test] public void WholeSectDisplaysAllVisibleMembersAtOnceWithoutCameraOrRosterFocusAndDeduplicates()
        {
            var camera=items.cameraRig.GetComponent<Camera>();var position=camera.transform.position;float zoom=camera.orthographicSize;
            for(int i=0;i<30;i++){var e=Read("group-"+i).Event;group.HandleEvent(e);group.HandleEvent(e);items.HandleEvent(e);idle.HandleEvent(e);}group.Advance(.5f);items.Advance(.5f);idle.Advance(.5f);
            Assert.That(group.ActiveCount,Is.EqualTo(25));Assert.That(group.CreatedCount,Is.EqualTo(25));Assert.That(items.QueuedCount,Is.Zero);Assert.That(items.ActiveUserId,Is.Null);Assert.That(group.characters.ItemFocusUserId,Is.Null);
            Assert.That(camera.transform.position,Is.EqualTo(position));Assert.That(camera.orthographicSize,Is.EqualTo(zoom));group.Advance(1.4f);Assert.That(group.ActiveCount,Is.Zero);
            var raw=JObject.Parse(File.ReadAllText(Folder+"group-0.json"));raw["payload"]["item"]="camera";raw["payload"]["eventId"]=Guid.NewGuid().ToString();Assert.That(StateMapper.TryParse(raw.ToString(),out var cameraGift,out _),Is.True);group.HandleEvent(cameraGift.Event);group.Advance(.2f);Assert.That(group.ActiveCount,Is.EqualTo(1));Assert.That(camera.orthographicSize,Is.EqualTo(zoom));
        }
        [Test] public void IdleWaitsFifteenSecondsPansZoomsThenReturnsExactlyToAuthoredCamera()
        {
            var camera=items.cameraRig.GetComponent<Camera>();var position=camera.transform.position;var rotation=camera.transform.rotation;float zoom=camera.orthographicSize;
            idle.Advance(14.9f);Assert.That(idle.Mode,Is.EqualTo("overview"));Assert.That(items.cameraRig.HasAmbientFocus,Is.False);idle.Advance(.11f);idle.Advance(2);Assert.That(idle.Mode,Is.EqualTo("pan"));Assert.That(camera.orthographicSize,Is.LessThan(zoom));Assert.That(camera.transform.position,Is.Not.EqualTo(position));
            idle.Advance(19.6f);Assert.That(idle.Mode,Is.EqualTo("overview"));Assert.That(camera.transform.position,Is.EqualTo(position));Assert.That(camera.transform.rotation,Is.EqualTo(rotation));Assert.That(camera.orthographicSize,Is.EqualTo(zoom));
        }
        [Test] public void PersonalReceiptInterruptsIdleDirectlyThenZoomsWithNameRealmCardsAndRestoresScale()
        {
            var scales=group.characters.Views.ToDictionary(p=>p.Key,p=>p.Value.nameLabel.GetComponentInParent<Canvas>().transform.localScale);
            idle.Advance(15);idle.Advance(2);var e=Read("personal").Event;idle.HandleEvent(e);items.HandleEvent(e);items.Advance(.01f);Assert.That(items.ActiveUserId,Is.EqualTo("qua:12"));
            for(int i=0;i<20;i++){idle.Advance(.02f);items.Advance(.02f);}Assert.That(items.ActiveUserId,Is.EqualTo("qua:12"));items.Advance(1);
            Assert.That(items.cameraRig.HasAmbientFocus,Is.False);Assert.That(items.cameraRig.HasReceiptFocus,Is.True);Assert.That(group.characters.Views.Values.All(v=>v.nameLabel.GetComponentInParent<Canvas>().enabled),Is.True);
            Assert.That(group.characters.Views["qua:12"].nameLabel.text,Does.Contain("Đạo hữu 12"));items.Advance(3);
            foreach(var view in group.characters.Views)if(scales.TryGetValue(view.Key,out var scale))Assert.That(Vector3.Distance(scale,view.Value.nameLabel.GetComponentInParent<Canvas>().transform.localScale),Is.LessThan(.001));
        }
        [Test] public void WholeSectFreezesAmbientShotWhileIconsAreVisibleAndPoolRemainsBounded()
        {
            idle.Advance(15);idle.Advance(2);var camera=items.cameraRig.GetComponent<Camera>();var position=camera.transform.position;float zoom=camera.orthographicSize;
            var e=Read("group-12").Event;idle.HandleEvent(e);group.HandleEvent(e);group.Advance(.5f);idle.Advance(.5f);Assert.That(camera.transform.position,Is.EqualTo(position));Assert.That(camera.orthographicSize,Is.EqualTo(zoom));
            for(int round=0;round<100;round++){group.ResetPresentation();for(int i=0;i<30;i++)group.HandleEvent(Read("group-"+i).Event);group.Advance(2);}
            Assert.That(group.CreatedCount,Is.LessThanOrEqualTo(25));group.ApplySnapshot(null,Read("initial").SessionId);Assert.That(group.ActiveCount,Is.Zero);
        }
        [Test] public void RitualFlightIsFollowedAndBattleDisconnectOrSessionChangeRestoresOverview()
        {
            State("ritual");idle.Advance(1);Assert.That(idle.Mode,Is.EqualTo("overview"));idle.ChooseIndex=n=>n-1;idle.Advance(14);Assert.That(idle.Mode,Is.EqualTo("follow"));Assert.That(items.cameraRig.HasAmbientFocus,Is.True);Assert.That(group.characters.tribulation.UserId,Is.EqualTo("qua:12"));
            idle.ApplySnapshot(null,Read("ritual").SessionId);Assert.That(items.cameraRig.HasAmbientFocus,Is.False);State("initial");idle.Advance(15);idle.Advance(2);
            var raw=JObject.Parse(File.ReadAllText(Folder+"initial.json"));raw["payload"]["phase"]="battle";raw["payload"]["effectivePhase"]="battle";Assert.That(StateMapper.TryParse(raw.ToString(),out var battle,out _),Is.True);idle.ApplySnapshot(battle.Snapshot,Read("initial").SessionId);idle.Advance(1);Assert.That(items.cameraRig.HasAmbientFocus,Is.False);
        }
        [UnityTest] public IEnumerator PlayProtocolGlobalReceiptsNeverEnterPersonalZoomQueueAndDisableCleansUp()
        {
            yield return new EnterPlayMode();var live=Object.FindAnyObjectByType<GroupReceiptPresenter>();live.characters.enabled=true;live.characters.scene.quality=SectQuality.High;live.network.enabled=true;live.network.enabled=false;live.enabled=false;live.enabled=true;
            var protocol=live.network.Protocol;protocol.Open(9750);Assert.That(protocol.Accept(File.ReadAllText(Folder+"initial.json"),9750,0),Is.True);yield return null;
            for(int i=0;i<30;i++)Assert.That(protocol.Accept(File.ReadAllText(Folder+"group-"+i+".json"),9750,i+1),Is.True);
            double until=EditorApplication.timeSinceStartup+3;while(live.ActiveCount<25&&EditorApplication.timeSinceStartup<until)yield return null;
            bool shown=live.ActiveCount==25&&live.items.ActiveUserId==null&&!live.items.cameraRig.HasReceiptFocus;string details=$"active={live.ActiveCount} pool={live.CreatedCount} views={live.characters.Views.Count} personal={live.items.ActiveUserId}";live.enabled=false;bool cleared=live.ActiveCount==0;protocol.Disconnect(9750);yield return null;
            yield return new ExitPlayMode();Assert.That(shown&&cleared,Is.True,$"shown={shown} cleared={cleared} {details}");
        }
        private static IEnumerator Control(string url,string action,string value)
        {
            var json=new JObject{["action"]=action,["value"]=value,["userId"]="qua:12"};using var request=new UnityWebRequest(url+"/api/control","POST"){uploadHandler=new UploadHandlerRaw(Encoding.UTF8.GetBytes(json.ToString())),downloadHandler=new DownloadHandlerBuffer()};request.SetRequestHeader("Content-Type","application/json");request.timeout=5;request.SendWebRequest();while(!request.isDone)yield return null;Assert.That(request.responseCode,Is.EqualTo(200),request.error+" "+request.downloadHandler.text);
        }
        [UnityTest] public IEnumerator RealHttpPersonalGiftAndBossRewardsUseDifferentCameraPaths()
        {
            string url=Environment.GetEnvironmentVariable("TUTIEN_QUA78_TEST_URL");if(string.IsNullOrEmpty(url))Assert.Ignore("Needs isolated Qua78 server.");var uri=new Uri(url);Assert.That(uri.IsLoopback,Is.True);var config=new SerializedObject(group.network);config.FindProperty("endpoint").stringValue="ws://"+uri.Authority+"/ws";config.ApplyModifiedPropertiesWithoutUndo();group.network.enabled=true;group.characters.enabled=true;items.enabled=group.enabled=idle.enabled=true;
            yield return new EnterPlayMode();var live=Object.FindAnyObjectByType<GroupReceiptPresenter>();live.characters.scene.quality=SectQuality.High;url=Environment.GetEnvironmentVariable("TUTIEN_QUA78_TEST_URL");double deadline=EditorApplication.timeSinceStartup+10;while(live.characters.Views.Count!=25&&EditorApplication.timeSinceStartup<deadline)yield return null;
            yield return Control(url,"phase","cultivation");yield return Control(url,"grantItem","tea");deadline=EditorApplication.timeSinceStartup+5;while(live.items.ActiveUserId==null&&EditorApplication.timeSinceStartup<deadline)yield return null;bool personal=live.items.ActiveUserId=="qua:12";
            deadline=EditorApplication.timeSinceStartup+5;while(live.items.Elapsed<1.2f&&EditorApplication.timeSinceStartup<deadline)yield return null;personal&=live.items.cameraRig.HasReceiptFocus&&live.characters.Views["qua:12"].nameLabel.GetComponentInParent<Canvas>().enabled;
            deadline=EditorApplication.timeSinceStartup+6;while(live.items.ActiveUserId!=null&&EditorApplication.timeSinceStartup<deadline)yield return null;
            yield return Control(url,"phase","battle");deadline=EditorApplication.timeSinceStartup+6;while(live.ActiveCount<25&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool all=live.ActiveCount==25&&live.items.ActiveUserId==null&&live.items.QueuedCount==0&&!live.items.cameraRig.HasReceiptFocus;
            yield return Control(url,"phase","paused");yield return new ExitPlayMode();Assert.That(personal&&all,Is.True,$"personal={personal} all={all}");
        }
    }
}
