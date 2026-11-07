using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TextCore.LowLevel;
using TMPro;
using TuTienLive.Scenes;
using TuTienLive.Characters;
using TuTienLive.Network;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class SectSceneAuthoringMigration
    {
        public const string ScenePath="Assets/Scenes/SectScene_Editable.unity";
        public const string CharacterPath="Assets/SceneAuthoring/Prefabs/CharacterPrefab.prefab";
        public const string Root="Assets/SceneAuthoring/";
        public static string PreferredScene=>File.Exists(ScenePath)?ScenePath:SectSceneSetup.ScenePath;
        private static readonly string[] GroupNames={"01_Environment","02_Architecture","03_Formation","04_Characters","05_Tribulation","06_Effects","07_UI","08_Systems","09_Camera"};

        [MenuItem("Tu Tien LIVE/Scene Authoring/1 - Migrate SectScene (backup and safe copy)")]
        public static void Migrate()
        {
            if(EditorApplication.isPlayingOrWillChangePlaymode)throw new InvalidOperationException("Stop Play Mode before migration.");
            SectSceneSetup.CleanScenes();
            if(File.Exists(ScenePath))
            {
                EditorSceneManager.OpenScene(ScenePath,OpenSceneMode.Single);
                if(UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>()){Verify();Debug.Log("Scene already migrated; nothing rebuilt.");return;}
            }
            else
            {
                BackupOriginals();
                if(!AssetDatabase.CopyAsset(SectSceneSetup.ScenePath,ScenePath))throw new IOException("Cannot create editable scene copy");
                EditorSceneManager.OpenScene(ScenePath,OpenSceneMode.Single);
            }
            Directory.CreateDirectory(Root+"Meshes");Directory.CreateDirectory(Root+"Prefabs");Directory.CreateDirectory(Root+"Resources");AssetDatabase.Refresh();
            var controller=UnityEngine.Object.FindAnyObjectByType<SectSceneController>();
            if(!controller)throw new InvalidOperationException("SectSceneController missing");
            foreach(var layer in controller.layers)layer.ApplyLayout(); // Include optional inactive props.
            controller.Sample(0); // Bake the existing visible legacy layout exactly once.
            var sceneRoot=controller.transform;sceneRoot.name="SectScene";
            var oldGroups=sceneRoot.Cast<Transform>().ToArray();
            var groups=GroupNames.Select(name=>Group(sceneRoot,name)).ToArray();
            for(int i=0;i<groups.Length;i++)groups[i].SetSiblingIndex(i);
            var seats=sceneRoot.GetComponentsInChildren<Transform>(true).Where(t=>t.name.StartsWith("Seat_",StringComparison.Ordinal)).OrderBy(t=>t.name).ToArray();
            var platformSeat=sceneRoot.GetComponentsInChildren<Transform>(true).Single(t=>t.name=="Breakthrough seat");
            var spawn=Group(groups[3],"SpawnPoints");foreach(var seat in seats)seat.SetParent(spawn,true);
            platformSeat.SetParent(groups[4],true);
            for(int i=0;i<controller.layers.Length;i++)
            {
                var layer=controller.layers[i];
                int group=layer.name.Contains("Formation")?2:layer.name.Contains("Breakthrough platform")?4:
                    layer.sortingLayer=="SectHUD"?6:layer.sortingLayer=="SectAtmosphere"||layer.motion==SectMotion.Mist?5:
                    layer.sortingLayer=="SectBackground"||layer.name=="Waterfalls"?0:1;
                layer.transform.SetParent(groups[group],true);
                string path=Root+"Meshes/Layer_"+i.ToString("00")+".asset";
                var geometry=AssetDatabase.LoadAssetAtPath<Mesh>(path);
                if(!geometry){geometry=UnityEngine.Object.Instantiate(layer.GetComponent<MeshFilter>().sharedMesh);geometry.name=layer.name;geometry.hideFlags=HideFlags.None;AssetDatabase.CreateAsset(geometry,path);}
                layer.MarkSceneAuthored(geometry);EditorUtility.SetDirty(layer);
            }
            foreach(var text in sceneRoot.GetComponentsInChildren<SectTextLayout>(true))
            {text.Fit();text.autoFit=false;text.transform.SetParent(groups[6],true);EditorUtility.SetDirty(text);}
            // Reuse the existing placeholder renderers; no second temple/courtyard/gate is created.
            foreach(var group in oldGroups.Where(t=>t&&t.name.StartsWith("05 Foreground")))
                foreach(var child in group.Cast<Transform>().ToArray())child.SetParent(groups[1],true);
            foreach(var group in oldGroups.Where(t=>t&&t.name.StartsWith("02 Architecture")))
                foreach(var child in group.Cast<Transform>().ToArray())child.SetParent(groups[1],true);
            controller.cameraRig.transform.SetParent(groups[8],true);controller.cameraRig.gameObject.name="MainCamera";controller.cameraRig.MarkSceneAuthored();
            var prefab=CreateCharacterVariant();
            var manager=Component<CharacterManager>(groups[3].gameObject);
            manager.characterPrefab=prefab;manager.scene=controller;manager.seats=seats;manager.characterPool=Group(groups[3],"CharacterPool");
            var client=Group(groups[7],"NetworkClient");manager.network=Component<UnityWebSocketClient>(client.gameObject);
            var focus=Group(groups[7],"CameraDirector");manager.director=Component<CameraDirector>(focus.gameObject);
            var ritual=groups[4].GetComponentInChildren<TribulationController>(true);
            if(!ritual)
            {
                var source=AssetDatabase.LoadAssetAtPath<TribulationController>("Assets/Resources/TribulationPrefab.prefab");
                ritual=((GameObject)PrefabUtility.InstantiatePrefab(source.gameObject,platformSeat)).GetComponent<TribulationController>();
                ritual.transform.localPosition=Vector3.zero;ritual.gameObject.name="TribulationFX";
            }
            ritual.platformSeat=platformSeat;manager.tribulation=ritual;
            PrefabUtility.RecordPrefabInstancePropertyModifications(ritual);PrefabUtility.RecordPrefabInstancePropertyModifications(ritual.transform);
            var hud=Group(groups[6],"RosterHUD");var textMesh=Component<TextMesh>(hud.gameObject);
            textMesh.font=Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");textMesh.fontSize=48;textMesh.characterSize=.15f;textMesh.anchor=TextAnchor.MiddleCenter;textMesh.richText=false;
            textMesh.text="Đang chờ snapshot máy chủ";hud.position=new Vector3(0,-8.18f,6);
            var renderer=hud.GetComponent<MeshRenderer>();renderer.sharedMaterial=textMesh.font.material;renderer.sortingLayerName="SectHUD";renderer.sortingOrder=125;
            var fitter=Component<SectTextLayout>(hud.gameObject);fitter.maximumSizePixels=new Vector2(800,20);textMesh.font.RequestCharactersInTexture(textMesh.text,48);fitter.Fit();fitter.autoFit=false;
            var roster=Component<CharacterRosterHud>(hud.gameObject);roster.manager=manager;roster.label=textMesh;
            textMesh.text=""; // Dynamic text is supplied by the existing HUD at runtime.
            var systems=Group(groups[7],"SceneController");
            var authoredController=Component<SectSceneController>(systems.gameObject);
            EditorUtility.CopySerialized(controller,authoredController);manager.scene=authoredController;
            UnityEngine.Object.DestroyImmediate(controller);
            foreach(var old in oldGroups)
                if(old&&old.parent==sceneRoot&&old.childCount==0&&old.GetComponents<Component>().Length==1)UnityEngine.Object.DestroyImmediate(old.gameObject);
            var bindings=Component<SectSceneBindings>(sceneRoot.gameObject);
            bindings.environment=authoredController;bindings.characters=manager;bindings.network=manager.network;bindings.roster=roster;
            bindings.tribulation=ritual;bindings.cameraRig=authoredController.cameraRig;bindings.groups=groups;
            EditorUtility.SetDirty(manager);EditorUtility.SetDirty(authoredController);EditorUtility.SetDirty(bindings);
            EditorSceneManager.MarkSceneDirty(SceneManager.GetActiveScene());Verify();
            if(!EditorSceneManager.SaveScene(SceneManager.GetActiveScene(),ScenePath))throw new IOException("Cannot save editable scene");
            var entries=EditorBuildSettings.scenes.Where(s=>s.path!=ScenePath).ToList();entries.Insert(0,new EditorBuildSettingsScene(ScenePath,true));EditorBuildSettings.scenes=entries.ToArray();
            AssetDatabase.SaveAssets();Debug.Log("TU_TIEN_SCENE_AUTHORING_MIGRATION_PASS");
        }

        private static Transform Group(Transform parent,string name)
        {var found=parent.Find(name);if(found)return found;var go=new GameObject(name);go.transform.SetParent(parent,false);return go.transform;}
        private static T Component<T>(GameObject go) where T:UnityEngine.Component
        {var value=go.GetComponent<T>();return value?value:go.AddComponent<T>();}

        private static CharacterView CreateCharacterVariant()
        {
            var existing=AssetDatabase.LoadAssetAtPath<CharacterView>(CharacterPath);if(existing)return existing;
            var font=CreateFont();
            var original=AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Resources/CharacterPrefab.prefab");
            var instance=(GameObject)PrefabUtility.InstantiatePrefab(original);
            try
            {
                var view=instance.GetComponent<CharacterView>();view.nameplate.gameObject.SetActive(false);
                var label=new GameObject("Nameplate TMP",typeof(RectTransform));label.transform.SetParent(instance.transform,false);label.transform.localPosition=new Vector3(0,1.6f,0);
                var tmp=label.AddComponent<TextMeshPro>();tmp.font=font;tmp.text="";tmp.fontSize=3;tmp.enableAutoSizing=true;tmp.fontSizeMin=1.5f;tmp.fontSizeMax=3;
                tmp.fontSize=2;tmp.fontSizeMin=1;tmp.fontSizeMax=2;
                tmp.alignment=TextAlignmentOptions.Center;tmp.richText=false;tmp.textWrappingMode=TextWrappingModes.NoWrap;tmp.overflowMode=TextOverflowModes.Truncate;
                tmp.rectTransform.sizeDelta=new Vector2(1.5f,.5f);tmp.color=new Color(1,.92f,.72f);tmp.GetComponent<MeshRenderer>().sortingLayerName="SectCharacters";tmp.GetComponent<MeshRenderer>().sortingOrder=30;
                view.nameLabel=tmp;PrefabUtility.RecordPrefabInstancePropertyModifications(view);
                var saved=PrefabUtility.SaveAsPrefabAsset(instance,CharacterPath);return saved.GetComponent<CharacterView>();
            }
            finally{UnityEngine.Object.DestroyImmediate(instance);}
        }
        private static TMP_FontAsset CreateFont()
        {
            string settingsPath=Root+"Resources/TMP Settings.asset";
            var settings=AssetDatabase.LoadAssetAtPath<TMP_Settings>(settingsPath);
            if(!settings){settings=ScriptableObject.CreateInstance<TMP_Settings>();AssetDatabase.CreateAsset(settings,settingsPath);AssetDatabase.SaveAssets();AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);}
            TMP_Settings.LoadDefaultSettings();
            string path=Root+"Nameplate SDF.asset";
            var font=AssetDatabase.LoadAssetAtPath<TMP_FontAsset>(path);if(font)return font;
            var source=AssetDatabase.LoadAssetAtPath<Font>(Root+"Fonts/LiberationSans.ttf");
            if(!source)throw new InvalidOperationException("Bundled Unity TMP font is missing (see SceneAuthoring/Fonts)");
            font=TMP_FontAsset.CreateFontAsset(source,90,9,GlyphRenderMode.SDFAA,1024,1024,AtlasPopulationMode.Dynamic,true);
            if(!font)throw new InvalidOperationException("Cannot create TMP font from Unity SDK LiberationSans");
            font.name="LiberationSans SDF";AssetDatabase.CreateAsset(font,path);
            AssetDatabase.AddObjectToAsset(font.material,font);foreach(var atlas in font.atlasTextures)AssetDatabase.AddObjectToAsset(atlas,font);
            font.TryAddCharacters("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ·ĐđệửôngờmáychủPhàmNhânLuyệnKhíTrúcCơKimĐanNguyênAnhHóaThầnHưHợpThểĐạiThừaĐộKiếpPhiThăng");
            TMP_Settings.defaultFontAsset=font;
            EditorUtility.SetDirty(settings);EditorUtility.SetDirty(font);AssetDatabase.SaveAssets();return font;
        }
        private static void BackupOriginals()
        {
            string project=Directory.GetParent(Application.dataPath).FullName;
            string backup=Path.Combine(project,"SceneAuthoringBackups",DateTime.UtcNow.ToString("yyyyMMdd-HHmmss"));Directory.CreateDirectory(backup);
            foreach(var path in new[]{SectSceneSetup.ScenePath,"Assets/Resources/CharacterPrefab.prefab","Assets/Resources/TribulationPrefab.prefab"})
            {File.Copy(path,Path.Combine(backup,Path.GetFileName(path)),false);File.Copy(path+".meta",Path.Combine(backup,Path.GetFileName(path)+".meta"),false);}
            Debug.Log("Original scene/prefabs backed up: "+backup);
        }
        [MenuItem("Tu Tien LIVE/Scene Authoring/2 - Verify saved references")]
        public static void Verify()
        {
            var bindings=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();
            if(!bindings||!bindings.characters||!bindings.network||!bindings.roster||!bindings.tribulation||!bindings.cameraRig)throw new InvalidOperationException("Incomplete scene bindings");
            var manager=bindings.characters;
            if(!manager.characterPrefab||!manager.characterPool||manager.seats.Length!=12||manager.seats.Any(t=>!t)||!manager.director)throw new InvalidOperationException("Incomplete character references");
            var character=manager.characterPrefab;
            if(!character.pose||!character.aura||!character.burst||!character.nameLabel||!character.nameLabel.font||!character.pose.idleStand||!character.pose.fly||!character.pose.attack||!character.pose.meditate||!character.pose.celebrate||!character.pose.backThreeQuarter||!character.pose.meditateThreeQuarter)
                throw new InvalidOperationException("Incomplete character prefab");
            if(manager.network!=bindings.network||manager.tribulation!=bindings.tribulation||bindings.roster.manager!=manager||!bindings.roster.label||!bindings.tribulation.platformSeat||!bindings.tribulation.lightning||bindings.tribulation.clouds.Any(c=>!c))
                throw new InvalidOperationException("Incomplete system/ritual/HUD references");
            if(bindings.groups.Length!=9||bindings.groups.Any(t=>!t)||bindings.groups.Distinct().Count()!=9)throw new InvalidOperationException("Incomplete hierarchy groups");
            foreach(var root in SceneManager.GetActiveScene().GetRootGameObjects())foreach(var t in root.GetComponentsInChildren<Transform>(true))
                if(GameObjectUtility.GetMonoBehavioursWithMissingScriptCount(t.gameObject)>0)throw new InvalidOperationException("Missing script: "+t.name);
            foreach(var layer in bindings.environment.layers)if(!layer.sceneAuthored||!layer.bakedGeometry||!layer.GetComponent<MeshRenderer>().sharedMaterial)throw new InvalidOperationException("Unbaked layer "+layer.name);
        }
    }
}
