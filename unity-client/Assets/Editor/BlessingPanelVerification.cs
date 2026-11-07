using System;
using System.IO;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Network;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class BlessingPanelVerification
    {
        public static void Capture()
        {
            SectSceneSetup.CleanScenes();EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);
            var view=UnityEngine.Object.FindAnyObjectByType<BlessingPanelHud>();var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();var camera=hud.characters.scene.cameraRig.GetComponent<Camera>();
            string output=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/unity-blessing");Directory.CreateDirectory(output);
            foreach(string name in new[]{"idle","active-30","remaining-15","stacked-50","level-up","expired","paused","battle"})
            {
                if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/Blessing/"+name+".json"),out var e,out var error))throw new InvalidOperationException(error);
                hud.characters.ApplySnapshot(e.Snapshot,e.SessionId);hud.characters.Sample(0,0);hud.characters.scene.Sample(0);hud.Render(e.Snapshot);view.Render(e.Snapshot);
                Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,name+"-1080x1920.png"));
                if(name=="active-30"||name=="stacked-50")Concept02Verification.CaptureCamera(camera,720,1280,Path.Combine(output,name+"-720x1280.png"));
            }
            hud.characters.ApplySnapshot(null,"disconnected");hud.Render(null);view.Render(null);Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,"disconnected.png"));
            Debug.Log("BLESSING_PANEL_CAPTURE_PASS "+SystemInfo.graphicsDeviceName);
        }
    }
}
