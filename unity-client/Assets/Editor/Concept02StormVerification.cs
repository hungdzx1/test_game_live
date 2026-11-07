using System;
using System.IO;
using Newtonsoft.Json.Linq;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Network;
using TuTienLive.Scenes;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class Concept02StormVerification
    {
        public static void Capture()
        {
            SectSceneSetup.CleanScenes();EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);
            var bindings=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();
            var camera=bindings.cameraRig.GetComponent<Camera>();string output=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/unity-storm");Directory.CreateDirectory(output);
            var raw=JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/Characters/ritual-start.json"));
            raw["payload"]["interactions"]=JObject.Parse(File.ReadAllText("Assets/Tests/Fixtures/SectHud/level2.json"))["payload"]["interactions"].DeepClone();
            if(!StateMapper.TryParse(raw.ToString(),out var ceremony,out var error))throw new InvalidOperationException(error);
            bindings.characters.ApplySnapshot(ceremony.Snapshot,ceremony.SessionId);hud.Render(ceremony.Snapshot);bindings.environment.Sample(0);
            for(int i=0;i<4;i++)
            {
                bindings.characters.Sample(1800+i*45,0);
                if(bindings.tribulation.LightningFrameIndex!=i)throw new InvalidOperationException("Wrong frame at capture.");
                Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,"storm-frame-0"+(i+1)+"-1080x1920.png"));
                if(i==2)Concept02Verification.CaptureCamera(camera,720,1280,Path.Combine(output,"storm-720x1280.png"));
            }
            bindings.characters.Sample(2200,0);Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,"storm-between-strikes.png"));
            foreach(string name in new[]{"level1","level2","level3-max"})
            {
                if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/SectHud/"+name+".json"),out var e,out error))throw new InvalidOperationException(error);
                bindings.characters.ApplySnapshot(e.Snapshot,e.SessionId);bindings.characters.Sample(0,0);hud.Render(e.Snapshot);
                Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,"energy-"+name+".png"));
            }
            bindings.characters.ApplySnapshot(null,"disconnected");hud.Render(null);Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,"disconnected.png"));
            Debug.Log("CONCEPT02_STORM_CAPTURE_PASS "+SystemInfo.graphicsDeviceName);
        }
    }
}
