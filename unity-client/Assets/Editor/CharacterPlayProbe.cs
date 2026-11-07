using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Characters;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class CharacterPlayProbe
    {
        private const string Key="TuTien.Stage04.Probe";
        private static readonly HashSet<string> sessions=new HashSet<string>();
        private static int errors,maxViews,maxCreated,maxEffects;
        private static bool sawRitual,sawDisconnected;
        public static void Run()
        {
            SectSceneSetup.CleanScenes();EditorSceneManager.OpenScene(SectSceneAuthoringMigration.PreferredScene,OpenSceneMode.Single);
            SessionState.SetBool(Key,true);SessionState.SetFloat(Key+"Deadline",(float)EditorApplication.timeSinceStartup+150);
            EditorApplication.EnterPlaymode();
        }
        [InitializeOnLoadMethod] private static void Resume()
        {
            if(!SessionState.GetBool(Key,false))return;EditorApplication.update+=Poll;
            Application.logMessageReceived+=(message,stack,type)=>{if((type==LogType.Error||type==LogType.Exception)&&(stack.Contains("Scripts/Characters")||stack.Contains("Scripts/Effects")||stack.Contains("Scripts/Network")||stack.Contains("Scripts/Scenes")))errors++;};
        }
        private static void Poll()
        {
            if(EditorApplication.timeSinceStartup>SessionState.GetFloat(Key+"Deadline",0)){EditorApplication.Exit(2);return;}
            if(!EditorApplication.isPlaying)return;
            var manager=UnityEngine.Object.FindAnyObjectByType<CharacterManager>();if(!manager||manager.network.Protocol==null)return;
            var state=manager.network.State;if(state.SessionId!=null)sessions.Add(state.SessionId);
            if(manager.network.Status.StartsWith("Disconnected"))sawDisconnected=true;
            sawRitual|=manager.tribulation.HasCeremony;
            maxViews=Mathf.Max(maxViews,manager.Views.Count);maxCreated=Mathf.Max(maxCreated,manager.CreatedCount);
            maxEffects=Mathf.Max(maxEffects,manager.AcceptedEffects);
            string path=NetworkTestProbe.Argument("--character-report");if(path==null)return;
            bool validSprites=manager.Views.Values.All(v=>v.pose.Body.sprite&&v.pose.Body.bounds.size.y>.01f);
            bool completed=sessions.Count==2&&manager.TotalPlayers==51&&manager.Views.Count>0&&validSprites&&sawDisconnected&&sawRitual;
            var report=new Report{completed=completed,players=manager.TotalPlayers,views=manager.Views.Count,maxViews=maxViews,maxCreated=maxCreated,maxEffects=maxEffects,errors=errors,sessions=sessions.Count,sawRitual=sawRitual,sawDisconnected=sawDisconnected,synchronized=state.IsSynchronized,acceptedEffects=manager.AcceptedEffects,status=manager.network.Status};
            File.WriteAllText(path,JsonUtility.ToJson(report,true));
            if(completed){SessionState.SetBool(Key,false);EditorApplication.update-=Poll;EditorApplication.Exit(errors==0?0:3);}
        }
        [Serializable] private class Report{public bool completed,sawRitual,sawDisconnected,synchronized;public int players,views,maxViews,maxCreated,maxEffects,errors,sessions,acceptedEffects;public string status;}
    }
}
