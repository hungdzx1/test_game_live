using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Characters;

namespace TuTienLive.Editor
{
    public static class CharacterVariantVerification
    {
        // Only edit the disposable validation copy; publishing applies just the new YAML field.
        public static void ConfigureValidation()
        {
            string expected=Path.Combine(SectSceneSetup.RepositoryRoot(),"test-results/unity-concept02/project/Assets");
            if(!string.Equals(Path.GetFullPath(Application.dataPath),Path.GetFullPath(expected),StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Use the isolated Concept02 validation project.");
            SectSceneSetup.CleanScenes();EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);
            var manager=UnityEngine.Object.FindAnyObjectByType<CharacterManager>();
            manager.characterVariants=Enumerable.Range(1,3).Select(i=>AssetDatabase.LoadAssetAtPath<CharacterView>(Concept02SceneSetup.Root+"Prefabs/Character_"+i+".prefab")).ToArray();
            if(manager.characterVariants.Any(v=>!v))throw new InvalidOperationException("Missing variant prefab.");
            EditorUtility.SetDirty(manager);EditorSceneManager.MarkSceneDirty(manager.gameObject.scene);
            EditorSceneManager.SaveScene(manager.gameObject.scene);AssetDatabase.SaveAssets();
            Debug.Log("CHARACTER_VARIANTS_CONFIGURED");
        }
    }
}
