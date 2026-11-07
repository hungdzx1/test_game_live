using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.SceneManagement;
using TuTienLive.Scenes;

namespace TuTienLive.Editor
{
    public static class SectSceneSetup
    {
        public const string ScenePath = "Assets/Scenes/SectScene.unity";
        public const string ArtRoot = "Assets/Art/Sect/";
        private const string MaterialRoot = "Assets/Materials/Sect/";
        public static readonly string[] SortingLayers = { "SectBackground", "SectArchitecture", "SectPlatform", "SectGround", "SectGroundDetail", "SectCharacters", "SectForeground", "SectAtmosphere", "SectHUD" };
        private static AssetAudit audit;
        private static readonly List<SectLayer> layers = new List<SectLayer>();

        [MenuItem("Tu Tien LIVE/Stage 03/Import PNG and create SectScene (once)")]
        public static void Create()
        {
            CleanScenes();
            if (File.Exists(ScenePath)) { SectSceneAuthoringMigration.Migrate(); return; }
            audit = JsonUtility.FromJson<AssetAudit>(File.ReadAllText(ArtRoot + "asset-audit.json"));
            Directory.CreateDirectory(MaterialRoot); AssetDatabase.Refresh();
            foreach (var entry in audit.assets) Import(entry);
            AddSortingLayers();
            layers.Clear();
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var root = new GameObject("SectScene — PNG 2.5D");
            var controller = root.AddComponent<SectSceneController>();
            var cameraObject = new GameObject("CameraRig — 1080 x 1920"); cameraObject.transform.SetParent(root.transform);
            var camera = cameraObject.AddComponent<Camera>(); camera.tag = "MainCamera";
            camera.orthographic = true; camera.orthographicSize = 9.6f; camera.nearClipPlane = .1f; camera.farClipPlane = 100;
            camera.clearFlags = CameraClearFlags.SolidColor; camera.backgroundColor = new Color(.025f, .055f, .1f);
            camera.allowHDR = false; camera.allowMSAA = false;
            camera.GetUniversalAdditionalCameraData().renderPostProcessing = false;
            var rig = cameraObject.AddComponent<CameraRig>(); controller.cameraRig = rig;
            var background = Group(root, "01 Background");
            CanvasLayer(background, "Sky", "Background layers/bg_sky.png", 0, 1.04f);
            CanvasLayer(background, "Clouds far", "Background layers/bg_cloud_far.png", 10).opacity = .5f;
            layers.Last().motion = SectMotion.Cloud; layers.Last().parallax = .06f;
            CanvasLayer(background, "Mountains far", "Background layers/bg_mountain_far.png", 20).parallax = .04f;
            CanvasLayer(background, "Mountains mid", "Background layers/bg_mountain_mid.png", 30).parallax = .10f;
            var mist = CanvasLayer(background, "Mist behind architecture", "FX layers/mist_overlay.png", 35);
            mist.opacity = .15f; mist.motion = SectMotion.Mist; mist.minimumQuality = SectQuality.Medium;
            var architecture = Group(root, "02 Architecture");
            var falls = CanvasLayer(architecture, "Waterfalls", "Architecture layers/waterfalls.png", 40);
            falls.sortingLayer = "SectArchitecture";
            Layer(architecture, "Temple", "Architecture layers/temple_left.png", new Vector2(240, 980), .40f, 1, "SectArchitecture", 42, true);
            Layer(architecture, "Breakthrough platform", "Architecture layers/breakthrough_platform.png", new Vector2(745, 900), .68f, 1, "SectPlatform", 50, true);
            PlaceholderBridge(architecture);
            var ground = Group(root, "03 Courtyard");
            Layer(ground, "Main courtyard — original perspective", "Architecture layers/main_courtyard.png", new Vector2(540, 1660), .86f, 1, "SectGround", 60, true);
            var ring = Layer(ground, "Formation base — fitted to courtyard ellipse", "FX layers/formation_ring_base.png", new Vector2(540, 1200), .44f, .35f, "SectGroundDetail", 70, false, new Vector2(.5f, .5f));
            ring.opacity = .58f;
            var glow = Layer(ground, "Formation glow", "FX layers/formation_ring_glow.png", new Vector2(540, 1200), .47f, .35f, "SectGroundDetail", 71, false, new Vector2(.5f, .5f));
            glow.opacity = .22f; glow.motion = SectMotion.Glow; glow.minimumQuality = SectQuality.Medium;
            var characters = Group(root, "04 Character anchors — no player renderer in stage 03");
            var seats = new[] { new Vector2(240,1085),new Vector2(420,1060),new Vector2(610,1060),new Vector2(805,1085),new Vector2(205,1200),new Vector2(875,1200),new Vector2(275,1320),new Vector2(445,1350),new Vector2(630,1350),new Vector2(810,1320),new Vector2(180,1300),new Vector2(900,1300) };
            for (int i = 0; i < seats.Length; i++) Anchor(characters, "Seat_" + (i + 1).ToString("00"), seats[i]);
            Anchor(characters, "Breakthrough seat", new Vector2(745, 690));
            var foreground = Group(root, "05 Foreground");
            Layer(foreground, "Front gate", "Architecture layers/front_gate.png", new Vector2(235, 1720), .29f, 1, "SectForeground", 90, true);
            // The source already includes a ring of railings/lanterns on each island.
            // Keep the separate props configurable, hidden to avoid double railings and source-right clipping.
            var props = Layer(foreground, "Lantern props — source clipped at right, optional", "Architecture layers/lanterns_props.png", new Vector2(540, 1420), .82f, 1, "SectForeground", 91, false);
            props.gameObject.SetActive(false);
            PlaceholderBranch(foreground);
            var atmosphere = Group(root, "06 Atmosphere");
            var petals = CanvasLayer(atmosphere, "Petals", "FX layers/petals_overlay.png", 100);
            petals.sortingLayer = "SectAtmosphere"; petals.opacity = .45f; petals.minimumQuality = SectQuality.Medium; petals.motion = SectMotion.Petals;
            var particles = CanvasLayer(atmosphere, "Light particles", "FX layers/light_particles.png", 101);
            particles.sortingLayer = "SectAtmosphere"; particles.opacity = .45f; particles.minimumQuality = SectQuality.High; particles.motion = SectMotion.Glow;
            var frontMist = CanvasLayer(atmosphere, "Mist foreground — very light", "FX layers/mist_overlay.png", 102);
            frontMist.sortingLayer = "SectAtmosphere"; frontMist.opacity = .045f; frontMist.minimumQuality = SectQuality.High; frontMist.motion = SectMotion.Mist; frontMist.phase = 1.2f;
            var hud = Group(root, "07 HUD reserved");
            Layer(hud, "Header frame", "UI/ui_header.png", new Vector2(540, 335), .44f, 1, "SectHUD", 120, true);
            Layer(hud, "Footer frame", "UI/ui_footer.png", new Vector2(540, 1795), .46f, 1, "SectHUD", 121, true);
            Text(hud, "Title", "TU TIÊN LIVE", new Vector2(540, 154), .65f, new Color(1,.9f,.65f));
            Text(hud, "Subtitle", "VẠN GIỚI TRANH PHONG", new Vector2(540, 43), .17f, new Color(.72f,.94f,1));
            Text(hud, "Sect name", "TÔNG MÔN THANH VÂN", new Vector2(540, 1744), .25f, new Color(1,.94f,.78f));
            controller.layers = layers.ToArray();
            rig.protectedLayers = layers.Where(l => l.protectFromClipping).ToArray();
            foreach (var layer in layers) layer.ApplyLayout();
            controller.quality = SectQuality.Medium; controller.Sample(0); rig.ConfigureViewport(1080,1920);
            if (!EditorSceneManager.SaveScene(scene, ScenePath)) throw new IOException("Cannot save SectScene");
            var scenes = EditorBuildSettings.scenes.ToList();
            if (!scenes.Any(s => s.path == ScenePath)) scenes.Add(new EditorBuildSettingsScene(ScenePath, true));
            EditorBuildSettings.scenes = scenes.ToArray();
            AssetDatabase.SaveAssets(); Verify();
        }
        public static void RebuildValidationOnly()
        {
            throw new InvalidOperationException("Rebuild is retired. Use Scene Authoring/Migrate; original scene and prefabs are preserved.");
        }
        private static void Import(AssetEntry entry)
        {
            var original = Path.Combine(RepositoryRoot(),"public/assets/" + entry.id);
            if (Hash(original) != entry.sha256 || Hash(entry.importPath) != entry.sha256) throw new InvalidOperationException("PNG differs: " + entry.id);
            var importer = (TextureImporter)AssetImporter.GetAtPath(entry.importPath);
            importer.textureType = TextureImporterType.Sprite; importer.spriteImportMode = SpriteImportMode.Single;
            importer.spritePixelsPerUnit = 100; importer.sRGBTexture = true; importer.alphaIsTransparency = entry.alphaChannel;
            importer.alphaSource = TextureImporterAlphaSource.FromInput;
            importer.npotScale = TextureImporterNPOTScale.None; importer.maxTextureSize = 4096;
            importer.mipmapEnabled = false; importer.isReadable = false; importer.textureCompression = TextureImporterCompression.Uncompressed;
            importer.filterMode = FilterMode.Bilinear; importer.wrapMode = TextureWrapMode.Clamp; importer.anisoLevel = 0;
            var settings = new TextureImporterSettings(); importer.ReadTextureSettings(settings);
            settings.spriteMeshType = SpriteMeshType.FullRect; importer.SetTextureSettings(settings); importer.SaveAndReimport();
        }
        private static Transform Group(GameObject root, string name)
        { var group = new GameObject(name); group.transform.SetParent(root.transform); return group.transform; }
        private static SectLayer Layer(Transform parent, string name, string asset, Vector2 pixels, float scale, float scaleY, string sorting, int order, bool protect, Vector2? anchor = null)
        {
            var entry = audit.assets.First(a => a.id == asset);
            var go = new GameObject(name); go.transform.SetParent(parent);
            var layer = go.AddComponent<SectLayer>(); layer.sourceSprite = AssetDatabase.LoadAssetAtPath<Sprite>(entry.importPath);
            layer.sourcePixelRect = BottomRect(entry.crop, entry.height); layer.contentPixelRect = BottomRect(entry.bbox32, entry.height);
            layer.anchor = anchor ?? new Vector2(.5f, 0); layer.positionPixels = pixels; layer.uniformScale = scale; layer.verticalScale = scaleY;
            layer.sortingLayer = sorting; layer.sortingOrder = order; layer.protectFromClipping = protect;
            var materialPath = MaterialRoot + Path.GetFileNameWithoutExtension(asset) + ".mat";
            var material = AssetDatabase.LoadAssetAtPath<Material>(materialPath);
            if (!material) { material = new Material(Shader.Find("TuTienLive/SectUnlit")); material.mainTexture = layer.sourceSprite.texture; AssetDatabase.CreateAsset(material, materialPath); }
            go.GetComponent<MeshRenderer>().sharedMaterial = material; layer.ApplyLayout(); layers.Add(layer); return layer;
        }
        private static SectLayer CanvasLayer(Transform parent, string name, string asset, int order, float overscan = 1)
        {
            var a = audit.assets.First(e => e.id == asset); float scale = 1080f / a.width * overscan;
            var position = new Vector2((1080 - a.width*scale)/2 + a.bbox32[0]*scale, (1920-a.height*scale)/2 + a.bbox32[1]*scale);
            var layer=Layer(parent, name, asset, position, scale, 1, "SectBackground", order, false, new Vector2(0,1));
            layer.allowFrameBleed=true;return layer;
        }
        private static Rect BottomRect(int[] b, int height) => new Rect(b[0], height-b[3], b[2]-b[0], b[3]-b[1]);
        private static void Anchor(Transform parent, string name, Vector2 p)
        { var go = new GameObject(name); go.transform.SetParent(parent); go.transform.localPosition = new Vector3((p.x-540)/100, (960-p.y)/100, 8); }
        private static void Text(Transform parent, string name, string value, Vector2 p, float size, Color color)
        {
            var go = new GameObject(name); go.transform.SetParent(parent); go.transform.localPosition = new Vector3((p.x-540)/100,(960-p.y)/100,0);
            var text = go.AddComponent<TextMesh>(); text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = 96; text.characterSize = size; text.anchor = TextAnchor.MiddleCenter; text.alignment = TextAlignment.Center; text.text = value; text.color = color;
            var renderer = go.GetComponent<MeshRenderer>(); renderer.sharedMaterial = text.font.material; renderer.sortingLayerName = "SectHUD"; renderer.sortingOrder = 130;
            var layout=go.AddComponent<SectTextLayout>();layout.maximumSizePixels=name=="Title"?new Vector2(900,70):name=="Subtitle"?new Vector2(550,18):new Vector2(850,26);layout.Fit();
        }
        private static Material PlaceholderMaterial()
        {
            const string path = MaterialRoot + "Placeholder.mat";
            var material = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (!material) { material = new Material(Shader.Find("TuTienLive/SectUnlit")); AssetDatabase.CreateAsset(material,path); }
            return material;
        }
        private static void PlaceholderBridge(Transform parent)
        {
            var vertices = new List<Vector3>(); var colors = new List<Color>(); var indices = new List<int>();
            for (int i = 0; i < 7; i++)
            {
                float x = 340+i*10, y = 918+i*15;
                AddQuad(vertices, colors, indices, x, y, 64, 13, new Color(.23f,.31f,.43f));
                AddQuad(vertices, colors, indices, x, y, 64, 2, new Color(.53f,.63f,.72f));
            }
            SavePlaceholder(parent,"Placeholder — connecting stone steps",vertices,colors,indices,"SectArchitecture",43);
        }
        private static void PlaceholderBranch(Transform parent)
        {
            var vertices = new List<Vector3>(); var colors = new List<Color>(); var indices = new List<int>();
            // Modest procedural blossom silhouette. This is a declared placeholder, not a replacement PNG.
            for (int i=0;i<16;i++)
            {
                float t=i/16f,u=(i+1)/16f;
                Segment(vertices,colors,indices,new Vector2(t*265,405-70*t+8*t*t),new Vector2(u*265,405-70*u+8*u*u),12*(1-t)+2,new Color(.12f,.09f,.20f));
            }
            foreach(var p in new[]{new Vector2(60,388),new Vector2(105,353),new Vector2(160,332),new Vector2(225,350),new Vector2(252,326)})
            {
                Segment(vertices,colors,indices,p+new Vector2(-30,26),p,3,new Color(.16f,.10f,.22f));
                for(int petal=0;petal<5;petal++)
                {float a=petal*Mathf.PI*2/5;Disk(vertices,colors,indices,p+new Vector2(Mathf.Cos(a)*5,Mathf.Sin(a)*5),5.5f,new Color(.84f,.46f,.66f,.92f));}
                Disk(vertices,colors,indices,p,2,new Color(1,.81f,.69f));
            }
            SavePlaceholder(parent,"Placeholder — blossom branch (PNG missing)",vertices,colors,indices,"SectArchitecture",41);
        }
        private static void AddQuad(List<Vector3> v,List<Color> c,List<int> t,float x,float y,float width,float height,Color color)
        {
            int n=v.Count; foreach(var p in new[] {new Vector2(x,y),new Vector2(x+width,y),new Vector2(x+width,y+height),new Vector2(x,y+height)})
            {v.Add(new Vector3((p.x-540)/100,(960-p.y)/100,0));c.Add(color);}
            t.AddRange(new[] {n,n+2,n+1,n,n+3,n+2});
        }
        private static void Segment(List<Vector3> v,List<Color> c,List<int> t,Vector2 a,Vector2 b,float width,Color color)
        {
            var side=new Vector2(-(b-a).y,(b-a).x).normalized*width/2;int n=v.Count;
            foreach(var p in new[]{a-side,a+side,b+side,b-side}){v.Add(new Vector3((p.x-540)/100,(960-p.y)/100,0));c.Add(color);}
            t.AddRange(new[]{n,n+2,n+1,n,n+3,n+2});
        }
        private static void Disk(List<Vector3> v,List<Color> c,List<int> t,Vector2 center,float radius,Color color)
        {
            int n=v.Count;v.Add(new Vector3((center.x-540)/100,(960-center.y)/100,0));c.Add(color);
            for(int i=0;i<=12;i++){float a=i*Mathf.PI*2/12;var p=center+new Vector2(Mathf.Cos(a),Mathf.Sin(a))*radius;v.Add(new Vector3((p.x-540)/100,(960-p.y)/100,0));c.Add(color);if(i>0)t.AddRange(new[]{n,n+i,n+i+1});}
        }
        private static void SavePlaceholder(Transform parent,string name,List<Vector3> vertices,List<Color> colors,List<int> indices,string sorting,int order)
        {
            var mesh=new Mesh {name=name}; mesh.SetVertices(vertices);mesh.SetColors(colors);mesh.SetTriangles(indices,0);mesh.uv=new Vector2[vertices.Count];mesh.RecalculateBounds();
            string path=MaterialRoot+(name.Contains("blossom")?"PlaceholderBranch":"PlaceholderBridge")+".asset";AssetDatabase.CreateAsset(mesh,path);
            var go=new GameObject(name,typeof(MeshFilter),typeof(MeshRenderer));go.transform.SetParent(parent);go.transform.localPosition=new Vector3(0,0,10-order*.01f);
            go.GetComponent<MeshFilter>().sharedMesh=mesh;var renderer=go.GetComponent<MeshRenderer>();renderer.sharedMaterial=PlaceholderMaterial();renderer.sortingLayerName=sorting;renderer.sortingOrder=order;
            renderer.shadowCastingMode=ShadowCastingMode.Off;renderer.receiveShadows=false;
        }
        private static void AddSortingLayers()
        {
            var manager = new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset")[0]);
            var values = manager.FindProperty("m_SortingLayers");
            for(int i=0;i<SortingLayers.Length;i++)
            {
                bool exists=false; for(int j=0;j<values.arraySize;j++) if(values.GetArrayElementAtIndex(j).FindPropertyRelative("name").stringValue==SortingLayers[i])exists=true;
                if(exists)continue; int index=values.arraySize;values.InsertArrayElementAtIndex(index);var item=values.GetArrayElementAtIndex(index);
                item.FindPropertyRelative("name").stringValue=SortingLayers[i]; item.FindPropertyRelative("uniqueID").intValue=73000+i;item.FindPropertyRelative("locked").boolValue=false;
            }
            manager.ApplyModifiedPropertiesWithoutUndo();
        }
        [MenuItem("Tu Tien LIVE/Stage 03/Verify SectScene")]
        public static void Verify()
        {
            CleanScenes(); EditorSceneManager.OpenScene(ScenePath,OpenSceneMode.Single);
            var controller=UnityEngine.Object.FindAnyObjectByType<SectSceneController>();
            if(!controller||controller.layers.Length!=18)throw new InvalidOperationException("Missing SectScene layers");
            controller.Sample(0);controller.cameraRig.ConfigureViewport(1080,1920);
            foreach(var layer in controller.layers)
            {
                if(!layer.sourceSprite||!layer.GetComponent<MeshRenderer>().sharedMaterial)throw new InvalidOperationException("Missing sprite/material: "+layer.name);
                if(layer.sourceSprite.name.Contains("courtyard")&&Mathf.Abs(layer.verticalScale-1)>.0001f)throw new InvalidOperationException("Courtyard perspective distorted");
            }
            Debug.Log("TU_TIEN_STAGE03_SCENE_VERIFIED");
        }
        internal static string Hash(string path)
        {using var sha=SHA256.Create();return BitConverter.ToString(sha.ComputeHash(File.ReadAllBytes(path))).Replace("-","").ToLowerInvariant();}
        internal static void CleanScenes()
        {for(int i=0;i<SceneManager.sceneCount;i++)if(SceneManager.GetSceneAt(i).isDirty)throw new InvalidOperationException("Save modified scenes first; no scene edits discarded.");}
        internal static string RepositoryRoot()
        {
            var directory=new DirectoryInfo(Application.dataPath);
            while(directory!=null){if(File.Exists(Path.Combine(directory.FullName,"server.js"))&&File.Exists(Path.Combine(directory.FullName,"GAME_DESIGN.md")))return directory.FullName;directory=directory.Parent;}
            throw new DirectoryNotFoundException("TuTien repository not found above project");
        }
        [Serializable] private sealed class AssetAudit { public AssetEntry[] assets; }
        [Serializable] private sealed class AssetEntry { public string id,importPath,sha256;public int width,height;public bool alphaChannel;public int[] crop,bbox32; }
    }
}
