using System;
using System.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Characters;
using System.Collections;
using UnityEngine.TestTools;

namespace TuTienLive.Tests
{
    public sealed class CharacterWorkshopTests
    {
        [UnityTest] public IEnumerator LocalPreviewRunsInPlayWithoutServer()
        {
            EditorSceneManager.OpenScene("Assets/Scenes/CharacterWorkshop.unity");
            yield return new EnterPlayMode();
            var w = UnityEngine.Object.FindAnyObjectByType<CharacterWorkshop>();
            w.characters[0].previewPose = "fly";
            yield return null;
            bool valid = w.Generated.Count == 3 && w.Generated[0].pose.Pose == "fly"
                && w.Generated[0].nameLabel.text.Contains(w.characters[0].displayName)
                && !UnityEngine.Object.FindAnyObjectByType<TuTienLive.Network.UnityWebSocketClient>().enabled;
            yield return new ExitPlayMode();
            EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Editable.unity");
            Assert.That(valid, Is.True);
        }

        [Test] public void ReducingCountPreservesSpriteInputs()
        {
            var go = new GameObject();
            try
            {
                var w = go.AddComponent<CharacterWorkshop>(); w.characterCount = 4; w.ResizeEntries();
                w.characters[3].displayName = "Keep me"; w.characterCount = 1; w.ResizeEntries();
                w.characterCount = 4; w.ResizeEntries(); Assert.That(w.characters[3].displayName, Is.EqualTo("Keep me"));
                w.characterCount = 999; w.ResizeEntries(); Assert.That(w.characterCount, Is.EqualTo(100));
            }
            finally { UnityEngine.Object.DestroyImmediate(go); }
        }

        [Test] public void OptionalSpritesFallBackAndNameplateTransformIsPreserved()
        {
            var prefab = AssetDatabase.LoadAssetAtPath<CharacterView>("Assets/SceneAuthoring/Prefabs/CharacterSample.prefab");
            var view = UnityEngine.Object.Instantiate(prefab);
            try
            {
                var entry = new WorkshopCharacter { idle = prefab.pose.idleStand, displayName = "Thanh Vân", subtitle = "Preview" };
                var position = new Vector3(.3f, 2, .1f); view.nameLabel.transform.localPosition = position;
                entry.Apply(view); view.pose.Sample("fly", 1);
                Assert.That(view.pose.Body.sprite, Is.SameAs(entry.idle));
                Assert.That(view.nameLabel.text, Is.EqualTo("Thanh Vân\nPreview"));
                Assert.That(view.nameLabel.transform.localPosition, Is.EqualTo(position));
            }
            finally { UnityEngine.Object.DestroyImmediate(view.gameObject); }
        }

        [Test] public void WorkshopHasSerializedInstancesAndNoEnabledServerConnection()
        {
            EditorSceneManager.OpenScene("Assets/Scenes/CharacterWorkshop.unity");
            try
            {
                var w = UnityEngine.Object.FindAnyObjectByType<CharacterWorkshop>();
                Assert.That(w.Generated.Count, Is.EqualTo(3)); Assert.That(w.samplePrefab, Is.Not.Null);
                Assert.That(w.GetComponentInParent<CharacterManager>().enabled, Is.False);
                Assert.That(UnityEngine.Object.FindAnyObjectByType<TuTienLive.Network.UnityWebSocketClient>().enabled, Is.False);
                var editorType = AppDomain.CurrentDomain.GetAssemblies().Select(a => a.GetType("TuTienLive.Editor.CharacterWorkshopEditor")).First(t => t != null);
                editorType.GetMethod("Generate").Invoke(null, new object[] { w });
                editorType.GetMethod("Generate").Invoke(null, new object[] { w });
                Assert.That(w.generatedRoot.childCount, Is.EqualTo(3));
                var view = w.Generated[0]; var position = view.transform.position + Vector3.right; view.transform.position = position;
                w.Sample(1); Assert.That(view.transform.position, Is.EqualTo(position));
            }
            finally { EditorSceneManager.OpenScene("Assets/Scenes/SectScene_Editable.unity"); }
        }
    }
}
