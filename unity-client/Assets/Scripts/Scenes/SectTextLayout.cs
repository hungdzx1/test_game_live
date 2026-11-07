using UnityEngine;

namespace TuTienLive.Scenes
{
    [ExecuteAlways, RequireComponent(typeof(TextMesh))]
    public sealed class SectTextLayout : MonoBehaviour
    {
        public Vector2 maximumSizePixels = new Vector2(900, 70);
        [Tooltip("Off after migration: edit TextMesh/Transform directly. Fit is an explicit authoring action.")]
        public bool autoFit = true;
        private MeshRenderer view;
        private void OnEnable() { view = GetComponent<MeshRenderer>(); if(autoFit)Fit(); }
        private void LateUpdate() { if(autoFit)Fit(); }
        [ContextMenu("Fit text once to pixel bounds")]
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
