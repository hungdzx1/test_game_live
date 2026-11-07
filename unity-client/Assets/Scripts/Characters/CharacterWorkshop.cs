using System;
using System.Collections.Generic;
using UnityEngine;

namespace TuTienLive.Characters
{
    [Serializable]
    public sealed class WorkshopCharacter
    {
        public string displayName = "Nhân vật mẫu";
        public string subtitle = "Phàm Nhân";
        [Range(0, 10)] public int auraIndex;
        public string previewPose = "idle";
        public Sprite idle, fly, attack, meditate, celebrate, backThreeQuarter, meditateThreeQuarter;

        public void Apply(CharacterView view)
        {
            // Empty optional poses fall back to idle; do not change PNG pixels or aspect ratio.
            var p = view.pose;
            p.idleStand = idle;
            p.fly = fly ? fly : idle;
            p.attack = attack ? attack : idle;
            p.meditate = meditate ? meditate : idle;
            p.celebrate = celebrate ? celebrate : idle;
            p.backThreeQuarter = backThreeQuarter ? backThreeQuarter : idle;
            p.meditateThreeQuarter = meditateThreeQuarter ? meditateThreeQuarter : p.meditate;
            p.Body.sprite = idle;
            string text = displayName + "\n" + subtitle;
            if (view.nameLabel) view.nameLabel.text = text;
            else if (view.nameplate) view.nameplate.text = text;
        }
    }

    // Local visual authoring only. No networking, player IDs, rewards or gameplay state.
    public sealed class CharacterWorkshop : MonoBehaviour
    {
        [Range(0, 100)] public int characterCount = 3;
        public CharacterView samplePrefab;
        public Transform generatedRoot;
        public Transform[] seats;
        public List<WorkshopCharacter> characters = new List<WorkshopCharacter>();
        [SerializeField] private List<CharacterView> generated = new List<CharacterView>();
        public bool animateInPlayMode = true;
        public IReadOnlyList<CharacterView> Generated => generated;

        public void ResizeEntries()
        {
            characterCount = Mathf.Clamp(characterCount, 0, 100);
            while (characters.Count < characterCount)
                characters.Add(new WorkshopCharacter { displayName = "Nhân vật " + (characters.Count + 1) });
            // Keep hidden entries so reducing then increasing count doesn't erase sprite assignments.
        }

        public Vector3 PositionFor(int index)
        {
            if (seats != null && index < seats.Length && seats[index]) return seats[index].position;
            // Overflow is a local preview grid, not the server's roster/layout rule.
            return transform.TransformPoint(new Vector3((index % 6 - 2.5f) * 1.4f, -(index / 6) * 2f, 0));
        }

        public void Register(CharacterView view) { generated.Add(view); }
        public void ForgetGenerated() { generated.Clear(); }

        public void Sample(float seconds)
        {
            int count = Mathf.Min(generated.Count, Mathf.Min(characterCount, characters.Count));
            for (int i = 0; i < count; i++)
            {
                var view = generated[i];
                if (!view) continue;
                var entry = characters[i];
                entry.Apply(view);
                view.pose.Sample(entry.previewPose, seconds);
                if (view.aura) view.aura.Sample(entry.auraIndex, seconds, false);
            }
        }

        private void Update() { if (animateInPlayMode) Sample(Time.time); }
    }
}
