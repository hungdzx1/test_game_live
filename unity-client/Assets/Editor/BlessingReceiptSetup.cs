using System;
using System.IO;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using TuTienLive.Effects;
using TuTienLive.Network;
using TuTienLive.Scenes;

namespace TuTienLive.Editor
{
    public static class BlessingReceiptSetup
    {
        public const string ImagePath="Assets/Art/Items/tbao_ban_phuc.png";
        [MenuItem("Tu Tien LIVE/Concept 02/Add blessing receipt effect")]
        public static void AddToCurrentScene()
        {var effect=Install();EditorSceneManager.MarkSceneDirty(effect.gameObject.scene);Selection.activeGameObject=effect.gameObject;}
        public static BlessingReceiptPresenter Install()
        {
            var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();
            if(!b||b.gameObject.scene.path!=Concept02SceneSetup.ScenePath)throw new InvalidOperationException("Open SectScene_Concept02 first.");
            var existing=UnityEngine.Object.FindObjectsByType<BlessingReceiptPresenter>(FindObjectsInactive.Include);
            if(existing.Length>1)throw new InvalidOperationException("Multiple blessing presenters.");if(existing.Length==1)return existing[0];
            var importer=AssetImporter.GetAtPath(ImagePath) as TextureImporter;
            if(!importer)throw new InvalidOperationException("Missing supplied blessing image.");
            importer.textureType=TextureImporterType.Sprite;importer.spriteImportMode=SpriteImportMode.Single;importer.spritePixelsPerUnit=100;
            importer.alphaIsTransparency=true;importer.mipmapEnabled=false;importer.npotScale=TextureImporterNPOTScale.None;
            importer.maxTextureSize=2048;importer.textureCompression=TextureImporterCompression.Uncompressed;importer.wrapMode=TextureWrapMode.Clamp;
            importer.SaveAndReimport();
            var go=new GameObject("BlessingReceiptPresenter");go.transform.SetParent(b.groups[7],false);
            var effect=go.AddComponent<BlessingReceiptPresenter>();effect.network=b.network;effect.cameraRig=b.cameraRig;effect.scene=b.environment;
            var canvas=b.groups[6].GetComponentInChildren<Canvas>(true);if(!canvas)throw new InvalidOperationException("Missing UI canvas.");
            effect.popRoot=Rect(canvas.transform,"BlessingReceiptFX",new Vector2(0,280),new Vector2(620,465));
            effect.visual=effect.popRoot.gameObject.AddComponent<CanvasGroup>();effect.visual.alpha=0;effect.visual.interactable=false;effect.visual.blocksRaycasts=false;
            effect.artwork=Rect(effect.popRoot,"BlessingArtwork",new Vector2(0,24),new Vector2(620,414)).gameObject.AddComponent<Image>();
            effect.artwork.sprite=AssetDatabase.LoadAssetAtPath<Sprite>(ImagePath);effect.artwork.preserveAspect=true;effect.artwork.raycastTarget=false;
            effect.countLabel=Rect(effect.popRoot,"BlessingCount",new Vector2(0,-210),new Vector2(620,56)).gameObject.AddComponent<TextMeshProUGUI>();
            effect.countLabel.font=AssetDatabase.LoadAssetAtPath<TMP_FontAsset>("Assets/SceneAuthoring/Nameplate SDF.asset");
            effect.countLabel.fontSize=38;effect.countLabel.fontStyle=FontStyles.Bold;effect.countLabel.color=new Color(1,.93f,.66f);
            effect.countLabel.alignment=TextAlignmentOptions.Center;effect.countLabel.richText=false;effect.countLabel.raycastTarget=false;effect.countLabel.text="";
            var shadow=effect.countLabel.gameObject.AddComponent<Shadow>();shadow.effectColor=new Color(0,0,0,.9f);shadow.effectDistance=new Vector2(1,-2);
            effect.Hide();return effect;
        }
        private static RectTransform Rect(Transform parent,string name,Vector2 position,Vector2 size)
        {
            var rect=new GameObject(name,typeof(RectTransform)).GetComponent<RectTransform>();rect.SetParent(parent,false);
            rect.anchorMin=rect.anchorMax=rect.pivot=new Vector2(.5f,.5f);rect.anchoredPosition=position;rect.sizeDelta=size;return rect;
        }
        public static void UpgradeValidation()
        {
            if(!Application.dataPath.Replace('\\','/').EndsWith("/test-results/unity-concept02/project/Assets",StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Use isolated validation project.");
            var scene=EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);Install();EditorSceneManager.MarkSceneDirty(scene);EditorSceneManager.SaveScene(scene);AssetDatabase.SaveAssets();
            Debug.Log("BLESSING_RECEIPT_SETUP_PASS");
        }
        public static void Capture()
        {
            EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);
            var fx=UnityEngine.Object.FindAnyObjectByType<BlessingReceiptPresenter>();fx.network.enabled=false;fx.scene.animate=false;fx.scene.cameraRig.driftEnabled=false;
            var items=UnityEngine.Object.FindAnyObjectByType<ItemReceiptPresenter>();items.enabled=false;
            var characters=UnityEngine.Object.FindAnyObjectByType<TuTienLive.Characters.CharacterManager>();characters.enabled=false;
            if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/ItemReceipts/initial.json"),out var initial,out var error))throw new InvalidOperationException(error);
            characters.ApplySnapshot(initial.Snapshot,initial.SessionId);characters.Sample(0,0);fx.ApplySnapshot(initial.Snapshot,initial.SessionId);
            UnityEngine.Object.FindAnyObjectByType<TuTienLive.UI.Concept02Hud>().Render(initial.Snapshot);
            UnityEngine.Object.FindAnyObjectByType<TuTienLive.UI.BlessingPanelHud>().Render(initial.Snapshot);
            var raw=JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/Audio/banphuc.json"));raw["payload"]["count"]=3;
            if(!StateMapper.TryParse(raw.ToString(),out var message,out error))throw new InvalidOperationException(error);
            fx.HandleEvent(message.Event);
            string output=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/Tailieu_output/blessing-receipt");Directory.CreateDirectory(output);
            var report=new JArray();float previous=0;
            foreach(float time in new[]{.1f,.36f,.8f,1.7f,2.05f})
            {
                fx.Advance(time-previous);previous=time;
                string name="blessing-"+time.ToString("0.00",System.Globalization.CultureInfo.InvariantCulture);
                Concept02Verification.CaptureCamera(fx.cameraRig.GetComponent<Camera>(),1080,1920,Path.Combine(output,name+"-1080.png"),()=>fx.countLabel.ForceMeshUpdate());
                if(Mathf.Approximately(time,.8f))Concept02Verification.CaptureCamera(fx.cameraRig.GetComponent<Camera>(),720,1280,Path.Combine(output,name+"-720.png"),()=>fx.countLabel.ForceMeshUpdate());
                report.Add(new JObject{["time"]=time,["visible"]=fx.IsVisible,["alpha"]=fx.visual.alpha,["count"]=fx.Count,["shake"]=fx.cameraRig.BlessingShake.magnitude});
            }
            File.WriteAllText(Path.Combine(output,"capture-report.json"),new JObject{["gpu"]=SystemInfo.graphicsDeviceName,["timeline"]=report}.ToString());
            Debug.Log("BLESSING_RECEIPT_GPU_CAPTURE_PASS "+SystemInfo.graphicsDeviceName);
        }
    }
}
