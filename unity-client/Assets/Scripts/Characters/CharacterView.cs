using UnityEngine;
using TuTienLive.Models;
using TuTienLive.Presentation;
using TMPro;

namespace TuTienLive.Characters
{
    public sealed class CharacterView : MonoBehaviour
    {
        public CharacterPoseController pose;
        public RealmAuraController aura;
        public TextMesh nameplate;
        [Tooltip("Preferred scene-authored nameplate. Font, size, bounds and position are edited in the prefab.")]
        public TMP_Text nameLabel;
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
        private readonly TransformOffset burstPose=new TransformOffset();
        private void OnEnable(){if(burst)burstPose.Capture(burst.transform);}
        private void OnDisable(){burstPose.Restore();}
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
                label = text;
                if(nameLabel)nameLabel.text=text;
                else if(nameplate)nameplate.text=text;
            }
            effectRemaining = Mathf.Max(0, effectRemaining - delta);
            burst.enabled = effectRemaining > 0;
            if (burst.enabled)
            {
                float progress = 1 - effectRemaining / 1.2f;
                burstPose.Apply(burst.transform,Vector3.zero,Quaternion.identity,1+progress*.9f);
                Color color = LastEffect == "failure" ? new Color(.85f,.4f,.6f,1-progress) : new Color(1,.85f,.45f,1-progress);
                burst.startColor = burst.endColor = color;
            }
        }
        public void ResetVisual()
        { UserId = null; LastAnimation=null; WasOnPlatform = false; ReturnSeconds = 0; burst.enabled = false;burstPose.Restore();if(nameLabel)nameLabel.text="";if(nameplate)nameplate.text = ""; }
    }
}
