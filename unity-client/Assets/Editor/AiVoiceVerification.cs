using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace TuTienLive.Editor
{
    public static class AiVoiceVerification
    {
        public static void BuildWindows()
        {
            string root=SectSceneSetup.RepositoryRoot();
            string expected=Path.GetFullPath(Path.Combine(root,"test-results/unity-concept02/project/Assets"));
            if(!string.Equals(Path.GetFullPath(Application.dataPath),expected,StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Build verification requires the isolated project.");
            string output=Path.Combine(root,"test-results/ai-voice/build/TuTienLive.exe");Directory.CreateDirectory(Path.GetDirectoryName(output));
            var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{"Assets/Scenes/SectScene_Concept02.unity"},locationPathName=output,target=BuildTarget.StandaloneWindows64,options=BuildOptions.Development});
            var evidence=new Evidence{result=report.summary.result.ToString(),errors=report.summary.totalErrors,warnings=report.summary.totalWarnings,bytes=report.summary.totalSize,path=output};
            File.WriteAllText(Path.Combine(root,"test-results/ai-voice/build-report.json"),JsonUtility.ToJson(evidence,true));
            if(report.summary.result!=BuildResult.Succeeded)throw new InvalidOperationException("Voice Windows build failed");
        }
        [Serializable] private class Evidence{public string result,path;public int errors,warnings;public ulong bytes;}
    }
}
