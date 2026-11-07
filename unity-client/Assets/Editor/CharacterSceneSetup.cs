using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;
using TuTienLive.Characters;

namespace TuTienLive.Editor
{
    public static class CharacterSceneSetup
    {
        public const string Art="Assets/Art/Characters/Character_1/";
        public const string Prefab="Assets/Resources/CharacterPrefab.prefab";
        private static Material material;
        private static Material spriteMaterial;
        [MenuItem("Tu Tien LIVE/Stage 04/Import original poses and create prefabs (once)")]
        public static void Create()
        {
            if(File.Exists(Prefab)){SectSceneAuthoringMigration.Migrate();return;}
            Directory.CreateDirectory("Assets/Resources");Directory.CreateDirectory("Assets/Materials/Characters");
            AssetDatabase.Refresh();
            string[] names={"idle_stand","fly","attack","meditate","celebrate","back_3quarter","meditate_3quarter"};
            // Bottom of alpha>=32 contact silhouette; X is a shared torso axis, not bbox center.
            int[] bottom={1241,1193,1234,1195,1244,1213,1206};
            for(int i=0;i<names.Length;i++)
            {
                string path=Art+names[i]+".png";
                if(!File.ReadAllBytes(path).SequenceEqual(File.ReadAllBytes(Path.Combine(SectSceneSetup.RepositoryRoot(),"public/assets/Characters/Character_1/"+names[i]+".png"))))
                    throw new InvalidOperationException("Original pose changed: "+path);
                var importer=(TextureImporter)AssetImporter.GetAtPath(path);
                importer.textureType=TextureImporterType.Sprite;importer.spriteImportMode=SpriteImportMode.Single;
                importer.spritePixelsPerUnit=100;importer.spritePivot=new Vector2(.5f,(1254-bottom[i])/1254f);
                importer.alphaSource=TextureImporterAlphaSource.FromInput;importer.alphaIsTransparency=true;
                importer.sRGBTexture=true;importer.mipmapEnabled=false;importer.npotScale=TextureImporterNPOTScale.None;
                importer.maxTextureSize=2048;importer.textureCompression=TextureImporterCompression.Uncompressed;
                importer.filterMode=FilterMode.Bilinear;importer.wrapMode=TextureWrapMode.Clamp;importer.isReadable=false;
                var settings=new TextureImporterSettings();importer.ReadTextureSettings(settings);settings.spriteAlignment=(int)SpriteAlignment.Custom;settings.spritePivot=new Vector2(.5f,(1254-bottom[i])/1254f);settings.spriteMeshType=SpriteMeshType.FullRect;importer.SetTextureSettings(settings);importer.SaveAndReimport();
            }
            material=AssetDatabase.LoadAssetAtPath<Material>("Assets/Materials/Characters/SharedUnlit.mat");
            if(!material){material=new Material(Shader.Find("TuTienLive/SectUnlit"));AssetDatabase.CreateAsset(material,"Assets/Materials/Characters/SharedUnlit.mat");}
            spriteMaterial=AssetDatabase.LoadAssetAtPath<Material>("Assets/Materials/Characters/SpriteUnlit.mat");
            if(!spriteMaterial){spriteMaterial=new Material(Shader.Find("Universal Render Pipeline/2D/Sprite-Unlit-Default"));AssetDatabase.CreateAsset(spriteMaterial,"Assets/Materials/Characters/SpriteUnlit.mat");}
            if(File.Exists(Prefab)||File.Exists("Assets/Resources/TribulationPrefab.prefab"))
                throw new InvalidOperationException("Stage 04 prefab already exists. Refusing to overwrite Inspector edits.");
            var disk=Disk();
            var root=new GameObject("CharacterPrefab");
            try
            {
                var view=root.AddComponent<CharacterView>();
                var body=new GameObject("Original pose — no tint");body.transform.SetParent(root.transform);
                var renderer=body.AddComponent<SpriteRenderer>();renderer.sharedMaterial=spriteMaterial;renderer.sortingLayerName="SectCharacters";renderer.sortingOrder=10;
                view.pose=body.AddComponent<CharacterPoseController>();
                var poses=names.Select(n=>AssetDatabase.LoadAssetAtPath<Sprite>(Art+n+".png")).ToArray();
                view.pose.idleStand=poses[0];view.pose.fly=poses[1];view.pose.attack=poses[2];view.pose.meditate=poses[3];view.pose.celebrate=poses[4];view.pose.backThreeQuarter=poses[5];view.pose.meditateThreeQuarter=poses[6];view.pose.Sample("idle",0);
                var shadow=new GameObject("Shadow");shadow.transform.SetParent(root.transform);shadow.transform.localScale=new Vector3(1.15f,.22f,1);
                var sr=shadow.AddComponent<SpriteRenderer>();sr.sprite=disk;sr.sharedMaterial=spriteMaterial;sr.color=new Color(0,0,.04f,.24f);sr.sortingLayerName="SectCharacters";
                view.aura=root.AddComponent<RealmAuraController>();view.aura.rings=new LineRenderer[3];
                for(int r=0;r<3;r++)view.aura.rings[r]=Ring(root,"Realm aura "+r,.66f+r*.065f,.15f+r*.035f,1+r);
                view.burst=Ring(root,"Bounded appearance gift upgrade teleport victory effect",.7f,.25f,20);view.burst.enabled=false;
                var label=new GameObject("Nameplate");label.transform.SetParent(root.transform);
                view.nameplate=label.AddComponent<TextMesh>();view.nameplate.font=Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");view.nameplate.fontSize=40;view.nameplate.anchor=TextAnchor.MiddleCenter;view.nameplate.color=new Color(1,.92f,.72f);view.nameplate.richText=false;
                var mr=label.GetComponent<MeshRenderer>();mr.sharedMaterial=view.nameplate.font.material;mr.sortingLayerName="SectCharacters";mr.sortingOrder=30;
                PrefabUtility.SaveAsPrefabAsset(root,Prefab);
            }
            finally{UnityEngine.Object.DestroyImmediate(root);}
            root=new GameObject("TribulationPrefab");
            try
            {
                var ritual=root.AddComponent<TribulationController>();ritual.clouds=new SpriteRenderer[5];
                for(int i=0;i<5;i++)
                {
                    var cloud=new GameObject("Procedural dark cloud "+i);cloud.transform.SetParent(root.transform);
                    cloud.transform.localPosition=new Vector3((i-2)*.45f,2.2f+Mathf.Sin(i)*.12f,0);cloud.transform.localScale=new Vector3(1.1f,.48f,1);
                    var sr=cloud.AddComponent<SpriteRenderer>();sr.sprite=disk;sr.sharedMaterial=spriteMaterial;sr.color=new Color(.08f,.1f,.17f,.65f);sr.sortingLayerName="SectCharacters";sr.sortingOrder=40;sr.enabled=false;ritual.clouds[i]=sr;
                }
                var bolt=Ring(root,"Lightning — server timeline",1,1,45);bolt.loop=false;bolt.widthMultiplier=.035f;bolt.positionCount=9;
                for(int i=0;i<9;i++)bolt.SetPosition(i,new Vector3(i==0||i==8?0:Mathf.Sin(i*13)*.23f,2.2f-i*.24f,0));
                bolt.startColor=bolt.endColor=new Color(.85f,.94f,1);bolt.enabled=false;ritual.lightning=bolt;
                PrefabUtility.SaveAsPrefabAsset(root,"Assets/Resources/TribulationPrefab.prefab");
            }
            finally{UnityEngine.Object.DestroyImmediate(root);}
            AssetDatabase.SaveAssets();Debug.Log("TU_TIEN_STAGE04_PREFABS_CREATED");
        }
        private static LineRenderer Ring(GameObject parent,string name,float x,float y,int order)
        {
            var go=new GameObject(name);go.transform.SetParent(parent.transform);
            var line=go.AddComponent<LineRenderer>();line.sharedMaterial=material;line.useWorldSpace=false;line.loop=true;line.positionCount=48;line.widthMultiplier=.025f;
            line.sortingLayerName="SectCharacters";line.sortingOrder=order;
            for(int i=0;i<48;i++){float a=i*Mathf.PI*2/48;line.SetPosition(i,new Vector3(Mathf.Cos(a)*x,Mathf.Sin(a)*y));}
            return line;
        }
        private static Sprite Disk()
        {
            string path="Assets/Materials/Characters/ProceduralDisk.asset";
            if(File.Exists(path))return AssetDatabase.LoadAllAssetsAtPath(path).OfType<Sprite>().Single();
            var texture=new Texture2D(64,64,TextureFormat.RGBA32,false);texture.name="Procedural soft disk";texture.wrapMode=TextureWrapMode.Clamp;
            for(int y=0;y<64;y++)for(int x=0;x<64;x++){float d=Vector2.Distance(new Vector2(x+.5f,y+.5f),new Vector2(32,32))/32;texture.SetPixel(x,y,new Color(1,1,1,Mathf.Clamp01((1-d)*6)));}texture.Apply();
            AssetDatabase.CreateAsset(texture,path);var sprite=Sprite.Create(texture,new Rect(0,0,64,64),new Vector2(.5f,.5f),64);sprite.name="Procedural disk";AssetDatabase.AddObjectToAsset(sprite,texture);return sprite;
        }
    }
}
