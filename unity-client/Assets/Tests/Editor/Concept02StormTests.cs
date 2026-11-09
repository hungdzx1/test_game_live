using System.IO;
using System.Collections;
using System.Linq;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.TestTools;
using TuTienLive.Characters;
using TuTienLive.Models;
using TuTienLive.Network;
using TuTienLive.Scenes;
using TuTienLive.UI;

namespace TuTienLive.Tests
{
    public sealed class Concept02StormTests
    {
        private SectSceneBindings bindings;
        private TribulationController fx=>bindings.tribulation;
        private static Snapshot Read(string file)
        { Assert.That(StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/"+file+".json"),out var e,out var error),Is.True,error);return e.Snapshot; }
        [SetUp] public void Open()
        {if(!EditorApplication.isPlaying)EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");bindings=Object.FindAnyObjectByType<SectSceneBindings>();}
        [Test] public void SavedSceneUsesLocalStormAndFourOrderedFramesWithoutChangingLegacyPrefab()
        {
            Assert.That(AssetDatabase.GetAssetPath(fx.stormCloud.sprite),Does.EndWith("Effects/fx_cloud_storm.png"));
            Assert.That(fx.lightningFrames.Length,Is.EqualTo(4));
            for(int i=0;i<4;i++)
            {
                var frame=fx.lightningFrames[i];Assert.That(AssetDatabase.GetAssetPath(frame.sprite),Does.EndWith("Effects/fx_lightning_0"+(i+1)+".png"));
                Assert.That(frame.transform.IsChildOf(fx.platformSeat),Is.True);Assert.That(frame.enabled,Is.False);
                Assert.That(frame.transform.localScale.x,Is.EqualTo(frame.transform.localScale.y));
            }
            Assert.That(fx.stormCloud.enabled,Is.False);
            var legacy=AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Resources/TribulationPrefab.prefab").GetComponent<TribulationController>();
            Assert.That(legacy.stormCloud,Is.Null);Assert.That(legacy.lightningFrames,Is.Empty);
        }
        [Test] public void FourFramesLoopWithoutGapsThroughoutCeremonyAndResampleAfterReconnect()
        {
            var snapshot=Read("Characters/ritual-start");
            foreach(float time in new[]{0,299,300,1000,1499})
            {
                fx.Sample(snapshot,time);Assert.That(fx.stormCloud.enabled||fx.LightningVisible,Is.False,"FX before arrival at "+time);
                Assert.That(fx.lightningFrames.Any(f=>f.enabled),Is.False);
                if(time<=1000)Assert.That(Vector3.Distance(fx.Position(Vector3.zero),fx.Platform),Is.GreaterThan(.00001f));
            }
            foreach(float time in new[]{1500,1600,1799})
            {
                fx.Sample(snapshot,time);Assert.That(fx.stormCloud.enabled,Is.True);Assert.That(fx.LightningVisible,Is.False);
                Assert.That(Vector3.Distance(fx.Position(Vector3.zero),fx.Platform),Is.LessThan(.00001f));
            }
            for(int i=0;i<4;i++)
            {
                fx.Sample(snapshot,1800+i*(1000f/6)+.01f);Assert.That(fx.LightningFrameIndex,Is.EqualTo(i));Assert.That(fx.LightningIndex,Is.Zero);
                Assert.That(fx.lightningFrames.Count(f=>f.enabled),Is.EqualTo(1));Assert.That(fx.lightningFrames[i].enabled,Is.True);
                Assert.That(fx.lightning.enabled,Is.False);Assert.That(fx.clouds.Any(c=>c.enabled),Is.False);
            }
            fx.Sample(snapshot,1800+1000f*40/60+.01f);Assert.That(fx.LightningFrameIndex,Is.Zero);Assert.That(fx.LightningIndex,Is.EqualTo(1));
            foreach(float time in new[]{1980f,2200f,5000f,9000f,11999f}){fx.Sample(snapshot,time);Assert.That(fx.lightningFrames.Count(f=>f.enabled),Is.EqualTo(1),"Missing loop at "+time);Assert.That(fx.stormCloud.enabled,Is.True);}
            fx.Sample(snapshot,2301);Assert.That(fx.LightningFrameIndex,Is.EqualTo(3),"Reconnect samples the authoritative position, without replaying from frame 01.");
            var before=snapshot.CopyJson().ToString();fx.Sample(snapshot,12000);Assert.That(fx.LightningVisible||fx.stormCloud.enabled,Is.False);Assert.That(fx.lightningFrames.Any(f=>f.enabled),Is.False);Assert.That(snapshot.CopyJson().ToString(),Is.EqualTo(before));
        }
        [Test] public void ContinuousVisualLoopUsesEntireServerDurationForEveryStrikeCount()
        {
            foreach(int duration in new[]{8000,10000,12000,20000})foreach(int count in new[]{1,3,10})
            {
                var json=JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/Characters/ritual-start.json"));json["payload"]["breakthrough"]["durationMs"]=duration;json["payload"]["breakthrough"]["lightningCount"]=count;
                Assert.That(StateMapper.TryParse(json.ToString(),out var state,out _),Is.True);
                for(int time=0;time<duration;time+=37){fx.Sample(state.Snapshot,time);bool expected=time>=1800;Assert.That(fx.LightningVisible,Is.EqualTo(expected),$"duration={duration} count={count} time={time}");Assert.That(fx.lightningFrames.Count(f=>f.enabled),Is.EqualTo(expected?1:0));Assert.That(fx.stormCloud.enabled,Is.EqualTo(time>=1500));}
                fx.Sample(state.Snapshot,duration);Assert.That(fx.LightningVisible,Is.False);
            }
        }
        [Test] public void PauseFreezesFrameAndResultBattleDisconnectClearEverySprite()
        {
            var json=JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/Characters/ritual-start.json"));
            json["payload"]["phase"]="paused";json["payload"]["breakthrough"]["elapsedMs"]=2134;
            Assert.That(StateMapper.TryParse(json.ToString(),out var paused,out _),Is.True);
            fx.Sample(paused.Snapshot,0);fx.Sample(paused.Snapshot,9999);Assert.That(fx.LightningFrameIndex,Is.EqualTo(2));
            foreach(string file in new[]{"Characters/ritual-success","Characters/ritual-failure","battle"})
            {fx.Sample(Read(file),0);Assert.That(fx.stormCloud.enabled,Is.False,file);Assert.That(fx.lightningFrames.Any(f=>f.enabled),Is.False,file);}
            fx.Sample(Read("Characters/ritual-start"),1800);fx.Sample(null,0);Assert.That(fx.stormCloud.enabled,Is.False);Assert.That(fx.lightningFrames.Any(f=>f.enabled),Is.False);
        }
        [Test] public void IncompleteFrameListFallsBackAndDisablingControllerClearsFx()
        {
            var frame=fx.lightningFrames[3];fx.lightningFrames[3]=null;fx.Sample(Read("Characters/ritual-start"),1800);
            Assert.That(fx.lightning.enabled,Is.True);Assert.That(fx.lightningFrames.Where(f=>f).Any(f=>f.enabled),Is.False);
            fx.lightningFrames[3]=frame;fx.Sample(Read("Characters/ritual-start"),1890);fx.enabled=false;fx.Sample(Read("Characters/ritual-start"),1890);
            Assert.That(fx.stormCloud.enabled||fx.lightning.enabled||fx.lightningFrames.Any(f=>f.enabled),Is.False);
        }
        [Test] public void LegacyPrefabKeepsProceduralCloudsAndServerStrikeTiming()
        {
            var prefab=AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Resources/TribulationPrefab.prefab");var instance=(GameObject)PrefabUtility.InstantiatePrefab(prefab);
            try
            {
                var legacy=instance.GetComponent<TribulationController>();var snapshot=Read("Characters/ritual-start");
                legacy.Sample(snapshot,0);Assert.That(legacy.clouds.Any(c=>c.enabled),Is.False);Assert.That(legacy.lightning.enabled,Is.False);
                legacy.Sample(snapshot,1500);Assert.That(legacy.clouds.All(c=>c.enabled),Is.True);Assert.That(legacy.lightning.enabled,Is.False);
                legacy.Sample(snapshot,1800);Assert.That(legacy.lightning.enabled,Is.True);Assert.That(legacy.LightningVisible,Is.True);Assert.That(legacy.LightningFrameIndex,Is.EqualTo(-1));
                legacy.Sample(snapshot,1980);Assert.That(legacy.lightning.enabled,Is.False);legacy.Sample(null,0);Assert.That(legacy.clouds.Any(c=>c.enabled),Is.False);
            }
            finally{Object.DestroyImmediate(instance);}
        }
        [Test] public void EnergyArtDrawsAboveOpaqueFrameAndRetainsLeftEdgeAcrossLevels()
        {
            var hud=Object.FindAnyObjectByType<Concept02Hud>();var frame=hud.transform.Find("Header/ProgressFrame");
            Assert.That(AssetDatabase.GetAssetPath(hud.energyFill.texture),Does.EndWith("UI/ui_progress_fill.png"));
            Assert.That(hud.energyFill.transform.GetSiblingIndex(),Is.GreaterThan(frame.GetSiblingIndex()));
            var left=hud.energyFill.rectTransform.anchoredPosition;
            hud.Render(Read("SectHud/level2"));Assert.That(hud.energyFill.rectTransform.rect.width,Is.EqualTo(hud.energyFillWidth*.5f).Within(.01f));
            hud.Render(Read("SectHud/level3-max"));Assert.That(hud.energyFill.rectTransform.anchoredPosition,Is.EqualTo(left));
            Assert.That(hud.energyFill.rectTransform.rect.width,Is.EqualTo(hud.energyFillWidth).Within(.01f));hud.Render(null);Assert.That(hud.energyFill.gameObject.activeSelf,Is.False);
        }
        [UnityTest] public IEnumerator PlayFreezesPngStrikeAtServerTimeAndClearsOnResultAndDisconnect()
        {
            yield return new EnterPlayMode();bindings=Object.FindAnyObjectByType<SectSceneBindings>();bindings.network.enabled=false;
            var raw=JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/Characters/ritual-start.json"));
            raw["payload"]["phase"]="paused";raw["payload"]["breakthrough"]["elapsedMs"]=2134;
            bindings.network.Protocol.Open(9101);Assert.That(bindings.network.Protocol.Accept(raw.ToString(),9101,0),Is.True);
            double deadline=EditorApplication.timeSinceStartup+4;
            while(fx.LightningFrameIndex!=2&&EditorApplication.timeSinceStartup<deadline)yield return null;
            yield return null;yield return null;
            bool visible=fx.LightningFrameIndex==2&&fx.lightningFrames[2].enabled&&fx.stormCloud.enabled&&!fx.lightning.enabled;
            bindings.network.Protocol.Open(9102);Assert.That(bindings.network.Protocol.Accept(File.ReadAllText("Assets/Tests/Fixtures/Characters/ritual-success.json"),9102,0),Is.True);
            deadline=EditorApplication.timeSinceStartup+4;while(fx.stormCloud.enabled&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool result=!fx.stormCloud.enabled&&!fx.lightningFrames.Any(f=>f.enabled);
            bindings.network.Protocol.Disconnect(9102);yield return null;yield return null;
            bool disconnected=!fx.stormCloud.enabled&&!fx.lightningFrames.Any(f=>f.enabled);
            yield return new ExitPlayMode();Assert.That(visible&&result&&disconnected,Is.True,$"strike={visible} result={result} disconnect={disconnected}");
        }
        [UnityTest] public IEnumerator PlayLoopsBetweenOldStrikesWithoutEditingSnapshot()
        {
            yield return new EnterPlayMode();bindings=Object.FindAnyObjectByType<SectSceneBindings>();bindings.network.enabled=false;
            var raw=JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/Characters/ritual-start.json"));raw["payload"]["breakthrough"]["elapsedMs"]=2200;
            bindings.network.Protocol.Open(9110);Assert.That(bindings.network.Protocol.Accept(raw.ToString(),9110,0),Is.True);
            double ready=EditorApplication.timeSinceStartup+3;while(!fx.LightningVisible&&EditorApplication.timeSinceStartup<ready)yield return null;
            var before=bindings.network.State.Snapshot.CopyJson().ToString();var frames=new System.Collections.Generic.HashSet<int>();bool visible=true;double end=EditorApplication.timeSinceStartup+.45;
            while(EditorApplication.timeSinceStartup<end){visible&=fx.LightningVisible&&fx.lightningFrames.Count(f=>f.enabled)==1;frames.Add(fx.LightningFrameIndex);yield return null;}
            bool unchanged=bindings.network.State.Snapshot.CopyJson().ToString()==before;bindings.network.Protocol.Disconnect(9110);yield return null;
            yield return new ExitPlayMode();Assert.That(visible&&frames.Count>=2&&unchanged,Is.True,$"visible={visible} distinctFrames={frames.Count} snapshot={unchanged}");
        }
    }
}
