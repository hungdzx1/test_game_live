using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Characters;
using TuTienLive.Network;
using TuTienLive.Models;
using TuTienLive.Scenes;
using System.Collections;
using UnityEngine.TestTools;

namespace TuTienLive.Tests
{
    public sealed class CharacterVariantTests
    {
        private CharacterManager manager;
        private Envelope snapshot;
        private const string Scene="Assets/Scenes/SectScene_Concept02.unity";
        [SetUp] public void Open()
        {
            if(!Application.isPlaying)EditorSceneManager.OpenScene(Scene);
            manager=Object.FindAnyObjectByType<CharacterManager>();manager.network.enabled=false;
            Assert.That(StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/Characters/players-10.json"),out snapshot,out _),Is.True);
        }
        [TearDown] public void Close(){if(!Application.isPlaying)EditorSceneManager.OpenScene(Scene);}
        [Test] public void GridShows25UniqueSeatsAndHiddenPriorityPlayerReusesItsSeat()
        {
            Assert.That(StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/Characters/players-25.json"),out var data,out _),Is.True);
            manager.ApplySnapshot(data.Snapshot,"grid");
            Assert.That(manager.Views.Count,Is.EqualTo(25));Assert.That(manager.HiddenPlayers,Is.EqualTo(5));
            Assert.That(manager.seats.Select(t=>t.position.x).Distinct().Count(),Is.EqualTo(5));
            Assert.That(manager.seats.Select(t=>t.position.y).Distinct().Count(),Is.EqualTo(5));
            Assert.That(manager.Views.Values.Select(v=>v.Seat).Distinct().Count(),Is.EqualTo(25));
            manager.director.Request("grid:29",3,"gift");manager.director.Sample(null,null,0);
            manager.ApplySnapshot(data.Snapshot,"grid");
            Assert.That(manager.Views.ContainsKey("grid:29"),Is.True);
            Assert.That(manager.Views.Count,Is.EqualTo(25));
            Assert.That(manager.Views.Values.Select(v=>v.Seat).Distinct().Count(),Is.EqualTo(25));
            manager.scene.quality=SectQuality.Low;manager.ApplySnapshot(data.Snapshot,"low");
            Assert.That(manager.Views.Count,Is.EqualTo(6));
            manager.seats=new Transform[0];manager.ApplySnapshot(data.Snapshot,"empty");Assert.That(manager.Views,Is.Empty);
        }
        [UnityTest] public IEnumerator PlayShows25CharactersWithFourAppearances()
        {
            yield return new EnterPlayMode();
            var live=Object.FindAnyObjectByType<CharacterManager>();live.network.enabled=false;live.enabled=false;
            Assert.That(StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/Characters/players-25.json"),out var data,out _),Is.True);
            live.ApplySnapshot(data.Snapshot,"grid-play");live.Sample(0,0);yield return null;
            bool valid=live.Views.Count==25&&live.Views.Values.Select(v=>v.Seat).Distinct().Count()==25
                &&live.Views.Values.Select(v=>v.pose.meditate).Distinct().Count()==4;
            yield return new ExitPlayMode();Assert.That(valid,Is.True);
        }
        [Test] public void SavedCatalogSpawnsAllFourAndKeepsLooksAcrossSnapshotsReconnectAndPooling()
        {
            Assert.That(manager.characterVariants.Length,Is.EqualTo(4));
            manager.ApplySnapshot(snapshot.Snapshot,snapshot.SessionId);
            var looks=manager.Views.ToDictionary(p=>p.Key,p=>p.Value.pose.meditate);
            var instances=manager.Views.ToDictionary(p=>p.Key,p=>p.Value);
            Assert.That(looks.Values.Distinct().Count(),Is.EqualTo(4));
            int created=manager.CreatedCount;
            for(int i=0;i<5;i++)manager.ApplySnapshot(snapshot.Snapshot,snapshot.SessionId);
            Assert.That(manager.Views.All(p=>p.Value==instances[p.Key]),Is.True);
            for(int i=0;i<5;i++)
            {
                manager.ApplySnapshot(null,"disconnect");Assert.That(manager.PooledCount,Is.EqualTo(10));
                manager.ApplySnapshot(snapshot.Snapshot,"reconnect-"+i);
                Assert.That(manager.Views.All(p=>p.Value.pose.meditate==looks[p.Key]),Is.True);
                Assert.That(manager.CreatedCount,Is.EqualTo(created));
                foreach(var p in manager.Views)
                    Assert.That(p.Value.transform.localScale,Is.EqualTo(manager.PrefabFor(snapshot.Snapshot.Players[p.Key]).transform.localScale));
            }
        }
        [Test] public void EmptyOrMissingEntriesKeepLegacyPrefabFallback()
        {
            foreach(var catalog in new[]{null,new CharacterView[0],new CharacterView[]{null,null}})
            {
                manager.characterVariants=catalog;manager.ApplySnapshot(snapshot.Snapshot,"legacy");
                Assert.That(manager.Views.Values.All(v=>v.pose.meditate==manager.characterPrefab.pose.meditate),Is.True);
            }
            manager.characterVariants=new[]{null,manager.characterPrefab,null};manager.ApplySnapshot(snapshot.Snapshot,"sparse");
            Assert.That(manager.Views.Count,Is.EqualTo(10));Assert.That(manager.Views.Values.All(v=>v.pose.meditate==manager.characterPrefab.pose.meditate),Is.True);
        }
        [Test] public void AppendingAnotherTemplateWorksWithoutCodeChangesAndPreservesItsScale()
        {
            var fourth=Object.Instantiate(manager.characterVariants[0]);fourth.gameObject.SetActive(false);fourth.transform.localScale=Vector3.one*1.73f;
            try
            {
                manager.characterVariants=manager.characterVariants.Concat(new[]{fourth}).ToArray();
                var json=JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/Characters/players-10.json"));
                int seed=0;foreach(var p in (JArray)json["payload"]["players"])p["seed"]=seed++;
                Assert.That(StateMapper.TryParse(json.ToString(),out var data,out _),Is.True);
                var choices=data.Snapshot.Players.Values.Select(manager.PrefabFor).Distinct().ToArray();
                Assert.That(choices.Length,Is.EqualTo(5));Assert.That(choices,Does.Contain(fourth));
                manager.ApplySnapshot(data.Snapshot,"fourth");
                foreach(var p in manager.Views.Where(p=>manager.PrefabFor(data.Snapshot.Players[p.Key])==fourth))
                    Assert.That(p.Value.transform.localScale,Is.EqualTo(Vector3.one*1.73f));
            }
            finally{Object.DestroyImmediate(fourth.gameObject);}
        }
    }
}
