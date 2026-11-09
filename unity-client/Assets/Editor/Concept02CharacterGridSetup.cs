using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Characters;
using TuTienLive.Network;
using TuTienLive.Scenes;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class Concept02CharacterGridSetup
    {
        private const string Fourth = "Assets/SectConcept02/Prefabs/Character_4.prefab";
        // Pixel positions in the fixed 1080 x 1920 portrait composition, back row first.
        public static void ConfigureSeats(CharacterManager manager)
        {
            var parent = manager.seats[0].parent;
            var previous = manager.seats;
            var seats = new Transform[25];
            for (int i = 0; i < seats.Length; i++)
            {
                seats[i] = i < previous.Length ? previous[i] : new GameObject("Seat_" + i.ToString("00")).transform;
                seats[i].SetParent(parent, true);
                seats[i].name = "Seat_" + i.ToString("00");
                seats[i].position = new Vector3((140 + i % 5 * 200 - 540) / 100f, (960 - (1120 + i / 5 * 160)) / 100f, 8);
            }
            manager.seats = seats;
            manager.visibleCharacterLimit = 25;
        }
        public static int AlphaHeight(string path)
        {
            var texture = new Texture2D(2, 2);
            try
            {
                if (!ImageConversion.LoadImage(texture, File.ReadAllBytes(path))) throw new IOException(path);
                var pixels = texture.GetPixels32(); int bottom = texture.height, top = -1;
                for (int y = 0; y < texture.height; y++)
                    for (int x = 0; x < texture.width; x++)
                        if (pixels[y * texture.width + x].a >= 32) { bottom = Math.Min(bottom, y); top = Math.Max(top, y); }
                if (top < bottom) throw new InvalidOperationException("Empty character: " + path);
                return top - bottom + 1;
            }
            finally { UnityEngine.Object.DestroyImmediate(texture); }
        }
        // Run in a disposable copy; never automatically overwrite an authored prefab.
        public static void ApplyValidation()
        {
            if (!Application.dataPath.Replace('\\', '/').EndsWith("/test-results/unity-concept02/project/Assets", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Use the isolated validation project.");
            EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);
            var manager = UnityEngine.Object.FindAnyObjectByType<CharacterManager>();
            if (!File.Exists(Fourth))
            {
                var template = AssetDatabase.LoadAssetAtPath<CharacterView>(Concept02SceneSetup.Root + "Prefabs/Character_3.prefab");
                var instance = (GameObject)PrefabUtility.InstantiatePrefab(template.gameObject);
                try
                {
                    instance.name = "Character_4";
                    var view = instance.GetComponent<CharacterView>();
                    string art = Concept02SceneSetup.ArtRoot + "Characters/Character_4/";
                    view.pose.meditate = AssetDatabase.LoadAssetAtPath<Sprite>(art + "meditation.png");
                    view.pose.fly = AssetDatabase.LoadAssetAtPath<Sprite>(art + "fly.png");
                    view.pose.attack = AssetDatabase.LoadAssetAtPath<Sprite>(art + "attack.png");
                    view.pose.celebrate = AssetDatabase.LoadAssetAtPath<Sprite>(art + "celebrate.png");
                    view.pose.idleStand = view.pose.backThreeQuarter = view.pose.meditateThreeQuarter = view.pose.meditate;
                    view.pose.Body.sprite = view.pose.meditate;
                    instance.transform.localScale *= (float)AlphaHeight(AssetDatabase.GetAssetPath(template.pose.meditate)) / AlphaHeight(art + "meditation.png");
                    PrefabUtility.RecordPrefabInstancePropertyModifications(view.pose);
                    PrefabUtility.RecordPrefabInstancePropertyModifications(view.pose.Body);
                    PrefabUtility.RecordPrefabInstancePropertyModifications(instance.transform);
                    PrefabUtility.SaveAsPrefabAsset(instance, Fourth);
                }
                finally { UnityEngine.Object.DestroyImmediate(instance); }
            }
            manager.characterVariants = Enumerable.Range(1, 4).Select(i => AssetDatabase.LoadAssetAtPath<CharacterView>(Concept02SceneSetup.Root + "Prefabs/Character_" + i + ".prefab")).ToArray();
            ConfigureSeats(manager);
            EditorSceneManager.MarkSceneDirty(manager.gameObject.scene);
            EditorSceneManager.SaveScene(manager.gameObject.scene);
            AssetDatabase.SaveAssets();
            Debug.Log("CHARACTER4_GRID25_CONFIGURED");
        }
        public static void Capture()
        {
            EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);
            var b = UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();
            b.network.enabled = false;
            if (!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/Characters/players-25.json"), out var envelope, out var error)) throw new InvalidOperationException(error);
            b.characters.ApplySnapshot(envelope.Snapshot, envelope.SessionId); b.characters.Sample(0, 0);
            b.environment.Sample(0);
            UnityEngine.Object.FindAnyObjectByType<Concept02Hud>().Render(envelope.Snapshot);
            UnityEngine.Object.FindAnyObjectByType<BlessingPanelHud>().Render(envelope.Snapshot);
            foreach (var view in b.characters.Views.Values) view.nameLabel.ForceMeshUpdate();
            string output = Path.Combine(SectSceneSetup.RepositoryRoot(), "docs/unity-character4-grid"); Directory.CreateDirectory(output);
            float[] heights = b.characters.characterVariants.Select(v => AlphaHeight(AssetDatabase.GetAssetPath(v.pose.meditate)) / v.pose.meditate.pixelsPerUnit * v.pose.transform.lossyScale.y).ToArray();
            if (heights.Any(h => Mathf.Abs(h - heights[2]) > .001f)) throw new InvalidOperationException("Character visible heights differ.");
            Concept02Verification.CaptureCamera(b.cameraRig.GetComponent<Camera>(), 1080, 1920, Path.Combine(output, "roster-25.png"));
            if (b.characters.Views.Count != 25) throw new InvalidOperationException("Expected 25 visible characters.");
            File.WriteAllText(Path.Combine(output, "capture-report.json"), new Newtonsoft.Json.Linq.JObject {
                ["result"]="PASS", ["visibleCharacters"]=b.characters.Views.Count, ["variants"]=b.characters.characterVariants.Length,
                ["uniqueSeats"]=b.characters.Views.Values.Select(v=>v.Seat).Distinct().Count(),
                ["visibleHeights"]=new Newtonsoft.Json.Linq.JArray(heights), ["gpu"]=SystemInfo.graphicsDeviceName
            }.ToString());
            Debug.Log("CHARACTER4_GRID25_GPU_CAPTURE_PASS " + SystemInfo.graphicsDeviceName);
        }
    }
}
