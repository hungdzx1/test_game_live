using System;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using TuTienLive.Audio;
using TuTienLive.Effects;
using TuTienLive.Network;
using TuTienLive.Scenes;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class BossWarningSetup
    {
        public const string Sounds="Assets/Musics/SFX/Boss/";
        private static readonly Color Accent=new Color(1,.59f,.47f),White=new Color(1,.84f,.72f);
        [MenuItem("Tu Tien LIVE/Concept 02/Add TB02 boss warning")]
        public static void AddToCurrentScene(){var fx=Install();EditorSceneManager.MarkSceneDirty(fx.gameObject.scene);Selection.activeGameObject=fx.gameObject;}
        public static BossWarningPresenter Install()
        {
            var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();
            if(!hud||hud.gameObject.scene.path!=Concept02SceneSetup.ScenePath)throw new InvalidOperationException("Open Concept02 first.");
            var audio=UnityEngine.Object.FindAnyObjectByType<GameAudioManager>();
            audio.bossWarning=Clip("warning-TB02");audio.attackNormal=Clip("attack-normal");audio.attackSkill1=Clip("attack-skill1");audio.attackSkill2=Clip("attack-skill2");
            var existing=hud.transform.Find("TB02_BossWarning");if(existing)return existing.GetComponent<BossWarningPresenter>();
            var root=Rect(hud.transform,"TB02_BossWarning",0,0,1080,1920);var fx=root.gameObject.AddComponent<BossWarningPresenter>();
            fx.network=audio.network;fx.audioManager=audio;fx.cameraRig=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>().cameraRig;
            fx.warning=root.gameObject.AddComponent<CanvasGroup>();fx.warning.alpha=0;fx.warning.interactable=false;fx.warning.blocksRaycasts=false;
            Box(root,"Veil",0,0,1080,1920,new Color(.015f,.015f,.04f,.22f));
            var panel=Rect(root,"HuyetBao",234,393,612,513);var frame=panel.gameObject.AddComponent<GuidePanelGraphic>();
            frame.radius=3;frame.cornerAccents=false;frame.color=new Color(.035f,.008f,.045f,.97f);frame.border=new Color(1,.59f,.47f,.8f);frame.innerBorder=new Color(1,.59f,.47f,.23f);frame.raycastTarget=false;
            Box(panel,"SealTop",126,0,360,2,White);
            Text(panel,"Kicker","HUYẾT BÁO · BOSS SẮP XUẤT HIỆN",26,20,560,28,15,Accent);
            var sigil=Rect(panel,"WarningSigil",238,74,136,136).gameObject.AddComponent<BossWarningSigil>();sigil.color=Accent;sigil.raycastTarget=false;
            Text(panel,"Headline","YÊU KHÍ GIÁNG LÂM",22,228,568,50,36,White,true);
            fx.bossName=Text(panel,"BossName","VUA RỒNG XƯƠNG LAM HỎA",18,288,576,43,26,new Color(1,.94f,.82f),true);
            Text(panel,"Hint","Toàn tông chuẩn bị nghênh chiến!",22,337,568,31,18,new Color(.82f,.76f,.78f));
            fx.countdown=Text(panel,"Countdown","3",236,407,140,48,42,White,true);
            Text(panel,"DashLeft","—",160,407,60,42,28,Accent);Text(panel,"DashRight","—",392,407,60,42,28,Accent);
            Text(panel,"Note","XUẤT HIỆN SAU CẢNH BÁO 3 GIÂY",20,461,572,24,12,Accent);
            Box(panel,"ProgressTrack",44,487,524,4,new Color(.45f,.20f,.24f,.45f));
            fx.progress=Box(panel,"Progress",44,487,524,4,Accent);fx.progress.type=Image.Type.Filled;fx.progress.fillMethod=Image.FillMethod.Horizontal;fx.progress.fillOrigin=0;
            fx.Hide();return fx;
        }
        private static AudioClip Clip(string name){var clip=AssetDatabase.LoadAssetAtPath<AudioClip>(Sounds+name+".wav");if(!clip)throw new InvalidOperationException("Missing generated SFX "+name);return clip;}
        private static RectTransform Rect(Transform p,string name,float x,float y,float w,float h)
        {var r=new GameObject(name,typeof(RectTransform)).GetComponent<RectTransform>();r.SetParent(p,false);r.anchorMin=r.anchorMax=r.pivot=new Vector2(0,1);r.anchoredPosition=new Vector2(x,-y);r.sizeDelta=new Vector2(w,h);return r;}
        private static Image Box(Transform p,string name,float x,float y,float w,float h,Color color){var image=Rect(p,name,x,y,w,h).gameObject.AddComponent<Image>();image.color=color;image.raycastTarget=false;return image;}
        private static TMP_Text Text(Transform p,string name,string value,float x,float y,float w,float h,float size,Color color,bool bold=false)
        {
            var text=Rect(p,name,x,y,w,h).gameObject.AddComponent<TextMeshProUGUI>();text.font=AssetDatabase.LoadAssetAtPath<TMP_FontAsset>("Assets/SceneAuthoring/Nameplate SDF.asset");
            text.fontSize=size;text.fontStyle=bold?FontStyles.Bold:FontStyles.Normal;text.color=color;text.alignment=TextAlignmentOptions.Center;text.richText=false;text.raycastTarget=false;
            text.textWrappingMode=TextWrappingModes.NoWrap;text.overflowMode=TextOverflowModes.Overflow;text.margin=Vector4.zero;text.text=value;return text;
        }
        public static void Setup()
        {
            if(!Application.dataPath.Replace('\\','/').EndsWith("/test-results/unity-concept02/project/Assets",StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Use isolated validation project.");
            foreach(string name in new[]{"warning-TB02","attack-normal","attack-skill1","attack-skill2"})
            {var importer=(AudioImporter)AssetImporter.GetAtPath(Sounds+name+".wav");var settings=importer.defaultSampleSettings;settings.loadType=AudioClipLoadType.DecompressOnLoad;settings.compressionFormat=AudioCompressionFormat.PCM;importer.defaultSampleSettings=settings;importer.forceToMono=true;importer.SaveAndReimport();}
            var scene=EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);Install();EditorSceneManager.MarkSceneDirty(scene);EditorSceneManager.SaveScene(scene);AssetDatabase.SaveAssets();Debug.Log("TB02_SETUP_PASS");
        }
        public static void Capture()
        {
            EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);var fx=UnityEngine.Object.FindAnyObjectByType<BossWarningPresenter>();var boss=UnityEngine.Object.FindAnyObjectByType<BossBattlePresenter>();
            fx.enabled=false;boss.enabled=false;fx.network.enabled=false;boss.characters.enabled=false;
            var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();b.environment.animate=false;b.environment.quality=SectQuality.High;b.cameraRig.driftEnabled=false;
            var idle=UnityEngine.Object.FindAnyObjectByType<IdleCameraPresenter>();if(idle)idle.enabled=false;
            string output=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/Tailieu_output/boss-notice-designs/implemented");Directory.CreateDirectory(output);var samples=new JArray();
            foreach(string name in new[]{"warning1","warning2","warning3","paused","revealed","cultivation"})
            {
                if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/BossWarning/"+name+".json"),out var state,out var error))throw new InvalidOperationException(error);
                boss.characters.ApplySnapshot(state.Snapshot,state.SessionId);boss.characters.Sample(0,0);UnityEngine.Object.FindAnyObjectByType<Concept02Hud>().Render(state.Snapshot);
                UnityEngine.Object.FindAnyObjectByType<BlessingPanelHud>().Render(state.Snapshot);boss.Sample(state.Snapshot,0,0);fx.Sample(state.Snapshot,0);
                foreach(int width in new[]{1080,720})Concept02Verification.CaptureCamera(b.cameraRig.GetComponent<Camera>(),width,width*16/9,Path.Combine(output,name+"-"+width+".png"),()=>{Canvas.ForceUpdateCanvases();foreach(var label in UnityEngine.Object.FindObjectsByType<TextMeshProUGUI>(FindObjectsSortMode.None))label.ForceMeshUpdate();});
                samples.Add(new JObject{["fixture"]=name,["warning"]=fx.IsVisible,["seconds"]=fx.Seconds,["boss"]=boss.IsVisible,["shake"]=b.cameraRig.BossWarningShake.magnitude});
            }
            File.WriteAllText(Path.Combine(output,"capture-report.json"),new JObject{["gpu"]=SystemInfo.graphicsDeviceName,["samples"]=samples}.ToString());Debug.Log("TB02_GPU_CAPTURE_PASS");
        }
    }
}
