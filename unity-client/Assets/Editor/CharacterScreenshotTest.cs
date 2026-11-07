using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using TuTienLive.Characters;
using TuTienLive.Network;
using TuTienLive.Scenes;

namespace TuTienLive.Editor
{
    public static class CharacterScreenshotTest
    {
        public static void Capture()
        {
            SectSceneSetup.CleanScenes();EditorSceneManager.OpenScene(SectSceneAuthoringMigration.PreferredScene,OpenSceneMode.Single);
            if(SystemInfo.graphicsDeviceType==GraphicsDeviceType.Null)throw new Exception("Actual GPU required");
            var manager=SectCharacterBootstrap.Install();manager.network.enabled=false;
            var directory=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/unity-scene-authoring/after");Directory.CreateDirectory(directory);
            var shots=new List<Shot>();
            foreach(var name in new[]{"players-10","players-500","ritual-start","ritual-strike","ritual-success","ritual-failure"})
            {
                var timer=System.Diagnostics.Stopwatch.StartNew();
                if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/Characters/"+name+".json"),out var e,out var error))throw new Exception(error);
                manager.ApplySnapshot(e.Snapshot,e.SessionId);manager.Sample(0,2);timer.Stop();
                foreach(int width in new[]{1080,720})
                {
                    int height=width*16/9;var camera=manager.scene.cameraRig.GetComponent<Camera>();
                    manager.scene.Sample(0);manager.scene.cameraRig.ConfigureViewport(width,height);
                    // A dedicated strike sample uses the same server interval, not a synthetic outcome.
                    if(name=="ritual-strike")manager.Sample(1800-(float)e.Snapshot.Breakthrough.ElapsedMs.Value,0);
                    var path=name+"-"+width+"x"+height+".png";Render(camera,width,height,Path.Combine(directory,path));
                    foreach(var view in manager.Views.Values)
                    {
                        if(!view.pose.Body.sprite||view.pose.Body.bounds.size.y<.01f)throw new Exception("Missing or empty original sprite: "+view.UserId);
                        var b=view.pose.Body.bounds;var min=camera.WorldToViewportPoint(b.min);var max=camera.WorldToViewportPoint(b.max);
                        if(min.x<0||min.y<0||max.x>1||max.y>1)throw new Exception("Character clipped: "+view.UserId);
                    }
                    var labels=manager.Views.Values.Select(v=>
                    {
                        v.nameLabel.ForceMeshUpdate();var b=v.nameLabel.GetComponent<MeshRenderer>().bounds;
                        var min=camera.WorldToViewportPoint(b.min);var max=camera.WorldToViewportPoint(b.max);
                        return new LabelBounds{x0=min.x,y0=min.y,x1=max.x,y1=max.y};
                    }).ToArray();
                    shots.Add(new Shot{file=path,players=manager.TotalPlayers,visible=manager.Views.Count,created=manager.CreatedCount,lightning=manager.tribulation.LightningVisible,cpuParseSyncMs=timer.Elapsed.TotalMilliseconds,nameplates=labels});
                }
            }
            File.WriteAllText(Path.Combine(directory,"screenshot-report.json"),JsonUtility.ToJson(new Report{device=SystemInfo.graphicsDeviceName,api=SystemInfo.graphicsDeviceType.ToString(),shots=shots.ToArray()},true));
            Debug.Log("TU_TIEN_STAGE04_GPU_CAPTURE_PASS "+shots.Count);
        }
        private static void Render(Camera camera,int width,int height,string path)
        {
            var target=new RenderTexture(width,height,24,RenderTextureFormat.ARGB32,RenderTextureReadWrite.sRGB);target.Create();
            var previous=RenderTexture.active;Texture2D image=null;
            try
            {
                foreach(var text in UnityEngine.Object.FindObjectsByType<TextMesh>())text.font.RequestCharactersInTexture(text.text,text.fontSize,FontStyle.Normal);
                var request=new UniversalRenderPipeline.SingleCameraRequest{destination=target};RenderPipeline.SubmitRenderRequest(camera,request);
                foreach(var layout in UnityEngine.Object.FindObjectsByType<SectTextLayout>())if(layout.autoFit)layout.Fit();
                RenderPipeline.SubmitRenderRequest(camera,request);RenderTexture.active=target;
                image=new Texture2D(width,height,TextureFormat.RGB24,false);image.ReadPixels(new Rect(0,0,width,height),0,0);image.Apply();File.WriteAllBytes(path,image.EncodeToPNG());
            }
            finally{RenderTexture.active=previous;if(image)UnityEngine.Object.DestroyImmediate(image);target.Release();UnityEngine.Object.DestroyImmediate(target);}
        }
        [Serializable] private class Report{public string device,api;public Shot[] shots;public string note="Actual GPU screenshots with backend fixture replay. cpuParseSyncMs is a one-off CPU parse/sync measurement, not gameplay FPS/GPU timing.";}
        [Serializable] private class Shot{public string file;public int players,visible,created;public bool lightning;public double cpuParseSyncMs;public LabelBounds[] nameplates;}
        [Serializable] private class LabelBounds{public float x0,y0,x1,y1;}
    }
}
