using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Scenes;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class SceneAuthoringVerification
    {
        private const string TestScene="Assets/Tests/SceneAuthoringProbe.unity";
        private const string Key="TuTien.SceneAuthoring.Play";
        private static void Prepare()
        {
            SectSceneSetup.CleanScenes();EditorSceneManager.OpenScene(SectSceneAuthoringMigration.ScenePath,OpenSceneMode.Single);SectSceneAuthoringMigration.Verify();
            var bindings=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();
            var temple=bindings.environment.layers.Single(l=>l.name=="Temple").transform;
            temple.localPosition+=new Vector3(.13f,-.08f,0);temple.localRotation=Quaternion.Euler(0,0,8);temple.localScale*=1.08f;
            var title=bindings.groups[6].GetComponentsInChildren<TextMesh>().Single(t=>t.name=="Title").transform;title.localScale*=1.03f;
            var probe=new GameObject("QA — opt-in layout persistence probe").AddComponent<SceneAuthoringProbe>();
            probe.bindings=bindings;probe.temple=temple;probe.title=title;probe.expectedPosition=temple.localPosition;probe.expectedRotation=temple.localRotation;probe.expectedScale=temple.localScale;probe.expectedTitleScale=title.localScale;
            if(!EditorSceneManager.SaveScene(temple.gameObject.scene,TestScene))throw new IOException("Cannot save test scene");
            EditorSceneManager.OpenScene(TestScene,OpenSceneMode.Single); // Exercise save/reopen before Play/build.
        }
        [MenuItem("Tu Tien LIVE/Scene Authoring/3 - Play verification (test copy, requires DEMO Node)")]
        public static void RunPlay()
        {
            Prepare();SessionState.SetBool(Key,true);SessionState.SetFloat(Key+"Deadline",(float)EditorApplication.timeSinceStartup+150);EditorApplication.EnterPlaymode();
        }
        [InitializeOnLoadMethod] private static void Resume(){if(SessionState.GetBool(Key,false))EditorApplication.update+=Poll;}
        private static void Poll()
        {
            string path=NetworkTestProbe.Argument("--authoring-report");
            if(path!=null&&File.Exists(path)&&File.ReadAllText(path).Contains("\"completed\": true"))
            {SessionState.SetBool(Key,false);EditorApplication.update-=Poll;if(Application.isBatchMode)EditorApplication.Exit(File.ReadAllText(path).Contains("\"result\": \"PASS\"")?0:3);else EditorApplication.isPlaying=false;}
            else if(EditorApplication.timeSinceStartup>SessionState.GetFloat(Key+"Deadline",0)){SessionState.SetBool(Key,false);EditorApplication.update-=Poll;if(Application.isBatchMode)EditorApplication.Exit(2);else EditorApplication.isPlaying=false;}
        }
        [MenuItem("Tu Tien LIVE/Scene Authoring/4 - Build Windows validation player")]
        public static void BuildWindows()
        {
            Prepare();
            PlayerSettings.SetScriptingBackend(UnityEditor.Build.NamedBuildTarget.Standalone,ScriptingImplementation.Mono2x);
            var output=Path.GetFullPath("Builds/SceneAuthoring/TuTienSect.exe");Directory.CreateDirectory(Path.GetDirectoryName(output));
            var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{TestScene},locationPathName=output,target=BuildTarget.StandaloneWindows64,options=BuildOptions.Development});
            var result=new BuildEvidence{result=report.summary.result.ToString(),bytes=report.summary.totalSize,seconds=report.summary.totalTime.TotalSeconds,errors=report.summary.totalErrors,warnings=report.summary.totalWarnings};
            File.WriteAllText(Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/unity-scene-authoring/build-report.json"),JsonUtility.ToJson(result,true));
            if(report.summary.result!=BuildResult.Succeeded)throw new InvalidOperationException("Build failed");
            Debug.Log("TU_TIEN_SCENE_AUTHORING_BUILD_PASS "+output);
        }
        [Serializable] private class BuildEvidence{public string result;public ulong bytes;public double seconds;public int errors,warnings;}
    }
}
