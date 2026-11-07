using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Scenes;

namespace TuTienLive.Editor
{
    public static class SectPlayModeTest
    {
        private const string Key="TuTien.Stage03.PlayProbe";
        private static SectSceneController controller;
        private static Vector3 cloudStart;
        private static Mesh[] meshes;
        private static double started;
        private static int frames,runtimeErrors;
        private static bool initialized;
        [MenuItem("Tu Tien LIVE/Stage 03/Play Mode smoke (5 seconds)")]
        public static void Run()
        {
            SectSceneSetup.CleanScenes();EditorSceneManager.OpenScene(SectSceneAuthoringMigration.PreferredScene,OpenSceneMode.Single);
            SessionState.SetBool(Key,true);SessionState.SetFloat(Key+"Deadline",(float)EditorApplication.timeSinceStartup+90);
            EditorApplication.EnterPlaymode();
        }
        [InitializeOnLoadMethod] private static void Resume()
        {
            if(!SessionState.GetBool(Key,false))return;
            EditorApplication.update+=Poll;
            Application.logMessageReceived+=(message,stack,type)=>{if((type==LogType.Exception||type==LogType.Error)&&stack.Contains("Scripts/Scenes"))runtimeErrors++;};
        }
        private static void Poll()
        {
            if(EditorApplication.timeSinceStartup>SessionState.GetFloat(Key+"Deadline",0)){Finish("FAIL timeout");return;}
            if(!EditorApplication.isPlaying)return;
            if(!initialized)
            {
                controller=UnityEngine.Object.FindAnyObjectByType<SectSceneController>();if(!controller)return;
                started=Time.realtimeSinceStartupAsDouble;cloudStart=controller.layers.Single(l=>l.motion==SectMotion.Cloud).transform.position;
                meshes=controller.layers.Select(l=>l.GetComponent<MeshFilter>().sharedMesh).ToArray();initialized=true;
            }
            frames++;if(Time.realtimeSinceStartupAsDouble-started<5)return;
            bool moved=Vector3.Distance(cloudStart,controller.layers.Single(l=>l.motion==SectMotion.Cloud).transform.position)>.001f;
            bool stable=controller.layers.Select((l,i)=>ReferenceEquals(l.GetComponent<MeshFilter>().sharedMesh,meshes[i])).All(v=>v);
            bool inside=true;var camera=controller.cameraRig.GetComponent<Camera>();
            foreach(var layer in controller.layers.Where(l=>l.protectFromClipping))
            {
                var b=layer.ContentBounds;var min=camera.WorldToViewportPoint(b.min);var max=camera.WorldToViewportPoint(b.max);
                inside&=min.x>=0&&min.y>=0&&max.x<=1&&max.y<=1;
            }
            Finish(moved&&stable&&inside&&runtimeErrors==0?"PASS":"FAIL");
        }
        private static void Finish(string result)
        {
            var report=new Report {result=result,seconds=initialized?Time.realtimeSinceStartupAsDouble-started:0,editorUpdateSamples=frames,
                runtimeErrors=runtimeErrors,playing=EditorApplication.isPlaying,graphics=SystemInfo.graphicsDeviceType.ToString(),
                note="Five-second actual Editor Play Mode lifecycle/Update smoke; editorUpdateSamples is not gameplay FPS. No Node/LIVE connection."};
            var path=Path.Combine(SectSceneSetup.RepositoryRoot(),"test-results/unity-stage03/playmode-report.json");
            File.WriteAllText(path,JsonUtility.ToJson(report,true)+"\n");SessionState.SetBool(Key,false);EditorApplication.update-=Poll;
            Debug.Log("TU_TIEN_STAGE03_PLAYMODE_"+result);
            if(Application.isBatchMode)EditorApplication.Exit(result=="PASS"?0:1);else EditorApplication.isPlaying=false;
        }
        [Serializable] private sealed class Report {public string result,graphics,note;public double seconds;public int editorUpdateSamples,runtimeErrors;public bool playing;}
    }
}
