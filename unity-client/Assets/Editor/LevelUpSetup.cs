using System;
using System.IO;
using Newtonsoft.Json.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Characters;
using TuTienLive.Effects;
using TuTienLive.Network;
using TuTienLive.Scenes;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class LevelUpSetup
    {
        public static readonly string[] Names={"title","magic_circle","golden_aura","energy_ribbons","light_beams","sparkles","arrows","lotus"};
        // Alpha >= 32 bounds from the supplied PNGs, expressed in source pixels from top left.
        private static readonly Rect[] Bounds={new Rect(195,71,1779,534),new Rect(141,739,1249,234),new Rect(130,62,946,1138),new Rect(6,254,1216,681),new Rect(0,0,1,1),new Rect(128,138,1001,1057),new Rect(262,246,978,290),new Rect(77,846,1099,228)};
        private const string Art="Assets/Art/Characters/LVUP/levelup_";
        [MenuItem("Tu Tien LIVE/Concept 02/Add character level up effect")]
        public static void AddToCurrentScene(){var fx=Install();EditorSceneManager.MarkSceneDirty(fx.gameObject.scene);Selection.activeGameObject=fx.gameObject;}
        public static LevelUpPresenter Install()
        {
            var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();
            if(!b||b.gameObject.scene.path!=Concept02SceneSetup.ScenePath)throw new InvalidOperationException("Open Concept02 first.");
            var existing=UnityEngine.Object.FindObjectsByType<LevelUpPresenter>(FindObjectsInactive.Include);
            if(existing.Length>1)throw new InvalidOperationException("Duplicate level-up presenter.");if(existing.Length==1)return existing[0];
            var go=new GameObject("LevelUpPresenter");go.transform.SetParent(b.groups[7],false);var fx=go.AddComponent<LevelUpPresenter>();fx.network=b.network;fx.characters=b.characters;
            for(int i=0;i<Names.Length;i++)
            {
                var path=Art+Names[i]+".png";var importer=AssetImporter.GetAtPath(path) as TextureImporter;
                if(!importer)continue; // The user explicitly permits absent layers.
                importer.textureType=TextureImporterType.Sprite;importer.spriteImportMode=SpriteImportMode.Single;importer.spritePixelsPerUnit=100;
                importer.alphaSource=TextureImporterAlphaSource.FromInput;importer.alphaIsTransparency=true;importer.mipmapEnabled=false;
                importer.npotScale=TextureImporterNPOTScale.None;importer.maxTextureSize=4096;importer.textureCompression=TextureImporterCompression.Uncompressed;
                importer.filterMode=FilterMode.Bilinear;importer.wrapMode=TextureWrapMode.Clamp;
                var settings=new TextureImporterSettings();importer.ReadTextureSettings(settings);settings.spriteMeshType=SpriteMeshType.FullRect;importer.SetTextureSettings(settings);importer.SaveAndReimport();
                fx.layers[i]=AssetDatabase.LoadAssetAtPath<Sprite>(path);var texture=fx.layers[i].texture;var rect=Bounds[i];
                fx.visibleRegions[i]=new Rect(rect.x/texture.width,1-(rect.y+rect.height)/texture.height,rect.width/texture.width,rect.height/texture.height);
            }
            fx.ResetPresentation();return fx;
        }
        public static void UpgradeValidation()
        {
            if(!Application.dataPath.Replace('\\','/').EndsWith("/test-results/unity-concept02/project/Assets",StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Use isolated validation project.");
            var scene=EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);Install();EditorSceneManager.MarkSceneDirty(scene);EditorSceneManager.SaveScene(scene);AssetDatabase.SaveAssets();Debug.Log("LEVELUP_SETUP_PASS");
        }
        private static TuTienLive.Models.Envelope Read(string name)
        {if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/LevelUp/"+name+".json"),out var message,out var error))throw new InvalidOperationException(error);return message;}
        public static void Capture()
        {
            EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);var fx=UnityEngine.Object.FindAnyObjectByType<LevelUpPresenter>();
            fx.enabled=false;fx.network.enabled=false;fx.characters.enabled=false;fx.characters.scene.animate=false;fx.characters.scene.quality=SectQuality.High;
            fx.characters.scene.cameraRig.driftEnabled=false;var camera=fx.characters.scene.cameraRig.GetComponent<Camera>();
            string output=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/Tailieu_output/level-up");Directory.CreateDirectory(output);var report=new JArray();
            foreach(string scenario in new[]{"stage","realm","low"})
            {
                fx.ResetPresentation();var message=Read(scenario=="realm"?"realm-after":"stage-after");
                fx.characters.scene.quality=scenario=="low"?SectQuality.Low:SectQuality.High;
                fx.characters.ApplySnapshot(message.Snapshot,message.SessionId);fx.characters.Sample(0,0);fx.ApplySnapshot(message.Snapshot,message.SessionId);
                var item=Read(scenario=="realm"?"realm":"stage").Event;fx.characters.HandleEvent(item);fx.characters.Sample(0,0);fx.HandleEvent(item);fx.Advance(0);
                UnityEngine.Object.FindAnyObjectByType<Concept02Hud>().Render(message.Snapshot);UnityEngine.Object.FindAnyObjectByType<BlessingPanelHud>().Render(message.Snapshot);
                float previous=0;
                foreach(float time in new[]{.12f,.5f,1.5f,2.1f})
                {
                    fx.Advance(time-previous);previous=time;string name=scenario+"-"+time.ToString("0.00",System.Globalization.CultureInfo.InvariantCulture);
                    Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,name+"-1080.png"));
                    if(time==.5f)Concept02Verification.CaptureCamera(camera,720,1280,Path.Combine(output,name+"-720.png"));
                    report.Add(new JObject{["scenario"]=scenario,["time"]=time,["active"]=fx.ActiveCount,["pooled"]=fx.CreatedCount,["characters"]=fx.characters.Views.Count});
                }
            }
            File.WriteAllText(Path.Combine(output,"capture-report.json"),new JObject{["gpu"]=SystemInfo.graphicsDeviceName,["timeline"]=report}.ToString());Debug.Log("LEVELUP_GPU_CAPTURE_PASS "+SystemInfo.graphicsDeviceName);
        }
    }
}
