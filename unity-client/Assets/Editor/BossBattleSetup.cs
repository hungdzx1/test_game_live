using System;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using TuTienLive.Effects;
using TuTienLive.Network;
using TuTienLive.Scenes;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class BossBattleSetup
    {
        public const string Art="Assets/Art/Boss/";
        [MenuItem("Tu Tien LIVE/Concept 02/Add shared boss battle")]
        public static void AddToCurrentScene(){var fx=Install();EditorSceneManager.MarkSceneDirty(fx.gameObject.scene);Selection.activeGameObject=fx.gameObject;}
        public static BossBattlePresenter Install()
        {
            var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();
            if(!b||b.gameObject.scene.path!=Concept02SceneSetup.ScenePath)throw new InvalidOperationException("Open Concept02 first.");
            var existing=UnityEngine.Object.FindObjectsByType<BossBattlePresenter>(FindObjectsInactive.Include);
            if(existing.Length>1)throw new InvalidOperationException("Duplicate boss presenter.");if(existing.Length==1)return existing[0];
            foreach(var file in new[]{"Boss_1","Boss_2","Boss_3","in4_boss_1","in4_boss_2","in4_boss_3","fill_hp"})
            {
                var importer=AssetImporter.GetAtPath(Art+file+".png") as TextureImporter;if(!importer)throw new InvalidOperationException("Missing supplied boss art: "+file);
                // Keep the six existing slice rectangles, names, IDs and pivots exactly as authored.
                importer.alphaIsTransparency=true;importer.mipmapEnabled=false;importer.npotScale=TextureImporterNPOTScale.None;
                importer.maxTextureSize=file.StartsWith("Boss_")?2048:4096;importer.textureCompression=TextureImporterCompression.Uncompressed;
                importer.filterMode=FilterMode.Bilinear;importer.wrapMode=TextureWrapMode.Clamp;importer.SaveAndReimport();
            }
            var go=new GameObject("BossBattlePresenter");go.transform.SetParent(b.groups[7],false);
            var fx=go.AddComponent<BossBattlePresenter>();fx.network=b.network;fx.characters=b.characters;fx.podium=b.tribulation.platformSeat;
            fx.boss1Frames=Frames(1);fx.boss2Frames=Frames(2);fx.boss3Frames=Frames(3);
            var body=new GameObject("SharedBossSprite");body.transform.SetParent(b.groups[4],false);fx.body=body.AddComponent<SpriteRenderer>();
            fx.body.sprite=fx.boss1Frames[0];fx.body.sortingLayerID=b.characters.characterPrefab.pose.Body.sortingLayerID;fx.body.sortingOrder=100;
            body.transform.position=fx.podium.position+Vector3.up*(fx.bossHeight*.48f);
            body.transform.localScale=Vector3.one*(fx.bossHeight/(fx.body.sprite.rect.height/fx.body.sprite.pixelsPerUnit));fx.body.enabled=false;
            var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();
            var canvas=hud.GetComponent<Canvas>();var root=Rect(canvas.transform,"BossInformation",new Vector2(18,-235),new Vector2(520,520f/3));
            root.anchorMin=root.anchorMax=new Vector2(.5f,1);
            fx.information=root.gameObject.AddComponent<CanvasGroup>();fx.information.alpha=0;fx.information.blocksRaycasts=false;fx.information.interactable=false;
            fx.informationFrame=Rect(root,"BossFrame",Vector2.zero,root.sizeDelta).gameObject.AddComponent<RawImage>();fx.informationFrame.raycastTarget=false;
            fx.informationFrames=Enumerable.Range(1,3).Select(i=>AssetDatabase.LoadAssetAtPath<Texture2D>(Art+"in4_boss_"+i+".png")).ToArray();fx.informationFrame.texture=fx.informationFrames[0];
            // The supplied fill is a full-size transparent atlas. Crop only its red bar, preserving left anchoring.
            const float x=660,y=400,width=1308,height=78;float unit=520f/2172;
            fx.fullFillWidth=width*unit;fx.fillUv=new Rect(x/2172,1-(y+height)/724,width/2172,height/724);
            var fillRect=Rect(root,"BossHPFill",new Vector2((x-1086)*unit,(362-y-height/2)*unit),new Vector2(fx.fullFillWidth,height*unit));fillRect.pivot=new Vector2(0,.5f);
            fx.hpFill=fillRect.gameObject.AddComponent<RawImage>();fx.hpFill.texture=AssetDatabase.LoadAssetAtPath<Texture2D>(Art+"fill_hp.png");fx.hpFill.uvRect=fx.fillUv;fx.hpFill.raycastTarget=false;
            var label=Rect(root,"BossHPValue",new Vector2((x+width/2-1086)*unit,(362-y-height/2)*unit),new Vector2(fx.fullFillWidth,27));
            fx.hpLabel=label.gameObject.AddComponent<TextMeshProUGUI>();fx.hpLabel.font=AssetDatabase.LoadAssetAtPath<TMP_FontAsset>("Assets/SceneAuthoring/Nameplate SDF.asset");
            fx.hpLabel.fontSize=18;fx.hpLabel.fontStyle=FontStyles.Bold;fx.hpLabel.color=new Color(1,.97f,.82f);fx.hpLabel.alignment=TextAlignmentOptions.Center;fx.hpLabel.richText=false;fx.hpLabel.raycastTarget=false;fx.hpLabel.text="";
            var shadow=label.gameObject.AddComponent<Shadow>();shadow.effectColor=new Color(0,0,0,.9f);shadow.effectDistance=new Vector2(1,-1);
            fx.energyWidgets=new Graphic[]{hud.energyTitle,hud.energyLabel,hud.energyFill,hud.transform.Find("Header/ProgressFrame").GetComponent<RawImage>()};fx.Hide();return fx;
        }
        private static Sprite[] Frames(int index)
        {
            var frames=AssetDatabase.LoadAllAssetsAtPath(Art+"Boss_"+index+".png").OfType<Sprite>().OrderBy(s=>int.Parse(s.name.Substring(s.name.LastIndexOf('_')+1))).ToArray();
            if(frames.Length!=6)throw new InvalidOperationException("Expected exactly six supplied boss frames.");return frames;
        }
        private static RectTransform Rect(Transform parent,string name,Vector2 position,Vector2 size)
        {
            var rect=new GameObject(name,typeof(RectTransform)).GetComponent<RectTransform>();rect.SetParent(parent,false);
            rect.anchorMin=rect.anchorMax=rect.pivot=new Vector2(.5f,.5f);rect.anchoredPosition=position;rect.sizeDelta=size;return rect;
        }
        public static void UpgradeValidation()
        {
            if(!Application.dataPath.Replace('\\','/').EndsWith("/test-results/unity-concept02/project/Assets",StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Use isolated validation project.");
            var scene=EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);Install();EditorSceneManager.MarkSceneDirty(scene);EditorSceneManager.SaveScene(scene);AssetDatabase.SaveAssets();Debug.Log("SHARED_BOSS_SETUP_PASS");
        }
        public static void Capture()
        {
            EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);var fx=UnityEngine.Object.FindAnyObjectByType<BossBattlePresenter>();fx.enabled=false;fx.network.enabled=false;fx.characters.enabled=false;
            UnityEngine.Object.FindAnyObjectByType<ItemReceiptPresenter>().enabled=false;
            var scene=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();scene.cameraRig.driftEnabled=false;scene.environment.animate=false;scene.environment.quality=SectQuality.High;
            string output=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/Tailieu_output/shared-boss");Directory.CreateDirectory(output);var report=new JArray();
            foreach(var name in new[]{"boss1","half","boss2","boss3","paused","cultivation"})
            {
                if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/SharedBoss/"+name+".json"),out var value,out var error))throw new InvalidOperationException(error);
                fx.characters.ApplySnapshot(value.Snapshot,value.SessionId);fx.characters.Sample(0,0);
                var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();hud.Render(value.Snapshot);UnityEngine.Object.FindAnyObjectByType<BlessingPanelHud>().Render(value.Snapshot);
                fx.Sample(value.Snapshot,name=="half"?250:0,.1f);
                foreach(int width in new[]{1080,720})Concept02Verification.CaptureCamera(fx.characters.scene.cameraRig.GetComponent<Camera>(),width,width*16/9,Path.Combine(output,name+"-"+width+".png"),()=>{fx.hpLabel.ForceMeshUpdate();foreach(var view in fx.characters.Views.Values)view.nameLabel.ForceMeshUpdate();});
                report.Add(new JObject{["fixture"]=name,["visible"]=fx.IsVisible,["boss"]=fx.BossIndex,["frame"]=fx.FrameIndex,["fraction"]=fx.HpFraction,["projectiles"]=fx.ProjectileCount,["visibleCharacters"]=fx.characters.Views.Count});
            }
            File.WriteAllText(Path.Combine(output,"capture-report.json"),new JObject{["gpu"]=SystemInfo.graphicsDeviceName,["samples"]=report}.ToString());Debug.Log("SHARED_BOSS_GPU_CAPTURE_PASS "+SystemInfo.graphicsDeviceName);
        }
    }
}
