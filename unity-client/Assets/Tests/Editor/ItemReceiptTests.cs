using System;
using System.IO;
using System.Linq;
using System.Collections;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.TestTools;
using UnityEditor;
using UnityEngine.Networking;
using System.Text;
using TuTienLive.Characters;
using TuTienLive.Effects;
using TuTienLive.Models;
using TuTienLive.Network;

namespace TuTienLive.Tests
{
    public sealed class ItemReceiptTests
    {
        private ItemReceiptPresenter fx;
        private CharacterManager manager;
        private Envelope initial;
        private const string Folder="Assets/Tests/Fixtures/ItemReceipts/";
        [SetUp] public void Open()
        {
            if(Application.isPlaying)return;
            EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");
            fx=UnityEngine.Object.FindAnyObjectByType<ItemReceiptPresenter>();Assert.That(fx,Is.Not.Null);
            manager=fx.characters;manager.network.enabled=false;manager.enabled=false;fx.enabled=false;
            initial=Read("initial");manager.ApplySnapshot(initial.Snapshot,initial.SessionId);manager.Sample(0,0);fx.ApplySnapshot(initial.Snapshot,initial.SessionId);
        }
        [TearDown] public void Close(){if(!Application.isPlaying)EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");}
        [UnityTearDown] public IEnumerator LeavePlayAfterFailure(){if(Application.isPlaying)yield return new ExitPlayMode();}
        private static Envelope Read(string name){Assert.That(StateMapper.TryParse(File.ReadAllText(Folder+name+".json"),out var value,out var error),Is.True,error);return value;}
        private static GameEvent Event(string item="tea",int count=3,string user="receipt:29")
        {
            var json=JObject.Parse(File.ReadAllText(Folder+item+".json"));json["payload"]["eventId"]=Guid.NewGuid().ToString();json["payload"]["count"]=count;json["payload"]["userId"]=user;
            Assert.That(StateMapper.TryParse(json.ToString(),out var value,out var error),Is.True,error);return value.Event;
        }
        [Test] public void ExactTimelinePopsFloatsFadesAndRestoresAuthoredCamera()
        {
            var camera=fx.cameraRig.GetComponent<Camera>();var start=fx.cameraRig.transform.position;float wide=camera.orthographicSize;
            for(int repeat=0;repeat<3;repeat++)
            {
                fx.HandleEvent(Event());fx.Advance(.4f);Assert.That(camera.orthographicSize,Is.LessThan(wide));Assert.That(fx.visual.alpha,Is.Zero);
                fx.Advance(.4f);Assert.That(camera.orthographicSize,Is.EqualTo(fx.zoomHalfHeight).Within(.001));Assert.That(fx.iconTransform.localScale.x,Is.EqualTo(.08f).Within(.001));
                fx.Advance(.4f);Assert.That(fx.iconTransform.localScale.x,Is.EqualTo(1).Within(.001));Assert.That(fx.label.text,Does.Contain("Trà ngộ đạo"));Assert.That(fx.label.text,Does.Contain("×3"));
                Assert.That(fx.label.text,Does.Contain("Đạo hữu 29"));Assert.That(manager.Views.Values.All(v=>v.nameLabel.GetComponentInParent<Canvas>().enabled),Is.True);
                var iconPosition=fx.visualRoot.localPosition;fx.Advance(.5f);Assert.That(fx.visualRoot.localPosition.y,Is.GreaterThan(iconPosition.y));Assert.That(fx.visual.alpha,Is.InRange(.1f,.9f));
                fx.Advance(.5f);Assert.That(fx.visual.alpha,Is.EqualTo(0).Within(.001));fx.Advance(.8f);
                Assert.That(fx.ActiveUserId,Is.Null);Assert.That(fx.cameraRig.HasReceiptFocus,Is.False);
                Assert.That(camera.orthographicSize,Is.EqualTo(wide).Within(.001));Assert.That(Vector3.Distance(start,fx.cameraRig.transform.position),Is.LessThan(.0001));
                Assert.That(manager.Views.Values.All(v=>v.nameLabel.GetComponentInParent<Canvas>().enabled),Is.True);
            }
        }
        [Test] public void QueueMergesCountsWithoutReplayingEventsOrHoldingCameraForever()
        {
            var first=Event();fx.HandleEvent(first);fx.HandleEvent(first);fx.HandleEvent(Event());Assert.That(fx.QueuedCount,Is.EqualTo(1));
            fx.Advance(.4f);Assert.That(fx.ActiveCount,Is.EqualTo(6));fx.HandleEvent(Event());Assert.That(fx.ActiveCount,Is.EqualTo(9));
            fx.Advance(.8f);fx.HandleEvent(Event());fx.HandleEvent(Event("root",5));Assert.That(fx.QueuedCount,Is.EqualTo(2));
            fx.Advance(1.8f);Assert.That(fx.ActiveUserId,Is.Null);fx.Advance(0);Assert.That(fx.ActiveItem,Is.EqualTo("tea"));Assert.That(fx.ActiveCount,Is.EqualTo(3));
            fx.Advance(3);fx.Advance(0);Assert.That(fx.ActiveItem,Is.EqualTo("root"));Assert.That(fx.ActiveCount,Is.EqualTo(5));
        }
        [Test] public void GiftInterruptsRitualCameraAndKeepsBothHiddenRecipientAndRitualVisible()
        {
            var ritual=Read("ritual");manager.ApplySnapshot(ritual.Snapshot,ritual.SessionId);manager.Sample(0,0);fx.ApplySnapshot(ritual.Snapshot,ritual.SessionId);
            string before=ritual.Snapshot.CopyJson().ToString();fx.HandleEvent(Event());fx.Advance(.8f);
            Assert.That(fx.waitForTribulation,Is.False);Assert.That(manager.tribulation.UserId,Is.EqualTo("receipt:4"));
            Assert.That(manager.Views.ContainsKey("receipt:29")&&manager.Views.ContainsKey("receipt:4"),Is.True);
            Assert.That(manager.Views.Values.Select(v=>v.Seat).Distinct().Count(),Is.EqualTo(25));
            var body=manager.Views["receipt:29"].pose.Body;var target=body.transform.TransformPoint(body.sprite.bounds.center);
            Assert.That(Vector2.Distance(fx.cameraRig.transform.position,target),Is.LessThan(.001));
            Assert.That(ritual.Snapshot.CopyJson().ToString(),Is.EqualTo(before));
        }
        [Test] public void PauseDisconnectNewSessionAndDisableRestoreCameraAndClearVisuals()
        {
            var camera=fx.cameraRig.GetComponent<Camera>();float wide=camera.orthographicSize;var start=camera.transform.position;
            fx.HandleEvent(Event());fx.Advance(1.3f);
            var json=initial.Snapshot.CopyJson();json["phase"]="paused";var envelope=JObject.Parse(File.ReadAllText(Folder+"initial.json"));envelope["payload"]=json;
            Assert.That(StateMapper.TryParse(envelope.ToString(),out var paused,out _),Is.True);fx.ApplySnapshot(paused.Snapshot,initial.SessionId);fx.Advance(1);
            Assert.That(fx.Elapsed,Is.EqualTo(1.3f).Within(.001));
            fx.ApplySnapshot(null,initial.SessionId);Assert.That(fx.visual.alpha,Is.Zero);Assert.That(fx.QueuedCount,Is.Zero);Assert.That(camera.orthographicSize,Is.EqualTo(wide));
            Assert.That(Vector3.Distance(start,camera.transform.position),Is.LessThan(.0001));
            fx.ApplySnapshot(initial.Snapshot,"new-session");fx.HandleEvent(Event());fx.Advance(1);fx.ApplySnapshot(initial.Snapshot,"another-session");
            Assert.That(fx.ActiveUserId,Is.Null);Assert.That(fx.cameraRig.HasReceiptFocus,Is.False);
        }
        [Test] public void BoundedQueueRejectsInvalidCountsAndUnsupportedItemsAndAllowsSnapshotToCatchUp()
        {
            fx.HandleEvent(Event(count:0));Assert.That(fx.QueuedCount,Is.Zero);
            var bad=JObject.Parse(File.ReadAllText(Folder+"tea.json"));bad["payload"]["item"]="blessing";
            Assert.That(StateMapper.TryParse(bad.ToString(),out var unsupported,out _),Is.True);fx.HandleEvent(unsupported.Event);Assert.That(fx.QueuedCount,Is.Zero);
            fx.mergeReceipts=false;fx.maxQueuedReceipts=3;for(int i=0;i<5;i++)fx.HandleEvent(Event());
            Assert.That(fx.QueuedCount,Is.EqualTo(3));Assert.That(fx.DroppedVisuals,Is.EqualTo(2));fx.ResetPresentation();
            fx.HandleEvent(Event(user:"late"));fx.Advance(0);Assert.That(fx.ActiveUserId,Is.Null);Assert.That(fx.QueuedCount,Is.EqualTo(1));
            var envelope=JObject.Parse(File.ReadAllText(Folder+"initial.json"));var players=(JArray)envelope["payload"]["players"];var player=(JObject)players[0].DeepClone();player["userId"]="late";players.Add(player);
            Assert.That(StateMapper.TryParse(envelope.ToString(),out var updated,out _),Is.True);manager.ApplySnapshot(updated.Snapshot,initial.SessionId);fx.ApplySnapshot(updated.Snapshot,initial.SessionId);fx.Advance(0);
            Assert.That(fx.ActiveUserId,Is.EqualTo("late"));
        }
        [UnityTest] public IEnumerator PlayReceivesActualNodePayloadAndRestoresAfterDisconnect()
        {
            yield return new EnterPlayMode();
            var live=UnityEngine.Object.FindAnyObjectByType<ItemReceiptPresenter>();var characters=live.characters;
            characters.enabled=true;characters.network.enabled=true;characters.network.enabled=false;
            live.enabled=false;live.enabled=true; // Bind to the fresh injected protocol before dispatching events.
            var protocol=characters.network.Protocol;protocol.Open(9701);Assert.That(protocol.Accept(File.ReadAllText(Folder+"initial.json"),9701,0),Is.True);yield return null;
            Assert.That(protocol.Accept(File.ReadAllText(Folder+"tea.json"),9701,1),Is.True);
            double until=EditorApplication.timeSinceStartup+10;while(live.Elapsed<1.2f&&EditorApplication.timeSinceStartup<until)yield return null;
            bool receipt=live.ActiveUserId=="receipt:29"&&live.ActiveCount==3&&live.visual.alpha>0&&live.icon.sprite==live.tea&&live.cameraRig.GetComponent<Camera>().orthographicSize<9.6f;
            string details="user="+live.ActiveUserId+" count="+live.ActiveCount+" alpha="+live.visual.alpha+" elapsed="+live.Elapsed;
            protocol.Disconnect(9701);yield return null;
            bool restored=live.ActiveUserId==null&&live.visual.alpha==0&&!live.cameraRig.HasReceiptFocus;
            yield return new ExitPlayMode();Assert.That(receipt&&restored,Is.True,"receipt="+receipt+" restored="+restored+" "+details);
        }
        private static IEnumerator Grant(string url,string item)
        {
            var json=new JObject{["action"]="grantItem",["userId"]="receipt:29",["value"]=item};
            using var request=new UnityWebRequest(url+"/api/control","POST"){uploadHandler=new UploadHandlerRaw(Encoding.UTF8.GetBytes(json.ToString())),downloadHandler=new DownloadHandlerBuffer()};
            request.SetRequestHeader("Content-Type","application/json");request.timeout=5;request.SendWebRequest();while(!request.isDone)yield return null;
            Assert.That(request.responseCode,Is.EqualTo(200),request.error+" "+request.downloadHandler.text);
        }
        [UnityTest] public IEnumerator ActualHttpGrantAndWebSocketAnimateAllThreeItemIcons()
        {
            string url=Environment.GetEnvironmentVariable("TUTIEN_RECEIPT_TEST_URL");if(string.IsNullOrEmpty(url))Assert.Ignore("Needs disposable receipt test server.");
            var uri=new Uri(url);Assert.That(uri.IsLoopback,Is.True);
            var config=new SerializedObject(manager.network);config.FindProperty("endpoint").stringValue="ws://"+uri.Authority+"/ws";config.ApplyModifiedPropertiesWithoutUndo();
            yield return new EnterPlayMode();
            var live=UnityEngine.Object.FindAnyObjectByType<ItemReceiptPresenter>();live.enabled=true;live.characters.enabled=true;live.network.enabled=true;
            url=Environment.GetEnvironmentVariable("TUTIEN_RECEIPT_TEST_URL");
            double deadline=EditorApplication.timeSinceStartup+10;
            while(live.characters.TotalPlayers!=30&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool connected=live.characters.TotalPlayers==30;bool icons=true;
            foreach(string item in new[]{"tea","pill","root"})
            {
                yield return Grant(url,item);deadline=EditorApplication.timeSinceStartup+5;
                while(live.ActiveItem!=item&&EditorApplication.timeSinceStartup<deadline)yield return null;
                double until=EditorApplication.timeSinceStartup+10;while(live.Elapsed<1.2f&&EditorApplication.timeSinceStartup<until)yield return null;
                icons&=live.ActiveUserId=="receipt:29"&&live.ActiveItem==item&&live.ActiveCount==1&&live.visual.alpha>0;
                if(live.characters.Views.TryGetValue("receipt:29",out var recipient))
                {
                    var body=recipient.pose.Body;var point=live.cameraRig.GetComponent<Camera>().WorldToViewportPoint(body.transform.TransformPoint(body.sprite.bounds.center));
                    icons&=Mathf.Abs(point.x-.5f)<.02f&&Mathf.Abs(point.y-.5f)<.02f;
                }
                else icons=false;
                deadline=EditorApplication.timeSinceStartup+15;
                while(live.ActiveUserId!=null&&EditorApplication.timeSinceStartup<deadline)yield return null;
            }
            bool restored=!live.cameraRig.HasReceiptFocus&&Mathf.Abs(live.cameraRig.GetComponent<Camera>().orthographicSize-9.6f)<.001;
            yield return new ExitPlayMode();Assert.That(connected&&icons&&restored,Is.True,"connected="+connected+" icons="+icons+" restored="+restored);
        }
    }
}
