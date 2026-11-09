using System;
using System.IO;
using System.Text;
using System.Linq;
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
using TuTienLive.UI;
using Object=UnityEngine.Object;

namespace TuTienLive.Tests
{
    public sealed class BossBattleTests
    {
        private BossBattlePresenter fx;
        private const string Folder="Assets/Tests/Fixtures/SharedBoss/";
        [SetUp] public void Open()
        {
            if(Application.isPlaying)return;EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");
            fx=Object.FindAnyObjectByType<BossBattlePresenter>();Assert.That(fx,Is.Not.Null);fx.enabled=false;fx.network.enabled=false;fx.characters.enabled=false;fx.characters.scene.quality=SectQuality.High;fx.Hide();
        }
        [TearDown] public void Close(){if(!Application.isPlaying)EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");}
        [UnityTearDown] public IEnumerator LeavePlay(){if(Application.isPlaying)yield return new ExitPlayMode();}
        private static Envelope Read(string name){Assert.That(StateMapper.TryParse(File.ReadAllText(Folder+name+".json"),out var value,out var error),Is.True,error);return value;}
        private void Render(string name,float offset=0,float delta=0)
        {
            var value=Read(name);fx.characters.ApplySnapshot(value.Snapshot,value.SessionId);fx.characters.Sample(offset,0);
            Object.FindAnyObjectByType<Concept02Hud>().Render(value.Snapshot);fx.Sample(value.Snapshot,offset,delta);
        }
        [Test] public void SavedSuppliedFramesHeaderAndAllVisibleDisciplesAttackOnTheirOwnSeats()
        {
            Assert.That(new[]{fx.boss1Frames.Length,fx.boss2Frames.Length,fx.boss3Frames.Length},Is.EqualTo(new[]{6,6,6}));
            Assert.That(fx.informationFrames.Length,Is.EqualTo(3));Assert.That(fx.information.blocksRaycasts||fx.information.interactable,Is.False);
            Assert.That(fx.informationFrame.rectTransform.parent.name,Is.EqualTo("BossInformation"));
            Render("boss1");Assert.That(fx.IsVisible,Is.True);Assert.That(fx.characters.TotalPlayers,Is.EqualTo(30));Assert.That(fx.characters.Views.Count,Is.EqualTo(25));
            foreach(var view in fx.characters.Views.Values){Assert.That(view.pose.Pose,Is.EqualTo("attack"));Assert.That(Vector3.Distance(view.transform.position,view.Seat),Is.LessThan(.001));}
            Assert.That(fx.characters.tribulation.HasCeremony,Is.False);Assert.That(fx.energyWidgets.All(g=>!g.enabled),Is.True);
            Assert.That(AssetDatabase.GetAssetPath(fx.body.sprite),Does.EndWith("/Boss_1.png"));Assert.That(fx.body.transform.position.y,Is.GreaterThan(fx.podium.position.y));
        }
        [Test] public void SixFrameLoopAndHPFillFollowServerWithoutChangingSnapshotOrAuthoredCamera()
        {
            var initial=Read("boss1");string before=initial.Snapshot.CopyJson().ToString();var camera=fx.characters.scene.cameraRig.GetComponent<Camera>();var pose=camera.transform.position;float zoom=camera.orthographicSize;
            Assert.That(fx.framesPerSecond,Is.EqualTo(6));
            foreach(var name in new[]{"boss1","boss2","boss3"})
            {
                // A loop spans 60 reference frames at 60 FPS; each supplied sprite holds for ten.
                for(int frame=0;frame<=60;frame++)
                {
                    Render(name,frame*(1000f/60)+.01f);
                    Assert.That(fx.FrameIndex,Is.EqualTo(frame/10%6),name+" reference frame "+frame);
                }
            }
            Render("half");Assert.That(fx.HpFraction,Is.EqualTo(.5f));Assert.That(fx.hpFill.rectTransform.sizeDelta.x,Is.EqualTo(fx.fullFillWidth*.5f).Within(.001));
            Assert.That(fx.hpFill.uvRect.x,Is.EqualTo(fx.fillUv.x));Assert.That(fx.hpFill.uvRect.width,Is.EqualTo(fx.fillUv.width*.5f).Within(.001));Assert.That(fx.hpFill.rectTransform.pivot.x,Is.Zero);
            Assert.That(fx.hpLabel.text,Does.Contain("5.000 / 10.000"));Assert.That(initial.Snapshot.CopyJson().ToString(),Is.EqualTo(before));
            Assert.That(camera.orthographicSize,Is.EqualTo(zoom));Assert.That(Vector3.Distance(pose,camera.transform.position),Is.LessThan(.0001));
        }
        [Test] public void BossTwoThreeUseTheirOwnFramesAndHPAndPauseFreezesFrameAndProjectiles()
        {
            Render("boss2");Assert.That(fx.BossIndex,Is.EqualTo(1));Assert.That(AssetDatabase.GetAssetPath(fx.body.sprite),Does.EndWith("/Boss_2.png"));Assert.That(fx.informationFrame.texture,Is.EqualTo(fx.informationFrames[1]));
            Render("boss3");Assert.That(fx.BossIndex,Is.EqualTo(2));Assert.That(fx.hpLabel.text,Does.Contain("50.000"));Assert.That(fx.informationFrame.texture,Is.EqualTo(fx.informationFrames[2]));
            Render("paused",0,.1f);int frame=fx.FrameIndex;Render("paused",1000,1);Assert.That(fx.FrameIndex,Is.EqualTo(frame));Assert.That(fx.IsVisible,Is.True);
        }
        [Test] public void ProjectilesAreProceduralPooledAndBoundedAndClearOnReturnOrDisconnect()
        {
            Render("boss1",0,.1f);Assert.That(fx.ProjectileCount,Is.GreaterThan(0));Assert.That(fx.ProjectileCount,Is.LessThanOrEqualTo(32));
            int resources=fx.GetComponentsInChildren<LineRenderer>(true).Length;Assert.That(resources,Is.EqualTo(32));
            for(int i=0;i<1000;i++)fx.Sample(Read("boss1").Snapshot,0,.01f);
            Assert.That(fx.GetComponentsInChildren<LineRenderer>(true).Length,Is.EqualTo(resources));
            Render("cultivation");Assert.That(fx.IsVisible,Is.False);Assert.That(fx.ProjectileCount,Is.Zero);Assert.That(fx.energyWidgets.All(g=>g.enabled),Is.True);
            Render("boss3",0,.1f);fx.Sample(null,0,0);Assert.That(fx.IsVisible,Is.False);Assert.That(fx.information.alpha,Is.Zero);Assert.That(fx.body.enabled,Is.False);
        }
        [Test] public void SharedBossProtocolRejectsBadHPOrIndexButKeepsLegacySnapshotsCompatible()
        {
            foreach(var field in new[]{"hp","type"})
            {
                var raw=JObject.Parse(File.ReadAllText(Folder+"boss1.json"));raw["payload"]["battle"]["view"]["activeBoss"][field]=field=="hp"?-1:99;
                Assert.That(StateMapper.TryParse(raw.ToString(),out _,out _),Is.False);
            }
            Assert.That(StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/battle.json"),out var old,out var error),Is.True,error);Assert.That(old.Snapshot.Battle.SharedBoss,Is.False);
        }
        [UnityTest] public IEnumerator PlayProtocolKeepsBossAttackRosterAndClearsOnDisconnect()
        {
            fx.enabled=true;fx.characters.enabled=true;yield return new EnterPlayMode();yield return null;
            var live=Object.FindAnyObjectByType<BossBattlePresenter>();live.characters.scene.quality=SectQuality.High;live.network.enabled=false;live.network.enabled=true;live.network.enabled=false;
            var protocol=live.network.Protocol;protocol.Open(9720);Assert.That(protocol.Accept(File.ReadAllText(Folder+"boss1.json"),9720,0),Is.True);
            double deadline=EditorApplication.timeSinceStartup+5;while((!live.IsVisible||live.characters.Views.Count!=25)&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool visible=live.IsVisible&&live.BossIndex==0&&live.characters.Views.Count==25;
            string details=$"visible={live.IsVisible} index={live.BossIndex} views={live.characters.Views.Count}";
            bool attacking=AllAttack(live);protocol.Disconnect(9720);yield return null;bool clean=!live.IsVisible&&live.ProjectileCount==0&&live.information.alpha==0;
            yield return new ExitPlayMode();Assert.That(visible&&attacking&&clean,Is.True,$"visible={visible} attacking={attacking} clean={clean} {details}");
        }
        private static bool AllAttack(BossBattlePresenter fx)=>fx.characters.Views.Count>0&&fx.characters.Views.Values.All(v=>v.pose.Pose=="attack");
        private static IEnumerator Control(string url,string action,JToken value,string user="boss:0")
        {
            var raw=new JObject{["action"]=action,["value"]=value,["userId"]=user};
            using var request=new UnityWebRequest(url+"/api/control","POST"){uploadHandler=new UploadHandlerRaw(Encoding.UTF8.GetBytes(raw.ToString())),downloadHandler=new DownloadHandlerBuffer()};
            request.SetRequestHeader("Content-Type","application/json");request.timeout=5;request.SendWebRequest();while(!request.isDone)yield return null;Assert.That(request.responseCode,Is.EqualTo(200),request.error+" "+request.downloadHandler.text);
        }
        [UnityTest] public IEnumerator ActualHttpSkillUpdatesRealWebSocketHPAndReturnRestoresEnergyPanel()
        {
            string url=Environment.GetEnvironmentVariable("TUTIEN_BOSS_TEST_URL");if(string.IsNullOrEmpty(url))Assert.Ignore("Needs disposable shared-boss test server.");
            var uri=new Uri(url);Assert.That(uri.IsLoopback,Is.True);
            var config=new SerializedObject(fx.network);config.FindProperty("endpoint").stringValue="ws://"+uri.Authority+"/ws";config.ApplyModifiedPropertiesWithoutUndo();
            fx.network.enabled=true;fx.enabled=true;fx.characters.enabled=true;
            yield return new EnterPlayMode();var live=Object.FindAnyObjectByType<BossBattlePresenter>();url=Environment.GetEnvironmentVariable("TUTIEN_BOSS_TEST_URL");
            yield return Control(url,"phase","battle");double deadline=EditorApplication.timeSinceStartup+10;while(!live.IsVisible&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool shown=live.IsVisible&&live.BossIndex==0;
            yield return Control(url,"command",new JObject{["text"]="1",["eventId"]="unity-boss-skill"});
            deadline=EditorApplication.timeSinceStartup+5;while(live.HpFraction>=1&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool hp=live.HpFraction>0&&live.HpFraction<1&&live.hpFill.rectTransform.sizeDelta.x<live.fullFillWidth&&AllAttack(live);
            yield return Control(url,"phase","cultivation");deadline=EditorApplication.timeSinceStartup+5;while(live.IsVisible&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool restored=!live.IsVisible&&live.energyWidgets.All(g=>g.enabled);yield return new ExitPlayMode();Assert.That(shown&&hp&&restored,Is.True,$"shown={shown} hp={hp} restored={restored}");
        }
    }
}
