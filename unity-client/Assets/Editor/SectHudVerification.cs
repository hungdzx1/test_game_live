using System.IO;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.UI;
using TuTienLive.Network;

namespace TuTienLive.Editor
{
    public static class SectHudVerification
    {
        public static void Capture()
        {
            SectSceneSetup.CleanScenes();EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);
            var hud=Object.FindAnyObjectByType<Concept02Hud>();var camera=hud.characters.scene.cameraRig.GetComponent<Camera>();
            string directory=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/unity-sect-hud");Directory.CreateDirectory(directory);
            foreach(string name in new[]{"level1","level2","level3-max"})
            {
                if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/SectHud/"+name+".json"),out var snapshot,out var error))throw new System.InvalidOperationException(error);
                hud.characters.ApplySnapshot(snapshot.Snapshot,snapshot.SessionId);hud.characters.Sample(0,0);hud.Render(snapshot.Snapshot);hud.characters.scene.Sample(0);
                Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(directory,name+"-1080x1920.png"));
                if(name=="level2")Concept02Verification.CaptureCamera(camera,720,1280,Path.Combine(directory,name+"-720x1280.png"));
            }
            Debug.Log("SECT_HUD_CAPTURE_PASS "+SystemInfo.graphicsDeviceName);
        }
    }
}
