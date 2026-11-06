using UnityEngine;

namespace TuTienLive.Scenes
{
    [ExecuteAlways, RequireComponent(typeof(TextMesh))]
    public sealed class SectTextLayout : MonoBehaviour
    {
        public Vector2 maximumSizePixels = new Vector2(900, 70);
        private MeshRenderer view;
        private void OnEnable() { view = GetComponent<MeshRenderer>(); Fit(); }
        private void LateUpdate() { Fit(); }
        public void Fit()
        {
            if (!view) view = GetComponent<MeshRenderer>();
            var size = view.localBounds.size;
            if (size.x <= .0001f || size.y <= .0001f) return;
            float scale = Mathf.Min(maximumSizePixels.x / (100 * size.x), maximumSizePixels.y / (100 * size.y));
            transform.localScale = Vector3.one * scale;
        }
    }
}
