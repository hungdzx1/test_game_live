using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using TuTienLive.Scenes;

namespace TuTienLive.Editor
{
    public static class SectScreenshotTest
    {
        [MenuItem("Tu Tien LIVE/Stage 03/Screenshot test (actual GPU)")]
        public static void Capture()
        {
            SectSceneSetup.CleanScenes();
            EditorSceneManager.OpenScene(SectSceneSetup.ScenePath, OpenSceneMode.Single);
            if (SystemInfo.graphicsDeviceType == GraphicsDeviceType.Null) throw new InvalidOperationException("GPU required; remove -nographics. Do not claim screenshots from config tests.");
            var controller = UnityEngine.Object.FindAnyObjectByType<SectSceneController>();
            var directory = Path.Combine(SectSceneSetup.RepositoryRoot(),"test-results/unity-stage03"); Directory.CreateDirectory(directory);
            var shots = new List<Shot>();
            foreach (SectQuality quality in Enum.GetValues(typeof(SectQuality)))
            {
                controller.quality = quality;
                shots.Add(Render(controller, 1080, 1920, 0, directory));
                shots.Add(Render(controller, 720, 1280, 0, directory));
            }
            controller.quality = SectQuality.Medium;
            shots.Add(Render(controller, 1080, 1920, 20, directory));
            shots.Add(Render(controller, 1080, 1920, 60, directory));
            var report = new Report { result = "PASS", unity = Application.unityVersion, device = SystemInfo.graphicsDeviceName,
                graphicsApi = SystemInfo.graphicsDeviceType.ToString(), shots = shots.ToArray(),
                note = "Actual Unity URP camera render requests. captureRenderMs is CPU wall time around warmed SubmitRenderRequest, excluding ReadPixels/GPU readback; not GPU frame time, gameplay FPS or an OBS benchmark." };
            File.WriteAllText(Path.Combine(directory,"screenshot-report.json"),JsonUtility.ToJson(report,true)+"\n");
            Debug.Log("TU_TIEN_STAGE03_SCREENSHOTS_PASS " + shots.Count);
        }
        private static Shot Render(SectSceneController controller,int width,int height,float time,string directory)
        {
            var rig=controller.cameraRig;var camera=rig.GetComponent<Camera>();
            foreach(var layer in controller.layers) layer.ApplyLayout();
            controller.Sample(time);rig.ConfigureViewport(width,height);rig.Sample(time);
            var bounds=new List<ContentCheck>();
            foreach(var layer in controller.layers.Where(l=>l.gameObject.activeInHierarchy&&l.GetComponent<MeshRenderer>().enabled))
            {
                if(layer.allowFrameBleed)continue;
                var b=layer.ContentBounds;var min=camera.WorldToViewportPoint(b.min);var max=camera.WorldToViewportPoint(b.max);
                bool visible=min.x>=0&&min.y>=0&&max.x<=1&&max.y<=1;
                bounds.Add(new ContentCheck {layer=layer.name,viewport=new[]{min.x,min.y,max.x,max.y},inside=visible});
                if(!visible)throw new InvalidOperationException("Important sprite clipped: "+layer.name);
            }
            var target=new RenderTexture(width,height,24,RenderTextureFormat.ARGB32,RenderTextureReadWrite.sRGB) {antiAliasing=1};target.Create();
            var previous=RenderTexture.active;Texture2D image=null;
            string file=$"sect-{controller.quality.ToString().ToLowerInvariant()}-{width}x{height}-t{time:0}.png";
            try
            {
                foreach(var text in UnityEngine.Object.FindObjectsByType<TextMesh>())text.font.RequestCharactersInTexture(text.text,text.fontSize,FontStyle.Normal);
                var request=new UniversalRenderPipeline.SingleCameraRequest {destination=target};
                // Warm URP shaders and dynamic font atlas, then capture a second real render.
                RenderPipeline.SubmitRenderRequest(camera,request);
                foreach(var text in UnityEngine.Object.FindObjectsByType<SectTextLayout>())text.Fit();
                foreach(var text in UnityEngine.Object.FindObjectsByType<SectTextLayout>())
                {
                    var b=text.GetComponent<MeshRenderer>().bounds;var min=camera.WorldToViewportPoint(b.min);var max=camera.WorldToViewportPoint(b.max);
                    if(min.x<0||min.y<0||max.x>1||max.y>1)throw new InvalidOperationException("HUD text clipped: "+text.name);
                }
                var timer=System.Diagnostics.Stopwatch.StartNew();RenderPipeline.SubmitRenderRequest(camera,request);timer.Stop();
                RenderTexture.active=target;image=new Texture2D(width,height,TextureFormat.RGB24,false);
                image.ReadPixels(new Rect(0,0,width,height),0,0);image.Apply();
                File.WriteAllBytes(Path.Combine(directory,file),image.EncodeToPNG());
                var pixels=image.GetPixels32();int nonBlack=pixels.Count(p=>p.r>8||p.g>8||p.b>8);
                if(nonBlack<pixels.Length/2)throw new InvalidOperationException("Render is mostly black; inspect GPU/import/shader errors.");
                var textures=controller.layers.Where(l=>l.gameObject.activeInHierarchy&&l.GetComponent<MeshRenderer>().enabled).Select(l=>l.sourceSprite.texture).Distinct().ToArray();
                return new Shot {file=file,width=width,height=height,time=time,quality=controller.quality.ToString(),halfHeight=rig.RequiredHalfHeight,
                    visiblePngPlanes=controller.layers.Count(l=>l.gameObject.activeInHierarchy&&l.GetComponent<MeshRenderer>().enabled),
                    uniquePngTextures=textures.Length,rgbaTextureBytes=textures.Sum(t=>(long)t.width*t.height*4),captureRenderMs=timer.Elapsed.TotalMilliseconds,importantContent=bounds.ToArray()};
            }
            finally {RenderTexture.active=previous;if(image)UnityEngine.Object.DestroyImmediate(image);target.Release();UnityEngine.Object.DestroyImmediate(target);}
        }
        [Serializable] private sealed class Report { public string result,unity,device,graphicsApi,note;public Shot[] shots; }
        [Serializable] private sealed class Shot {public string file,quality;public int width,height,visiblePngPlanes,uniquePngTextures;public float time,halfHeight;public long rgbaTextureBytes;public double captureRenderMs;public ContentCheck[] importantContent;}
        [Serializable] private sealed class ContentCheck {public string layer;public float[] viewport;public bool inside;}
    }
}
