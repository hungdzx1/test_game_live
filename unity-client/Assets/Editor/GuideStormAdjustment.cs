using System;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Network;
using TuTienLive.Scenes;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class GuideStormAdjustment
    {
        public static void Setup()
        {
            if(!Application.dataPath.Replace('\\','/').EndsWith("/test-results/unity-concept02/project/Assets",StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Use isolated validation project.");
            var scene=EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();
            var root=hud.transform.Find(K01GuideSetup.RootName) as RectTransform;if(!root)throw new InvalidOperationException("Missing existing K01.");
            K01GuideSetup.ApplyCompactLayout(root);EditorSceneManager.MarkSceneDirty(scene);EditorSceneManager.SaveScene(scene);Debug.Log("GUIDE_STORM_SETUP_PASS");
        }
        private static TuTienLive.Models.Envelope Read(string file)
        {if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/"+file+".json"),out var state,out var error))throw new InvalidOperationException(error);return state;}
        public static void Capture()
        {
            EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();
            b.network.enabled=false;b.characters.enabled=false;b.environment.animate=false;b.environment.quality=SectQuality.High;b.cameraRig.driftEnabled=false;
            var idle=UnityEngine.Object.FindAnyObjectByType<TuTienLive.Effects.IdleCameraPresenter>();if(idle)idle.enabled=false;
            var root=(RectTransform)hud.transform.Find(K01GuideSetup.RootName);var camera=b.cameraRig.GetComponent<Camera>();string output=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/Tailieu_output/guide-storm");Directory.CreateDirectory(output);
            var initial=Read("Qua78/initial");b.characters.ApplySnapshot(initial.Snapshot,initial.SessionId);b.characters.Sample(0,0);hud.Render(initial.Snapshot);
            Action refresh=()=>{Canvas.ForceUpdateCanvases();foreach(var text in root.GetComponentsInChildren<TMP_Text>())text.ForceMeshUpdate();};
            foreach(int width in new[]{1080,720})Concept02Verification.CaptureCamera(camera,width,width*16/9,Path.Combine(output,"guide-"+width+".png"),refresh);
            var raw=JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/Qua78/ritual.json"));raw["payload"]["breakthrough"]["elapsedMs"]=0;
            if(!StateMapper.TryParse(raw.ToString(),out var ritual,out var error))throw new InvalidOperationException(error);
            b.characters.ApplySnapshot(ritual.Snapshot,ritual.SessionId);hud.Render(ritual.Snapshot);var timeline=new JArray();
            foreach(int time in new[]{0,45,90,135,180,2200,8000,11999,12000})
            {
                b.characters.Sample(time,0);timeline.Add(new JObject{["elapsedMs"]=time,["frame"]=b.tribulation.LightningFrameIndex,["visible"]=b.tribulation.LightningVisible});
                if(time==2200||time==11999||time==12000)Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,"ritual-"+time+"-1080.png"),refresh);
            }
            File.WriteAllText(Path.Combine(output,"capture-report.json"),new JObject{["gpu"]=SystemInfo.graphicsDeviceName,["guideRight"]=12+436*.9f,["guideWidth"]=436*.9f,["timeline"]=timeline}.ToString());Debug.Log("GUIDE_STORM_CAPTURE_PASS "+SystemInfo.graphicsDeviceName);
        }
    }
}
