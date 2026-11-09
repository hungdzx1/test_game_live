using System;
using System.IO;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Effects;
using TuTienLive.Network;
using TuTienLive.Scenes;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class StormCameraTimingSetup
    {
        private static void Guard()
        {if(!Application.dataPath.Replace('\\','/').EndsWith("/test-results/unity-concept02/project/Assets",StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Use isolated validation project.");}
        public static void Setup()
        {
            Guard();var scene=EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);var idle=UnityEngine.Object.FindAnyObjectByType<IdleCameraPresenter>();
            idle.panSeconds=20;idle.zoomSeconds=5;idle.followSeconds=8;
            EditorSceneManager.MarkSceneDirty(scene);EditorSceneManager.SaveScene(scene);Debug.Log("STORM_CAMERA_TIMING_SETUP_PASS");
        }
        private static TuTienLive.Models.Envelope Read(string path)
        {if(!StateMapper.TryParse(File.ReadAllText(path),out var e,out var error))throw new InvalidOperationException(error);return e;}
        public static void Capture()
        {
            Guard();EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();var idle=UnityEngine.Object.FindAnyObjectByType<IdleCameraPresenter>();
            b.network.enabled=b.characters.enabled=idle.enabled=idle.receipts.enabled=false;b.environment.animate=false;b.environment.quality=SectQuality.High;b.cameraRig.driftEnabled=false;
            var boss=UnityEngine.Object.FindAnyObjectByType<BossBattlePresenter>();boss.enabled=false;boss.Hide();UnityEngine.Object.FindAnyObjectByType<BossWarningPresenter>().enabled=false;
            string output=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/Tailieu_output/storm-camera-timing");Directory.CreateDirectory(output);
            var raw=JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/Qua78/ritual.json"));raw["payload"]["breakthrough"]["elapsedMs"]=0;
            if(!StateMapper.TryParse(raw.ToString(),out var ritual,out var error))throw new InvalidOperationException(error);
            b.characters.ApplySnapshot(ritual.Snapshot,ritual.SessionId);UnityEngine.Object.FindAnyObjectByType<Concept02Hud>().Render(ritual.Snapshot);
            var timeline=new JArray();int[] times={0,1000,1499,1500,1799,1800,1967,2134,2301,2467,11999,12000};int index=0;
            Action next=null;next=()=>{try{
                if(index==times.Length)
                {
                    var shots=new JArray();
                    foreach(string mode in new[]{"zoom","pan","follow"})
                    {
                        idle.ResetPresentation();var state=Read("Assets/Tests/Fixtures/Camera9/"+(mode=="follow"?"ritual":"initial")+".json");b.characters.ApplySnapshot(state.Snapshot,state.SessionId);b.characters.Sample(0,0);idle.ApplySnapshot(state.Snapshot,state.SessionId);idle.ChooseIndex=n=>mode=="pan"?0:mode=="zoom"?1:n-1;idle.Advance(15);
                        float total=mode=="zoom"?6.6f:mode=="pan"?21.6f:8;idle.Advance(total-.01f);string before=idle.Mode;idle.Advance(.02f);shots.Add(new JObject{["mode"]=mode,["totalSeconds"]=total,["beforeEnd"]=before,["afterEnd"]=idle.Mode});
                    }
                    File.WriteAllText(Path.Combine(output,"capture-report.json"),new JObject{["gpu"]=SystemInfo.graphicsDeviceName,["timeline"]=timeline,["shots"]=shots}.ToString());Debug.Log("STORM_CAMERA_TIMING_CAPTURE_PASS");EditorApplication.Exit(0);return;
                }
                int time=times[index++];b.characters.Sample(time,0);
                Later(()=>{try{
                    timeline.Add(new JObject{["elapsedMs"]=time,["cloud"]=b.tribulation.stormCloud.enabled,["lightning"]=b.tribulation.LightningVisible,["frame"]=b.tribulation.LightningFrameIndex,["pose"]=b.tribulation.Pose});
                    if(time==1000||time==1500||time==1800||time==2301||time==12000)
                        foreach(int width in new[]{1080,720})Concept02Verification.CaptureCamera(b.cameraRig.GetComponent<Camera>(),width,width*16/9,Path.Combine(output,"ritual-"+time+"-"+width+".png"),()=>{Canvas.ForceUpdateCanvases();foreach(var t in UnityEngine.Object.FindObjectsByType<TextMeshProUGUI>())t.ForceMeshUpdate();});
                    Later(next);
                }catch(Exception ex){Debug.LogException(ex);EditorApplication.Exit(1);}});
            }catch(Exception ex){Debug.LogException(ex);EditorApplication.Exit(1);}};next();
        }
        private static void Later(Action action)
        {
            int frames=3;EditorApplication.CallbackFunction update=null;update=()=>{if(--frames>0){EditorApplication.QueuePlayerLoopUpdate();return;}EditorApplication.update-=update;EditorApplication.delayCall+=()=>action();};EditorApplication.update+=update;EditorApplication.QueuePlayerLoopUpdate();
        }
    }
}
