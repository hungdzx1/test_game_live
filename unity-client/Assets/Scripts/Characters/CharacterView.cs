using UnityEngine;
using TuTienLive.Models;

namespace TuTienLive.Characters
{
    public sealed class CharacterView : MonoBehaviour
    {
        public CharacterPoseController pose;
        public RealmAuraController aura;
        public TextMesh nameplate;
        public LineRenderer burst;
        public string UserId { get; private set; }
        public int EffectCount { get; private set; }
        public string LastEffect { get; private set; }
        public Vector3 Seat { get; set; }
        public int SeatIndex { get; set; }
        public string LastAnimation { get; set; }
        public bool WasOnPlatform { get; set; }
        public float ReturnSeconds { get; set; }
        public Vector3 ReturnFrom { get; set; }
        private float effectRemaining;
        private string label;
        public void Bind(PlayerState player, Vector3 seat)
        {
            UserId = player.UserId; Seat = seat; EffectCount = 0; LastEffect = null;
            effectRemaining = 0; WasOnPlatform = false; ReturnSeconds = 0; label = null;
            transform.position = seat; burst.enabled = false;
        }
        public void Effect(string kind)
        { LastEffect = kind; EffectCount++; effectRemaining = 1.2f; }
        public void Sample(PlayerState player, string animation, float seconds, float delta, bool low, bool rear)
        {
            pose.Sample(animation, seconds, rear); aura.Sample(player.RealmIndex, seconds, low);
            string text = player.Name + "\n" + player.Realm;
            if (label != text)
            {
                label = text; nameplate.text = text;
                nameplate.font.RequestCharactersInTexture(text, nameplate.fontSize, FontStyle.Normal);
                var bounds = nameplate.GetComponent<MeshRenderer>().localBounds;
                float scale = Mathf.Min(.035f, 1.5f / Mathf.Max(.001f, bounds.size.x));
                nameplate.transform.localScale = Vector3.one * scale;
            }
            nameplate.transform.localPosition = new Vector3(0, 1.6f, 0);
            effectRemaining = Mathf.Max(0, effectRemaining - delta);
            burst.enabled = effectRemaining > 0;
            if (burst.enabled)
            {
                float progress = 1 - effectRemaining / 1.2f;
                burst.transform.localScale = Vector3.one * (1 + progress * .9f);
                Color color = LastEffect == "failure" ? new Color(.85f,.4f,.6f,1-progress) : new Color(1,.85f,.45f,1-progress);
                burst.startColor = burst.endColor = color;
            }
        }
        public void ResetVisual()
        { UserId = null; WasOnPlatform = false; ReturnSeconds = 0; burst.enabled = false; nameplate.text = ""; }
    }
}
