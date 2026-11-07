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
        public static CharacterManager Install()
        {
            // Compatibility lookup for old probes. Creation belongs to the one-time Editor migration.
            return Object.FindAnyObjectByType<CharacterManager>();
        }
    }
}
