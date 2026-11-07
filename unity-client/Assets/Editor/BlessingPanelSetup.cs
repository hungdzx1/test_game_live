using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class BlessingPanelSetup
    {
        public const string ArtRoot=Concept02SceneSetup.ArtRoot+"UI/Blessing/";
        [Serializable] private class Audit{public Entry[] assets;}
        [Serializable] private class Entry{public string file,importPath;public int width,height;public int[] bbox32;}
        private static readonly Color Gold=new Color(1,.88f,.48f),White=new Color(.93f,.97f,1);
        public static void Configure(Concept02Hud hud)
        {
            if(hud.GetComponent<BlessingPanelHud>())return;
            if(hud.transform.Find("BlessingPanel"))throw new InvalidOperationException("BlessingPanel exists; preserve user edits.");
            var audit=JsonUtility.FromJson<Audit>(File.ReadAllText(ArtRoot+"asset-audit.json"));
            var root=Rect(hud.transform,"BlessingPanel",Vector2.zero,new Vector2(340,200));
            root.anchorMin=root.anchorMax=new Vector2(.5f,1);root.anchoredPosition=new Vector2(350,-630);
            Art(root,"Panel","ui_blessing_panel.png",new Vector2(0,-1),new Vector2(326,182),audit);
            Art(root,"Border","ui_blessing_border.png",Vector2.zero,new Vector2(340,200),audit);
            Art(root,"Lotus","ui_blessing_lotus.png",new Vector2(-111,46),new Vector2(72,54),audit);
            Art(root,"Sparkles","ui_blessing_sparkles.png",new Vector2(-111,46),new Vector2(80,76),audit);
            var font=AssetDatabase.LoadAssetAtPath<TMP_FontAsset>("Assets/SceneAuthoring/Nameplate SDF.asset");
            var title=Text(root,"Title","BAN PHÚC",new Vector2(33,57),new Vector2(220,36),27,Gold,font);title.fontStyle=FontStyles.Bold;
            var effect=Text(root,"Effect","x2 tốc độ tu luyện",new Vector2(34,20),new Vector2(230,30),19,White,font);
            Art(root,"TimerPanel","ui_blessing_timer_panel.png",new Vector2(0,-48),new Vector2(296,70),audit);
            Art(root,"Hourglass","ui_blessing_hourglass.png",new Vector2(-93,-38),new Vector2(16,23),audit);
            var timer=Text(root,"Timer","Còn lại: 00:30",new Vector2(19,-38),new Vector2(192,28),20,Gold,font);
            Art(root,"ProgressBackground","ui_blessing_progress_bg.png",new Vector2(0,-66),new Vector2(270,20),audit);
            var fill=Art(root,"ProgressFill","ui_blessing_progress_fill.png",new Vector2(0,-66),new Vector2(263,13),audit);
            fill.rectTransform.pivot=new Vector2(0,.5f);fill.rectTransform.anchoredPosition-=new Vector2(131.5f,0);
            // The requested ornaments PNG is absent. Native UI diamonds supply the concept's two accents.
            foreach(int sign in new[]{-1,1})
            {
                var diamond=Rect(root,sign<0?"BottomOrnament":"TopOrnament",new Vector2(0,sign*96),new Vector2(11,11));
                diamond.localRotation=Quaternion.Euler(0,0,45);var image=diamond.gameObject.AddComponent<Image>();image.color=Gold;image.raycastTarget=false;
                var inner=Rect(diamond,"Center",Vector2.zero,new Vector2(7,7)).gameObject.AddComponent<Image>();inner.color=new Color(.025f,.075f,.13f);inner.raycastTarget=false;
            }
            var view=hud.gameObject.AddComponent<BlessingPanelHud>();view.network=hud.network;view.panel=root.gameObject;view.timerLabel=timer;view.effectLabel=effect;view.progressFill=fill;view.progressWidth=263;view.progressUv=fill.uvRect;
            root.gameObject.SetActive(false);EditorUtility.SetDirty(view);
        }
        private static RectTransform Rect(Transform parent,string name,Vector2 position,Vector2 size)
        {
            var go=new GameObject(name,typeof(RectTransform));go.transform.SetParent(parent,false);var r=(RectTransform)go.transform;
            r.anchorMin=r.anchorMax=r.pivot=new Vector2(.5f,.5f);r.anchoredPosition=position;r.sizeDelta=size;return r;
        }
        private static RawImage Art(Transform parent,string name,string file,Vector2 position,Vector2 size,Audit audit)
        {
            var entry=audit.assets.Single(e=>e.file==file);var b=entry.bbox32;
            float left=Mathf.Max(0,b[0]-8),top=Mathf.Max(0,b[1]-8),right=Mathf.Min(entry.width,b[2]+8),bottom=Mathf.Min(entry.height,b[3]+8);
            var image=Rect(parent,name,position,size).gameObject.AddComponent<RawImage>();image.texture=LoadTexture(entry.importPath);image.raycastTarget=false;
            image.uvRect=new Rect(left/entry.width,1-bottom/entry.height,(right-left)/entry.width,(bottom-top)/entry.height);return image;
        }
        private static TMP_Text Text(Transform parent,string name,string value,Vector2 position,Vector2 size,float fontSize,Color color,TMP_FontAsset font)
        {
            var label=Rect(parent,name,position,size).gameObject.AddComponent<TextMeshProUGUI>();label.font=font;label.text=value;label.fontSize=fontSize;label.fontSizeMax=fontSize;label.fontSizeMin=13;label.enableAutoSizing=true;
            label.richText=false;label.color=color;label.alignment=TextAlignmentOptions.Center;label.textWrappingMode=TextWrappingModes.NoWrap;label.overflowMode=TextOverflowModes.Ellipsis;label.raycastTarget=false;return label;
        }
        private static void Import()
        {
            var audit=JsonUtility.FromJson<Audit>(File.ReadAllText(ArtRoot+"asset-audit.json"));
            foreach(var entry in audit.assets)
            {
                var importer=(TextureImporter)AssetImporter.GetAtPath(entry.importPath);importer.textureType=TextureImporterType.Sprite;importer.textureShape=TextureImporterShape.Texture2D;importer.spriteImportMode=SpriteImportMode.Single;
                importer.spritePixelsPerUnit=100;importer.sRGBTexture=true;importer.alphaIsTransparency=true;importer.alphaSource=TextureImporterAlphaSource.FromInput;
                importer.mipmapEnabled=false;importer.isReadable=false;importer.npotScale=TextureImporterNPOTScale.None;importer.maxTextureSize=4096;importer.textureCompression=TextureImporterCompression.Uncompressed;importer.filterMode=FilterMode.Bilinear;importer.wrapMode=TextureWrapMode.Clamp;
                var settings=new TextureImporterSettings();importer.ReadTextureSettings(settings);settings.spriteMeshType=SpriteMeshType.FullRect;settings.spriteAlignment=(int)SpriteAlignment.Center;settings.spritePivot=new Vector2(.5f,.5f);importer.SetTextureSettings(settings);importer.SaveAndReimport();
            }
            AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
        }
        private static Texture2D LoadTexture(string path)
        {
            var texture=AssetDatabase.LoadAssetAtPath<Texture2D>(path);
            if(!texture)throw new InvalidOperationException("Blessing texture unavailable after import: "+path);
            return texture;
        }
        public static void RepairValidationTextures()
        {
            GuardValidation();Import();
            SectSceneSetup.CleanScenes();EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);
            var view=UnityEngine.Object.FindAnyObjectByType<BlessingPanelHud>();
            string[] names={"Panel","Border","Lotus","Sparkles","TimerPanel","Hourglass","ProgressBackground","ProgressFill"};
            string[] files={"panel","border","lotus","sparkles","timer_panel","hourglass","progress_bg","progress_fill"};
            for(int i=0;i<names.Length;i++)
            {
                var image=view.panel.transform.Find(names[i]).GetComponent<RawImage>();var texture=LoadTexture(ArtRoot+"ui_blessing_"+files[i]+".png");image.texture=texture;EditorUtility.SetDirty(image);
                Debug.Log("BLESSING_TEXTURE_BOUND "+names[i]+" "+AssetDatabase.GetAssetPath(texture));
            }
            view.GetComponent<Concept02Hud>().characters.scene.cameraRig.ConfigureViewport(1080,1920);
            EditorSceneManager.MarkSceneDirty(view.gameObject.scene);EditorSceneManager.SaveScene(view.gameObject.scene);AssetDatabase.SaveAssets();Debug.Log("BLESSING_TEXTURE_REPAIR_PASS");
        }
        private static void GuardValidation()
        {
            string expected=Path.Combine(SectSceneSetup.RepositoryRoot(),"test-results/unity-concept02/project/Assets");
            if(!string.Equals(Path.GetFullPath(Application.dataPath),Path.GetFullPath(expected),StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Use isolated validation project.");
        }
        public static void UpgradeValidation()
        {
            GuardValidation();
            Import();SectSceneSetup.CleanScenes();EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);
            var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();Configure(hud);hud.characters.scene.cameraRig.ConfigureViewport(1080,1920);
            EditorSceneManager.MarkSceneDirty(hud.gameObject.scene);EditorSceneManager.SaveScene(hud.gameObject.scene);AssetDatabase.SaveAssets();Debug.Log("BLESSING_PANEL_SETUP_PASS");
        }
    }
}
