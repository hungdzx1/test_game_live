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
    public static class Qua78Setup
    {
        [MenuItem("Tu Tien LIVE/Concept 02/Add group receipts and idle camera")]
        public static void AddToCurrentScene(){Install();EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());}
        public static void Install()
        {
            var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();if(!b||b.gameObject.scene.path!=Concept02SceneSetup.ScenePath)throw new InvalidOperationException("Open Concept02 first.");
            var items=UnityEngine.Object.FindAnyObjectByType<ItemReceiptPresenter>();if(!items)throw new InvalidOperationException("Missing item receipt presenter.");
            var groups=UnityEngine.Object.FindObjectsByType<GroupReceiptPresenter>(FindObjectsInactive.Include);if(groups.Length>1)throw new InvalidOperationException("Duplicate group receipts.");
            if(groups.Length==0)
            {
                var go=new GameObject("GroupReceiptPresenter");go.transform.SetParent(b.groups[7],false);var fx=go.AddComponent<GroupReceiptPresenter>();fx.network=b.network;fx.characters=b.characters;fx.items=items;fx.canvas=items.canvas;
                var root=Rect(items.canvas.transform,"WholeSectReceiptTemplate",Vector2.zero,new Vector2(100,90));fx.template=root;
                var alpha=root.gameObject.AddComponent<CanvasGroup>();alpha.alpha=0;alpha.blocksRaycasts=alpha.interactable=false;
                var icon=Rect(root,"Icon",new Vector2(0,12),new Vector2(56,56)).gameObject.AddComponent<Image>();icon.preserveAspect=true;icon.raycastTarget=false;icon.sprite=items.pill;
                var text=Rect(root,"Count",new Vector2(0,-28),new Vector2(96,28)).gameObject.AddComponent<TextMeshProUGUI>();text.font=items.label.font;text.fontSize=20;text.alignment=TextAlignmentOptions.Center;text.color=new Color(1,.94f,.65f);text.raycastTarget=false;text.richText=false;text.text="";
                var shadow=text.gameObject.AddComponent<Shadow>();shadow.effectColor=Color.black;shadow.effectDistance=new Vector2(1,-1);
            }
            var cameras=UnityEngine.Object.FindObjectsByType<IdleCameraPresenter>(FindObjectsInactive.Include);if(cameras.Length>1)throw new InvalidOperationException("Duplicate idle cameras.");
            if(cameras.Length==0){var go=new GameObject("IdleCameraPresenter");go.transform.SetParent(b.groups[7],false);var fx=go.AddComponent<IdleCameraPresenter>();fx.network=b.network;fx.characters=b.characters;fx.rig=b.cameraRig;fx.receipts=items;}
        }
        private static RectTransform Rect(Transform parent,string name,Vector2 position,Vector2 size){var go=new GameObject(name,typeof(RectTransform));var rect=go.GetComponent<RectTransform>();rect.SetParent(parent,false);rect.anchorMin=rect.anchorMax=rect.pivot=new Vector2(.5f,.5f);rect.anchoredPosition=position;rect.sizeDelta=size;return rect;}
        public static void UpgradeValidation()
        {
            if(!Application.dataPath.Replace('\\','/').EndsWith("/test-results/unity-concept02/project/Assets",StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Use isolated validation project.");
            var scene=EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);Install();EditorSceneManager.MarkSceneDirty(scene);EditorSceneManager.SaveScene(scene);AssetDatabase.SaveAssets();Debug.Log("QUA78_SETUP_PASS");
        }
        private static TuTienLive.Models.Envelope Read(string name){if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/Qua78/"+name+".json"),out var value,out var error))throw new InvalidOperationException(error);return value;}
        public static void Capture()
        {
            EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);var group=UnityEngine.Object.FindAnyObjectByType<GroupReceiptPresenter>();var idle=UnityEngine.Object.FindAnyObjectByType<IdleCameraPresenter>();var items=group.items;
            group.enabled=idle.enabled=items.enabled=false;group.network.enabled=false;var chars=group.characters;chars.enabled=false;chars.scene.animate=false;chars.scene.quality=SectQuality.High;items.cameraRig.driftEnabled=false;
            var initial=Read("initial");chars.ApplySnapshot(initial.Snapshot,initial.SessionId);chars.Sample(0,0);group.ApplySnapshot(initial.Snapshot,initial.SessionId);items.ApplySnapshot(initial.Snapshot,initial.SessionId);idle.ApplySnapshot(initial.Snapshot,initial.SessionId);
            UnityEngine.Object.FindAnyObjectByType<TuTienLive.UI.Concept02Hud>().Render(initial.Snapshot);
            string output=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/Tailieu_output/qua78");Directory.CreateDirectory(output);var camera=items.cameraRig.GetComponent<Camera>();var report=new JArray();
            for(int i=0;i<30;i++)group.HandleEvent(Read("group-"+i).Event);group.Advance(.5f);
            Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,"whole-sect-1080.png"),()=>group.Advance(0));Concept02Verification.CaptureCamera(camera,720,1280,Path.Combine(output,"whole-sect-720.png"),()=>group.Advance(0));report.Add(new JObject{["sample"]="whole-sect",["visible"]=group.ActiveCount,["zoom"]=camera.orthographicSize});
            group.ResetPresentation();idle.Advance(30);idle.Advance(2);Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,"idle-pan-1080.png"));report.Add(new JObject{["sample"]="idle",["mode"]=idle.Mode,["zoom"]=camera.orthographicSize});
            var personal=Read("personal").Event;idle.HandleEvent(personal);items.HandleEvent(personal);for(int i=0;i<30;i++){idle.Advance(.02f);items.Advance(.02f);}items.Advance(1);
            Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,"personal-names-1080.png"),()=>{items.Advance(0);items.label.ForceMeshUpdate();});Concept02Verification.CaptureCamera(camera,720,1280,Path.Combine(output,"personal-names-720.png"),()=>{items.Advance(0);items.label.ForceMeshUpdate();});
            var recipient=chars.Views["qua:12"].pose.Body;var center=recipient.transform.TransformPoint(recipient.sprite.bounds.center);
            report.Add(new JObject{["sample"]="personal",["recipient"]=items.ActiveUserId,["zoom"]=camera.orthographicSize,["sprite"]=AssetDatabase.GetAssetPath(recipient.sprite),["spriteBounds"]=recipient.sprite.bounds.ToString(),["bodyBounds"]=recipient.bounds.ToString(),["viewport"]=camera.WorldToViewportPoint(center).ToString(),["camera"]=camera.transform.position.ToString(),["bodyPosition"]=recipient.transform.position.ToString(),["namePosition"]=chars.Views["qua:12"].nameLabel.transform.position.ToString(),["nameCanvas"]=chars.Views["qua:12"].nameLabel.GetComponentInParent<Canvas>().transform.name});
            items.ResetPresentation();idle.ResetPresentation();var ritual=Read("ritual");chars.ApplySnapshot(ritual.Snapshot,ritual.SessionId);chars.Sample(0,0);idle.ApplySnapshot(ritual.Snapshot,ritual.SessionId);idle.Advance(1);Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,"ritual-follow-1080.png"));report.Add(new JObject{["sample"]="ritual",["mode"]=idle.Mode,["zoom"]=camera.orthographicSize});
            File.WriteAllText(Path.Combine(output,"capture-report.json"),new JObject{["gpu"]=SystemInfo.graphicsDeviceName,["samples"]=report}.ToString());Debug.Log("QUA78_GPU_CAPTURE_PASS "+SystemInfo.graphicsDeviceName);
        }
    }
}
