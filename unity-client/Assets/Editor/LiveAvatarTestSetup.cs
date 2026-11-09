using System;
using System.IO;
using System.Reflection;
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
    public static class LiveAvatarTestSetup
    {
        public const string RootName="LiveAvatarTest";
        [MenuItem("Tu Tien LIVE/Concept 02/Apply LIVE avatar test")]
        public static void Apply(){Install();EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());}
        public static LiveAvatarTestPresenter Install()
        {
            var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();if(!b||b.gameObject.scene.path!=Concept02SceneSetup.ScenePath)throw new InvalidOperationException("Open Concept02 first.");
            var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();var canvas=hud.GetComponentInParent<Canvas>();var prior=canvas.transform.Find(RootName);if(prior)return prior.GetComponent<LiveAvatarTestPresenter>();
            var root=Rect(canvas.transform,RootName,Vector2.zero,new Vector2(420,156));root.anchorMin=root.anchorMax=root.pivot=new Vector2(1,0);root.anchoredPosition=new Vector2(-24,90);
            var panel=root.gameObject.AddComponent<GuidePanelGraphic>();panel.color=new Color(.02f,.07f,.13f,.97f);panel.raycastTarget=false;
            var view=root.gameObject.AddComponent<CanvasGroup>();view.alpha=0;view.interactable=view.blocksRaycasts=false;
            var title=Text(root,"Title","THỬ AVATAR LIVE",new Vector2(0,60),new Vector2(390,26),18);title.alignment=TextAlignmentOptions.Center;
            var photo=Rect(root,"Avatar",new Vector2(-140,-9),new Vector2(104,104)).gameObject.AddComponent<RawImage>();photo.raycastTarget=false;photo.enabled=false;
            var fallback=Text(root,"AvatarFallback","?",new Vector2(-140,-9),new Vector2(104,104),48);fallback.alignment=TextAlignmentOptions.Center;
            var avatar=root.gameObject.AddComponent<DonorAvatarView>();avatar.portrait=photo;avatar.fallback=fallback;
            var presenter=root.gameObject.AddComponent<LiveAvatarTestPresenter>();presenter.network=b.network;presenter.visual=view;presenter.avatar=avatar;
            presenter.nameLabel=Text(root,"ViewerName","",new Vector2(60,15),new Vector2(272,48),24);
            presenter.statusLabel=Text(root,"LoadStatus","",new Vector2(60,-30),new Vector2(272,46),18);presenter.statusLabel.textWrappingMode=TextWrappingModes.Normal;presenter.Hide();return presenter;
        }
        private static RectTransform Rect(Transform parent,string name,Vector2 position,Vector2 size)
        {var r=new GameObject(name,typeof(RectTransform)).GetComponent<RectTransform>();r.SetParent(parent,false);r.anchorMin=r.anchorMax=r.pivot=new Vector2(.5f,.5f);r.anchoredPosition=position;r.sizeDelta=size;return r;}
        private static TMP_Text Text(Transform p,string name,string value,Vector2 position,Vector2 size,float fontSize)
        {var t=Rect(p,name,position,size).gameObject.AddComponent<TextMeshProUGUI>();t.font=AssetDatabase.LoadAssetAtPath<TMP_FontAsset>("Assets/SceneAuthoring/Nameplate SDF.asset");t.fontSize=fontSize;t.color=new Color(1,.94f,.73f);t.fontStyle=FontStyles.Bold;t.richText=false;t.raycastTarget=false;t.text=value;t.alignment=TextAlignmentOptions.Left;t.textWrappingMode=TextWrappingModes.NoWrap;t.overflowMode=TextOverflowModes.Ellipsis;return t;}
        private static void Guard(){if(!Application.dataPath.Replace('\\','/').EndsWith("/test-results/unity-concept02/project/Assets",StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Use isolated validation project.");}
        public static void Setup(){Guard();var scene=EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);Install();EditorSceneManager.MarkSceneDirty(scene);EditorSceneManager.SaveScene(scene);Debug.Log("LIVE_AVATAR_TEST_SETUP_PASS");}
        private static TuTienLive.Models.Envelope Read(string name)
        {if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/LiveAvatarTest/"+name+".json"),out var e,out var error))throw new InvalidOperationException(error);return e;}
        public static void Capture()
        {
            Guard();EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();var preview=UnityEngine.Object.FindAnyObjectByType<LiveAvatarTestPresenter>();
            b.network.enabled=b.characters.enabled=false;b.environment.animate=false;b.environment.quality=SectQuality.High;b.cameraRig.driftEnabled=false;UnityEngine.Object.FindAnyObjectByType<IdleCameraPresenter>().enabled=false;
            var initial=Read("initial-live");b.characters.ApplySnapshot(initial.Snapshot,initial.SessionId);b.characters.Sample(0,0);UnityEngine.Object.FindAnyObjectByType<Concept02Hud>().Render(initial.Snapshot);preview.ApplySnapshot(initial.Snapshot,initial.SessionId);
            string output=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/Tailieu_output/live-avatar-test");Directory.CreateDirectory(output);var states=new JArray();
            foreach(string mode in new[]{"missing","loading","ready","error"})
            {
                preview.ApplySnapshot(null,"capture:"+mode);preview.ApplySnapshot(initial.Snapshot,"capture:"+mode);preview.HandleEvent(Read(mode=="missing"?"event-missing":"event-url").Event);
                if(mode=="ready")
                {
                    // Synthetic image verifies the shared PNG decoder/UI, never claims a real TikTok download.
                    var texture=new Texture2D(8,8,TextureFormat.RGBA32,false);for(int y=0;y<8;y++)for(int x=0;x<8;x++)texture.SetPixel(x,y,(x+y)%2==0?new Color(.2f,.65f,.9f):new Color(.95f,.75f,.25f));texture.Apply();
                    typeof(DonorAvatarView).GetMethod("AcceptImage",BindingFlags.Instance|BindingFlags.NonPublic).Invoke(preview.avatar,new object[]{"https://p16.tiktokcdn.com/synthetic-avatar.png",texture.EncodeToPNG()});UnityEngine.Object.DestroyImmediate(texture);
                }
                if(mode=="error")preview.avatar.Present("Đạo hữu thử ảnh","http://localhost/blocked");preview.Advance(0);
                foreach(int width in new[]{1080,720})Concept02Verification.CaptureCamera(b.cameraRig.GetComponent<Camera>(),width,width*16/9,Path.Combine(output,mode+"-"+width+".png"),()=>{Canvas.ForceUpdateCanvases();foreach(var t in UnityEngine.Object.FindObjectsByType<TextMeshProUGUI>())t.ForceMeshUpdate();});
                states.Add(new JObject{["sample"]=mode,["status"]=preview.avatar.State.ToString(),["text"]=preview.statusLabel.text,["visible"]=preview.IsVisible});
            }
            File.WriteAllText(Path.Combine(output,"capture-report.json"),new JObject{["gpu"]=SystemInfo.graphicsDeviceName,["syntheticImageOnly"]=true,["states"]=states}.ToString());Debug.Log("LIVE_AVATAR_TEST_CAPTURE_PASS");
        }
    }
}
