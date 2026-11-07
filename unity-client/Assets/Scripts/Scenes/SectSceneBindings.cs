using UnityEngine;
using TuTienLive.Characters;
using TuTienLive.Network;
using TuTienLive.UI;

namespace TuTienLive.Scenes
{
    // Explicit serialized scene references, visible in Inspector. No runtime factory.
    public sealed class SectSceneBindings : MonoBehaviour
    {
        public int migrationVersion=1;
        public SectSceneController environment;
        public CharacterManager characters;
        public TribulationController tribulation;
        public UnityWebSocketClient network;
        public CharacterRosterHud roster;
        public CameraRig cameraRig;
        public Transform[] groups;
    }
}
