using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using TuTienLive.Network;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class NetworkTestSetup
    {
        public const string ScenePath = "Assets/Scenes/NetworkTest.unity";
        [MenuItem("Tu Tien LIVE/Stage 02/Create NetworkTest scene (once)")]
        public static void Create()
        {
            CleanScenes();
            if (!File.Exists(ScenePath))
            {
                var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                var camera = new GameObject("Main Camera", typeof(Camera)).GetComponent<Camera>();
                camera.tag = "MainCamera"; camera.orthographic = true; camera.orthographicSize = 9.6f;
                camera.transform.position = new Vector3(0, 0, -10);
                camera.clearFlags = CameraClearFlags.SolidColor; camera.backgroundColor = new Color(.025f, .055f, .1f);
                var client = new GameObject("Read-only WebSocket Client", typeof(UnityWebSocketClient), typeof(NetworkDebugHud), typeof(NetworkTestProbe));
                if (!EditorSceneManager.SaveScene(scene, ScenePath)) throw new IOException("Cannot save NetworkTest");
            }
            // Preserve Bootstrap asset; NetworkTest is the stage 02 standalone entry point.
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true), new EditorBuildSettingsScene("Assets/Scenes/Bootstrap.unity", true) };
            PlayerSettings.runInBackground = true;
            AssetDatabase.SaveAssets();
            Verify();
        }
        [MenuItem("Tu Tien LIVE/Stage 02/Verify NetworkTest")]
        public static void Verify()
        {
            CleanScenes();
            var scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            int clients = 0;
            foreach (var root in scene.GetRootGameObjects()) clients += root.GetComponentsInChildren<UnityWebSocketClient>(true).Length;
            if (clients != 1) throw new InvalidOperationException("NetworkTest must have one client");
            Debug.Log("TU_TIEN_STAGE02_EDITOR_VERIFIED");
        }
        public static void BuildWindows()
        {
            Verify();
            PlayerSettings.runInBackground = true;
            PlayerSettings.SetScriptingBackend(UnityEditor.Build.NamedBuildTarget.Standalone, ScriptingImplementation.Mono2x);
            var path = Path.GetFullPath("Builds/NetworkTest/TuTienNetworkTest.exe");
            Directory.CreateDirectory(Path.GetDirectoryName(path));
            var result = BuildPipeline.BuildPlayer(new BuildPlayerOptions { scenes = new[] { ScenePath }, locationPathName = path,
                target = BuildTarget.StandaloneWindows64, options = BuildOptions.Development });
            if (result.summary.result != BuildResult.Succeeded) throw new InvalidOperationException("Windows build failed: " + result.summary.result);
            Debug.Log("TU_TIEN_STAGE02_WINDOWS_BUILD_PASS " + result.summary.totalSize);
        }
        public static void PlayProbe()
        {
            Verify();
            // Persist hook across the domain reload when entering Play Mode.
            SessionState.SetBool("TuTien.NetworkProbe", true);
            SessionState.SetFloat("TuTien.NetworkProbeDeadline", (float)EditorApplication.timeSinceStartup + 120);
            EditorApplication.EnterPlaymode();
        }
        [InitializeOnLoadMethod]
        private static void WatchProbe()
        {
            if (!SessionState.GetBool("TuTien.NetworkProbe", false)) return;
            EditorApplication.update += Poll;
        }
        private static void Poll()
        {
            string report = NetworkTestProbe.Argument("--network-report");
            if (report != null && File.Exists(report) && File.ReadAllText(report).Contains("\"completed\": true"))
            { SessionState.SetBool("TuTien.NetworkProbe", false); EditorApplication.update -= Poll; EditorApplication.Exit(0); }
            else if (EditorApplication.timeSinceStartup > SessionState.GetFloat("TuTien.NetworkProbeDeadline", 0))
            { SessionState.SetBool("TuTien.NetworkProbe", false); EditorApplication.Exit(2); }
        }
        private static void CleanScenes()
        {
            for (int i = 0; i < SceneManager.sceneCount; i++)
                if (SceneManager.GetSceneAt(i).isDirty) throw new InvalidOperationException("Save modified scenes first; no scene will be discarded.");
        }
    }
}
