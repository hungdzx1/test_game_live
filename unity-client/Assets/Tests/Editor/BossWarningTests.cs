using System;
using System.Collections;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.TestTools;
using UnityEngine.UI;
using TuTienLive.Audio;
using TuTienLive.Effects;
using TuTienLive.Models;
using TuTienLive.Network;
using Object=UnityEngine.Object;

namespace TuTienLive.Tests
{
    public sealed class BossWarningTests
    {
        private BossWarningPresenter fx;private BossBattlePresenter boss;
        private const string Folder="Assets/Tests/Fixtures/BossWarning/";
        [SetUp] public void Open(){if(Application.isPlaying)return;EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");fx=Object.FindAnyObjectByType<BossWarningPresenter>();boss=Object.FindAnyObjectByType<BossBattlePresenter>();Assert.That(fx,Is.Not.Null);fx.enabled=false;boss.enabled=false;fx.network.enabled=false;boss.characters.enabled=false;fx.cameraRig.driftEnabled=false;}
        [TearDown] public void Close(){if(!Application.isPlaying)EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");}
        [UnityTearDown] public IEnumerator Leave(){if(Application.isPlaying)yield return new ExitPlayMode();}
        private static Envelope Read(string name){Assert.That(StateMapper.TryParse(File.ReadAllText(Folder+name+".json"),out var e,out var error),Is.True,error);return e;}
        private void Render(string name,float offset=0){var e=Read(name);boss.characters.ApplySnapshot(e.Snapshot,e.SessionId);boss.characters.Sample(offset,0);boss.Sample(e.Snapshot,offset,0);fx.Sample(e.Snapshot,offset);}
        [Test] public void SavedTB02MatchesSelectedLayoutDoesNotBlockInputAndInstallerIsIdempotent()
        {
            var setup=AppDomain.CurrentDomain.GetAssemblies().Select(a=>a.GetType("TuTienLive.Editor.BossWarningSetup")).First(t=>t!=null);
            Assert.That(setup.GetMethod("Install").Invoke(null,null),Is.SameAs(fx));Assert.That(Object.FindObjectsByType<BossWarningPresenter>(FindObjectsSortMode.None).Length,Is.EqualTo(1));
            var r=(RectTransform)fx.transform.Find("HuyetBao");Assert.That(r.anchoredPosition,Is.EqualTo(new Vector2(234,-393)));Assert.That(r.sizeDelta,Is.EqualTo(new Vector2(612,513)));
            Assert.That(fx.warning.blocksRaycasts||fx.warning.interactable,Is.False);Assert.That(fx.GetComponentsInChildren<Graphic>(true).All(g=>!g.raycastTarget),Is.True);
            Assert.That(fx.GetComponentsInChildren<TMPro.TMP_Text>(true).All(t=>!t.text.Contains("TB02")),Is.True);
            foreach(string name in new[]{"warning1","warning2","warning3"}){Render(name);fx.bossName.ForceMeshUpdate();Assert.That(fx.bossName.isTextOverflowing,Is.False,name);Assert.That(fx.bossName.preferredWidth,Is.LessThanOrEqualTo(576));}
        }
        [Test] public void AuthoritativeThreeSecondWarningHidesBossAndAttacksThenRestoresAndKeepsSnapshotImmutable()
        {
            var original=Read("warning1");string before=original.Snapshot.CopyJson().ToString();
            foreach(var row in new[]{new[]{0,3},new[]{1000,2},new[]{2000,1},new[]{2999,1},new[]{3000,1}}){Render("warning1",row[0]);Assert.That(fx.IsVisible,Is.True);Assert.That(fx.Seconds,Is.EqualTo(row[1]));Assert.That(boss.IsVisible,Is.False);Assert.That(boss.ProjectileCount,Is.Zero);Assert.That(boss.characters.Views.Values.All(v=>v.pose.Pose=="idle"),Is.True);}
            Render("revealed");Assert.That(fx.IsVisible,Is.False);Assert.That(boss.IsVisible,Is.True);Assert.That(fx.cameraRig.BossWarningShake,Is.EqualTo(Vector2.zero));Assert.That(boss.characters.Views.Values.All(v=>v.pose.Pose=="attack"),Is.True);Assert.That(original.Snapshot.CopyJson().ToString(),Is.EqualTo(before));
            Render("mid");Assert.That(fx.progress.rectTransform.rect.width,Is.EqualTo(524*2f/3).Within(.01f));Render("warning1");Assert.That(fx.progress.rectTransform.rect.width,Is.EqualTo(524).Within(.01f));
        }
        [Test] public void PauseReconnectDisableAndCultivationClearOnlyWarningShakeAndPreserveCameraPose()
        {
            var camera=fx.cameraRig.GetComponent<Camera>();var start=camera.transform.localPosition;float size=camera.orthographicSize;
            Render("mid");Assert.That(fx.Seconds,Is.EqualTo(2));Assert.That(fx.cameraRig.BossWarningShake.magnitude,Is.GreaterThan(0));Render("paused",20000);Assert.That(fx.Seconds,Is.EqualTo(2));Assert.That(fx.cameraRig.BossWarningShake,Is.EqualTo(Vector2.zero));
            fx.cameraRig.SetBlessingShake(new Vector2(.01f,0));Render("warning3");fx.Sample(null,0);Assert.That(fx.IsVisible,Is.False);Assert.That(fx.cameraRig.BlessingShake.x,Is.EqualTo(.01f));fx.cameraRig.SetBlessingShake(Vector2.zero);
            Assert.That(Vector3.Distance(camera.transform.localPosition,start),Is.LessThan(.0001f));Assert.That(camera.orthographicSize,Is.EqualTo(size));Render("mid");fx.Hide();Assert.That(fx.warning.alpha,Is.Zero);Render("cultivation");Assert.That(fx.IsVisible,Is.False);
        }
        [Test] public void GeneratedClipsAreCanonicalPCMAndOptionalWarningProtocolIsValidated()
        {
            var audio=fx.audioManager;Assert.That(AssetDatabase.GetAssetPath(audio.bossWarning),Is.EqualTo("Assets/Musics/SFX/Boss/warning-TB02.wav"));
            var clips=new[]{audio.bossWarning,audio.attackNormal,audio.attackSkill1,audio.attackSkill2};var lengths=new[]{3f,.2f,.3f,.6f};
            for(int i=0;i<clips.Length;i++){Assert.That(clips[i].length,Is.EqualTo(lengths[i]).Within(.001));Assert.That(clips[i].channels,Is.EqualTo(1));Assert.That(clips[i].frequency,Is.EqualTo(44100));var data=new float[clips[i].samples];Assert.That(clips[i].GetData(data,0),Is.True);Assert.That(data.Max(v=>Mathf.Abs(v)),Is.InRange(.67f,.69f));}
            foreach(int bad in new[]{-1,3001}){var raw=JObject.Parse(File.ReadAllText(Folder+"warning1.json"));raw["payload"]["battle"]["view"]["activeBoss"]["warningElapsedMs"]=bad;Assert.That(StateMapper.TryParse(raw.ToString(),out _,out _),Is.False);}
            Assert.That(Read("revealed").Snapshot.Battle.View.ActiveBoss.IsWarning,Is.False);
        }
        private static void Inject(BossWarningPresenter p,string name,long seq)
        {var raw=JObject.Parse(File.ReadAllText(Folder+name+".json"));raw["sessionId"]="tb02-test";raw["seq"]=seq;Assert.That(p.network.Protocol.Accept(raw.ToString(),9840,0),Is.True);}
        private static void Hit(BossWarningPresenter p,long seq,string skill,string id,bool duplicate=false)
        {
            var raw=new JObject{["type"]="game:event",["version"]=1,["sessionId"]="tb02-test",["seq"]=seq,["serverTime"]=1000,["payload"]=new JObject{["eventId"]=id,["kind"]="battle:hit",["userId"]="warning:0",["timestamp"]=1000,["skill"]=skill==null?JValue.CreateNull():new JValue(skill)}};
            Assert.That(p.network.Protocol.Accept(raw.ToString(),9840,0),Is.EqualTo(!duplicate),p.network.Protocol.LastError);
        }
        // Do not capture iterator locals across EnterPlayMode's domain reload.
        private static bool Seeked(GameAudioManager audio)=>audio.EffectSources.Any(s=>s.clip==audio.bossWarning&&s.time>=.9f);
        [UnityTest] public IEnumerator PlayWarningAudioSeeksPausesRevealsAndDisconnectsWithoutDuplicatingSources()
        {
            fx.enabled=true;boss.enabled=true;boss.characters.enabled=true;yield return new EnterPlayMode();yield return null;
            var live=Object.FindAnyObjectByType<BossWarningPresenter>();live.network.enabled=false;live.network.enabled=true;live.network.enabled=false;live.network.Protocol.Open(9840);live.audioManager.Refresh();Inject(live,"mid",1);yield return null;yield return null;
            bool shown=live.IsVisible&&!Object.FindAnyObjectByType<BossBattlePresenter>().IsVisible;bool audio=live.audioManager.LastEffect=="boss-warning";
            bool sought=Seeked(live.audioManager);
            int played=live.audioManager.PlayedEffects;Inject(live,"paused",2);yield return null;yield return null;bool paused=!live.audioManager.BossWarningPlaying&&live.Seconds==2;
            Inject(live,"mid",3);yield return null;yield return null;bool once=live.audioManager.PlayedEffects==played;
            Inject(live,"revealed",4);yield return null;yield return null;bool revealed=!live.IsVisible&&Object.FindAnyObjectByType<BossBattlePresenter>().IsVisible&&!live.audioManager.BossWarningPlaying;
            played=live.audioManager.PlayedEffects;Hit(live,5,null,"attack-normal");bool normal=live.audioManager.LastEffect=="attack";
            Hit(live,6,"1","attack-1");bool skill1=live.audioManager.LastEffect=="attack-1";Hit(live,7,"2","attack-2");bool skill2=live.audioManager.LastEffect=="attack-2";
            Hit(live,8,"2","attack-2",true);bool attacks=normal&&skill1&&skill2&&live.audioManager.PlayedEffects==played+3;
            var mute=JObject.Parse(File.ReadAllText(Folder+"revealed.json"));mute["sessionId"]="tb02-test";mute["seq"]=9;mute["payload"]["config"]["audio"]=new JObject{["effects"]=false};Assert.That(live.network.Protocol.Accept(mute.ToString(),9840,0),Is.True);yield return null;
            played=live.audioManager.PlayedEffects;Hit(live,10,"1","muted");bool muted=live.audioManager.PlayedEffects==played&&live.audioManager.EffectSources.All(s=>!s.isPlaying);
            int count=live.audioManager.EffectSources.Length;live.network.Protocol.Disconnect(9840);yield return null;bool clean=!live.IsVisible&&live.cameraRig.BossWarningShake==Vector2.zero;
            yield return new ExitPlayMode();Assert.That(shown&&audio&&sought&&paused&&once&&revealed&&attacks&&muted&&clean&&count==16,Is.True,$"shown={shown} audio={audio} sought={sought} paused={paused} once={once} revealed={revealed} attacks={attacks} muted={muted} clean={clean} sources={count}");
        }
    }
}
