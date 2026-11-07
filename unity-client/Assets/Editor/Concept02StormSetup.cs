using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Scenes;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class Concept02StormSetup
    {
        [Serializable] private class Audit { public Entry[] assets; }
        [Serializable] private class Entry { public string importPath; public int width,height; public int[] bbox32; }
        public static void Configure(SectSceneBindings bindings)
        {
            var ritual=bindings.tribulation;
            if(ritual.stormCloud&&ritual.lightningFrames.Length==4)return;
            if(ritual.platformSeat.Find("StormFX"))throw new InvalidOperationException("StormFX already exists; preserve user edits.");
            var audit=JsonUtility.FromJson<Audit>(File.ReadAllText(Concept02SceneSetup.ArtRoot+"asset-audit.json"));
            var root=new GameObject("StormFX");root.transform.SetParent(ritual.platformSeat,false);
            var material=AssetDatabase.LoadAssetAtPath<Material>("Assets/Materials/Characters/SpriteUnlit.mat");
            ritual.stormCloud=Sprite(root.transform,"StormCloud","fx_cloud_storm.png",new Vector2(0,2.7f),1.8f,46,audit,material);
            ritual.lightningFrames=new SpriteRenderer[4];
            for(int i=0;i<4;i++)ritual.lightningFrames[i]=Sprite(root.transform,"Lightning_0"+(i+1),"fx_lightning_0"+(i+1)+".png",new Vector2(0,1.15f),2.1f,45,audit,material);
            PrefabUtility.RecordPrefabInstancePropertyModifications(ritual);EditorUtility.SetDirty(ritual);
        }
        private static SpriteRenderer Sprite(Transform parent,string name,string file,Vector2 center,float height,int order,Audit audit,Material material)
        {
            string path=Concept02SceneSetup.ArtRoot+"Effects/"+file;var entry=audit.assets.Single(e=>e.importPath==path);
            var sprite=AssetDatabase.LoadAssetAtPath<Sprite>(path);if(!sprite||!material)throw new InvalidOperationException("Missing local storm art/material: "+path);
            var bounds=entry.bbox32;float scale=height*100/(bounds[3]-bounds[1]);
            // Source frames have different canvases. Align visible content uniformly without editing/reimporting PNGs.
            var contentCenter=new Vector2((bounds[0]+bounds[2])*.5f,entry.height-(bounds[1]+bounds[3])*.5f);
            var offset=(contentCenter-sprite.pivot)*scale/100;
            var go=new GameObject(name,typeof(SpriteRenderer));go.transform.SetParent(parent,false);
            go.transform.localPosition=new Vector3(center.x-offset.x,center.y-offset.y,0);go.transform.localScale=new Vector3(scale,scale,1);
            var renderer=go.GetComponent<SpriteRenderer>();renderer.sprite=sprite;renderer.sharedMaterial=material;renderer.sortingLayerName="SectCharacters";renderer.sortingOrder=order;renderer.enabled=false;
            return renderer;
        }
        public static void UpgradeValidation()
        {
            string expected=Path.Combine(SectSceneSetup.RepositoryRoot(),"test-results/unity-concept02/project/Assets");
            if(!string.Equals(Path.GetFullPath(Application.dataPath),Path.GetFullPath(expected),StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Use isolated validation project.");
            SectSceneSetup.CleanScenes();EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);
            var bindings=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();Configure(bindings);
            Concept02HudLayout.ConfigureEnergyFill(UnityEngine.Object.FindAnyObjectByType<Concept02Hud>());
            bindings.cameraRig.ConfigureViewport(1080,1920);
            EditorSceneManager.MarkSceneDirty(bindings.gameObject.scene);EditorSceneManager.SaveScene(bindings.gameObject.scene);AssetDatabase.SaveAssets();
            Debug.Log("CONCEPT02_STORM_SETUP_PASS");
        }
    }
}
