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
    public static class Camera9Setup
    {
        [MenuItem("Tu Tien LIVE/Concept 02/Apply camera section 9")]
        public static void Apply(){Install();EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());}
        public static void Install()
        {
            var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();if(!b||b.gameObject.scene.path!=Concept02SceneSetup.ScenePath)throw new InvalidOperationException("Open Concept02 first.");
            b.characters.arrivalFlights=true;var idle=UnityEngine.Object.FindAnyObjectByType<IdleCameraPresenter>();idle.idleSeconds=15;idle.panSeconds=20;idle.zoomSeconds=5;idle.followSeconds=8;
            var fx=UnityEngine.Object.FindAnyObjectByType<BlessingReceiptPresenter>();if(fx.popRoot.Find("DonorAttribution"))return;
            var root=Rect(fx.popRoot,"DonorAttribution",new Vector2(0,-285),new Vector2(610,76));
            fx.donorVisual=root.gameObject.AddComponent<CanvasGroup>();fx.donorVisual.alpha=0;fx.donorVisual.interactable=fx.donorVisual.blocksRaycasts=false;
            var panel=root.gameObject.AddComponent<GuidePanelGraphic>();panel.color=new Color(.02f,.07f,.13f,.97f);panel.raycastTarget=false;
            var portrait=Rect(root,"Avatar",new Vector2(-260,0),new Vector2(58,58)).gameObject.AddComponent<RawImage>();portrait.raycastTarget=false;portrait.enabled=false;
            var fallback=Text(root,"AvatarFallback","?",new Vector2(-260,0),new Vector2(58,58),32);fallback.alignment=TextAlignmentOptions.Center;
            fx.donorLabel=Text(root,"DonorName","",new Vector2(33,0),new Vector2(500,62),27);fx.donorLabel.alignment=TextAlignmentOptions.Left;
            fx.donorAvatar=root.gameObject.AddComponent<DonorAvatarView>();fx.donorAvatar.portrait=portrait;fx.donorAvatar.fallback=fallback;fx.Hide();
        }
        private static RectTransform Rect(Transform parent,string name,Vector2 position,Vector2 size)
        {var r=new GameObject(name,typeof(RectTransform)).GetComponent<RectTransform>();r.SetParent(parent,false);r.anchorMin=r.anchorMax=r.pivot=new Vector2(.5f,.5f);r.anchoredPosition=position;r.sizeDelta=size;return r;}
        private static TMP_Text Text(Transform p,string name,string value,Vector2 position,Vector2 size,float fontSize)
        {var t=Rect(p,name,position,size).gameObject.AddComponent<TextMeshProUGUI>();t.font=AssetDatabase.LoadAssetAtPath<TMP_FontAsset>("Assets/SceneAuthoring/Nameplate SDF.asset");t.fontSize=fontSize;t.color=new Color(1,.94f,.73f);t.fontStyle=FontStyles.Bold;t.richText=false;t.raycastTarget=false;t.text=value;t.textWrappingMode=TextWrappingModes.NoWrap;t.overflowMode=TextOverflowModes.Ellipsis;return t;}
        public static void Setup()
        {
            if(!Application.dataPath.Replace('\\','/').EndsWith("/test-results/unity-concept02/project/Assets",StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Use isolated validation project.");
            var scene=EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);Install();EditorSceneManager.MarkSceneDirty(scene);EditorSceneManager.SaveScene(scene);Debug.Log("CAMERA9_SETUP_PASS");
        }
        private static TuTienLive.Models.Envelope Read(string name)
        {if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/Camera9/"+name+".json"),out var state,out var error))throw new InvalidOperationException(error);return state;}
        public static void Capture()
        {
            EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();var idle=UnityEngine.Object.FindAnyObjectByType<IdleCameraPresenter>();var items=idle.receipts;var blessing=UnityEngine.Object.FindAnyObjectByType<BlessingReceiptPresenter>();
            b.network.enabled=b.characters.enabled=idle.enabled=items.enabled=false;b.environment.animate=false;b.environment.quality=SectQuality.High;b.cameraRig.driftEnabled=false;
            var boss=UnityEngine.Object.FindAnyObjectByType<BossBattlePresenter>();boss.enabled=false;boss.Hide();UnityEngine.Object.FindAnyObjectByType<BossWarningPresenter>().enabled=false;
            string output=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/Tailieu_output/camera9");Directory.CreateDirectory(output);var samples=new JArray();
            var modes=new[]{"pan","zoom","follow","arrival","gift","donor"};int index=0;
            Action next=null;next=()=>{try
            {
                if(index==modes.Length){File.WriteAllText(Path.Combine(output,"capture-report.json"),new JObject{["gpu"]=SystemInfo.graphicsDeviceName,["samples"]=samples}.ToString());Debug.Log("CAMERA9_CAPTURE_PASS");EditorApplication.Exit(0);return;}
                string mode=modes[index++];
                var state=Read(mode=="follow"?"ritual":"initial");string session=state.SessionId+":"+mode;idle.ResetPresentation();items.ResetPresentation();blessing.Hide();b.characters.ApplySnapshot(state.Snapshot,session);b.characters.Sample(0,0);idle.ApplySnapshot(state.Snapshot,session);items.ApplySnapshot(state.Snapshot,session);blessing.ApplySnapshot(state.Snapshot,session);
                UnityEngine.Object.FindAnyObjectByType<Concept02Hud>().Render(state.Snapshot);UnityEngine.Object.FindAnyObjectByType<BlessingPanelHud>().Render(state.Snapshot);
                idle.ChooseIndex=n=>mode=="pan"?0:mode=="follow"?n-1:1;
                if(mode=="pan"||mode=="zoom"||mode=="follow"){idle.Advance(15);idle.Advance(2);}
                if(mode=="arrival"||mode=="gift")
                {
                    b.characters.HandleEvent(Read("joined-a").Event);b.characters.Sample(0,0);idle.Advance(.1f);b.characters.Sample(0,1.5f);idle.Advance(.2f);
                    if(mode=="gift"){items.HandleEvent(Read("gift").Event);idle.HandleEvent(Read("gift").Event);idle.Advance(.01f);items.Advance(1.3f);}
                }
                if(mode=="donor"){blessing.enabled=true;blessing.HandleEvent(Read("donor").Event);blessing.Advance(.8f);}
                // Sprite batches need an Editor player-loop update after pooled transforms change.
                Later(()=>{try{
                foreach(int width in new[]{1080,720})Concept02Verification.CaptureCamera(b.cameraRig.GetComponent<Camera>(),width,width*16/9,Path.Combine(output,mode+"-"+width+".png"),()=>{Canvas.ForceUpdateCanvases();if(mode=="gift")items.Advance(0);foreach(var label in UnityEngine.Object.FindObjectsByType<TextMeshProUGUI>(FindObjectsSortMode.None))label.ForceMeshUpdate();});
                var sample=new JObject{["sample"]=mode,["cameraMode"]=idle.Mode,["subject"]=idle.Subject,["arrivalCount"]=b.characters.ArrivalCount,["receipt"]=items.ActiveUserId,["donor"]=blessing.DonorName,["halfHeight"]=b.cameraRig.GetComponent<Camera>().orthographicSize};
                if(mode=="gift")
                {
                    var body=b.characters.Views[items.ActiveUserId].pose.Body;var camera=b.cameraRig.GetComponent<Camera>();
                    sample["cameraPosition"]=camera.transform.position.ToString("F4");sample["bodyPosition"]=body.transform.position.ToString("F4");sample["localBounds"]=body.localBounds.ToString("F4");sample["worldBounds"]=body.bounds.ToString("F4");sample["spriteBounds"]=body.sprite.bounds.ToString("F4");sample["subjectViewport"]=camera.WorldToViewportPoint(body.transform.TransformPoint(body.localBounds.center)).ToString("F4");
                    foreach(var v in b.characters.Views.Values)if(v.UserId!=items.ActiveUserId)v.gameObject.SetActive(false);
                    Concept02Verification.CaptureCamera(camera,720,1280,Path.Combine(output,"gift-focus.png"),()=>items.Advance(0));
                    foreach(var v in b.characters.Views.Values)v.gameObject.SetActive(true);
                }
                samples.Add(sample);
                Later(next);
                }catch(Exception error){Debug.LogException(error);EditorApplication.Exit(1);}});
            }catch(Exception error){Debug.LogException(error);EditorApplication.Exit(1);}};next();
        }
        private static void Later(Action action)
        {
            int frames=3;EditorApplication.CallbackFunction update=null;
            update=()=>{if(--frames>0){EditorApplication.QueuePlayerLoopUpdate();return;}EditorApplication.update-=update;EditorApplication.delayCall+=()=>action();};
            EditorApplication.update+=update;EditorApplication.QueuePlayerLoopUpdate();
        }
    }
}
