using System.IO;
using System.Collections;
using System.Linq;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.UI;
using TuTienLive.Models;
using TuTienLive.Network;
using TuTienLive.Scenes;
using UnityEngine.TestTools;
using UnityEditor;

namespace TuTienLive.Tests
{
    public sealed class SectHudTests
    {
        private Concept02Hud hud;
        private static JObject Raw()=>JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/Characters/players-10.json"));
        private static Snapshot Read(JObject json){Assert.That(StateMapper.TryParse(json.ToString(),out var e,out var error),Is.True,error);return e.Snapshot;}
        [SetUp] public void Open(){if(EditorApplication.isPlaying)return;EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");hud=Object.FindAnyObjectByType<Concept02Hud>();}
        [Test] public void RanksUseRealmThenStageThenCultivationAndStableIdTieBreak()
        {
            var json=Raw();var p=(JArray)json["payload"]["players"];
            foreach(var player in p){player["realmIndex"]=0;player["stageIndex"]=0;player["cultivation"]=0;}
            for(int i=0;i<4;i++){p[i]["realmIndex"]=3;p[i]["realm"]="Kim Đan";p[i]["stageIndex"]=1;p[i]["stage"]="Trung Kỳ";p[i]["cultivation"]=i<2?0:20;}
            p[0]["stageIndex"]=0;p[4]["realmIndex"]=2;p[4]["stageIndex"]=3;p[4]["cultivation"]=9999;
            hud.Render(Read(json));Assert.That(hud.rankRows[0].text,Does.StartWith("Disciple 2\n"));Assert.That(hud.rankRows[1].text,Does.StartWith("Disciple 3\n"));Assert.That(hud.rankRows[2].text,Does.StartWith("Disciple 1\n"));
            Assert.That(hud.rankIcons.All(i=>i.texture.name=="ui_rank_icons"),Is.True);Assert.That(hud.rankIcons.Select(i=>i.uvRect).Distinct().Count(),Is.EqualTo(3));
        }
        [Test] public void RankingIncludesHiddenPlayersAndHandlesEmptyOrDisconnectedRoster()
        {
            var json=JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/Characters/players-500.json"));var p=(JArray)json["payload"]["players"];
            p[499]["realmIndex"]=10;p[499]["stageIndex"]=3;p[499]["cultivation"]=9999;hud.Render(Read(json));Assert.That(hud.rankRows[0].text,Does.Contain("499"));
            p.Clear();hud.Render(Read(json));Assert.That(hud.rankRows[0].text,Is.EqualTo("Chưa có đệ tử"));Assert.That(hud.rankRows[1].text,Is.EqualTo("—"));
            hud.Render(null);Assert.That(hud.rankRows[0].text,Is.EqualTo("Đang chờ máy chủ"));Assert.That(hud.energyFill.gameObject.activeSelf,Is.False);
        }
        [Test] public void RealBackendProgressClipsFillAndShowsLevelAndMaxWithoutLocalLevelCalculation()
        {
            var level2=Read(JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/SectHud/level2.json")));hud.Render(level2);
            Assert.That(hud.energyTitle.text,Does.Contain("CẤP 2"));Assert.That(hud.energyLabel.text,Does.Contain("1.500 / 3.000"));
            Assert.That(hud.energyFill.rectTransform.rect.width,Is.EqualTo(hud.energyFillWidth*.5f).Within(.01f));Assert.That(hud.energyFill.uvRect.width,Is.EqualTo(hud.energyFillUv.width*.5f).Within(.0001f));
            hud.Render(Read(JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/SectHud/level3-max.json"))));Assert.That(hud.energyLabel.text,Does.Contain("MAX"));Assert.That(hud.energyFill.rectTransform.rect.width,Is.EqualTo(hud.energyFillWidth).Within(.01f));
            hud.Render(Read(Raw()));Assert.That(hud.energyLabel.text,Is.EqualTo("-- / -- TIM"));Assert.That(hud.energyFill.gameObject.activeSelf,Is.False);
        }
        [TestCase(-1,1000,1)][TestCase(20,0,1)][TestCase(1001,1000,1)][TestCase(0,1000,4)]
        public void MalformedEnergyIsRejected(int power,int threshold,int level)
        {
            var json=Raw();json["payload"]["interactions"]=new JObject{["sectEnergy"]=new JObject{["level"]=level,["power"]=power,["threshold"]=threshold,["full"]=false}};
            Assert.That(StateMapper.TryParse(json.ToString(),out _,out _),Is.False);
        }
        [Test] public void ConfiguredSixLevelsUseServerThresholdAndKeepLegacyMaxFallback()
        {
            var snapshot=Read(JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/SectHud/level6.json")));hud.Render(snapshot);
            Assert.That(snapshot.SectEnergy.Level,Is.EqualTo(6));Assert.That(snapshot.SectEnergy.MaxLevel,Is.EqualTo(6));
            Assert.That(hud.energyTitle.text,Does.Contain("CẤP 6"));Assert.That(hud.energyLabel.text,Does.Contain("15 / 60"));
            Assert.That(hud.energyFill.rectTransform.rect.width,Is.EqualTo(hud.energyFillWidth*.25f).Within(.01f));
            var old=JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/SectHud/level2.json"));((JObject)old["payload"]["interactions"]["sectEnergy"]).Remove("maxLevel");Assert.That(Read(old).SectEnergy.MaxLevel,Is.EqualTo(3));
        }
        [TestCase(4,3,false,0)][TestCase(1,0,false,0)][TestCase(51,51,false,0)][TestCase(6,6,true,15)][TestCase(6,6,false,60)][TestCase(5,6,false,60)]
        public void ConfiguredBoundsAndFullFlagAreValidated(int level,int maxLevel,bool full,int power)
        {
            var json=Raw();json["payload"]["interactions"]=new JObject{["sectEnergy"]=new JObject{["level"]=level,["maxLevel"]=maxLevel,["power"]=power,["threshold"]=60,["full"]=full}};
            Assert.That(StateMapper.TryParse(json.ToString(),out _,out _),Is.False);
        }
        [UnityTest] public IEnumerator ConfiguredLevelSixRendersViaProtocolInPlayMode()
        {
            yield return new EnterPlayMode();var b=Object.FindAnyObjectByType<SectSceneBindings>();b.network.enabled=false;
            b.network.Protocol.Open(951);bool accepted=b.network.Protocol.Accept(File.ReadAllText("Assets/Tests/Fixtures/SectHud/level6.json"),951,0);
            var liveHud=Object.FindAnyObjectByType<Concept02Hud>();double deadline=EditorApplication.timeSinceStartup+4;
            while(!liveHud.energyTitle.text.Contains("CẤP 6")&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool rendered=liveHud.energyTitle.text.Contains("CẤP 6")&&liveHud.energyLabel.text.Contains("15 / 60")&&Mathf.Abs(liveHud.energyFill.rectTransform.rect.width-liveHud.energyFillWidth*.25f)<.01f;
            b.network.Protocol.Disconnect(951);deadline=EditorApplication.timeSinceStartup+4;while(liveHud.energyFill.gameObject.activeSelf&&EditorApplication.timeSinceStartup<deadline)yield return null;
            bool disconnected=!liveHud.energyFill.gameObject.activeSelf;yield return new ExitPlayMode();Assert.That(accepted&&rendered&&disconnected,Is.True,$"accepted={accepted},rendered={rendered},disconnect={disconnected}");
        }
    }
}
