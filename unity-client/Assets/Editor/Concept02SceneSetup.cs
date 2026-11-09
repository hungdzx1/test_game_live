using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using TuTienLive.Scenes;
using TuTienLive.Characters;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class Concept02SceneSetup
    {
        public const string ScenePath = "Assets/Scenes/SectScene_Concept02.unity";
        public const string ArtRoot = "Assets/Art/SectConcept02/";
        public const string Root = "Assets/SectConcept02/";
        private static readonly List<SectLayer> layers = new List<SectLayer>();
        private static Audit audit;
        private static TMP_FontAsset font;
        [Serializable] private class Audit { public Entry[] assets; }
        [Serializable] private class Entry { public string id, importPath; public int width, height; public int[] bboxAlpha, bbox32; }

        [MenuItem("Tu Tien LIVE/Concept 02/Open or create new scene")]
        public static void Create()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode) throw new InvalidOperationException("Stop Play before creating a scene.");
            SectSceneSetup.CleanScenes();
            if (File.Exists(ScenePath)) { EditorSceneManager.OpenScene(ScenePath); Verify(); return; }
            if (Directory.Exists(Root) && Directory.EnumerateFiles(Root,"*",SearchOption.AllDirectories).Any(p=>!p.EndsWith(".meta",StringComparison.OrdinalIgnoreCase)))
                throw new InvalidOperationException("Concept02 resources already exist. Refusing to overwrite them when the scene is missing.");
            foreach (string folder in new[]{"Meshes", "Materials", "Prefabs"}) Directory.CreateDirectory(Root+folder);
            AssetDatabase.Refresh();
            audit = JsonUtility.FromJson<Audit>(File.ReadAllText(ArtRoot+"asset-audit.json"));
            foreach (var entry in audit.assets) Import(entry);
            if (!AssetDatabase.CopyAsset("Assets/Scenes/SectScene_Main.unity", ScenePath)) throw new IOException("Cannot copy SectScene_Main.");
            EditorSceneManager.OpenScene(ScenePath);
            var bindings = UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();
            if (!bindings) throw new InvalidOperationException("SectScene_Main bindings missing.");
            // Modify only this new scene copy. Keep its serialized network/manager/ritual/camera systems.
            foreach (var layer in bindings.environment.layers) if (layer) UnityEngine.Object.DestroyImmediate(layer.gameObject);
            foreach (int index in new[]{0,1,2,5}) ClearChildren(bindings.groups[index]);
            foreach (Transform child in bindings.groups[6].Cast<Transform>().ToArray())
                if (child.gameObject != bindings.roster.gameObject) UnityEngine.Object.DestroyImmediate(child.gameObject);
            bindings.roster.gameObject.SetActive(false); // No footer in this concept; legacy reference retained.
            foreach (var canvas in UnityEngine.Object.FindObjectsByType<Canvas>(FindObjectsInactive.Include, FindObjectsSortMode.None))
                if (!canvas.transform.IsChildOf(bindings.transform)) UnityEngine.Object.DestroyImmediate(canvas.gameObject);
            font = AssetDatabase.LoadAssetAtPath<TMP_FontAsset>("Assets/SceneAuthoring/Nameplate SDF.asset");
            if (!font) throw new InvalidOperationException("Existing bundled TMP font is missing.");
            layers.Clear();
            var background = bindings.groups[0];
            Full(background,"Sky","Background layers/bg_sky.png","SectBackground",0,1.04f);
            Full(background,"MountainFar","Background layers/bg_mountain_far.png","SectBackground",10);
            var far=Full(background,"CloudFar","Background layers/bg_cloud_far.png","SectBackground",15,1.03f);far.motion=SectMotion.Cloud;far.parallax=.04f;
            Full(background,"MountainMid","Background layers/bg_mountain_mid.png","SectBackground",20);
            Full(background,"CloudNear","Background layers/bg_cloud_near.png","SectBackground",25,1.03f).motion=SectMotion.Cloud;
            var env=bindings.groups[1];
            Full(env,"Waterfalls","Architecture layers/waterfalls.png","SectArchitecture",40);
            var courtyard=Full(env,"MainCourtyard","Architecture layers/main_courtyard.png","SectGround",60);
            courtyard.allowFrameBleed=true;
            Full(env,"CourtyardTrim","UI/ui_courtyard_trim.png","SectGroundDetail",74);
            Full(bindings.groups[4],"BreakthroughPlatform","Architecture layers/breakthrough_platform.png","SectPlatform",50).protectFromClipping=true;
            Full(bindings.groups[2],"FormationGround","FX layers/formation_ground.png","SectGroundDetail",70).motion=SectMotion.Glow;
            var platformFormation=Full(bindings.groups[4],"FormationBreakthrough","FX layers/formation_breakthrough.png","SectPlatform",55);
            platformFormation.motion=SectMotion.Glow;platformFormation.transform.position+=Vector3.up*.34f;
            var beam=Full(bindings.groups[4],"BreakthroughBeam","FX layers/breakthrough_effect.png","SectPlatform",57);
            beam.motion=SectMotion.Glow;beam.transform.localScale*=.62f;beam.transform.position+=Vector3.up*.74f;
            var effects=bindings.groups[5];
            var particles=Full(effects,"SpiritualParticles","FX layers/particles_overlay.png","SectAtmosphere",100);particles.motion=SectMotion.Glow;particles.opacity=.5f;particles.minimumQuality=SectQuality.Medium;
            var petals=Full(effects,"Petals","FX layers/petals_overlay.png","SectAtmosphere",101,.55f);petals.motion=SectMotion.Petals;petals.opacity=.3f;petals.minimumQuality=SectQuality.Medium;
            Full(env,"CherryBranches","Architecture layers/cherry_branches.png","SectAtmosphere",105);
            var camera=bindings.cameraRig.GetComponent<Camera>();
            camera.transform.SetPositionAndRotation(new Vector3(0,0,-20),Quaternion.identity);camera.orthographicSize=9.6f;
            bindings.cameraRig.autoFitBounds=false;bindings.cameraRig.driftEnabled=false;bindings.cameraRig.MarkSceneAuthored();bindings.cameraRig.ConfigureViewport(1080,1920);
            bindings.cameraRig.protectedLayers=layers.Where(l=>l.protectFromClipping).ToArray();
            bindings.environment.layers=layers.ToArray();bindings.environment.quality=SectQuality.High;
            Concept02CharacterGridSetup.ConfigureSeats(bindings.characters);
            bindings.tribulation.platformSeat.position=World(new Vector2(540,665),8);
            // Four prefab variants; meditation is the documented idle/rear fallback.
            var variants=new List<CharacterView>();
            for(int i=1;i<=4;i++)
            {
                var prefab=CreateCharacter(i);
                variants.Add(prefab);
                if(i==1)bindings.characters.characterPrefab=prefab;
            }
            bindings.characters.characterVariants=variants.ToArray();
            CreateUI(bindings,camera,beam.gameObject);
            Concept02StormSetup.Configure(bindings);
            bindings.environment.Sample(0);
            Verify();
            EditorSceneManager.MarkSceneDirty(camera.gameObject.scene);
            if(!EditorSceneManager.SaveScene(camera.gameObject.scene,ScenePath))throw new IOException("Cannot save concept scene.");
            AssetDatabase.SaveAssets();Debug.Log("CONCEPT02_SCENE_CREATED "+ScenePath);
        }
        private static void ClearChildren(Transform parent)
        {foreach(var child in parent.Cast<Transform>().ToArray())UnityEngine.Object.DestroyImmediate(child.gameObject);}
        private static Vector3 World(Vector2 p,float z=0)=>new Vector3((p.x-540)/100,(960-p.y)/100,z);
        private static void Import(Entry entry)
        {
            var importer=(TextureImporter)AssetImporter.GetAtPath(entry.importPath);
            importer.textureType=TextureImporterType.Sprite;importer.textureShape=TextureImporterShape.Texture2D;importer.spriteImportMode=SpriteImportMode.Single;
            importer.spritePixelsPerUnit=100;importer.sRGBTexture=true;importer.alphaSource=TextureImporterAlphaSource.FromInput;importer.alphaIsTransparency=true;
            importer.mipmapEnabled=false;importer.isReadable=false;importer.npotScale=TextureImporterNPOTScale.None;importer.maxTextureSize=4096;
            importer.textureCompression=TextureImporterCompression.Uncompressed;importer.filterMode=FilterMode.Bilinear;importer.wrapMode=TextureWrapMode.Clamp;
            var settings=new TextureImporterSettings();importer.ReadTextureSettings(settings);settings.spriteMeshType=SpriteMeshType.FullRect;
            // A common feet anchor keeps all four poses on the same player seat.
            settings.spriteAlignment=(int)SpriteAlignment.Custom;settings.spritePivot=entry.id.StartsWith("Characters/")?new Vector2(.5f,.04f):new Vector2(.5f,.5f);
            importer.SetTextureSettings(settings);importer.SaveAndReimport();
        }
        private static SectLayer Full(Transform parent,string name,string id,string sorting,int order,float overscan=1)
        {
            var a=audit.assets.Single(e=>e.id==id);var sprite=AssetDatabase.LoadAssetAtPath<Sprite>(a.importPath);
            if(!sprite)throw new InvalidOperationException("PNG did not import as a 2D sprite: "+a.importPath);
            float scale=1080f/941*overscan;
            Vector2 canvas=new Vector2(941*scale,1672*scale),origin=(new Vector2(1080,1920)-canvas)/2;
            var b=a.bbox32;var soft=a.bboxAlpha;
            var crop=new Rect(Mathf.Max(0,soft[0]-3),Mathf.Max(0,a.height-soft[3]-3),Mathf.Min(a.width,soft[2]+3)-Mathf.Max(0,soft[0]-3),Mathf.Min(a.height,a.height-soft[1]+3)-Mathf.Max(0,a.height-soft[3]-3));
            var content=new Rect(b[0],a.height-b[3],b[2]-b[0],b[3]-b[1]);var center=content.center;
            var mesh=new Mesh{name=name};
            mesh.vertices=new[]{new Vector3(crop.xMin-center.x,crop.yMin-center.y)/100,new Vector3(crop.xMax-center.x,crop.yMin-center.y)/100,new Vector3(crop.xMax-center.x,crop.yMax-center.y)/100,new Vector3(crop.xMin-center.x,crop.yMax-center.y)/100};
            mesh.uv=new[]{new Vector2(crop.xMin/a.width,crop.yMin/a.height),new Vector2(crop.xMax/a.width,crop.yMin/a.height),new Vector2(crop.xMax/a.width,crop.yMax/a.height),new Vector2(crop.xMin/a.width,crop.yMax/a.height)};
            mesh.colors=Enumerable.Repeat(Color.white,4).ToArray();mesh.triangles=new[]{0,2,1,0,3,2};mesh.RecalculateBounds();
            AssetDatabase.CreateAsset(mesh,Root+"Meshes/"+name+".asset");
            var material=new Material(Shader.Find("TuTienLive/SectUnlit")){name=name,mainTexture=sprite.texture};
            AssetDatabase.CreateAsset(material,Root+"Materials/"+name+".mat");
            var go=new GameObject(name,typeof(MeshFilter),typeof(MeshRenderer));go.transform.SetParent(parent,false);
            go.transform.position=World(origin+new Vector2(center.x,a.height-center.y)*scale,10-order*.01f);go.transform.localScale=Vector3.one*scale;
            go.GetComponent<MeshFilter>().sharedMesh=mesh;var renderer=go.GetComponent<MeshRenderer>();renderer.sharedMaterial=material;renderer.sortingLayerName=sorting;renderer.sortingOrder=order;
            var layer=go.AddComponent<SectLayer>();layer.sourceSprite=sprite;layer.sourcePixelRect=crop;layer.contentPixelRect=content;layer.anchor=new Vector2(.5f,.5f);
            layer.allowFrameBleed=true;layer.MarkSceneAuthored(mesh);layers.Add(layer);return layer;
        }
        private static CharacterView CreateCharacter(int number)
        {
            var source=AssetDatabase.LoadAssetAtPath<CharacterView>("Assets/SceneAuthoring/Prefabs/CharacterSample.prefab");
            var instance=(GameObject)PrefabUtility.InstantiatePrefab(source.gameObject);
            try
            {
                var view=instance.GetComponent<CharacterView>();var p=view.pose;
                string folder=ArtRoot+"Characters/Character_"+number+"/";
                p.idleStand=p.meditate=p.backThreeQuarter=p.meditateThreeQuarter=AssetDatabase.LoadAssetAtPath<Sprite>(folder+"meditation.png");
                p.fly=AssetDatabase.LoadAssetAtPath<Sprite>(folder+"fly.png");p.attack=AssetDatabase.LoadAssetAtPath<Sprite>(folder+"attack.png");p.celebrate=AssetDatabase.LoadAssetAtPath<Sprite>(folder+"celebrate.png");
                p.Body.sprite=p.meditate;p.transform.localPosition=Vector3.zero;p.transform.localScale=Vector3.one*.105f;
                view.nameLabel.transform.parent.localPosition=new Vector3(0,1.52f,0);view.nameLabel.transform.parent.localScale=Vector3.one*.0065f;
                view.nameLabel.fontSizeMax=26;view.nameLabel.fontSizeMin=16;view.nameLabel.fontSize=26;view.nameLabel.text="";
                foreach(var c in instance.GetComponentsInChildren<Component>(true))if(c)PrefabUtility.RecordPrefabInstancePropertyModifications(c);
                return PrefabUtility.SaveAsPrefabAsset(instance,Root+"Prefabs/Character_"+number+".prefab").GetComponent<CharacterView>();
            }
            finally{UnityEngine.Object.DestroyImmediate(instance);}
        }
        private static RectTransform Rect(Transform parent,string name,Vector2 center,Vector2 size)
        {
            var go=new GameObject(name,typeof(RectTransform));go.transform.SetParent(parent,false);var rect=(RectTransform)go.transform;
            rect.anchorMin=rect.anchorMax=new Vector2(.5f,1);rect.pivot=new Vector2(.5f,.5f);rect.anchoredPosition=new Vector2(center.x-540,-center.y);rect.sizeDelta=size;return rect;
        }
        // UV crop around significant alpha with a guard; keep PNG bytes untouched.
        private static RawImage Cropped(Transform parent,string name,string id,Vector2 center,Vector2 size)
        {
            var a=audit.assets.Single(e=>e.id==id);var b=(int[])a.bbox32.Clone();
            b[0]=Math.Max(0,b[0]-8);b[1]=Math.Max(0,b[1]-8);b[2]=Math.Min(a.width,b[2]+8);b[3]=Math.Min(a.height,b[3]+8);
            var raw=Rect(parent,name,center,size).gameObject.AddComponent<RawImage>();raw.texture=AssetDatabase.LoadAssetAtPath<Texture2D>(a.importPath);
            raw.uvRect=new Rect((float)b[0]/a.width,1-(float)b[3]/a.height,(float)(b[2]-b[0])/a.width,(float)(b[3]-b[1])/a.height);raw.raycastTarget=false;return raw;
        }
        private static void HeaderPiece(Transform parent,string name,Rect pixels,Vector2 center,Vector2 size)
        {
            var raw=Rect(parent,name,center,size).gameObject.AddComponent<RawImage>();
            raw.texture=AssetDatabase.LoadAssetAtPath<Texture2D>(ArtRoot+"UI/ui_header.png");
            raw.uvRect=new Rect(pixels.x/2172,1-pixels.yMax/724,pixels.width/2172,pixels.height/724);raw.raycastTarget=false;
        }
        private static TMP_Text Text(Transform parent,string name,string value,Vector2 center,Vector2 size,float fontSize,Color color)
        {
            var label=Rect(parent,name,center,size).gameObject.AddComponent<TextMeshProUGUI>();label.font=font;label.text=value;label.fontSize=fontSize;
            label.alignment=TextAlignmentOptions.Center;label.color=color;label.richText=false;label.raycastTarget=false;label.textWrappingMode=TextWrappingModes.Normal;return label;
        }
        private static void CreateUI(SectSceneBindings b,Camera camera,GameObject beam)
        {
            var go=new GameObject("UI_Canvas",typeof(RectTransform),typeof(Canvas),typeof(CanvasScaler));go.transform.SetParent(b.groups[6],false);
            var canvas=go.GetComponent<Canvas>();canvas.renderMode=RenderMode.ScreenSpaceCamera;canvas.worldCamera=camera;canvas.planeDistance=1;canvas.sortingLayerName="SectHUD";canvas.sortingOrder=150;
            var scaler=go.GetComponent<CanvasScaler>();scaler.uiScaleMode=CanvasScaler.ScaleMode.ScaleWithScreenSize;scaler.referenceResolution=new Vector2(1080,1920);scaler.matchWidthOrHeight=1;
            var header=Rect(go.transform,"Header",new Vector2(540,0),new Vector2(1080,1920));header.pivot=new Vector2(.5f,1);
            var gold=new Color(1,.89f,.49f);var cyan=new Color(.49f,.94f,1);var white=new Color(.9f,.96f,1);
            HeaderPiece(header,"CornerOrnaments",new Rect(0,0,2172,285),new Vector2(540,71),new Vector2(1080,142));
            HeaderPiece(header,"TitleUnderline",new Rect(620,255,940,104),new Vector2(540,155),new Vector2(470,52));
            HeaderPiece(header,"HeaderDivider",new Rect(70,390,1360,140),new Vector2(385,284),new Vector2(700,55));
            Text(header,"Subtitle","VẠN GIỚI TRANH PHONG",new Vector2(540,30),new Vector2(750,30),21,cyan).characterSpacing=5;
            var title=Text(header,"Title","TU TIÊN <color=#FFE37D>LIVE</color>",new Vector2(540,98),new Vector2(860,90),78,white);
            title.richText=true;title.fontStyle=FontStyles.Bold;
            Cropped(header,"CultivationIcon","UI/ui_cultivation_icon.png.png",new Vector2(65,220),new Vector2(88,88));
            var phase=Text(header,"Phase","CHỜ MÁY CHỦ",new Vector2(224,220),new Vector2(245,48),24,white);
            Text(header,"EnergyTitle","NGUYÊN LỰC TÔNG MÔN",new Vector2(558,190),new Vector2(400,30),17,white);
            Text(header,"EnergyUnavailable","Chưa có dữ liệu nguyên lực",new Vector2(558,221),new Vector2(400,28),17,cyan);
            Cropped(header,"ProgressFrame","UI/ui_progress_frame.png",new Vector2(558,252),new Vector2(396,18));
            var fill=Cropped(header,"ProgressFill - unbound","UI/ui_progress_fill.png",new Vector2(558,252),new Vector2(396,35));fill.gameObject.SetActive(false);
            Cropped(header,"TimerFrame","UI/ui_timer_frame.png",new Vector2(960,220),new Vector2(174,47));
            var timer=Text(header,"Timer","--:--",new Vector2(980,220),new Vector2(118,40),28,gold);
            var panel=Rect(go.transform,"NoticePanel",new Vector2(540,0),new Vector2(1080,1920));panel.pivot=new Vector2(.5f,1);
            Cropped(panel,"PanelFrame","UI/ui_notice_panel.png",new Vector2(890,395),new Vector2(340,249));
            Text(panel,"NoticeTitle","THIÊN ĐẠO THÔNG CÁO",new Vector2(890,325),new Vector2(315,36),21,gold);
            var connection=Text(panel,"Connection","Đang chờ kết nối máy chủ",new Vector2(890,376),new Vector2(292,42),18,white);
            var roster=Text(panel,"Roster","Chưa có dữ liệu đệ tử",new Vector2(890,423),new Vector2(292,42),18,white);
            var ritual=Text(panel,"Ritual","Chưa có người độ kiếp",new Vector2(890,469),new Vector2(292,42),18,white);
            var hud=go.AddComponent<Concept02Hud>();hud.network=b.network;hud.characters=b.characters;hud.phaseLabel=phase;hud.timerLabel=timer;hud.connectionLabel=connection;hud.rosterLabel=roster;hud.ritualLabel=ritual;hud.breakthroughBeam=beam;
            Concept02HudLayout.Configure(hud);
            BlessingPanelSetup.Configure(hud);
        }
        [MenuItem("Tu Tien LIVE/Concept 02/Verify scene references")]
        public static void Verify()
        {
            var b=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();
            if(!b||!b.network||!b.characters||!b.tribulation||b.characters.seats.Length!=25)throw new InvalidOperationException("Missing inherited systems.");
            if(b.environment.layers.Length!=15)throw new InvalidOperationException("Expected 15 independent artwork layers.");
            foreach(var layer in b.environment.layers)if(!layer||!layer.sourceSprite||!layer.bakedGeometry||!layer.sceneAuthored)throw new InvalidOperationException("Missing scene artwork.");
            foreach(var t in b.GetComponentsInChildren<Transform>(true))if(GameObjectUtility.GetMonoBehavioursWithMissingScriptCount(t.gameObject)>0)throw new InvalidOperationException("Missing script: "+t.name);
            if(!UnityEngine.Object.FindAnyObjectByType<Concept02Hud>()||!b.characters.characterPrefab.pose.fly)throw new InvalidOperationException("Missing HUD or new prefab.");
            Debug.Log("CONCEPT02_REFERENCES_PASS");
        }
    }
}
