using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using UnityEngine;
using TuTienLive.Scenes;

namespace TuTienLive.UI
{
    // Opt-in QA component, serialized only into the disposable test/build scene.
    public sealed class SceneAuthoringProbe : MonoBehaviour
    {
        public SectSceneBindings bindings;
        public Transform temple,title;
        public Vector3 expectedPosition,expectedScale,expectedTitleScale;
        public Quaternion expectedRotation;
        private string path;
        private readonly HashSet<string> sessions=new HashSet<string>();
        private bool sawRitual,sawDisconnected,layoutValid=true,spritesValid=true;
        private int maxEffects,maxViews,maxCreated,errors,frames;
        private double start;
        private void Start()
        {
            path=NetworkTestProbe.Argument("--authoring-report");if(path==null){enabled=false;return;}
            start=Time.realtimeSinceStartupAsDouble;Application.logMessageReceived+=Log;
        }
        private void Log(string message,string stack,LogType type)
        {if((type==LogType.Exception||type==LogType.Error)&&stack.Contains("Scripts/"))errors++;}
        private void LateUpdate()
        {
            if(path==null)return;
            var manager=bindings.characters;var client=bindings.network;var state=client.State;if(state==null)return;
            frames++;if(state.SessionId!=null)sessions.Add(state.SessionId);
            sawRitual|=manager.tribulation.HasCeremony;sawDisconnected|=client.Status.StartsWith("Disconnected");
            maxEffects=Mathf.Max(maxEffects,manager.AcceptedEffects);maxViews=Mathf.Max(maxViews,manager.Views.Count);maxCreated=Mathf.Max(maxCreated,manager.CreatedCount);
            layoutValid&=Vector3.Distance(temple.localPosition,expectedPosition)<.0001f&&Vector3.Distance(temple.localScale,expectedScale)<.0001f&&Quaternion.Angle(temple.localRotation,expectedRotation)<.001f&&Vector3.Distance(title.localScale,expectedTitleScale)<.0001f;
            spritesValid&=manager.Views.Values.All(v=>v.pose.Body.sprite&&v.pose.Body.bounds.size.y>.01f&&v.nameLabel&&v.nameLabel.font);
            bool completed=sessions.Count==2&&manager.TotalPlayers==51&&manager.Views.Count>0&&sawRitual&&sawDisconnected&&maxEffects>0;
            var report=new Report{result=layoutValid&&spritesValid&&errors==0?"PASS":"FAIL",completed=completed,layoutValid=layoutValid,spritesValid=spritesValid,sawRitual=sawRitual,sawDisconnected=sawDisconnected,players=manager.TotalPlayers,views=manager.Views.Count,maxEffects=maxEffects,maxViews=maxViews,maxCreated=maxCreated,sessions=sessions.Count,errors=errors,frames=frames,seconds=Time.realtimeSinceStartupAsDouble-start,graphics=SystemInfo.graphicsDeviceType.ToString(),synchronized=state.IsSynchronized};
            File.WriteAllText(path,JsonUtility.ToJson(report,true));
            if(completed){enabled=false;if(!Application.isEditor)Application.Quit(report.result=="PASS"?0:3);}
        }
        private void OnDestroy(){Application.logMessageReceived-=Log;}
        [Serializable] private class Report{public string result,graphics;public bool completed,layoutValid,spritesValid,sawRitual,sawDisconnected,synchronized;public int players,views,maxEffects,maxViews,maxCreated,sessions,errors,frames;public double seconds;}
    }
}
