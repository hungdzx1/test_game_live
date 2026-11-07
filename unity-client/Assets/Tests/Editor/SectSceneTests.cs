using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Scenes;

namespace TuTienLive.Tests
{
    public sealed class SectSceneTests
    {
        private SectSceneController controller;
        [SetUp] public void Open()
        {
            EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Editable.unity",OpenSceneMode.Single);
            controller=UnityEngine.Object.FindAnyObjectByType<SectSceneController>();Assert.That(controller,Is.Not.Null);
            foreach(var l in controller.layers)l.ApplyLayout();controller.Sample(0);
        }
        [Test] public void ImportsAreByteIdenticalAndSettingsPreserveColors()
        {
            foreach(var group in controller.layers.GroupBy(l=>AssetDatabase.GetAssetPath(l.sourceSprite)))
            {
                string imported=group.Key,relative=imported.Substring("Assets/Art/Sect/".Length),source=Path.Combine(FindRepository(),"public/assets/"+relative);
                Assert.That(File.ReadAllBytes(imported),Is.EqualTo(File.ReadAllBytes(source)),relative);
                var importer=(TextureImporter)AssetImporter.GetAtPath(imported);
                Assert.That(importer.textureType,Is.EqualTo(TextureImporterType.Sprite));Assert.That(importer.spritePixelsPerUnit,Is.EqualTo(100));
                Assert.That(importer.sRGBTexture,Is.True);Assert.That(importer.mipmapEnabled,Is.False);
                Assert.That(importer.textureCompression,Is.EqualTo(TextureImporterCompression.Uncompressed));
                Assert.That(importer.npotScale,Is.EqualTo(TextureImporterNPOTScale.None));Assert.That(importer.filterMode,Is.EqualTo(FilterMode.Bilinear));
                var settings=new TextureImporterSettings();importer.ReadTextureSettings(settings);Assert.That(settings.spriteMeshType,Is.EqualTo(SpriteMeshType.FullRect));
                var texture=group.First().sourceSprite.texture;
                Assert.That(texture.width,Is.EqualTo(importer.GetSourceTextureWidthAndHeightForTest().x));
            }
        }
        [TestCase(1080,1920)][TestCase(720,1280)]
        public void ImportantLayersStayInsideCameraAtEveryDriftPhase(int width,int height)
        {
            var rig=controller.cameraRig;var camera=rig.GetComponent<Camera>();rig.ConfigureViewport(width,height);
            foreach(var time in new[]{0f,10f,20f,45f,60f,120f})
            {
                controller.Sample(time);
                foreach(var layer in controller.layers.Where(l=>l.protectFromClipping))
                {
                    var b=layer.ContentBounds;var min=camera.WorldToViewportPoint(b.min);var max=camera.WorldToViewportPoint(b.max);
                    Assert.That(min.x,Is.GreaterThanOrEqualTo(0),layer.name);Assert.That(min.y,Is.GreaterThanOrEqualTo(0),layer.name);
                    Assert.That(max.x,Is.LessThanOrEqualTo(1),layer.name);Assert.That(max.y,Is.LessThanOrEqualTo(1),layer.name);
                }
            }
        }
        [Test] public void ArchitecturePerspectiveAndSortingArePreserved()
        {
            var court=controller.layers.Single(l=>l.name.StartsWith("Main courtyard"));
            var platform=controller.layers.Single(l=>l.name=="Breakthrough platform");
            foreach(var layer in controller.layers.Where(l=>AssetDatabase.GetAssetPath(l.sourceSprite).Contains("Architecture layers")))
            {Assert.That(layer.verticalScale,Is.EqualTo(1));Assert.That(layer.transform.localRotation,Is.EqualTo(Quaternion.identity));}
            Assert.That(platform.ContentBounds.center.y,Is.GreaterThan(court.ContentBounds.center.y));
            Assert.That(SortingLayer.GetLayerValueFromName("SectPlatform"),Is.LessThan(SortingLayer.GetLayerValueFromName("SectGround")));
            Assert.That(SortingLayer.GetLayerValueFromName("SectGroundDetail"),Is.LessThan(SortingLayer.GetLayerValueFromName("SectCharacters")));
            Assert.That(controller.layers.Single(l=>l.name.StartsWith("Formation base")).verticalScale,Is.EqualTo(.35f));
        }
        [Test] public void QualityReducesEffectsWithoutRemovingCoreScene()
        {
            var counts=Enum.GetValues(typeof(SectQuality)).Cast<SectQuality>().Select(q=>
            {controller.quality=q;controller.Sample(0);Assert.That(controller.layers.Where(l=>l.protectFromClipping).All(l=>l.GetComponent<MeshRenderer>().enabled),Is.True);return controller.layers.Count(l=>l.gameObject.activeInHierarchy&&l.GetComponent<MeshRenderer>().enabled);}).ToArray();
            Assert.That(counts[0],Is.LessThan(counts[1]));Assert.That(counts[1],Is.LessThan(counts[2]));
        }
        [Test] public void AnimationMovesLayersWithoutChangingGeometryOrTint()
        {
            controller.quality=SectQuality.High;controller.Sample(0);
            var meshes=controller.layers.Select(l=>l.GetComponent<MeshFilter>().sharedMesh).ToArray();
            var cloud=controller.layers.Single(l=>l.motion==SectMotion.Cloud);var initial=cloud.transform.position;
            controller.Sample(20);Assert.That(cloud.transform.position,Is.Not.EqualTo(initial));
            for(int i=0;i<meshes.Length;i++)Assert.That(controller.layers[i].GetComponent<MeshFilter>().sharedMesh,Is.SameAs(meshes[i]));
            foreach(var l in controller.layers)
            {var block=new MaterialPropertyBlock();l.GetComponent<MeshRenderer>().GetPropertyBlock(block);var c=block.GetColor("_Color");Assert.That(c.r,Is.EqualTo(1));Assert.That(c.g,Is.EqualTo(1));Assert.That(c.b,Is.EqualTo(1));}
        }
        [Test] public void InspectorAnchorAndBoundsFitWorkAfterMovingLayer()
        {
            var layer=controller.layers.Single(l=>l.name=="Breakthrough platform");layer.transform.localPosition=new Vector3(6.6f,3.1f,8);layer.ApplyLayout();
            controller.Sample(0);controller.cameraRig.FitBounds();
            var max=controller.cameraRig.GetComponent<Camera>().WorldToViewportPoint(layer.ContentBounds.max);Assert.That(max.x,Is.LessThan(1));
            Assert.That(controller.cameraRig.RequiredHalfHeight,Is.GreaterThan(9.6f));
        }
        [Test] public void SceneMoveUpdatesLayoutAndSupportsUndoRedo()
        {
            var layer=controller.layers.Single(l=>l.name=="Temple");
            var before=layer.transform.position;
            var editorType=AppDomain.CurrentDomain.GetAssemblies().Select(a=>a.GetType("TuTienLive.Editor.SectLayerEditor")).First(t=>t!=null);
            Undo.IncrementCurrentGroup();
            editorType.GetMethod("MoveLayers").Invoke(null,new object[]{new UnityEngine.Object[]{layer},new Vector3(1,-.5f,3)});
            Undo.FlushUndoRecordObjects();
            controller.Sample(20);controller.Sample(0);
            Assert.That(layer.transform.position,Is.EqualTo(before+new Vector3(1,-.5f,3)));
            Undo.PerformUndo();controller.Sample(0);
            Assert.That(layer.transform.position,Is.EqualTo(before));
            Undo.PerformRedo();controller.Sample(0);
            Assert.That(layer.transform.position,Is.EqualTo(before+new Vector3(1,-.5f,3)));
            Undo.ClearAll();
        }
        [Test] public void HudTextFitsItsReservedArea()
        {
            controller.cameraRig.ConfigureViewport(1080,1920);var camera=controller.cameraRig.GetComponent<Camera>();
            foreach(var layout in UnityEngine.Object.FindObjectsByType<SectTextLayout>())
            {
                var text=layout.GetComponent<TextMesh>();text.font.RequestCharactersInTexture(text.text,text.fontSize,FontStyle.Normal);layout.Fit();
                if(string.IsNullOrEmpty(text.text))continue;
                var b=layout.GetComponent<MeshRenderer>().bounds;
                Assert.That(b.size.x,Is.GreaterThan(0));Assert.That(b.size.x*100,Is.LessThanOrEqualTo(layout.maximumSizePixels.x+.05f));
                Assert.That(b.size.y*100,Is.LessThanOrEqualTo(layout.maximumSizePixels.y+.05f));
                var min=camera.WorldToViewportPoint(b.min);var max=camera.WorldToViewportPoint(b.max);
                Assert.That(min.x,Is.GreaterThanOrEqualTo(0),text.name);Assert.That(min.y,Is.GreaterThanOrEqualTo(0),text.name);
                Assert.That(max.x,Is.LessThanOrEqualTo(1),text.name);Assert.That(max.y,Is.LessThanOrEqualTo(1),text.name);
            }
        }
        [TestCase(16f/9)][TestCase(1f)][TestCase(9f/20)]
        public void OtherWindowsLetterboxWithoutDistortingPortrait(float aspect)
        {var r=CameraRig.PortraitRect(aspect);Assert.That(r.width*aspect/r.height,Is.EqualTo(9f/16).Within(.0001));Assert.That(r.xMin,Is.GreaterThanOrEqualTo(0));Assert.That(r.yMin,Is.GreaterThanOrEqualTo(0));}
        private static string FindRepository()
        {var d=new DirectoryInfo(Application.dataPath);while(d!=null){if(File.Exists(Path.Combine(d.FullName,"server.js")))return d.FullName;d=d.Parent;}throw new DirectoryNotFoundException();}
    }
    internal static class TextureImportTestExtensions
    {
        public static Vector2Int GetSourceTextureWidthAndHeightForTest(this TextureImporter importer)
        {importer.GetSourceTextureWidthAndHeight(out int width,out int height);return new Vector2Int(width,height);}
    }
}
