using System;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using TuTienLive.UI;
using TuTienLive.Scenes;
using TuTienLive.Network;

namespace TuTienLive.Editor
{
    public static class K01GuideSetup
    {
        public const string RootName="K01_PlayGuide",Art="Assets/Art/K01Guide/";
        private static readonly Color Gold=new Color(.97f,.84f,.48f),White=new Color(.96f,.92f,.84f),Muted=new Color(.76f,.78f,.78f),Line=new Color(.81f,.68f,.35f,.23f);
        private static TMP_FontAsset Font=>AssetDatabase.LoadAssetAtPath<TMP_FontAsset>("Assets/SceneAuthoring/Nameplate SDF.asset");
        [MenuItem("Tu Tien LIVE/Concept 02/Add K01 play guide")]
        public static void AddToCurrentScene(){var root=Install();EditorSceneManager.MarkSceneDirty(root.gameObject.scene);Selection.activeGameObject=root.gameObject;}
        public static RectTransform Install()
        {
            var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();
            if(!hud||hud.gameObject.scene.path!=Concept02SceneSetup.ScenePath)throw new InvalidOperationException("Open Concept02 first.");
            var existing=hud.transform.Find(RootName);if(existing)return (RectTransform)existing;
            if(!Font)throw new InvalidOperationException("Missing existing scene font.");
            var root=Rect(hud.transform,RootName,12,322,436,611);ApplyCompactLayout(root);root.SetSiblingIndex(0);
            var group=root.gameObject.AddComponent<CanvasGroup>();group.interactable=false;group.blocksRaycasts=false;
            var guide=Panel(root,"Instructions",0,0,436,382);
            Header(guide,"HƯỚNG DẪN NHẬP MÔN",20);
            Box(guide,"JoinCommandBackground",17,45,116,30,new Color(.82f,.71f,.35f,.10f));
            Text(guide,"JoinCommand","nhập môn",20,45,110,30,19,Gold,TextAlignmentOptions.Center,true);
            Text(guide,"JoinHelp","Gia nhập tông môn",147,45,270,30,19,White);
            Text(guide,"BossLabel","BÌNH LUẬN KHI ĐÁNH BOSS",17,82,402,19,12,Muted).characterSpacing=1;
            Skill(guide,1,"Kiếm khí trảm","×2 ST",105);Skill(guide,2,"Thiên long quyết","×3 ST",135);
            Rule(guide,"HeartDivider",17,169,402);
            Symbol(guide,"Heart",18,183,22,23,GuidePanelGraphic.Shape.Heart);
            Text(guide,"HeartTitle","THẢ TIM",48,177,355,19,13,Gold,TextAlignmentOptions.Left,true);
            Text(guide,"HeartHelp","Tăng cấp tông môn & tu vi bản thân",48,197,367,24,17,White);
            Box(guide,"BlessingHighlight",17,227,402,57,new Color(.82f,.71f,.35f,.10f));
            Symbol(guide,"BlessingStar",27,244,20,23,GuidePanelGraphic.Shape.Star);
            Text(guide,"BlessingHelp","Tông môn lên cấp nhận <b>Ban Phúc</b>",55,231,352,23,16,White).richText=true;
            Text(guide,"BlessingEffect","×2 tốc độ tu luyện · 30 giây / lượt",55,254,352,23,17,Gold);
            Rule(guide,"ItemsDivider",17,294,402);
            Effect(guide,"Tea","Trà ngộ đạo","×2 tu luyện · 60 giây",300);
            Effect(guide,"Pill","Độ kiếp đan","+10% tỉ lệ độ kiếp",325);
            Effect(guide,"Root","Biến dị linh căn","×3 tu luyện · vĩnh viễn",350);
            var gifts=Panel(root,"GiftTable",0,392,436,219);Header(gifts,"TẶNG QUÀ · NHẬN TIÊN DUYÊN",17);
            Gift(gifts,0,"Hoa hồng","1 xu","1xu.jpg",new Rect(.24f,.34f,.52f,.49f),"Trà ngộ đạo","tra_ngo_dao");
            Gift(gifts,1,"Cỏ bốn lá","10 xu","10xu.jpg",new Rect(.22f,.38f,.57f,.52f),"Độ kiếp đan","do_kiep_dan");
            Gift(gifts,2,"Má hồng nhỏ xinh","20 xu","20xu.jpg",new Rect(.18f,.39f,.63f,.54f),"Biến dị linh căn","bien_di_linh_can");
            int y=36+3*43;Symbol(gifts,"BlessingPriceDiamond",26,y+12,17,17,GuidePanelGraphic.Shape.Diamond);
            Text(gifts,"BlessingPrice",">50 xu",62,y+2,145,23,15,White,TextAlignmentOptions.Left,true);
            Text(gifts,"BlessingPriceHelp","Quà tặng",62,y+23,145,17,12,Muted);
            Symbol(gifts,"BlessingArrow",217,y+15,17,12,GuidePanelGraphic.Shape.Arrow);
            Text(gifts,"BlessingReward","Ban Phúc",249,y+2,142,23,15,White,TextAlignmentOptions.Left,true);
            Text(gifts,"BlessingScope","Cho toàn tông môn",249,y+23,150,17,12,Muted);
            Symbol(gifts,"BlessingRewardStar",390,y+9,27,29,GuidePanelGraphic.Shape.Star);
            return root;
        }
        public static void ApplyCompactLayout(RectTransform root)
        {root.anchoredPosition=new Vector2(12,-322);root.localScale=new Vector3(.9f,.9f,1);}
        private static RectTransform Panel(Transform parent,string name,float x,float y,float w,float h)
        {var r=Rect(parent,name,x,y,w,h);var frame=r.gameObject.AddComponent<GuidePanelGraphic>();frame.color=new Color(.026f,.10f,.18f,.97f);frame.raycastTarget=false;return r;}
        private static void Header(RectTransform parent,string value,float size)
        {
            Box(parent,"HeaderTint",1,1,434,35,new Color(.85f,.73f,.38f,.08f));Rule(parent,"HeaderDivider",1,36,434);
            Text(parent,"Title",value,34,2,368,32,size,Gold,TextAlignmentOptions.Center,true);
            Symbol(parent,"TitleStarLeft",17,13,10,12,GuidePanelGraphic.Shape.Star);Symbol(parent,"TitleStarRight",409,13,10,12,GuidePanelGraphic.Shape.Star);
        }
        private static void Skill(Transform p,int key,string title,string damage,float y)
        {Box(p,"Skill"+key+"KeyBackground",17,y,26,26,new Color(.82f,.71f,.35f,.13f));Text(p,"Skill"+key+"Key",key.ToString(),17,y,26,26,19,Gold,TextAlignmentOptions.Center,true);Text(p,"Skill"+key+"Name",title,56,y,285,26,19,White);Text(p,"Skill"+key+"Damage",damage,342,y,77,26,19,Gold,TextAlignmentOptions.Right,true);}
        private static void Effect(Transform p,string id,string name,string effect,float y)
        {Text(p,id+"Name",name,17,y,171,25,16,White);Text(p,id+"Effect",effect,182,y,237,25,16,Gold,TextAlignmentOptions.Right,true);}
        private static void Gift(Transform parent,int index,string name,string price,string file,Rect uv,string reward,string item)
        {
            float y=36+index*43;var icon=Rect(parent,"Gift"+index+"Icon",14,y+3,37,37).gameObject.AddComponent<RawImage>();icon.texture=AssetDatabase.LoadAssetAtPath<Texture2D>(Art+file);if(!icon.texture)throw new InvalidOperationException("Missing local gift art: "+file);icon.uvRect=uv;icon.raycastTarget=false;
            Text(parent,"Gift"+index+"Name",name,62,y+1,149,23,15,White,TextAlignmentOptions.Left,true);Text(parent,"Gift"+index+"Price",price,62,y+23,140,17,12,Muted);
            Symbol(parent,"Gift"+index+"Arrow",217,y+15,17,12,GuidePanelGraphic.Shape.Arrow);
            Text(parent,"Gift"+index+"Reward",reward,249,y,143,43,15,White,TextAlignmentOptions.Left,true);
            var image=Rect(parent,"Gift"+index+"RewardIcon",388,y+4,34,34).gameObject.AddComponent<Image>();image.sprite=AssetDatabase.LoadAssetAtPath<Sprite>("Assets/Art/Items/"+item+".png");image.preserveAspect=true;image.raycastTarget=false;
            if(!image.sprite)throw new InvalidOperationException("Missing supplied item sprite: "+item);Rule(parent,"Gift"+index+"Divider",14,y+43,408);
        }
        private static RectTransform Rect(Transform p,string name,float x,float y,float w,float h)
        {var r=new GameObject(name,typeof(RectTransform)).GetComponent<RectTransform>();r.SetParent(p,false);r.anchorMin=r.anchorMax=r.pivot=new Vector2(0,1);r.anchoredPosition=new Vector2(x,-y);r.sizeDelta=new Vector2(w,h);return r;}
        private static TMP_Text Text(Transform parent,string name,string text,float x,float y,float w,float h,float size,Color tint,TextAlignmentOptions align=TextAlignmentOptions.Left,bool bold=false)
        {var t=Rect(parent,name,x,y,w,h).gameObject.AddComponent<TextMeshProUGUI>();t.font=Font;t.fontSize=size;t.color=tint;t.alignment=align;t.fontStyle=bold?FontStyles.Bold:FontStyles.Normal;t.richText=false;t.raycastTarget=false;t.textWrappingMode=TextWrappingModes.NoWrap;t.overflowMode=TextOverflowModes.Overflow;t.margin=Vector4.zero;t.text=text;return t;}
        private static void Box(Transform p,string name,float x,float y,float w,float h,Color tint){var image=Rect(p,name,x,y,w,h).gameObject.AddComponent<Image>();image.color=tint;image.raycastTarget=false;}
        private static void Rule(Transform p,string name,float x,float y,float w)=>Box(p,name,x,y,w,1,Line);
        private static void Symbol(Transform p,string name,float x,float y,float w,float h,GuidePanelGraphic.Shape shape){var g=Rect(p,name,x,y,w,h).gameObject.AddComponent<GuidePanelGraphic>();g.shape=shape;g.color=Gold;g.raycastTarget=false;}
        public static void UpgradeValidation()
        {
            if(!Application.dataPath.Replace('\\','/').EndsWith("/test-results/unity-concept02/project/Assets",StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Use isolated validation project.");
            foreach(var file in new[]{"1xu.jpg","10xu.jpg","20xu.jpg"})
            {var importer=AssetImporter.GetAtPath(Art+file) as TextureImporter;if(!importer)throw new InvalidOperationException(file);importer.textureType=TextureImporterType.Default;importer.textureShape=TextureImporterShape.Texture2D;importer.mipmapEnabled=false;importer.npotScale=TextureImporterNPOTScale.None;importer.textureCompression=TextureImporterCompression.Uncompressed;importer.maxTextureSize=1024;importer.wrapMode=TextureWrapMode.Clamp;importer.SaveAndReimport();}
            var scene=EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);var root=Install();
            // Upgrade the disposable first preview too; RequireComponent applies on new components.
            foreach(var graphic in root.GetComponentsInChildren<GuidePanelGraphic>(true)){if(!graphic.GetComponent<CanvasRenderer>())graphic.gameObject.AddComponent<CanvasRenderer>();if(graphic.shape==GuidePanelGraphic.Shape.Panel)graphic.color=new Color(.026f,.10f,.18f,.97f);graphic.SetAllDirty();}
            EditorSceneManager.MarkSceneDirty(scene);EditorSceneManager.SaveScene(scene);Debug.Log("K01_SETUP_PASS");
        }
        public static void Capture()
        {
            EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();
            b.network.enabled=false;b.characters.enabled=false;b.environment.animate=false;b.cameraRig.driftEnabled=false;
            foreach(var effect in UnityEngine.Object.FindObjectsByType<TuTienLive.Effects.IdleCameraPresenter>(FindObjectsInactive.Include))effect.enabled=false;
            if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/Qua78/initial.json"),out var state,out var error))throw new InvalidOperationException(error);
            b.characters.scene.quality=SectQuality.High;b.characters.ApplySnapshot(state.Snapshot,state.SessionId);b.characters.Sample(0,0);hud.Render(state.Snapshot);UnityEngine.Object.FindAnyObjectByType<BlessingPanelHud>().Render(state.Snapshot);
            var camera=b.cameraRig.GetComponent<Camera>();string output=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/Tailieu_output/khung-01/implemented");Directory.CreateDirectory(output);
            var root=(RectTransform)hud.transform.Find(RootName);var report=new JArray();
            foreach(int width in new[]{1080,720})
            {int height=width*16/9;Concept02Verification.CaptureCamera(camera,width,height,Path.Combine(output,"K01-"+width+".png"),()=>{Canvas.ForceUpdateCanvases();foreach(var text in root.GetComponentsInChildren<TMP_Text>())text.ForceMeshUpdate();});report.Add(new JObject{["width"]=width,["height"]=height,["labels"]=root.GetComponentsInChildren<TMP_Text>().Length,["raycastTargets"]=root.GetComponentsInChildren<Graphic>().Count(g=>g.raycastTarget)});}
            File.WriteAllText(Path.Combine(output,"capture-report.json"),new JObject{["gpu"]=SystemInfo.graphicsDeviceName,["samples"]=report}.ToString());Debug.Log("K01_GPU_CAPTURE_PASS "+SystemInfo.graphicsDeviceName);
        }
    }
}
