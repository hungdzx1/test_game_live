using System;
using UnityEngine;

namespace TuTienLive.Characters
{
    [RequireComponent(typeof(SpriteRenderer))]
    public sealed class CharacterPoseController : MonoBehaviour
    {
        public Sprite idleStand, fly, attack, meditate, celebrate, backThreeQuarter, meditateThreeQuarter;
        public float sourceScale = .125f;
        public string Pose { get; private set; } = "idle";
        public bool UsesFallback => ResolveAsset(Pose) != Pose && Pose != "idle";
        public SpriteRenderer Body => GetComponent<SpriteRenderer>();
        // Each input is one pose, not a sprite sheet. No generated frames or recoloring.
        public static string ResolveAsset(string pose)
        {
            switch (pose)
            {
                case "meditate": return "meditate";
                case "cast": return "meditate";
                case "fly": return "fly";
                case "attack": return "attack";
                case "celebrate": return "celebrate";
                case "back_3quarter": return "back_3quarter";
                case "meditate_3quarter": return "meditate_3quarter";
                default: return "idle_stand";
            }
        }
        public void Sample(string pose, float seconds, bool rear = false)
        {
            Pose = pose ?? "idle";
            Sprite next;
            switch (ResolveAsset(Pose))
            {
                case "meditate": next = rear ? backThreeQuarter : meditate; break;
                case "fly": next = fly; break;
                case "attack": next = attack; break;
                case "celebrate": next = celebrate; break;
                case "back_3quarter": next = backThreeQuarter; break;
                case "meditate_3quarter": next = meditateThreeQuarter; break;
                default: next = idleStand; break;
            }
            Body.sprite = next; Body.color = Color.white;
            float bob = Pose == "fly" ? Mathf.Sin(seconds * 1.8f) * .045f : 0;
            float lean = Pose == "hit" ? Mathf.Sin(seconds * 15) * 1.5f : Pose == "bow" ? -3 : 0;
            transform.localPosition = new Vector3(0, bob, 0);
            transform.localRotation = Quaternion.Euler(0, 0, lean);
            // Uniform breathing keeps the original aspect ratio. Never squash/recolor the PNG.
            transform.localScale = Vector3.one * sourceScale * (1 + Mathf.Sin(seconds * 1.5f) * .002f);
        }
    }
}
