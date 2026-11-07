using System.IO;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using TuTienLive.Characters;
using TuTienLive.Scenes;

namespace TuTienLive.Editor
{
    public static class CharacterWorkshopVerification
    {
        public static void Capture()
        {
            EditorSceneManager.OpenScene(CharacterWorkshopEditor.ScenePath);
            var bindings = Object.FindAnyObjectByType<SectSceneBindings>();
            bindings.environment.Sample(0);
            Object.FindAnyObjectByType<CharacterWorkshop>().Sample(0);
            Canvas.ForceUpdateCanvases();
            var camera = bindings.cameraRig.GetComponent<Camera>();
            camera.aspect = 9f / 16f; camera.rect = new Rect(0, 0, 1, 1);
            string directory = Path.Combine(SectSceneSetup.RepositoryRoot(), "docs/unity-character-workshop");
            Directory.CreateDirectory(directory);
            var target = new RenderTexture(1080, 1920, 24, RenderTextureFormat.ARGB32, RenderTextureReadWrite.sRGB);
            target.Create(); var previous = RenderTexture.active; Texture2D image = null;
            try
            {
                foreach (var text in Object.FindObjectsByType<TextMesh>()) text.font.RequestCharactersInTexture(text.text, text.fontSize);
                var request = new UniversalRenderPipeline.SingleCameraRequest { destination = target };
                RenderPipeline.SubmitRenderRequest(camera, request); Canvas.ForceUpdateCanvases();
                RenderPipeline.SubmitRenderRequest(camera, request); RenderTexture.active = target;
                image = new Texture2D(1080, 1920, TextureFormat.RGB24, false);
                image.ReadPixels(new Rect(0, 0, 1080, 1920), 0, 0); image.Apply();
                File.WriteAllBytes(Path.Combine(directory, "workshop-1080x1920.png"), image.EncodeToPNG());
            }
            finally { RenderTexture.active = previous; if (image) Object.DestroyImmediate(image); target.Release(); Object.DestroyImmediate(target); }
            Debug.Log("CHARACTER_WORKSHOP_GPU_CAPTURE_PASS " + SystemInfo.graphicsDeviceName);
        }
    }
}
