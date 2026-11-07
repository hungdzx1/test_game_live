using System.IO;
using System.Collections;
using System.Linq;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.TestTools;
using UnityEngine.UI;
using TuTienLive.Models;
using TuTienLive.Network;
using TuTienLive.UI;

namespace TuTienLive.Tests
{
    public sealed class BlessingPanelTests
    {
        private BlessingPanelHud hud;
        private static string Json(string name)=>File.ReadAllText("Assets/Tests/Fixtures/Blessing/"+name+".json");
        private static Snapshot Read(string name){Assert.That(StateMapper.TryParse(Json(name),out var e,out var error),Is.True,error);return e.Snapshot;}
        [SetUp] public void Open(){if(!EditorApplication.isPlaying)EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Concept02.unity");hud=Object.FindAnyObjectByType<BlessingPanelHud>();}
        [Test] public void SavedPanelUsesEightLocalLayersAndSitsDirectlyBelowNotice()
        {
            Assert.That(hud,Is.Not.Null);Assert.That(hud.panel.activeSelf,Is.False);
            var images=hud.panel.GetComponentsInChildren<RawImage>(true);Assert.That(images.Length,Is.EqualTo(8));
            foreach(var image in images)
            {
                Assert.That(image.texture,Is.Not.Null,image.name);
                string path=AssetDatabase.GetAssetPath(image.texture);Assert.That(path,Does.StartWith("Assets/Art/SectConcept02/UI/Blessing/"));
                Assert.That(((TextureImporter)AssetImporter.GetAtPath(path)).textureShape,Is.EqualTo(TextureImporterShape.Texture2D));
            }
            var panel=(RectTransform)hud.panel.transform;var notice=(RectTransform)hud.transform.Find("NoticePanel/PanelFrame");
            var a=new Vector3[4];var b=new Vector3[4];panel.GetWorldCorners(a);notice.GetWorldCorners(b);Assert.That(a[1].y,Is.LessThan(b[0].y));
            Assert.That(hud.panel.transform.Find("TopOrnament"),Is.Not.Null);Assert.That(hud.panel.transform.Find("BottomOrnament"),Is.Not.Null);
        }
        [Test] public void BackendSnapshotsDriveTimerFillAndDurationExtension()
        {
            var left=hud.progressFill.rectTransform.anchoredPosition;
            hud.Render(Read("active-30"));Assert.That(hud.panel.activeSelf,Is.True);Assert.That(hud.timerLabel.text,Is.EqualTo("Còn lại: 00:30"));Assert.That(hud.effectLabel.text,Is.EqualTo("x2 tốc độ tu luyện"));
            hud.Render(Read("remaining-15"));Assert.That(hud.timerLabel.text,Is.EqualTo("Còn lại: 00:15"));Assert.That(hud.progressFill.rectTransform.rect.width,Is.EqualTo(hud.progressWidth*.5f).Within(.01f));
            hud.Render(Read("stacked-50"));Assert.That(hud.timerLabel.text,Is.EqualTo("Còn lại: 00:50"));Assert.That(hud.progressFill.rectTransform.rect.width,Is.EqualTo(hud.progressWidth*50/60).Within(.01f));Assert.That(hud.progressFill.rectTransform.anchoredPosition,Is.EqualTo(left));
        }
        [Test] public void ExpiryLegacyMissingStateAndDisconnectHidePanel()
        {
            foreach(string name in new[]{"idle","expired"}){hud.Render(Read("active-30"));hud.Render(Read(name));Assert.That(hud.panel.activeSelf,Is.False,name);}
            var old=JObject.Parse(Json("active-30"));((JObject)old["payload"]["interactions"]).Remove("blessing");Assert.That(StateMapper.TryParse(old.ToString(),out var legacy,out _),Is.True);hud.Render(legacy.Snapshot);Assert.That(hud.panel.activeSelf,Is.False);
            hud.Render(Read("active-30"));hud.Render(null);Assert.That(hud.panel.activeSelf,Is.False);
        }
        [Test] public void PausedAndBattleSnapshotsRetainServerCountdownWithoutLocalTimer()
        {
            foreach(string name in new[]{"paused","battle"}){var snapshot=Read(name);for(int i=0;i<100;i++)hud.Render(snapshot);Assert.That(hud.timerLabel.text,Is.EqualTo("Còn lại: 00:30"));Assert.That(hud.panel.activeSelf,Is.True);}
        }
        [TestCase(-1,30000,2)][TestCase(30001,30000,2)][TestCase(0,-1,2)][TestCase(1,0,2)][TestCase(1,30000,4)]
        public void MalformedBlessingStateIsRejected(double remaining,double duration,int multiplier)
        {var json=JObject.Parse(Json("active-30"));json["payload"]["interactions"]["blessing"]=new JObject{["remainingMs"]=remaining,["durationMs"]=duration,["multiplier"]=multiplier};Assert.That(StateMapper.TryParse(json.ToString(),out _,out _),Is.False);}
        [UnityTest] public IEnumerator PlayShowsRefreshesExpiresAndHidesOnDisconnect()
        {
            yield return new EnterPlayMode();hud=Object.FindAnyObjectByType<BlessingPanelHud>();hud.network.enabled=false;
            foreach(var item in new[]{("active-30","00:30"),("stacked-50","00:50"),("expired",(string)null),("active-30","00:30")})
            {
                hud.network.Protocol.Open(9201);Assert.That(hud.network.Protocol.Accept(Json(item.Item1),9201,0),Is.True);
                double deadline=EditorApplication.timeSinceStartup+4;
                while((item.Item2==null?hud.panel.activeSelf:!hud.panel.activeSelf||!hud.timerLabel.text.Contains(item.Item2))&&EditorApplication.timeSinceStartup<deadline)yield return null;
                Assert.That(item.Item2==null?!hud.panel.activeSelf:hud.panel.activeSelf&&hud.timerLabel.text.Contains(item.Item2),Is.True,item.Item1);
            }
            hud.network.Protocol.Disconnect(9201);double end=EditorApplication.timeSinceStartup+4;while(hud.panel.activeSelf&&EditorApplication.timeSinceStartup<end)yield return null;
            bool hidden=!hud.panel.activeSelf;yield return new ExitPlayMode();Assert.That(hidden,Is.True);
        }
    }
}
