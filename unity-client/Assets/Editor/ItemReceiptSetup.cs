using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using TuTienLive.Effects;
using TuTienLive.Scenes;
using TuTienLive.Network;

namespace TuTienLive.Editor
{
    public static class ItemReceiptSetup
    {
        private static readonly string[] Files={"tra_ngo_dao","do_kiep_dan","bien_di_linh_can"};
        [MenuItem("Tu Tien LIVE/Concept 02/Add item receipt effects")]
        public static void AddToCurrentScene()
        {
            var effect=Install();EditorSceneManager.MarkSceneDirty(effect.gameObject.scene);Selection.activeGameObject=effect.gameObject;
        }
        public static ItemReceiptPresenter Install()
        {
            var existing=UnityEngine.Object.FindObjectsByType<ItemReceiptPresenter>(FindObjectsInactive.Include);
            if(existing.Length>1)throw new InvalidOperationException("Multiple item receipt presenters.");
            if(existing.Length==1)return existing[0];
            var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();
            if(!b||b.gameObject.scene.path!=Concept02SceneSetup.ScenePath)throw new InvalidOperationException("Open SectScene_Concept02 first.");
            foreach(var file in Files)
            {
                var importer=AssetImporter.GetAtPath("Assets/Art/Items/"+file+".png") as TextureImporter;
                if(!importer)throw new InvalidOperationException("Missing supplied item image: "+file);
                importer.textureType=TextureImporterType.Sprite;importer.spriteImportMode=SpriteImportMode.Single;importer.spritePixelsPerUnit=100;
                importer.alphaIsTransparency=true;importer.mipmapEnabled=false;importer.npotScale=TextureImporterNPOTScale.None;
                importer.maxTextureSize=4096;importer.textureCompression=TextureImporterCompression.Uncompressed;
                importer.wrapMode=TextureWrapMode.Clamp;importer.filterMode=FilterMode.Bilinear;
                var settings=new TextureImporterSettings();importer.ReadTextureSettings(settings);settings.spriteMeshType=SpriteMeshType.FullRect;
                settings.spriteAlignment=(int)SpriteAlignment.Center;settings.spritePivot=new Vector2(.5f,.5f);importer.SetTextureSettings(settings);importer.SaveAndReimport();
            }
            var go=new GameObject("ItemReceiptPresenter");go.transform.SetParent(b.groups[7],false);
            var effect=go.AddComponent<ItemReceiptPresenter>();effect.network=b.network;effect.characters=b.characters;effect.cameraRig=b.cameraRig;
            effect.tea=Sprite(Files[0]);effect.pill=Sprite(Files[1]);effect.root=Sprite(Files[2]);
            effect.waitForTribulation=false;effect.mergeReceipts=true;
            var canvas=b.groups[6].GetComponentInChildren<Canvas>(true);if(!canvas)throw new InvalidOperationException("Missing scene UI canvas.");
            effect.canvas=canvas;
            effect.visualRoot=Rect(canvas.transform,"ItemReceiptFX",Vector2.zero,new Vector2(240,240));
            effect.visual=effect.visualRoot.gameObject.AddComponent<CanvasGroup>();effect.visual.alpha=0;effect.visual.interactable=false;effect.visual.blocksRaycasts=false;
            effect.iconTransform=Rect(effect.visualRoot,"IconPop",Vector2.zero,new Vector2(120,120));
            effect.glow=Graphic(effect.iconTransform,"Glow",new Color(1,.85f,.4f,.22f));
            effect.icon=Graphic(effect.iconTransform,"ItemIcon",Color.white);
            var text=Rect(effect.visualRoot,"ItemNameCount",new Vector2(0,105),new Vector2(280,64));
            effect.label=text.gameObject.AddComponent<TextMeshProUGUI>();effect.label.font=AssetDatabase.LoadAssetAtPath<TMP_FontAsset>("Assets/SceneAuthoring/Nameplate SDF.asset");
            effect.label.fontSize=25;effect.label.fontStyle=FontStyles.Bold;effect.label.color=new Color(1,.93f,.69f);
            effect.label.alignment=TextAlignmentOptions.Center;effect.label.richText=false;effect.label.raycastTarget=false;effect.label.text="";
            var shadow=text.gameObject.AddComponent<Shadow>();shadow.effectColor=new Color(0,0,0,.9f);shadow.effectDistance=new Vector2(1,-2);
            return effect;
        }
        private static Sprite Sprite(string name)=>AssetDatabase.LoadAssetAtPath<Sprite>("Assets/Art/Items/"+name+".png");
        private static RectTransform Rect(Transform parent,string name,Vector2 position,Vector2 size)
        {
            var rect=new GameObject(name,typeof(RectTransform)).GetComponent<RectTransform>();rect.SetParent(parent,false);
            rect.anchorMin=rect.anchorMax=rect.pivot=new Vector2(.5f,.5f);rect.anchoredPosition=position;rect.sizeDelta=size;return rect;
        }
        private static Image Graphic(Transform parent,string name,Color tint)
        {
            var image=Rect(parent,name,Vector2.zero,new Vector2(120,120)).gameObject.AddComponent<Image>();image.color=tint;image.preserveAspect=true;image.raycastTarget=false;return image;
        }
        public static void UpgradeValidation()
        {
            if(!Application.dataPath.Replace('\\','/').EndsWith("/test-results/unity-concept02/project/Assets",StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Use isolated validation project.");
            var scene=EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);Install();EditorSceneManager.MarkSceneDirty(scene);EditorSceneManager.SaveScene(scene);AssetDatabase.SaveAssets();
            Debug.Log("ITEM_RECEIPT_SETUP_PASS");
        }
        public static void Capture()
        {
            EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);
            var effect=UnityEngine.Object.FindAnyObjectByType<ItemReceiptPresenter>();effect.enabled=false;effect.network.enabled=false;effect.characters.enabled=false;
            if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/ItemReceipts/initial.json"),out var state,out var error))throw new InvalidOperationException(error);
            effect.characters.ApplySnapshot(state.Snapshot,state.SessionId);effect.characters.Sample(0,0);effect.ApplySnapshot(state.Snapshot,state.SessionId);
            UnityEngine.Object.FindAnyObjectByType<TuTienLive.UI.Concept02Hud>().Render(state.Snapshot);
            UnityEngine.Object.FindAnyObjectByType<TuTienLive.UI.BlessingPanelHud>().Render(state.Snapshot);
            var camera=effect.cameraRig.GetComponent<Camera>();var original=camera.transform.position;float half=camera.orthographicSize;
            string output=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/Tailieu_output/item-receipts");Directory.CreateDirectory(output);
            var report=new Newtonsoft.Json.Linq.JArray();
            foreach(var item in new[]{"tea","pill","root"})
            {
                if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/ItemReceipts/"+item+".json"),out var receipt,out error))throw new InvalidOperationException(error);
                effect.HandleEvent(receipt.Event);
                foreach(float time in new[]{0f,.4f,.8f,1.2f,1.7f,2.6f,3f})
                {
                    effect.Advance(time-effect.Elapsed);effect.characters.Sample(0,0);
                    if(item=="tea"||Mathf.Approximately(time,1.2f))
                        Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,item+"-"+time.ToString("0.0",System.Globalization.CultureInfo.InvariantCulture)+".png"),()=>{effect.Advance(0);effect.label.ForceMeshUpdate();foreach(var character in effect.characters.Views.Values)character.nameLabel.ForceMeshUpdate();});
                    if(item=="tea")report.Add(new Newtonsoft.Json.Linq.JObject{["time"]=time,["orthographicSize"]=camera.orthographicSize,["iconAlpha"]=effect.visual.alpha,["count"]=effect.ActiveCount});
                }
                if(Vector3.Distance(camera.transform.position,original)>.001f||Mathf.Abs(camera.orthographicSize-half)>.001f)throw new InvalidOperationException("Camera did not return to authored pose.");
            }
            File.WriteAllText(Path.Combine(output,"capture-report.json"),new Newtonsoft.Json.Linq.JObject{["result"]="PASS",["gpu"]=SystemInfo.graphicsDeviceName,["timeline"]=report,["cameraRestored"]=true}.ToString());
            Debug.Log("ITEM_RECEIPT_GPU_CAPTURE_PASS "+SystemInfo.graphicsDeviceName);
        }
    }
}
