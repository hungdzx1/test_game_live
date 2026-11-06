// Stage 01 only: configure an empty project. No transport, gameplay or artwork.
using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace TuTienLive.Editor
{
    public static class MigrationProjectSetup
    {
        private const string ScenePath = "Assets/Scenes/Bootstrap.unity";
        private const string PipelinePath = "Assets/Settings/TuTienPipeline.asset";
        private const string RendererPath = "Assets/Settings/TuTienRenderer.asset";
        private static readonly string[] Folders = {
            "Scripts/Network", "Scripts/Models", "Scripts/Presentation", "Scripts/Characters",
            "Scripts/Scenes", "Scripts/Effects", "Scripts/UI", "Prefabs", "Art", "Animations",
            "Materials", "Tests", "Scenes", "Settings", "Editor"
        };

        [MenuItem("Tu Tien LIVE/Stage 01/Initialize empty project")]
        public static void Initialize()
        {
            RequireCleanScenes();
            // Refuse to replace an existing project configuration or scene.
            if (AssetDatabase.LoadAssetAtPath<SceneAsset>(ScenePath) != null ||
                AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(PipelinePath) != null ||
                File.Exists(RendererPath))
                throw new InvalidOperationException("Stage 01 assets already exist. Use Verify; do not overwrite scenes.");

            foreach (var folder in Folders) Directory.CreateDirectory("Assets/" + folder);
            AssetDatabase.Refresh();
            EditorSettings.serializationMode = SerializationMode.ForceText;
            PlayerSettings.companyName = "TuTienLive";
            PlayerSettings.productName = "Tu Tien LIVE - Unity Migration";
            PlayerSettings.defaultScreenWidth = 1080;
            PlayerSettings.defaultScreenHeight = 1920;
            PlayerSettings.resizableWindow = true;
            PlayerSettings.colorSpace = ColorSpace.Linear;

            var renderer = ScriptableObject.CreateInstance<UniversalRendererData>();
            AssetDatabase.CreateAsset(renderer, RendererPath);
            var pipeline = UniversalRenderPipelineAsset.Create(renderer);
            pipeline.supportsHDR = false;
            pipeline.msaaSampleCount = 1;
            pipeline.supportsCameraDepthTexture = false;
            pipeline.supportsCameraOpaqueTexture = false;
            pipeline.shadowDistance = 0;
            AssetDatabase.CreateAsset(pipeline, PipelinePath);
            GraphicsSettings.defaultRenderPipeline = pipeline;
            int currentQuality = QualitySettings.GetQualityLevel();
            for (int i = 0; i < QualitySettings.names.Length; i++)
            {
                QualitySettings.SetQualityLevel(i, false);
                QualitySettings.renderPipeline = pipeline;
            }
            QualitySettings.SetQualityLevel(currentQuality, false);

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var cameraObject = new GameObject("Main Camera", typeof(Camera));
            cameraObject.tag = "MainCamera";
            var camera = cameraObject.GetComponent<Camera>();
            camera.orthographic = true;
            camera.orthographicSize = 9.6f; // Planned layout convention: 100 px = 1 unit.
            camera.transform.position = new Vector3(0, 0, -10);
            camera.nearClipPlane = 0.1f;
            camera.farClipPlane = 100;
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.025f, 0.055f, 0.1f, 1);
            camera.allowHDR = false;
            camera.allowMSAA = false;
            camera.GetUniversalAdditionalCameraData().renderPostProcessing = false;
            if (!EditorSceneManager.SaveScene(scene, ScenePath))
                throw new IOException("Could not save the empty Bootstrap scene.");
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
            AssetDatabase.SaveAssets();
            Verify();
        }

        [MenuItem("Tu Tien LIVE/Stage 01/Verify empty project")]
        public static void Verify()
        {
            RequireCleanScenes();
            foreach (var folder in Folders)
                Require(AssetDatabase.IsValidFolder("Assets/" + folder), "Missing folder: " + folder);
            var pipeline = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(PipelinePath);
            Require(pipeline != null && GraphicsSettings.defaultRenderPipeline == pipeline, "URP not assigned.");
            Require(pipeline.rendererDataList.Length == 1 && pipeline.rendererDataList[0] != null, "Missing URP renderer data.");
            Require(PlayerSettings.defaultScreenWidth == 1080 && PlayerSettings.defaultScreenHeight == 1920, "Wrong initial resolution.");
            Require(EditorBuildSettings.scenes.Any(s => s.path == ScenePath), "Bootstrap missing from build scene list.");
            var scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            var roots = scene.GetRootGameObjects();
            Require(roots.Length == 1, "Bootstrap must contain only the camera in stage 01.");
            var camera = roots[0].GetComponent<Camera>();
            Require(camera != null && camera.orthographic && Mathf.Approximately(camera.orthographicSize, 9.6f), "Wrong initial camera.");
            Require(!roots.SelectMany(r => r.GetComponentsInChildren<Renderer>(true)).Any(), "Stage 01 must not contain graphics.");
            // Stage 02 adds runtime code; this historical tool only verifies the preserved Bootstrap.
            var report = new VerificationReport {
                editorVersion = Application.unityVersion, batchMode = Application.isBatchMode,
                pipeline = pipeline.GetType().FullName, camera = "Orthographic", scene = ScenePath,
                width = PlayerSettings.defaultScreenWidth, height = PlayerSettings.defaultScreenHeight,
                rootObjects = roots.Length, result = "PASS: Editor import, compilation and empty project configuration only",
                limitations = "No Play Mode, GPU render, Windows build, networking, gameplay or OBS verification."
            };
            var directory = Path.GetFullPath(Path.Combine(Application.dataPath, "../../test-results/unity-stage01"));
            Directory.CreateDirectory(directory);
            File.WriteAllText(Path.Combine(directory, "editor-verification.json"), JsonUtility.ToJson(report, true) + "\n");
            Debug.Log("TU_TIEN_STAGE01_VERIFIED " + JsonUtility.ToJson(report));
        }

        private static void Require(bool condition, string message)
        {
            if (!condition) throw new InvalidOperationException(message);
        }

        private static void RequireCleanScenes()
        {
            for (int i = 0; i < UnityEngine.SceneManagement.SceneManager.sceneCount; i++)
                Require(!UnityEngine.SceneManagement.SceneManager.GetSceneAt(i).isDirty,
                    "Save modified scenes before Stage 01 tools; no unsaved scene will be discarded.");
        }

        [Serializable]
        private sealed class VerificationReport
        {
            public string editorVersion, pipeline, camera, scene, result, limitations;
            public bool batchMode;
            public int width, height, rootObjects;
        }
    }
}
