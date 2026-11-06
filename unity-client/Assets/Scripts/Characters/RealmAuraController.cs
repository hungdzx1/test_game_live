using UnityEngine;

namespace TuTienLive.Characters
{
    public sealed class RealmAuraController : MonoBehaviour
    {
        // Same eleven realm colors as public/js/realmAura.js; no client realm progression.
        private static readonly string[] Colors = {"#668b98","#83ceca","#72d8c6","#ecc66f","#c49aec","#91cbe8","#a69fe2","#e39dd2","#f3bb7c","#abc9ff","#ffe7a3"};
        public LineRenderer[] rings;
        public int Realm { get; private set; }
        public void Sample(int realm, float time, bool low)
        {
            Realm = Mathf.Clamp(realm, 0, 10); ColorUtility.TryParseHtmlString(Colors[Realm], out var color);
            for (int r = 0; r < rings.Length; r++)
            {
                var line = rings[r]; line.enabled = r == 0 || !low && r <= Realm / 4;
                color.a = .50f; line.startColor = line.endColor = color;
                line.widthMultiplier = .018f + Realm * .001f;
                line.transform.localRotation = Quaternion.Euler(0, 0, Mathf.Sin(time * .3f + r) * 2);
            }
        }
    }
}
