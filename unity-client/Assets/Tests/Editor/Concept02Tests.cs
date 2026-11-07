using System;
using System.Collections;
using System.IO;
using System.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.TestTools;
using TuTienLive.Scenes;
using TuTienLive.Characters;
using TuTienLive.UI;

namespace TuTienLive.Tests
{
    public sealed class Concept02Tests
    {
        private const string ScenePath="Assets/Scenes/SectScene_Concept02.unity";
        [Test] public void SavedSceneUsesLocalArtAndKeepsPortraitSystems()
        {
            EditorSceneManager.OpenScene(ScenePath);var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();
            Assert.That(b.groups.Length,Is.EqualTo(9));Assert.That(b.characters.seats.Length,Is.EqualTo(12));
            Assert.That(b.environment.layers.Length,Is.EqualTo(15));Assert.That(b.network.enabled,Is.True);
            Assert.That(b.cameraRig.autoFitBounds,Is.False);Assert.That(b.cameraRig.GetComponent<Camera>().orthographicSize,Is.EqualTo(9.6f));
            Assert.That(b.environment.layers.All(l=>l.sceneAuthored&&l.bakedGeometry&&AssetDatabase.GetAssetPath(l.sourceSprite).StartsWith("Assets/Art/SectConcept02/")),Is.True);
            Assert.That(b.GetComponentsInChildren<Transform>().Any(t=>t.name=="Temple"||t.name=="Front gate"||t.name=="Footer frame"),Is.False);
            foreach(var t in b.GetComponentsInChildren<Transform>(true))Assert.That(GameObjectUtility.GetMonoBehavioursWithMissingScriptCount(t.gameObject),Is.Zero,t.name);
            var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();hud.Render(null);
            Assert.That(hud.timerLabel.text,Is.EqualTo("--:--"));Assert.That(hud.breakthroughBeam.activeSelf,Is.False);
        }
        [Test] public void ThreePrefabsHaveExactlyTheSuppliedFourPoses()
        {
            for(int i=1;i<=3;i++)
            {
                var view=AssetDatabase.LoadAssetAtPath<CharacterView>("Assets/SectConcept02/Prefabs/Character_"+i+".prefab");
                Assert.That(view,Is.Not.Null);var p=view.pose;
                Assert.That(p.fly&&p.attack&&p.meditate&&p.celebrate,Is.True);
                Assert.That(p.idleStand,Is.SameAs(p.meditate));Assert.That(p.backThreeQuarter,Is.SameAs(p.meditate));
                Assert.That(new[]{p.fly,p.attack,p.meditate,p.celebrate}.Select(AssetDatabase.GetAssetPath).Distinct().Count(),Is.EqualTo(4));
            }
        }
        [Test] public void OpenExistingSceneNeverRebuildsUserEdits()
        {
            EditorSceneManager.OpenScene(ScenePath);var bytes=File.ReadAllBytes(ScenePath);
            var type=AppDomain.CurrentDomain.GetAssemblies().Select(a=>a.GetType("TuTienLive.Editor.Concept02SceneSetup")).First(t=>t!=null);
            type.GetMethod("Create").Invoke(null,null);Assert.That(File.ReadAllBytes(ScenePath),Is.EqualTo(bytes));
        }
        [UnityTest] public IEnumerator PlayUsesNewSpritesAndAuthoritativeSnapshotWithoutResettingLayout()
        {
            EditorSceneManager.OpenScene(ScenePath);yield return new EnterPlayMode();
            var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();
            b.network.enabled=false; // Dispose real transport, inject only recorded protocol fixtures in this test.
            b.network.Protocol.Open(9001);
            Assert.That(b.network.Protocol.Accept(File.ReadAllText("Assets/Tests/Fixtures/Characters/players-10.json"),9001,0),Is.True);
            double deadline=EditorApplication.timeSinceStartup+4;
            while((b.characters.TotalPlayers!=10||UnityEngine.Object.FindAnyObjectByType<Concept02Hud>().rankRows[0].text.Contains("Đang chờ"))&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool roster=b.characters.TotalPlayers==10&&b.characters.Views.Count==10;
            bool sprites=b.characters.Views.Values.All(v=>AssetDatabase.GetAssetPath(v.pose.Body.sprite).StartsWith("Assets/Art/SectConcept02/Characters/"))
                &&b.characters.Views.Values.Select(v=>v.pose.meditate).Distinct().Count()==3;
            var floor=b.environment.layers.Single(l=>l.name=="MainCourtyard");var pos=floor.transform.position;
            b.environment.Sample(30);b.environment.Sample(0);bool layout=Vector3.Distance(pos,floor.transform.position)<.0001f;
            var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();bool text=hud.rankRows.All(t=>t.text.Contains("Disciple"));
            b.network.Protocol.Open(9002);
            Assert.That(b.network.Protocol.Accept(File.ReadAllText("Assets/Tests/Fixtures/Characters/ritual-strike.json"),9002,0),Is.True);
            deadline=EditorApplication.timeSinceStartup+4;
            while((!b.tribulation.HasCeremony||!hud.breakthroughBeam.activeSelf)&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool ritual=b.tribulation.HasCeremony&&hud.breakthroughBeam.activeSelf;
            b.network.Protocol.Open(9003);
            Assert.That(b.network.Protocol.Accept(File.ReadAllText("Assets/Tests/Fixtures/SectHud/level2.json"),9003,0),Is.True);
            deadline=EditorApplication.timeSinceStartup+4;
            while(!hud.energyLabel.text.Contains("1.500")&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool energy=hud.energyTitle.text.Contains("CẤP 2")&&hud.energyFill.gameObject.activeSelf&&Mathf.Abs(hud.energyFill.rectTransform.rect.width-hud.energyFillWidth*.5f)<.01f;
            b.network.Protocol.Disconnect(9003);
            deadline=EditorApplication.timeSinceStartup+4;
            while((hud.timerLabel.text!="--:--"||hud.breakthroughBeam.activeSelf||b.characters.Views.Count!=0)&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool disconnected=hud.timerLabel.text=="--:--"&&!hud.breakthroughBeam.activeSelf&&b.characters.Views.Count==0;
            string disconnectDetails=$"timer={hud.timerLabel.text}, beam={hud.breakthroughBeam.activeSelf}, views={b.characters.Views.Count}, snapshotNull={b.network.State.Snapshot==null}";
            yield return new ExitPlayMode();
            Assert.That(roster&&sprites&&layout&&text&&ritual&&energy&&disconnected,Is.True,$"roster={roster} sprites={sprites} layout={layout} text={text} ritual={ritual} energy={energy} disconnect={disconnected}: {disconnectDetails}");
        }
        [UnityTest] public IEnumerator ServerCultivationAndLikeStreaksReachConceptHudInPlayMode()
        {
            EditorSceneManager.OpenScene(ScenePath);yield return new EnterPlayMode();
            var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();b.network.enabled=false;b.network.Protocol.Open(9601);
            var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();
            string[] files={"seconds","streak","settled","buffed","stage"};double[] exp={2,2,102,502,2};int[] energy={0,50,50,150,165};
            bool all=true;string details="";
            for(int i=0;i<files.Length;i++)
            {
                bool accepted=b.network.Protocol.Accept(File.ReadAllText("Assets/Tests/Fixtures/CultivationLikes/"+files[i]+".json"),9601,i);
                double deadline=EditorApplication.timeSinceStartup+4;
                while((b.characters.TotalPlayers!=1||!hud.energyLabel.text.Contains(energy[i]+" /"))&&EditorApplication.timeSinceStartup<deadline)yield return null;
                var state=b.network.State.Snapshot;var player=state.Players["cultivation-demo"];
                bool correct=accepted&&player.Cultivation==exp[i]&&player.StageIndex==(i==4?1:0)&&state.SectEnergy.Power==energy[i]
                    &&b.characters.Views.Count==1&&hud.rankRows[0].text.Contains("Thanh Vân")
                    &&Mathf.Abs(hud.energyFill.rectTransform.rect.width-hud.energyFillWidth*energy[i]/1000f)<.01f;
                all&=correct;details+=files[i]+"="+correct+"; ";
            }
            bool stage=hud.rankRows[0].text.Contains("Trung Kỳ");
            b.network.Protocol.Disconnect(9601);yield return new ExitPlayMode();Assert.That(all&&stage,Is.True,details+"stage="+stage);
        }
    }
}
