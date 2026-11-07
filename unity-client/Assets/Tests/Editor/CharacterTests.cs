using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Characters;
using TuTienLive.Network;
using TuTienLive.Models;
using TuTienLive.Scenes;

namespace TuTienLive.Tests
{
    public sealed class CharacterTests
    {
        private CharacterManager manager;
        private const string Fixtures="Assets/Tests/Fixtures/Characters/";
        private static Envelope Read(string name)
        {Assert.That(StateMapper.TryParse(File.ReadAllText(Fixtures+name+".json"),out var e,out var error),Is.True,error);return e;}
        [SetUp] public void Setup()
        {
            EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Editable.unity",OpenSceneMode.Single);
            manager=SectCharacterBootstrap.Install();manager.network.enabled=false;
        }
        [TearDown] public void Cleanup(){if(manager)Object.DestroyImmediate(manager.gameObject);}
        [TestCase(10,10)][TestCase(50,10)][TestCase(100,10)][TestCase(500,8)]
        public void SnapshotLoadStaysBoundedAndReusesPool(int players,int expected)
        {
            var e=Read("players-"+players);manager.ApplySnapshot(e.Snapshot,e.SessionId);manager.Sample(0,0);
            Assert.That(manager.Views.Count,Is.EqualTo(expected));Assert.That(manager.TotalPlayers,Is.EqualTo(players));
            int created=manager.CreatedCount;
            for(int i=0;i<50;i++){manager.ApplySnapshot(e.Snapshot,e.SessionId);manager.Sample(i*20,.02f);}
            Assert.That(manager.CreatedCount,Is.EqualTo(created));
            manager.ApplySnapshot(null,e.SessionId);Assert.That(manager.Views.Count,Is.Zero);
            manager.ApplySnapshot(e.Snapshot,e.SessionId);Assert.That(manager.CreatedCount,Is.EqualTo(created));
        }
        [Test] public void ReconnectAndNewSessionNeverDuplicatePlayers()
        {
            var e=Read("players-50");manager.ApplySnapshot(e.Snapshot,e.SessionId);int created=manager.CreatedCount;
            manager.ApplySnapshot(null,e.SessionId);manager.ApplySnapshot(e.Snapshot,"new-session");
            Assert.That(manager.CreatedCount,Is.EqualTo(created));Assert.That(manager.Views.Values.Select(v=>v.UserId).Distinct().Count(),Is.EqualTo(manager.Views.Count));
        }
        [TestCase("idle","idle_stand")][TestCase("walk","idle_stand")][TestCase("meditate","meditate")]
        [TestCase("standUp","idle_stand")][TestCase("attack","attack")][TestCase("teleport","idle_stand")]
        [TestCase("celebrate","celebrate")][TestCase("cast","meditate")][TestCase("fly","fly")]
        [TestCase("bow","idle_stand")][TestCase("hit","idle_stand")]
        public void PoseFallbackIsExplicitAndPreservesSpriteAspect(string animation,string expected)
        {
            Assert.That(CharacterPoseController.ResolveAsset(animation),Is.EqualTo(expected));
            var prefab=Resources.Load<CharacterView>("CharacterPrefab");var instance=Object.Instantiate(prefab);
            try{instance.pose.Sample(animation,0);Assert.That(instance.pose.Body.sprite.name,Is.EqualTo(expected));Assert.That(instance.pose.Body.color,Is.EqualTo(Color.white));
                Assert.That(instance.pose.transform.localScale.x,Is.EqualTo(instance.pose.transform.localScale.y));}
            finally{Object.DestroyImmediate(instance.gameObject);}
        }
        [Test] public void SevenOriginalPosesHaveFullRectAndAlignedFeet()
        {
            string[] names={"idle_stand","fly","attack","meditate","celebrate","back_3quarter","meditate_3quarter"};int[] bottom={1241,1193,1234,1195,1244,1213,1206};
            for(int i=0;i<names.Length;i++)
            {
                string path="Assets/Art/Characters/Character_1/"+names[i]+".png";var sprite=AssetDatabase.LoadAssetAtPath<Sprite>(path);
                Assert.That(sprite.rect.size,Is.EqualTo(new Vector2(1254,1254)));Assert.That(sprite.pixelsPerUnit,Is.EqualTo(100));
                Assert.That(sprite.pivot.x,Is.EqualTo(627).Within(.01));Assert.That(sprite.pivot.y,Is.EqualTo(1254-bottom[i]).Within(.01));
                var d=new DirectoryInfo(Application.dataPath);while(d!=null&&!File.Exists(Path.Combine(d.FullName,"server.js")))d=d.Parent;
                Assert.That(File.ReadAllBytes(path),Is.EqualTo(File.ReadAllBytes(Path.Combine(d.FullName,"public/assets/Characters/Character_1/"+names[i]+".png"))));
            }
        }
        [Test] public void RitualKeepsCourtyardVisibleAndUsesServerTimeline()
        {
            var e=Read("ritual-start");manager.ApplySnapshot(e.Snapshot,e.SessionId);manager.Sample(0,0);
            var view=manager.Views["ritual:0"];var seat=view.Seat;
            Assert.That(view.pose.Pose,Is.EqualTo("standUp"));
            manager.Sample(600,.1f);Assert.That(view.pose.Pose,Is.EqualTo("fly"));Assert.That(view.transform.position,Is.Not.EqualTo(seat));
            manager.Sample(1800,.1f);Assert.That(view.pose.Pose,Is.EqualTo("cast"));Assert.That(manager.tribulation.LightningVisible,Is.True);
            Assert.That(manager.Views.Count,Is.EqualTo(10));Assert.That(manager.Views.Values.Count(v=>v.WasOnPlatform),Is.EqualTo(1));
            Assert.That(manager.tribulation.Outcome,Is.Null);
        }
        [TestCase("ritual-success","celebrate",true)][TestCase("ritual-failure","hit",false)]
        public void OutcomeOnlyComesFromBackend(string file,string pose,bool success)
        {
            var e=Read(file);manager.ApplySnapshot(e.Snapshot,e.SessionId);manager.Sample(0,0);
            Assert.That(manager.Views["ritual:0"].pose.Pose,Is.EqualTo(pose));Assert.That(manager.tribulation.Outcome,Is.EqualTo(success));
        }
        [Test] public void PauseFreezesAndBattleClearsSectWithoutMakingBattleViews()
        {
            var e=Read("ritual-paused");manager.ApplySnapshot(e.Snapshot,e.SessionId);manager.Sample(0,0);var before=manager.Views["ritual:0"].transform.position;
            manager.Sample(2000,2);Assert.That(manager.Views["ritual:0"].transform.position,Is.EqualTo(before));
            Assert.That(manager.tribulation.ElapsedMs,Is.EqualTo(e.Snapshot.Breakthrough.ElapsedMs));
            StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/battle.json"),out var battle,out _);manager.ApplySnapshot(battle.Snapshot,battle.SessionId);
            Assert.That(manager.Views.Count,Is.Zero);
        }
        [Test] public void DuplicateEventsDoNotRepeatEffectsAndSessionResetsDedup()
        {
            var e=Read("ritual-start");manager.ApplySnapshot(e.Snapshot,e.SessionId);
            var events=JArray.Parse(File.ReadAllText(Fixtures+"success-events.json"));
            foreach(var json in events){StateMapper.TryParse(json.ToString(),out var message,out _);manager.HandleEvent(message.Event);manager.HandleEvent(message.Event);}
            int effects=manager.AcceptedEffects;Assert.That(effects,Is.GreaterThan(0));
            foreach(var json in events){StateMapper.TryParse(json.ToString(),out var message,out _);manager.HandleEvent(message.Event);}Assert.That(manager.AcceptedEffects,Is.EqualTo(effects));
            manager.ApplySnapshot(e.Snapshot,"new");Assert.That(manager.AcceptedEffects,Is.Zero);
        }
        [Test] public void CameraPriorityDoesNotMoveCameraOrOpenProfile()
        {
            var camera=manager.scene.cameraRig.transform;var before=camera.position;
            manager.director.Request("gift-user",3,"gift");manager.director.Request("minor-user",1,"join");manager.director.Sample(null,null,0);
            Assert.That(manager.director.FollowUserId,Is.EqualTo("gift-user"));manager.director.Sample("ritual-user","follow",0);
            Assert.That(manager.director.FollowUserId,Is.EqualTo("ritual-user"));Assert.That(camera.position,Is.EqualTo(before));
        }
        [Test] public void FocusSwapsHiddenPlayerWithoutDuplicateSeat()
        {
            var e=Read("players-500");var json=e.Snapshot.CopyJson();json["cameraUserId"]="character:499";
            var envelope=JObject.Parse(File.ReadAllText(Fixtures+"players-500.json"));envelope["payload"]=json;
            Assert.That(StateMapper.TryParse(envelope.ToString(),out var focused,out _),Is.True);
            manager.ApplySnapshot(focused.Snapshot,focused.SessionId);
            Assert.That(manager.Views.ContainsKey("character:499"),Is.True);Assert.That(manager.Views.Count,Is.EqualTo(8));
            Assert.That(manager.Views.Values.Select(v=>v.SeatIndex).Distinct().Count(),Is.EqualTo(manager.Views.Count));
        }
        [Test] public void LowQualityAndElevenAuraRealmsArePresentationOnly()
        {
            manager.scene.quality=SectQuality.Low;var e=Read("players-50");manager.ApplySnapshot(e.Snapshot,e.SessionId);Assert.That(manager.Views.Count,Is.EqualTo(6));
            var aura=manager.Views.Values.First().aura;
            for(int realm=0;realm<11;realm++){aura.Sample(realm,0,false);Assert.That(aura.Realm,Is.EqualTo(realm));}
            Assert.That(e.Snapshot.Players["character:0"].RealmIndex,Is.EqualTo(0));
        }
        [Test] public void ResultReturnsToSeatAndClearsClouds()
        {
            var e=Read("ritual-success");manager.ApplySnapshot(e.Snapshot,e.SessionId);manager.Sample(0,0);
            var view=manager.Views["ritual:0"];Assert.That(view.transform.position,Is.EqualTo(manager.tribulation.Platform));
            var json=JObject.Parse(File.ReadAllText(Fixtures+"ritual-success.json"));json["payload"]["breakthroughResult"]=null;
            StateMapper.TryParse(json.ToString(),out var ended,out _);manager.ApplySnapshot(ended.Snapshot,ended.SessionId);manager.Sample(0,.4f);
            Assert.That(view.pose.Pose,Is.EqualTo("fly"));manager.Sample(0,.5f);Assert.That(view.transform.position,Is.EqualTo(view.Seat));
            Assert.That(manager.tribulation.clouds.All(c=>!c.enabled),Is.True);
        }
        [Test] public void MissingOutcomeNeverBecomesClientFailure()
        {
            var json=JObject.Parse(File.ReadAllText(Fixtures+"ritual-success.json"));json["payload"]["breakthroughResult"]["outcome"]=null;
            Assert.That(StateMapper.TryParse(json.ToString(),out var e,out _),Is.True);manager.ApplySnapshot(e.Snapshot,e.SessionId);manager.Sample(0,0);
            Assert.That(manager.tribulation.Outcome,Is.Null);Assert.That(manager.Views["ritual:0"].pose.Pose,Is.EqualTo("idle"));
        }
    }
}
