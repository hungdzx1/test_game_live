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
using TuTienLive.Effects;
using TuTienLive.Models;
using TuTienLive.Network;
using Object=UnityEngine.Object;

namespace TuTienLive.Tests
{
    public sealed class Camera9Tests
    {
        private IdleCameraPresenter idle;private ItemReceiptPresenter items;private BlessingReceiptPresenter blessing;
        private const string Folder="Assets/Tests/Fixtures/Camera9/";
        private static Envelope Read(string name){Assert.That(StateMapper.TryParse(File.ReadAllText(Folder+name+".json"),out var e,out var error),Is.True,error);return e;}
        [SetUp] public void Open()
        {
            if(Application.isPlaying)return;EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");idle=Object.FindAnyObjectByType<IdleCameraPresenter>();items=idle.receipts;blessing=Object.FindAnyObjectByType<BlessingReceiptPresenter>();
            idle.enabled=items.enabled=false;idle.network.enabled=false;idle.characters.enabled=false;idle.characters.scene.quality=TuTienLive.Scenes.SectQuality.High;idle.rig.driftEnabled=false;idle.rig.Sample(0);State("initial");idle.ChooseIndex=n=>0;
        }
        [TearDown] public void Close(){if(!Application.isPlaying)EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");}
        [UnityTearDown] public IEnumerator Leave(){if(Application.isPlaying)yield return new ExitPlayMode();}
        private void State(string name){var e=Read(name);idle.characters.ApplySnapshot(e.Snapshot,e.SessionId);idle.characters.Sample(0,0);idle.ApplySnapshot(e.Snapshot,e.SessionId);items.ApplySnapshot(e.Snapshot,e.SessionId);blessing.ApplySnapshot(e.Snapshot,e.SessionId);}
        [Test] public void RandomWaitsFifteenSecondsChoosesAllEligibleKindsAndRitualNeverForcesFollow()
        {
            Assert.That(idle.idleSeconds,Is.EqualTo(15));Assert.That(idle.panSeconds,Is.EqualTo(20));Assert.That(idle.zoomSeconds,Is.EqualTo(5));Assert.That(idle.followSeconds,Is.EqualTo(8));Assert.That(idle.characters.arrivalFlights,Is.True);
            State("ritual");idle.Advance(1);Assert.That(idle.Mode,Is.EqualTo("overview"));Assert.That(idle.rig.HasAmbientFocus,Is.False);
            foreach(var mode in new[]{"pan","zoom","follow"})
            {
                idle.ResetPresentation();State("ritual");idle.ChooseIndex=n=>mode=="pan"?0:mode=="zoom"?1:n-1;
                idle.Advance(14.99f);Assert.That(idle.Mode,Is.EqualTo("overview"));idle.Advance(.02f);Assert.That(idle.Mode,Is.EqualTo(mode));
                float total=mode=="pan"?21.6f:mode=="zoom"?6.6f:8;
                idle.Advance(total-.02f);Assert.That(idle.Mode,Is.EqualTo(mode),"Shot ended before its hold and both transitions finished");idle.Advance(.03f);Assert.That(idle.Mode,Is.EqualTo("overview"));Assert.That(idle.rig.HasAmbientFocus,Is.False);
                idle.Advance(14.99f);Assert.That(idle.Mode,Is.EqualTo("overview"));
            }
            idle.ResetPresentation();State("initial");int eligible=0;idle.ChooseIndex=n=>{eligible=n;return 0;};idle.Advance(15);Assert.That(eligible,Is.EqualTo(2));
        }
        [Test] public void NewcomersFlyConcurrentlyForThreeSecondsNewestGetsCameraAndRosterStaysBounded()
        {
            var c=idle.characters;c.HandleEvent(Read("joined-a").Event);c.HandleEvent(Read("joined-a").Event);c.HandleEvent(Read("joined-b").Event);c.Sample(0,0);Assert.That(c.ArrivalCount,Is.EqualTo(2));Assert.That(c.NewestArrivalUserId,Is.EqualTo("cam:27"));
            var camera=idle.rig.GetComponent<Camera>();var point=camera.WorldToViewportPoint(c.Views["cam:27"].transform.position);Assert.That(point.x<0||point.x>1,Is.True);
            idle.Advance(.1f);Assert.That(idle.Mode,Is.EqualTo("arrival"));Assert.That(idle.Subject,Is.EqualTo("cam:27"));
            float margin=idle.rig.OverviewHalfHeight-camera.orthographicSize;Assert.That(Mathf.Abs(camera.transform.position.x-idle.rig.OverviewPosition.x),Is.LessThanOrEqualTo(margin*TuTienLive.Scenes.CameraRig.PortraitAspect+.001f));Assert.That(Mathf.Abs(camera.transform.position.y-idle.rig.OverviewPosition.y),Is.LessThanOrEqualTo(margin+.001f));
            c.Sample(0,1.5f);Assert.That(c.ArrivalElapsed("cam:26"),Is.EqualTo(1.5f));Assert.That(c.Views["cam:27"].pose.Pose,Is.EqualTo("fly"));Assert.That(c.Views.Count,Is.EqualTo(25));
            c.Sample(0,1.5f);Assert.That(c.ArrivalCount,Is.Zero);foreach(string id in new[]{"cam:26","cam:27"})if(c.Views.TryGetValue(id,out var view))Assert.That(Vector3.Distance(view.transform.position,view.Seat),Is.LessThan(.001));idle.Advance(.4f);Assert.That(idle.Mode,Is.EqualTo("overview"));
        }
        [Test] public void GiftTakesCameraDirectlyFromRandomOrArrivalAndReceiptsRemainFIFO()
        {
            idle.Advance(15);idle.Advance(2);var c=idle.characters;c.HandleEvent(Read("joined-a").Event);c.Sample(0,0);idle.Advance(.2f);var position=idle.rig.transform.position;float half=idle.rig.GetComponent<Camera>().orthographicSize;
            items.HandleEvent(Read("gift").Event);idle.HandleEvent(Read("gift").Event);idle.Advance(.01f);items.Advance(0);Assert.That(items.ActiveUserId,Is.EqualTo("cam:12"));Assert.That(Vector3.Distance(idle.rig.transform.position,position),Is.LessThan(.001));Assert.That(idle.rig.GetComponent<Camera>().orthographicSize,Is.EqualTo(half).Within(.001));
            items.HandleEvent(Read("gift-b").Event);items.Advance(1);c.Sample(0,1);Assert.That(c.ArrivalElapsed("cam:26"),Is.EqualTo(1));Assert.That(items.ActiveUserId,Is.EqualTo("cam:12"));
            var renderer=c.Views["cam:12"].pose.Body;var point=idle.rig.GetComponent<Camera>().WorldToViewportPoint(renderer.transform.TransformPoint(renderer.localBounds.center));Assert.That(point.x,Is.EqualTo(.5f).Within(.015));Assert.That(point.y,Is.EqualTo(.5f).Within(.015));
            items.Advance(2);items.Advance(0);Assert.That(items.ActiveUserId,Is.EqualTo("cam:13"));
            c.HandleEvent(Read("joined-b").Event);c.Sample(0,0);c.Sample(0,.5f);items.Advance(3);idle.Advance(.1f);Assert.That(idle.Subject,Is.EqualTo("cam:27"));Assert.That(idle.Mode,Is.EqualTo("arrival"));
        }
        [Test] public void BattleDefersBothGiftsAndArrivalsPauseFreezesAndReconnectDoesNotReplayEntry()
        {
            idle.Advance(15);idle.Advance(2);items.HandleEvent(Read("gift").Event);items.Advance(1);State("paused");idle.Advance(0);items.Advance(0);
            Assert.That(idle.rig.HasAmbientFocus||idle.rig.HasReceiptFocus,Is.False,"Entering a paused battle must still release the cultivation camera");
            State("battle");var c=idle.characters;c.HandleEvent(Read("joined-a").Event);items.HandleEvent(Read("gift").Event);c.Sample(0,2);idle.Advance(2);items.Advance(2);Assert.That(c.NewestArrivalUserId,Is.Null);Assert.That(items.ActiveUserId,Is.Null);Assert.That(idle.rig.HasAmbientFocus||idle.rig.HasReceiptFocus,Is.False);
            State("initial");c.Sample(0,0);items.Advance(.2f);Assert.That(items.ActiveUserId,Is.EqualTo("cam:12"));Assert.That(c.IsArriving("cam:26"),Is.True);
            State("paused");float elapsed=c.ArrivalElapsed("cam:26");c.Sample(0,20);Assert.That(c.ArrivalElapsed("cam:26"),Is.EqualTo(elapsed));
            c.ApplySnapshot(null,Read("initial").SessionId);State("initial");c.HandleEvent(Read("returned").Event);c.Sample(0,3);Assert.That(c.ArrivalCount,Is.Zero);
        }
        [Test] public void DonorPopupHasNameAndAvatarFallbackKeepsAnonymousRewardsAndQueuesDifferentDonors()
        {
            blessing.enabled=true;blessing.HandleEvent(Read("donor").Event);Assert.That(blessing.DonorName,Is.EqualTo("Đạo hữu ban phúc"));Assert.That(blessing.donorVisual.alpha,Is.EqualTo(1));Assert.That(blessing.donorAvatar.fallback.text,Is.EqualTo("Đ"));Assert.That(blessing.Count,Is.EqualTo(3));
            blessing.HandleEvent(Read("donor-b").Event);Assert.That(blessing.QueuedCount,Is.EqualTo(1));Assert.That(blessing.DonorName,Is.EqualTo("Đạo hữu ban phúc"));blessing.Advance(2);Assert.That(blessing.DonorName,Is.EqualTo("Tiên hữu thứ hai"));Assert.That(blessing.Count,Is.EqualTo(1));
            blessing.Hide();Assert.That(blessing.donorVisual.alpha,Is.Zero);Assert.That(blessing.donorAvatar.CachedCount,Is.Zero);
            foreach(string url in new[]{"http://localhost/a","https://tiktokcdn.com.evil.test/a","file:///C:/a","https://user:pass@p16.tiktokcdn.com/a"})Assert.That(DonorAvatarView.IsSafeUrl(url),Is.False);
            Assert.That(DonorAvatarView.IsSafeUrl("https://p16.tiktokcdn.com/avatar.jpeg"),Is.True);
            var raw=JObject.Parse(File.ReadAllText(Folder+"donor.json"));raw["payload"]["donor"]["avatar"]=new JObject();Assert.That(StateMapper.TryParse(raw.ToString(),out _,out _),Is.False);
        }
        [Test] public void SavedInstallerAddsOnlyOneDonorPanelAndNoRaycastTargets()
        {
            var setup=AppDomain.CurrentDomain.GetAssemblies().Select(a=>a.GetType("TuTienLive.Editor.Camera9Setup")).First(t=>t!=null);setup.GetMethod("Install").Invoke(null,null);
            Assert.That(blessing.popRoot.Cast<Transform>().Count(t=>t.name=="DonorAttribution"),Is.EqualTo(1));Assert.That(blessing.donorVisual.blocksRaycasts||blessing.donorVisual.interactable,Is.False);Assert.That(blessing.donorVisual.GetComponentsInChildren<UnityEngine.UI.Graphic>(true).All(g=>!g.raycastTarget),Is.True);
        }
        private static void Inject(UnityWebSocketClient network,string name,long seq)
        {var raw=JObject.Parse(File.ReadAllText(Folder+name+".json"));raw["sessionId"]="camera9-play";raw["seq"]=seq;Assert.That(network.Protocol.Accept(raw.ToString(),9860,0),Is.True,network.Protocol.LastError);}
        [UnityTest] public IEnumerator PlayNewestArrivalYieldsToGiftAndDisconnectRestoresOriginalCamera()
        {
            idle.enabled=items.enabled=idle.characters.enabled=true;yield return new EnterPlayMode();yield return null;
            var live=Object.FindAnyObjectByType<IdleCameraPresenter>();live.network.enabled=false;live.network.enabled=true;live.network.enabled=false;live.network.Protocol.Open(9860);Inject(live.network,"initial",1);yield return null;yield return null;
            Inject(live.network,"joined-a",2);Inject(live.network,"joined-b",3);yield return null;yield return null;bool arrival=live.Mode=="arrival"&&live.Subject=="cam:27";
            Inject(live.network,"gift",4);double deadline=EditorApplication.timeSinceStartup+3;while((live.receipts.ActiveUserId!="cam:12"||!live.rig.HasReceiptFocus)&&EditorApplication.timeSinceStartup<deadline)yield return null;bool gift=live.receipts.ActiveUserId=="cam:12"&&live.rig.HasReceiptFocus;
            string giftDetails=$"active={live.receipts.ActiveUserId} queued={live.receipts.QueuedCount} elapsed={live.receipts.Elapsed} enabled={live.receipts.enabled} phase={live.network.State.Snapshot?.Phase}";
            Inject(live.network,"donor",5);yield return null;bool donor=Object.FindAnyObjectByType<BlessingReceiptPresenter>().DonorName=="Đạo hữu ban phúc";
            live.network.Protocol.Disconnect(9860);yield return null;bool clean=!live.rig.HasAmbientFocus&&!live.rig.HasReceiptFocus&&live.characters.ArrivalCount==0;
            yield return new ExitPlayMode();Assert.That(arrival&&gift&&donor&&clean,Is.True,$"arrival={arrival} gift={gift} donor={donor} clean={clean} {giftDetails}");
        }
    }
}
