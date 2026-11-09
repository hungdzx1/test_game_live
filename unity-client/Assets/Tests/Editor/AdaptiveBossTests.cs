using System.Collections;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.TestTools;
using TuTienLive.Effects;
using TuTienLive.Models;
using TuTienLive.Network;
using TuTienLive.UI;
using Object=UnityEngine.Object;

namespace TuTienLive.Tests
{
    public sealed class AdaptiveBossTests
    {
        private const string Folder="Assets/Tests/Fixtures/AdaptiveBoss/";
        private BossBattlePresenter fx;
        [SetUp] public void Open()
        {
            if(Application.isPlaying)return;
            EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");
            fx=Object.FindAnyObjectByType<BossBattlePresenter>();fx.enabled=false;fx.network.enabled=false;fx.characters.enabled=false;
        }
        [TearDown] public void Close(){if(!Application.isPlaying)EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");}
        [UnityTearDown] public IEnumerator Leave(){if(Application.isPlaying)yield return new ExitPlayMode();}
        private static Envelope Read(string name)
        {Assert.That(StateMapper.TryParse(File.ReadAllText(Folder+name+".json"),out var value,out var error),Is.True,error);return value;}
        [TestCase(0)][TestCase(1)][TestCase(2)] public void ActualRandomBossSnapshotsUseOneArenaAndZeroDeadline(int index)
        {
            var state=Read("boss"+index).Snapshot;var battle=state.Battle;var boss=battle.View.ActiveBoss;
            Assert.That(battle.EndOnKill&&boss.EndOnKill,Is.True);Assert.That(battle.Fields.Count,Is.EqualTo(1));
            Assert.That(boss.Type,Is.EqualTo(index));Assert.That(boss.DurationMs,Is.Zero);Assert.That(state.RemainingMs,Is.Zero);
            Assert.That(boss.ElapsedMs,Is.GreaterThan(180000));Assert.That(boss.Hp,Is.GreaterThan(0));
            fx.Sample(state,0,0);Assert.That(fx.IsVisible,Is.True);Assert.That(fx.BossIndex,Is.EqualTo(index));
        }
        [Test] public void UntimedAnimationKeepsLoopingAndHudCountsUpWithPauseAndNoStateMutation()
        {
            var state=Read("boss0").Snapshot;string before=state.CopyJson().ToString();
            fx.Sample(state,0,0);int first=fx.FrameIndex;fx.Sample(state,200,0);Assert.That(fx.FrameIndex,Is.Not.EqualTo(first));
            var hud=Object.FindAnyObjectByType<Concept02Hud>();hud.Render(state);Assert.That(hud.timerLabel.text,Is.EqualTo("03:20"));
            var paused=Read("paused").Snapshot;fx.Sample(paused,0,0);int frozen=fx.FrameIndex;fx.Sample(paused,50000,1);Assert.That(fx.FrameIndex,Is.EqualTo(frozen));
            hud.Render(paused);Assert.That(hud.timerLabel.text,Is.EqualTo("03:20"));hud.Render(Read("long").Snapshot);Assert.That(hud.timerLabel.text,Is.EqualTo("20:00"));
            Assert.That(state.CopyJson().ToString(),Is.EqualTo(before));
        }
        [Test] public void ZeroDeadlineRequiresExplicitMatchingFlagsAndLegacyPacketsStillParse()
        {
            foreach(string field in new[]{"endOnKill","durationMs"})
            {
                var raw=JObject.Parse(File.ReadAllText(Folder+"boss0.json"));var boss=(JObject)raw["payload"]["battle"]["view"]["activeBoss"];
                boss[field]=field=="endOnKill"?JToken.FromObject(false):JToken.FromObject(300000);
                Assert.That(StateMapper.TryParse(raw.ToString(),out _,out _),Is.False);
            }
            var mismatch=JObject.Parse(File.ReadAllText(Folder+"boss0.json"));mismatch["payload"]["battle"]["endOnKill"]=false;
            Assert.That(StateMapper.TryParse(mismatch.ToString(),out _,out _),Is.False);
            Assert.That(StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/SharedBoss/boss1.json"),out _,out var error),Is.True,error);
        }
        [UnityTest] public IEnumerator PlayProtocolAcceptsUntimedFightAndServerKillReturnsToCultivation()
        {
            fx.enabled=true;fx.characters.enabled=true;yield return new EnterPlayMode();yield return null;
            var live=Object.FindAnyObjectByType<BossBattlePresenter>();live.network.enabled=false;
            var protocol=live.network.Protocol;protocol.Open(9841);
            Assert.That(protocol.Accept(File.ReadAllText(Folder+"boss2.json"),9841,0),Is.True);yield return null;yield return null;
            Assert.That(live.IsVisible&&live.BossIndex==2,Is.True);Assert.That(live.characters.Views.Values.All(v=>v.pose.Pose=="attack"),Is.True);
            var completed=JObject.Parse(File.ReadAllText(Folder+"completed.json"));completed["sessionId"]=protocol.State.SessionId;completed["seq"]=999;
            Assert.That(protocol.Accept(completed.ToString(),9841,0),Is.True);yield return null;yield return null;
            Assert.That(live.IsVisible,Is.False);Assert.That(live.energyWidgets.All(g=>g.enabled),Is.True);
            Assert.That(protocol.State.Snapshot.Players.Values.All(p=>p.CopyField("inventory")["pill"].Value<int>()==2),Is.True);
            yield return new ExitPlayMode();
        }
    }
}
