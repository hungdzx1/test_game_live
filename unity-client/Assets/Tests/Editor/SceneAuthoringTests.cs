using System;
using System.IO;
using System.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Scenes;
using TuTienLive.Characters;

namespace TuTienLive.Tests
{
    public sealed class SceneAuthoringTests
    {
        private const string ScenePath="Assets/Scenes/SectScene_Editable.unity";
        private const string TempPath="Assets/Tests/AuthoringRoundTrip.unity";
        private SectSceneBindings bindings;
        [SetUp] public void Open()
        {EditorSceneManager.OpenScene(ScenePath,OpenSceneMode.Single);bindings=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();}
        [TearDown] public void Cleanup()
        {EditorSceneManager.OpenScene(ScenePath,OpenSceneMode.Single);if(File.Exists(TempPath))AssetDatabase.DeleteAsset(TempPath);}
        private static Type Migration=>AppDomain.CurrentDomain.GetAssemblies().Select(a=>a.GetType("TuTienLive.Editor.SectSceneAuthoringMigration")).First(t=>t!=null);

        [Test] public void HierarchyAndReferencesAreSerializedWithNoMissingScripts()
        {
            Assert.That(bindings,Is.Not.Null);Migration.GetMethod("Verify").Invoke(null,null);
            Assert.That(bindings.groups.Length,Is.EqualTo(9));Assert.That(bindings.groups.Select(t=>t.name).Distinct().Count(),Is.EqualTo(9));
            Assert.That(UnityEngine.Object.FindObjectsByType<CharacterManager>().Length,Is.EqualTo(1));
            Assert.That(bindings.characters.characterPrefab.nameLabel,Is.Not.Null);
            Assert.That(bindings.characters.characterPrefab.nameLabel.font,Is.Not.Null);
            Assert.That(PrefabUtility.GetPrefabAssetType(bindings.characters.characterPrefab.gameObject),Is.EqualTo(PrefabAssetType.Variant));
            Assert.That(bindings.environment.layers.All(l=>l.bakedGeometry&&l.GetComponent<MeshFilter>().sharedMesh),Is.True);
        }
        [Test] public void MigrationRerunDoesNotDuplicateOrRewriteUserLayout()
        {
            int before=UnityEngine.Object.FindObjectsByType<Transform>().Length;
            var bytes=File.ReadAllBytes(ScenePath);
            Migration.GetMethod("Migrate").Invoke(null,null);Migration.GetMethod("Migrate").Invoke(null,null);
            Assert.That(UnityEngine.Object.FindObjectsByType<Transform>().Length,Is.EqualTo(before));Assert.That(File.ReadAllBytes(ScenePath),Is.EqualTo(bytes));
        }
        [Test] public void NativeTransformOpacitySortingAndTextSurviveSamplingSaveReopen()
        {
            var temple=bindings.environment.layers.Single(l=>l.name=="Temple");
            var position=temple.transform.localPosition+new Vector3(.13f,-.08f,.2f);var rotation=Quaternion.Euler(0,0,8);var scale=temple.transform.localScale*1.08f;
            temple.transform.localPosition=position;temple.transform.localRotation=rotation;temple.transform.localScale=scale;temple.opacity=.37f;
            temple.GetComponent<MeshRenderer>().sortingOrder=512;
            var title=bindings.groups[6].GetComponentsInChildren<TextMesh>().Single(t=>t.name=="Title");var textScale=title.transform.localScale*1.03f;title.transform.localScale=textScale;
            bindings.environment.Sample(20);bindings.environment.Sample(0);
            Assert.That(Vector3.Distance(temple.transform.localPosition,position),Is.LessThan(.00001));Assert.That(Quaternion.Angle(temple.transform.localRotation,rotation),Is.LessThan(.001));
            Assert.That(Vector3.Distance(temple.transform.localScale,scale),Is.LessThan(.00001));Assert.That(temple.GetComponent<MeshRenderer>().sortingOrder,Is.EqualTo(512));
            var block=new MaterialPropertyBlock();temple.GetComponent<MeshRenderer>().GetPropertyBlock(block);Assert.That(block.GetColor("_Color").a,Is.EqualTo(.37f));
            EditorSceneManager.SaveScene(temple.gameObject.scene,TempPath);EditorSceneManager.OpenScene(TempPath,OpenSceneMode.Single);
            temple=UnityEngine.Object.FindObjectsByType<SectLayer>().Single(l=>l.name=="Temple");
            Assert.That(Vector3.Distance(temple.transform.localPosition,position),Is.LessThan(.00001));Assert.That(Quaternion.Angle(temple.transform.localRotation,rotation),Is.LessThan(.001));
            Assert.That(Vector3.Distance(temple.transform.localScale,scale),Is.LessThan(.00001));Assert.That(temple.opacity,Is.EqualTo(.37f));Assert.That(temple.GetComponent<MeshRenderer>().sortingOrder,Is.EqualTo(512));
            title=UnityEngine.Object.FindObjectsByType<TextMesh>().Single(t=>t.name=="Title");Assert.That(title.transform.localScale,Is.EqualTo(textScale));
        }
        [Test] public void PoseAddsOffsetsToPrefabTransformAndNeverMovesNameplate()
        {
            var e=TuTienLive.Network.StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/Characters/players-10.json"),out var envelope,out _);
            Assert.That(e,Is.True);var view=UnityEngine.Object.Instantiate(bindings.characters.characterPrefab);
            try
            {
                view.pose.transform.localPosition=new Vector3(.12f,.2f,0);view.pose.transform.localRotation=Quaternion.Euler(0,0,7);view.pose.transform.localScale=Vector3.one*.17f;
                var label=view.nameLabel.transform;label.localPosition=new Vector3(.15f,1.8f,.1f);label.localScale=Vector3.one*.8f;
                view.Sample(envelope.Snapshot.Players.Values.First(),"idle",0,0,false,false);
                Assert.That(view.pose.transform.localPosition,Is.EqualTo(new Vector3(.12f,.2f,0)));Assert.That(view.pose.transform.localScale.x,Is.EqualTo(.17f).Within(.00001));
                Assert.That(Quaternion.Angle(view.pose.transform.localRotation,Quaternion.Euler(0,0,7)),Is.LessThan(.001));
                Assert.That(label.localPosition,Is.EqualTo(new Vector3(.15f,1.8f,.1f)));Assert.That(label.localScale,Is.EqualTo(Vector3.one*.8f));
            }
            finally{UnityEngine.Object.DestroyImmediate(view.gameObject);}
        }
        [Test] public void CameraKeepsAuthoredTranslationRotationAndManualSize()
        {
            var rig=bindings.cameraRig;rig.autoFitBounds=false;var camera=rig.GetComponent<Camera>();camera.orthographicSize=12;
            var position=rig.transform.localPosition+new Vector3(.2f,.15f,1);var rotation=Quaternion.Euler(0,0,2);
            rig.transform.localPosition=position;rig.transform.localRotation=rotation;rig.Sample(20);rig.Sample(0);rig.FitBounds();
            Assert.That(Vector3.Distance(rig.transform.localPosition,position),Is.LessThan(.00001));Assert.That(Quaternion.Angle(rig.transform.localRotation,rotation),Is.LessThan(.001));Assert.That(camera.orthographicSize,Is.EqualTo(12));
        }
    }
}
