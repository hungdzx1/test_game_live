using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEditor.Build.Reporting;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using TuTienLive.Scenes;
using TuTienLive.Characters;

namespace TuTienLive.Editor
{
    public static class Concept02Verification
    {
        public static string Evidence=>Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/unity-concept02");
        // Iteration helper is deliberately restricted to this task's disposable validation project.
        public static void RecreateValidationOnly()
        {
            string expected=Path.Combine(SectSceneSetup.RepositoryRoot(),"test-results/unity-concept02/project/Assets");
            if(!string.Equals(Path.GetFullPath(Application.dataPath),Path.GetFullPath(expected),StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Recreation is allowed only in the isolated Concept02 validation project.");
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
            AssetDatabase.DeleteAsset(Concept02SceneSetup.ScenePath);AssetDatabase.DeleteAsset(Concept02SceneSetup.Root.TrimEnd('/'));
            Concept02SceneSetup.Create();
        }
        [MenuItem("Tu Tien LIVE/Concept 02/Capture portrait preview")]
        public static void Capture()
        {
            SectSceneSetup.CleanScenes();
            EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);Concept02SceneSetup.Verify();
            var bindings=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();bindings.environment.Sample(0);
            var camera=bindings.cameraRig.GetComponent<Camera>();
            Directory.CreateDirectory(Evidence);
            CaptureCamera(camera,1080,1920,Path.Combine(Evidence,"concept02-1080x1920.png"));
            CaptureCamera(camera,720,1280,Path.Combine(Evidence,"concept02-720x1280.png"));
            // Temporary local preview only; never save demonstration players into the scene.
            for(int i=1;i<=3;i++)
            {
                var prefab=AssetDatabase.LoadAssetAtPath<CharacterView>(Concept02SceneSetup.Root+"Prefabs/Character_"+i+".prefab");
                var view=UnityEngine.Object.Instantiate(prefab,bindings.groups[3]);
                view.transform.position=new Vector3((i-2)*2.7f,-5,8);view.pose.Sample("meditate",0);
                view.nameLabel.text="Mẫu "+i;view.nameLabel.ForceMeshUpdate();
            }
            CaptureCamera(camera,1080,1920,Path.Combine(Evidence,"concept02-character-preview.png"));
            Debug.Log("CONCEPT02_GPU_CAPTURE_PASS "+SystemInfo.graphicsDeviceName);
        }
        public static void CaptureCamera(Camera camera,int width,int height,string destination)
        {
            camera.rect=new Rect(0,0,1,1);camera.aspect=9f/16;
            var target=new RenderTexture(width,height,24,RenderTextureFormat.ARGB32,RenderTextureReadWrite.sRGB);
            target.Create();var previous=RenderTexture.active;Texture2D image=null;
            try
            {
                camera.targetTexture=target;Canvas.ForceUpdateCanvases();
                var request=new UniversalRenderPipeline.SingleCameraRequest{destination=target};
                RenderPipeline.SubmitRenderRequest(camera,request);Canvas.ForceUpdateCanvases();RenderPipeline.SubmitRenderRequest(camera,request);
                RenderTexture.active=target;image=new Texture2D(width,height,TextureFormat.RGB24,false);
                image.ReadPixels(new Rect(0,0,width,height),0,0);image.Apply();File.WriteAllBytes(destination,image.EncodeToPNG());
            }
            finally{camera.targetTexture=null;RenderTexture.active=previous;if(image)UnityEngine.Object.DestroyImmediate(image);target.Release();UnityEngine.Object.DestroyImmediate(target);}
        }
        public static void BuildWindows()
        {
            var output=Path.GetFullPath("Builds/Concept02/TuTienConcept02.exe");Directory.CreateDirectory(Path.GetDirectoryName(output));
            var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{Concept02SceneSetup.ScenePath},locationPathName=output,target=BuildTarget.StandaloneWindows64,options=BuildOptions.Development});
            Directory.CreateDirectory(Evidence);File.WriteAllText(Path.Combine(Evidence,"build-report.json"),JsonUtility.ToJson(new BuildEvidence{result=report.summary.result.ToString(),errors=report.summary.totalErrors,warnings=report.summary.totalWarnings,bytes=report.summary.totalSize},true));
            if(report.summary.result!=BuildResult.Succeeded)throw new InvalidOperationException("Concept02 build failed.");
        }
        [Serializable] private class BuildEvidence{public string result;public int errors,warnings;public ulong bytes;}
    }
}
