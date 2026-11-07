using System;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Characters;
using TuTienLive.Scenes;
using TMPro;
using UnityEngine.UI;

namespace TuTienLive.Editor
{
    [CustomEditor(typeof(CharacterWorkshop))]
    public sealed class CharacterWorkshopEditor : UnityEditor.Editor
    {
        public override void OnInspectorGUI()
        {
            DrawDefaultInspector();
            var workshop = (CharacterWorkshop)target;
            EditorGUILayout.HelpBox("Local preview only. 1: choose count, 2: resize list, 3: assign sprites, 4: generate. Generated Transform edits are kept until you explicitly regenerate. Stop Play before saving.", MessageType.Info);
            using (new EditorGUI.DisabledScope(Application.isPlaying))
            {
                if (GUILayout.Button("1 - Resize character list (keep existing inputs)"))
                { Undo.RecordObject(workshop, "Resize preview list"); workshop.ResizeEntries(); EditorUtility.SetDirty(workshop); }
                if (GUILayout.Button("2 - Generate / Apply characters")) Generate(workshop);
                if (GUILayout.Button("Clear generated preview")) Clear(workshop);
            }
        }

        public static void Clear(CharacterWorkshop workshop)
        {
            Undo.RecordObject(workshop, "Clear character preview");
            // Only delete registered instances, never unrelated children or server characters.
            foreach (var view in workshop.Generated) if (view) Undo.DestroyObjectImmediate(view.gameObject);
            workshop.ForgetGenerated(); EditorUtility.SetDirty(workshop);
        }

        public static void Generate(CharacterWorkshop workshop)
        {
            if (Application.isPlaying) throw new InvalidOperationException("Stop Play before generating.");
            if (!workshop.samplePrefab || !workshop.generatedRoot) throw new InvalidOperationException("Assign Sample Prefab and Generated Root first.");
            workshop.ResizeEntries();
            for (int i = 0; i < workshop.characterCount; i++)
                if (!workshop.characters[i].idle) throw new InvalidOperationException("Character " + (i + 1) + ": assign Idle sprite before generating.");
            Undo.IncrementCurrentGroup(); int group = Undo.GetCurrentGroup();
            Clear(workshop);
            for (int i = 0; i < workshop.characterCount; i++)
            {
                var go = (GameObject)PrefabUtility.InstantiatePrefab(workshop.samplePrefab.gameObject, workshop.generatedRoot);
                Undo.RegisterCreatedObjectUndo(go, "Generate preview character");
                go.name = "Preview " + (i + 1) + " - " + workshop.characters[i].displayName;
                go.transform.position = workshop.PositionFor(i);
                var view = go.GetComponent<CharacterView>(); workshop.characters[i].Apply(view); workshop.Register(view);
                foreach (var component in go.GetComponentsInChildren<Component>(true))
                    if (component) PrefabUtility.RecordPrefabInstancePropertyModifications(component);
            }
            // Sample only in Play, avoiding serialized animation offsets in the saved scene.
            EditorUtility.SetDirty(workshop); EditorSceneManager.MarkSceneDirty(workshop.gameObject.scene);
            Undo.CollapseUndoOperations(group);
        }

        public const string ScenePath = "Assets/Scenes/CharacterWorkshop.unity";
        public const string PrefabPath = "Assets/SceneAuthoring/Prefabs/CharacterSample.prefab";

        [MenuItem("Tu Tien LIVE/Characters/Open Character Workshop")]
        public static void OpenOrCreate()
        {
            if (Application.isPlaying) throw new InvalidOperationException("Stop Play first.");
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            if (System.IO.File.Exists(ScenePath)) { EditorSceneManager.OpenScene(ScenePath); return; }
            if (!System.IO.File.Exists(PrefabPath)) CreateSamplePrefab();
            if (!AssetDatabase.CopyAsset(SectSceneAuthoringMigration.ScenePath, ScenePath)) throw new InvalidOperationException("Cannot create workshop scene.");
            EditorSceneManager.OpenScene(ScenePath);
            var bindings = UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();
            bindings.characters.enabled = false; bindings.network.enabled = false; bindings.roster.enabled = false;
            if (bindings.roster.label) bindings.roster.label.text = "XƯỞNG NHÂN VẬT — không kết nối server";
            var go = new GameObject("Character Workshop - select me"); go.transform.SetParent(bindings.groups[3], false);
            var workshop = go.AddComponent<CharacterWorkshop>();
            workshop.samplePrefab = AssetDatabase.LoadAssetAtPath<CharacterView>(PrefabPath);
            workshop.seats = bindings.characters.seats;
            var root = new GameObject("Preview Characters").transform; root.SetParent(go.transform, false); workshop.generatedRoot = root;
            workshop.ResizeEntries();
            foreach (var entry in workshop.characters)
            {
                var pose = workshop.samplePrefab.pose;
                entry.idle = pose.idleStand; entry.fly = pose.fly; entry.attack = pose.attack; entry.meditate = pose.meditate;
                entry.celebrate = pose.celebrate; entry.backThreeQuarter = pose.backThreeQuarter; entry.meditateThreeQuarter = pose.meditateThreeQuarter;
            }
            Generate(workshop); EditorSceneManager.SaveScene(go.scene); AssetDatabase.SaveAssets(); Selection.activeGameObject = go;
            Debug.Log("CHARACTER_WORKSHOP_CREATED: " + ScenePath);
        }

        private static void CreateSamplePrefab()
        {
            // A new variant; never rewrite the production prefab or its original PNGs.
            var source = AssetDatabase.LoadAssetAtPath<CharacterView>(SectSceneAuthoringMigration.CharacterPath);
            var instance = (GameObject)PrefabUtility.InstantiatePrefab(source.gameObject);
            try
            {
                var view = instance.GetComponent<CharacterView>();
                var previous = view.nameLabel; previous.gameObject.SetActive(false);
                var canvasGo = new GameObject("Nameplate Canvas", typeof(RectTransform), typeof(Canvas));
                canvasGo.transform.SetParent(instance.transform, false);
                canvasGo.transform.localPosition = previous.transform.localPosition;
                canvasGo.transform.localScale = Vector3.one * .01f;
                ((RectTransform)canvasGo.transform).sizeDelta = new Vector2(200, 56);
                var canvas = canvasGo.GetComponent<Canvas>(); canvas.renderMode = RenderMode.WorldSpace;
                canvas.overrideSorting = true; canvas.sortingLayerName = "SectCharacters"; canvas.sortingOrder = 30;
                var card = new GameObject("Name Card", typeof(RectTransform), typeof(Image));
                card.transform.SetParent(canvasGo.transform, false);
                var cardRect = (RectTransform)card.transform; cardRect.anchorMin = Vector2.zero; cardRect.anchorMax = Vector2.one; cardRect.sizeDelta = Vector2.zero;
                var image = card.GetComponent<Image>(); image.color = new Color(.025f, .06f, .12f, .85f); image.raycastTarget = false;
                var labelGo = new GameObject("Name Text", typeof(RectTransform), typeof(TextMeshProUGUI));
                labelGo.transform.SetParent(canvasGo.transform, false);
                var labelRect = (RectTransform)labelGo.transform; labelRect.anchorMin = Vector2.zero; labelRect.anchorMax = Vector2.one; labelRect.offsetMin = new Vector2(4, 2); labelRect.offsetMax = new Vector2(-4, -2);
                var label = labelGo.GetComponent<TextMeshProUGUI>(); label.font = previous.font;
                label.fontSize = 20; label.enableAutoSizing = true; label.fontSizeMin = 10; label.fontSizeMax = 20;
                label.alignment = TextAlignmentOptions.Center; label.color = previous.color; label.raycastTarget = false; label.richText = false;
                label.text = "Nhân vật mẫu\nPhàm Nhân"; view.nameLabel = label;
                PrefabUtility.SaveAsPrefabAsset(instance, PrefabPath);
            }
            finally { UnityEngine.Object.DestroyImmediate(instance); }
        }
    }
}
