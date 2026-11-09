using System;
using System.Collections;
using System.IO;
using System.Linq;
using NUnit.Framework;
using TMPro;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.TestTools;
using UnityEngine.UI;
using TuTienLive.UI;
using TuTienLive.Scenes;
using Object=UnityEngine.Object;

namespace TuTienLive.Tests
{
    public sealed class K01GuideTests
    {
        private const string Scene="Assets/Scenes/SectScene_Concept02.unity";
        private static RectTransform Root()=>Object.FindAnyObjectByType<Concept02Hud>().transform.Find("K01_PlayGuide") as RectTransform;
        [SetUp] public void Open(){if(!Application.isPlaying)EditorSceneManager.OpenScene(Scene);}
        [UnityTearDown] public IEnumerator Exit(){if(Application.isPlaying)yield return new ExitPlayMode();}
        [Test] public void SavedK01UsesApprovedBoundsLocalImagesAndNeverBlocksInput()
        {
            var root=Root();Assert.That(root,Is.Not.Null);Assert.That(root.anchoredPosition,Is.EqualTo(new Vector2(12,-322)));Assert.That(root.sizeDelta,Is.EqualTo(new Vector2(436,611)));Assert.That(root.localScale,Is.EqualTo(new Vector3(.9f,.9f,1)));
            Assert.That(root.anchoredPosition.x+root.sizeDelta.x*root.localScale.x,Is.LessThan(405),"Leave more of the ritual platform visible.");
            Assert.That(root.GetSiblingIndex(),Is.Zero,"Existing notifications must render above the guide.");
            var group=root.GetComponent<CanvasGroup>();Assert.That(group.blocksRaycasts||group.interactable,Is.False);
            Assert.That(root.GetComponentsInChildren<Graphic>().All(g=>!g.raycastTarget),Is.True);
            foreach(var graphic in root.GetComponentsInChildren<GuidePanelGraphic>())Assert.That(graphic.GetComponent<CanvasRenderer>(),Is.Not.Null,"Custom frame/symbol needs a CanvasRenderer: "+graphic.name);
            var gifts=root.Find("GiftTable");Assert.That(((RectTransform)gifts).anchoredPosition,Is.EqualTo(new Vector2(0,-392)));
            foreach(var raw in gifts.GetComponentsInChildren<RawImage>())Assert.That(AssetDatabase.GetAssetPath(raw.texture).StartsWith("Assets/Art/K01Guide/"),Is.True);
            Assert.That(gifts.GetComponentsInChildren<RawImage>().Length,Is.EqualTo(3));
            foreach(var image in gifts.GetComponentsInChildren<Image>())if(image.sprite)Assert.That(AssetDatabase.GetAssetPath(image.sprite).StartsWith("Assets/Art/Items/"),Is.True);
            foreach(var t in root.GetComponentsInChildren<Transform>(true))Assert.That(GameObjectUtility.GetMonoBehavioursWithMissingScriptCount(t.gameObject),Is.Zero,t.name);
            Assert.That(root.GetComponentsInChildren<TMP_Text>().Single(t=>t.name=="RootEffect").text,Is.EqualTo("×3 tu luyện · vĩnh viễn"));
            Assert.That(root.GetComponentsInChildren<TMP_Text>().Single(t=>t.name=="Skill2Name").text,Is.EqualTo("Thiên long quyết"));
        }
        [Test] public void LabelsFitAndInstallerIsIdempotentWithoutSavingOrRebuildingExistingScene()
        {
            var root=Root();Canvas.ForceUpdateCanvases();foreach(var text in root.GetComponentsInChildren<TMP_Text>())
            {text.ForceMeshUpdate(true,true);Assert.That(text.preferredWidth,Is.LessThanOrEqualTo(text.rectTransform.rect.width+1),text.name);Assert.That(text.preferredHeight,Is.LessThanOrEqualTo(text.rectTransform.rect.height+1),text.name);}
            var bytes=File.ReadAllBytes(Scene);int count=root.GetComponentsInChildren<Transform>(true).Length;
            var type=AppDomain.CurrentDomain.GetAssemblies().Select(a=>a.GetType("TuTienLive.Editor.K01GuideSetup")).First(t=>t!=null);
            Assert.That(type.GetMethod("Install").Invoke(null,null),Is.SameAs(root));Assert.That(Root().GetComponentsInChildren<Transform>(true).Length,Is.EqualTo(count));Assert.That(File.ReadAllBytes(Scene),Is.EqualTo(bytes));
        }
        [UnityTest] public IEnumerator PlayGuideSurvivesSnapshotDisconnectAndCameraZoomWithoutChangingServerOrWorld()
        {
            yield return new EnterPlayMode();var b=Object.FindAnyObjectByType<SectSceneBindings>();b.network.enabled=false;var root=Root();
            string file=File.ReadAllText("Assets/Tests/Fixtures/Qua78/initial.json");var protocol=b.network.Protocol;protocol.Open(9801);Assert.That(protocol.Accept(file,9801,0),Is.True);yield return null;
            string original=b.network.State.Snapshot.CopyJson().ToString();var position=root.anchoredPosition;var size=root.sizeDelta;int count=root.GetComponentsInChildren<Transform>(true).Length;
            var camera=b.cameraRig.GetComponent<Camera>();float half=camera.orthographicSize;var pose=camera.transform.position;
            camera.orthographicSize=2.4f;camera.transform.position+=Vector3.up*3;yield return null;Canvas.ForceUpdateCanvases();
            bool fixedLayout=root.gameObject.activeInHierarchy&&root.anchoredPosition==position&&root.sizeDelta==size&&root.GetComponentsInChildren<Transform>(true).Length==count;
            bool authority=b.network.State.Snapshot.CopyJson().ToString()==original;
            camera.orthographicSize=half;camera.transform.position=pose;protocol.Disconnect(9801);yield return null;
            bool visible=root.gameObject.activeInHierarchy&&Object.FindAnyObjectByType<Concept02Hud>().timerLabel.text=="--:--";
            yield return new ExitPlayMode();Assert.That(fixedLayout&&authority&&visible,Is.True,$"fixed={fixedLayout} snapshot={authority} disconnectedVisible={visible}");
        }
    }
}
