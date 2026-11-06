using System.Linq;
using UnityEngine;
using UnityEngine.SceneManagement;
using TuTienLive.Network;
using TuTienLive.Scenes;
using TuTienLive.UI;

namespace TuTienLive.Characters
{
    public static class SectCharacterBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void Register()
        { SceneManager.sceneLoaded-=Loaded;SceneManager.sceneLoaded+=Loaded; }
        private static void Loaded(Scene scene,LoadSceneMode mode)
        { if(scene.name=="SectScene") Install(); }
        public static CharacterManager Install()
        {
            var existing=Object.FindAnyObjectByType<CharacterManager>();if(existing)return existing;
            var scene=Object.FindAnyObjectByType<SectSceneController>();if(!scene)return null;
            var prefab=Resources.Load<CharacterView>("CharacterPrefab");
            if(!prefab){Debug.LogError("CharacterPrefab missing. Run Stage 04 setup.");return null;}
            var root=new GameObject("Stage 04 — server driven characters");
            var manager=root.AddComponent<CharacterManager>();manager.scene=scene;manager.characterPrefab=prefab;
            manager.seats=scene.GetComponentsInChildren<Transform>().Where(t=>t.name.StartsWith("Seat_")).OrderBy(t=>t.name).ToArray();
            manager.director=root.AddComponent<CameraDirector>();
            manager.tribulation=Object.Instantiate(Resources.Load<TribulationController>("TribulationPrefab"),root.transform);
            manager.tribulation.platformSeat=scene.GetComponentsInChildren<Transform>().Single(t=>t.name=="Breakthrough seat");
            manager.network=root.AddComponent<UnityWebSocketClient>();
            var hud=new GameObject("Roster count — server data only");hud.transform.SetParent(root.transform);hud.transform.position=new Vector3(0,-8.18f,6);
            var text=hud.AddComponent<TextMesh>();text.font=Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");text.fontSize=48;text.characterSize=.15f;text.anchor=TextAnchor.MiddleCenter;text.richText=false;
            var renderer=hud.GetComponent<MeshRenderer>();renderer.sharedMaterial=text.font.material;renderer.sortingLayerName="SectHUD";renderer.sortingOrder=125;
            hud.AddComponent<SectTextLayout>().maximumSizePixels=new Vector2(800,20);
            var roster=hud.AddComponent<CharacterRosterHud>();roster.manager=manager;roster.label=text;
            return manager;
        }
    }
}
