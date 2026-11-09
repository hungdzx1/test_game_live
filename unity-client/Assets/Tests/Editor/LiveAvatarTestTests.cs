using System;
using System.Collections;
using System.IO;
using System.Linq;
using System.Reflection;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.TestTools;
using UnityEngine.UI;
using TuTienLive.Effects;
using TuTienLive.Network;
using Object=UnityEngine.Object;

namespace TuTienLive.Tests
{
    public sealed class LiveAvatarTestTests
    {
        private LiveAvatarTestPresenter preview;
        private const string Folder="Assets/Tests/Fixtures/LiveAvatarTest/";
        private static TuTienLive.Models.Envelope Read(string name){Assert.That(StateMapper.TryParse(File.ReadAllText(Folder+name+".json"),out var e,out var error),Is.True,error);return e;}
        [SetUp] public void Open(){if(Application.isPlaying)return;EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");preview=Object.FindAnyObjectByType<LiveAvatarTestPresenter>();Assert.That(preview,Is.Not.Null);preview.network.enabled=false;State("initial-live");}
        [TearDown] public void Close(){if(!Application.isPlaying)EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");}
        [UnityTearDown] public IEnumerator Leave(){if(Application.isPlaying)yield return new ExitPlayMode();}
        private void State(string name){var e=Read(name);preview.ApplySnapshot(e.Snapshot,e.SessionId);}
        [Test] public void SavedLowerRightPanelIsSmallHiddenDoesNotBlockInputAndInstallerIsIdempotent()
        {
            var rect=(RectTransform)preview.transform;Assert.That(rect.anchorMin,Is.EqualTo(new Vector2(1,0)));Assert.That(rect.pivot,Is.EqualTo(new Vector2(1,0)));Assert.That(rect.anchoredPosition,Is.EqualTo(new Vector2(-24,90)));Assert.That(rect.sizeDelta,Is.EqualTo(new Vector2(420,156)));Assert.That(preview.visual.alpha,Is.Zero);
            Assert.That(preview.GetComponentsInChildren<Graphic>(true).All(g=>!g.raycastTarget),Is.True);Assert.That(preview.visual.blocksRaycasts||preview.visual.interactable,Is.False);
            var setup=AppDomain.CurrentDomain.GetAssemblies().Select(a=>a.GetType("TuTienLive.Editor.LiveAvatarTestSetup")).First(t=>t!=null);setup.GetMethod("Install").Invoke(null,null);Assert.That(Object.FindObjectsByType<LiveAvatarTestPresenter>().Length,Is.EqualTo(1));
        }
        [Test] public void OnlyEnabledLiveShowsUnknownViewerNewestWinsExpiresAtTenAndOffOrDisconnectHides()
        {
            var camera=Object.FindAnyObjectByType<TuTienLive.Scenes.CameraRig>();var position=camera.transform.position;float zoom=camera.GetComponent<Camera>().orthographicSize;var chars=Object.FindAnyObjectByType<TuTienLive.Characters.CharacterManager>();int created=chars.CreatedCount;
            foreach(string mode in new[]{"disabled-live","initial-demo"}){State(mode);preview.HandleEvent(Read("event-url").Event);Assert.That(preview.IsVisible,Is.False);}
            State("initial-live");var before=Read("initial-live").Snapshot.CopyJson().ToString();preview.HandleEvent(Read("event-missing").Event);Assert.That(preview.IsVisible,Is.True);Assert.That(preview.UserId,Is.EqualTo("tt:123"));Assert.That(preview.statusLabel.text,Is.EqualTo("Không có ảnh"));Assert.That(preview.avatar.fallback.enabled,Is.True);Assert.That(chars.Views.ContainsKey("tt:123"),Is.False);
            preview.Advance(3);preview.HandleEvent(Read("event-missing").Event);Assert.That(preview.Elapsed,Is.EqualTo(3));preview.HandleEvent(Read("event-url").Event);Assert.That(preview.UserId,Is.EqualTo("tt:456"));Assert.That(preview.Elapsed,Is.Zero);Assert.That(preview.statusLabel.text,Is.EqualTo("Đang tải"));
            State("paused-live");preview.Advance(4);Assert.That(preview.Elapsed,Is.EqualTo(4));State("battle-live");preview.Advance(5.99f);Assert.That(preview.IsVisible,Is.True);preview.Advance(.02f);Assert.That(preview.IsVisible,Is.False);
            preview.HandleEvent(Read("event-b").Event);Assert.That(preview.IsVisible,Is.True);State("disabled-live");Assert.That(preview.IsVisible,Is.False);State("initial-live");Assert.That(preview.IsVisible,Is.False);preview.ApplySnapshot(null,Read("initial-live").SessionId);Assert.That(preview.avatar.State,Is.EqualTo(AvatarLoadState.Hidden));
            Assert.That(camera.transform.position,Is.EqualTo(position));Assert.That(camera.GetComponent<Camera>().orthographicSize,Is.EqualTo(zoom));Assert.That(chars.CreatedCount,Is.EqualTo(created));Assert.That(Read("initial-live").Snapshot.CopyJson().ToString(),Is.EqualTo(before));
        }
        private static bool Image(DonorAvatarView avatar,string url,byte[] png)=>(bool)typeof(DonorAvatarView).GetMethod("AcceptImage",BindingFlags.NonPublic|BindingFlags.Instance).Invoke(avatar,new object[]{url,png});
        [Test] public void PhotoRequestsUseSameLocalServerPreserveSignedUrlAndExplainErrors()
        {
            const string source="https://p16.tiktokcdn.com/a.webp?x-signature=a%2Bb&x-expires=123";
            string local=DonorAvatarView.RequestUrl(source,"ws://127.0.0.1:32123/ws");
            Assert.That(local,Does.StartWith("http://127.0.0.1:32123/api/avatar?url="));Assert.That(Uri.UnescapeDataString(local.Substring(local.IndexOf("url=")+4)),Is.EqualTo(source));
            foreach(string endpoint in new[]{"ws://evil.invalid:32123/ws","ws://127.0.0.1.evil.invalid/ws","http://127.0.0.1:32123/ws","ws://user:pass@127.0.0.1/ws",null})Assert.That(DonorAvatarView.RequestUrl(source,endpoint),Is.Null);
            Assert.That(DonorAvatarView.RequestUrl("https://example.invalid/a","ws://127.0.0.1:3000/ws"),Is.Null);
            Assert.That(DonorAvatarView.RequestError(null,404),Does.Contain("khởi động lại Node"));Assert.That(DonorAvatarView.RequestError("decode",415),Does.Contain("giải mã"));Assert.That(DonorAvatarView.RequestError("source_size",413),Is.EqualTo("Ảnh quá lớn"));
        }
        [UnityTest] public IEnumerator ActualHttpWebpAndAvifBecomePngAndReachUnityReadyIncludingBanPhucLoader()
        {
            string url=Environment.GetEnvironmentVariable("TUTIEN_AVATAR_TEST_URL");if(string.IsNullOrEmpty(url))Assert.Ignore("Needs disposable avatar format test server.");
            var uri=new Uri(url);Assert.That(uri.IsLoopback,Is.True);
            var config=new SerializedObject(preview.network);config.FindProperty("endpoint").stringValue="ws://"+uri.Authority+"/ws";config.ApplyModifiedPropertiesWithoutUndo();
            yield return new EnterPlayMode();var live=Object.FindAnyObjectByType<LiveAvatarTestPresenter>();live.network.enabled=false;live.enabled=false;
            var blessing=Object.FindAnyObjectByType<BlessingReceiptPresenter>();blessing.enabled=false;var donor=blessing.donorAvatar;bool all=true;string details="";
            foreach(var loader in new[]{live.avatar,donor})foreach(string format in new[]{"webp","avif"}){
                loader.Present("Đạo hữu ảnh","https://p16.tiktokcdn.com/format-test."+format);
                double deadline=EditorApplication.timeSinceStartup+9;while(loader.State==AvatarLoadState.Loading&&EditorApplication.timeSinceStartup<deadline)yield return null;
                bool ok=loader.State==AvatarLoadState.Ready&&loader.portrait.enabled&&loader.portrait.texture.width==256&&loader.portrait.texture.height==128;
                all&=ok;details+=format+":"+loader.State+":"+loader.Error+";";loader.Hide();
            }
            yield return new ExitPlayMode();Assert.That(all,Is.True,details);
        }
        [Test] public void SharedBanPhucLoaderReportsOnlyDecodedImagesAsReadyCachesEightAndFallsBackOnFailure()
        {
            var avatar=preview.avatar;avatar.Present("Đạo hữu",null);Assert.That(avatar.State,Is.EqualTo(AvatarLoadState.Missing));Assert.That(avatar.fallback.text,Is.EqualTo("Đ"));
            const string url="https://p16.tiktokcdn.com/test.png";avatar.Present("Đạo hữu",url);Assert.That(avatar.State,Is.EqualTo(AvatarLoadState.Loading));
            var texture=new Texture2D(8,8,TextureFormat.RGBA32,false);var png=texture.EncodeToPNG();Object.DestroyImmediate(texture);
            Assert.That(Image(avatar,url,png),Is.True);Assert.That(avatar.State,Is.EqualTo(AvatarLoadState.Ready));Assert.That(avatar.StatusText,Is.EqualTo("Đã tải ảnh"));Assert.That(avatar.portrait.enabled,Is.True);Assert.That(avatar.fallback.enabled,Is.False);var first=avatar.portrait.texture;avatar.Present("Đạo hữu",url);Assert.That(avatar.portrait.texture,Is.SameAs(first));
            for(int i=0;i<10;i++)Assert.That(Image(avatar,"https://p16.tiktokcdn.com/test"+i+".png",png),Is.True);Assert.That(avatar.CachedCount,Is.EqualTo(8));
            avatar.Present("Người mới","https://example.invalid/a");Assert.That(avatar.State,Is.EqualTo(AvatarLoadState.Failed));Assert.That(avatar.fallback.text,Is.EqualTo("N"));Assert.That(avatar.portrait.enabled,Is.False);Assert.That(Image(avatar,url,new byte[524289]),Is.False);Assert.That(avatar.State,Is.EqualTo(AvatarLoadState.Failed));avatar.Hide();Assert.That(avatar.State,Is.EqualTo(AvatarLoadState.Hidden));
        }
        [Test] public void ProtocolRejectsMalformedTestPayloadAndToggleButStillAcceptsOlderSnapshots()
        {
            foreach(string key in new[]{"name","avatar","durationMs","source","userId"}){var raw=JObject.Parse(File.ReadAllText(Folder+"event-url.json"));raw["payload"][key]=new JObject();Assert.That(StateMapper.TryParse(raw.ToString(),out _,out _),Is.False,key);}
            var state=JObject.Parse(File.ReadAllText(Folder+"initial-live.json"));state["payload"]["config"]["live"]["avatarTestEnabled"]="true";Assert.That(StateMapper.TryParse(state.ToString(),out _,out _),Is.False);((JObject)state["payload"]["config"]["live"]).Remove("avatarTestEnabled");Assert.That(StateMapper.TryParse(state.ToString(),out var legacy,out _),Is.True);preview.ApplySnapshot(legacy.Snapshot,legacy.SessionId);preview.HandleEvent(Read("event-url").Event);Assert.That(preview.IsVisible,Is.False);
        }
        private static void Inject(UnityWebSocketClient client,string name,long seq){var raw=JObject.Parse(File.ReadAllText(Folder+name+".json"));raw["sessionId"]="live-avatar-play";raw["seq"]=seq;Assert.That(client.Protocol.Accept(raw.ToString(),9910,0),Is.True,client.Protocol.LastError);}
        [UnityTest] public IEnumerator PlayProtocolShowsNewestUnjoinedViewerAndOffReconnectClearWithoutCameraFocus()
        {
            yield return new EnterPlayMode();var live=Object.FindAnyObjectByType<LiveAvatarTestPresenter>();live.network.enabled=false;live.network.enabled=true;live.network.enabled=false;live.network.Protocol.Open(9910);Inject(live.network,"initial-live",1);live.Refresh();yield return null;Inject(live.network,"event-missing",2);yield return null;bool shown=live.IsVisible&&live.UserId=="tt:123"&&live.avatar.State==AvatarLoadState.Missing;
            Inject(live.network,"event-b",3);yield return null;bool latest=live.IsVisible&&live.UserId=="tt:789";Inject(live.network,"disabled-live",4);yield return null;bool off=!live.IsVisible&&live.avatar.State==AvatarLoadState.Hidden;Inject(live.network,"initial-live",5);yield return null;bool noReplay=!live.IsVisible;live.network.Protocol.Disconnect(9910);yield return null;
            var rig=Object.FindAnyObjectByType<TuTienLive.Scenes.CameraRig>();bool clean=!live.IsVisible&&!rig.HasReceiptFocus&&!rig.HasAmbientFocus;
            yield return new ExitPlayMode();Assert.That(shown&&latest&&off&&noReplay&&clean,Is.True,$"shown={shown} latest={latest} off={off} noReplay={noReplay} clean={clean}");
        }
    }
}
