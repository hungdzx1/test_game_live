using UnityEngine;

namespace TuTienLive.Scenes
{
    [ExecuteAlways, RequireComponent(typeof(Camera))]
    public sealed class CameraRig : MonoBehaviour
    {
        public SectLayer[] protectedLayers;
        [Min(0)] public float safeMargin = .14f;
        [Tooltip("World units; default drift is only 3.5 x 2.5 reference pixels.")]
        public Vector2 driftAmplitude = new Vector2(.035f, .025f);
        public bool driftEnabled = true;
        public const float PortraitAspect = 9f / 16;
        public Vector2 CurrentDrift { get; private set; }
        public float RequiredHalfHeight { get; private set; } = 9.6f;
        private Camera view;
        private void OnEnable() { view = GetComponent<Camera>(); ConfigureViewport(Screen.width, Screen.height); Sample(0); }
        public void ConfigureViewport(int width, int height)
        {
            if (!view) view = GetComponent<Camera>();
            float aspect = (float)Mathf.Max(1, width) / Mathf.Max(1, height);
            view.rect = PortraitRect(aspect); view.aspect = PortraitAspect;
            view.orthographic = true; FitBounds();
        }
        public static Rect PortraitRect(float aspect)
        {
            if (aspect > PortraitAspect) { float width = PortraitAspect / aspect; return new Rect((1 - width) / 2, 0, width, 1); }
            float height = aspect / PortraitAspect; return new Rect(0, (1 - height) / 2, 1, height);
        }
        public void FitBounds()
        {
            if (!view) view = GetComponent<Camera>();
            float half = 9.6f;
            if (protectedLayers != null) foreach (var layer in protectedLayers)
            {
                if (!layer) continue;
                var b = layer.ContentBounds;
                float x = Mathf.Max(Mathf.Abs(b.min.x), Mathf.Abs(b.max.x)) + safeMargin + Mathf.Abs(driftAmplitude.x);
                float y = Mathf.Max(Mathf.Abs(b.min.y), Mathf.Abs(b.max.y)) + safeMargin + Mathf.Abs(driftAmplitude.y);
                half = Mathf.Max(half, x / PortraitAspect, y);
            }
            RequiredHalfHeight = half; view.orthographicSize = half;
        }
        public void Sample(float time)
        {
            CurrentDrift = driftEnabled ? new Vector2(Mathf.Sin(time * .075f) * driftAmplitude.x, Mathf.Sin(time * .054f) * driftAmplitude.y) : Vector2.zero;
            transform.localPosition = new Vector3(CurrentDrift.x, CurrentDrift.y, -20);
            transform.localRotation = Quaternion.identity;
        }
        private void OnDrawGizmosSelected()
        { Gizmos.color = Color.yellow; Gizmos.DrawWireCube(Vector3.zero, new Vector3(10.8f, 19.2f, .01f)); }
    }
}
