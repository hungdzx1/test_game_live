using System;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using TuTienLive.Audio;
using TuTienLive.Scenes;

namespace TuTienLive.Editor
{
    public static class GameAudioSetup
    {
        [MenuItem("Tu Tien LIVE/Audio/Add audio manager to current scene")]
        public static void AddToCurrentScene()
        {
            var manager=Install(SceneManager.GetActiveScene());Selection.activeGameObject=manager.gameObject;
            EditorSceneManager.MarkSceneDirty(manager.gameObject.scene);
        }
        public static GameAudioManager Install(Scene scene)
        {
            var existing=scene.GetRootGameObjects().SelectMany(g=>g.GetComponentsInChildren<GameAudioManager>(true)).ToArray();
            if(existing.Length>1)throw new InvalidOperationException("More than one GameAudioManager; preserve scene and resolve duplicates first.");
            if(existing.Length==1)return existing[0]; // Never replace the user's assigned clips/settings.
            var bindings=scene.GetRootGameObjects().SelectMany(g=>g.GetComponentsInChildren<SectSceneBindings>(true)).Single();
            var clips=new[]{"BGM.mp3","Sfx_banphuc.mp3","sfx_SDokiep.mp3","sfx_lv_up_TM.mp3","sfx_fly.wav"}
                .Select(file=>AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/Musics/"+file)).ToArray();
            if(clips.Any(c=>!c))throw new InvalidOperationException("Missing audio in Assets/Musics. No external assets will be downloaded.");
            var root=new GameObject("GameAudioManager");Undo.RegisterCreatedObjectUndo(root,"Add game audio");
            SceneManager.MoveGameObjectToScene(root,scene);root.transform.SetParent(bindings.network.transform.parent,false);
            var manager=root.AddComponent<GameAudioManager>();manager.network=bindings.network;manager.characters=bindings.characters;
            manager.bgm=clips[0];manager.banPhuc=clips[1];manager.breakthroughSuccess=clips[2];manager.sectLevelUp=clips[3];manager.fly=clips[4];
            manager.musicSource=root.AddComponent<AudioSource>();manager.musicSource.playOnAwake=false;manager.musicSource.loop=true;manager.musicSource.spatialBlend=0;manager.musicSource.volume=0;
            if(!scene.GetRootGameObjects().SelectMany(g=>g.GetComponentsInChildren<AudioListener>(true)).Any(l=>l.enabled))root.AddComponent<AudioListener>();
            EditorUtility.SetDirty(manager);return manager;
        }
        public static void UpgradeValidation()
        {
            string expected=System.IO.Path.Combine(SectSceneSetup.RepositoryRoot(),"test-results/unity-concept02/project/Assets");
            if(!string.Equals(System.IO.Path.GetFullPath(Application.dataPath),System.IO.Path.GetFullPath(expected),StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Use isolated validation project.");
            SectSceneSetup.CleanScenes();
            foreach(var path in new[]{"Assets/Scenes/SectScene_Main.unity","Assets/Scenes/SectScene_Concept02.unity"})
            {var scene=EditorSceneManager.OpenScene(path);Install(scene);EditorSceneManager.MarkSceneDirty(scene);EditorSceneManager.SaveScene(scene);}
            AssetDatabase.SaveAssets();Debug.Log("GAME_AUDIO_SETUP_PASS");
        }
    }
}
