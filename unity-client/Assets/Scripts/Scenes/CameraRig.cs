using UnityEngine;
using TuTienLive.Presentation;

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
        [Tooltip("Automatically widen the view during Play to keep protected content visible. Never edits saved camera pose.")]
        public bool autoFitBounds = true;
        [HideInInspector] public bool sceneAuthored;
        public const float PortraitAspect = 9f / 16;
        public Vector2 CurrentDrift { get; private set; }
        public float RequiredHalfHeight { get; private set; } = 9.6f;
        private Camera view;
        private readonly TransformOffset pose = new TransformOffset();
        private float authoredHalfHeight;
        private void OnEnable() { view = GetComponent<Camera>();pose.Capture(transform);authoredHalfHeight=view.orthographicSize;ConfigureViewport(Screen.width, Screen.height); }
        public void ConfigureViewport(int width, int height)
        {
            if (!view) view = GetComponent<Camera>();
            float aspect = (float)Mathf.Max(1, width) / Mathf.Max(1, height);
            view.rect = PortraitRect(aspect); view.aspect = PortraitAspect;
            if(!sceneAuthored||Application.isPlaying)FitBounds();
        }
        public static Rect PortraitRect(float aspect)
        {
            if (aspect > PortraitAspect) { float width = PortraitAspect / aspect; return new Rect((1 - width) / 2, 0, width, 1); }
            float height = aspect / PortraitAspect; return new Rect(0, (1 - height) / 2, 1, height);
        }
        public void FitBounds()
        {
            if (!view) view = GetComponent<Camera>();
            float half = sceneAuthored ? Mathf.Max(.01f,authoredHalfHeight) : 9.6f;
            if(!autoFitBounds){RequiredHalfHeight=view.orthographicSize;return;}
            var cameraPosition=transform.position;
            if (protectedLayers != null) foreach (var layer in protectedLayers)
            {
                if (!layer) continue;
                var b = layer.ContentBounds;
                float x = Mathf.Max(Mathf.Abs(b.min.x-cameraPosition.x), Mathf.Abs(b.max.x-cameraPosition.x)) + safeMargin + Mathf.Abs(driftAmplitude.x);
                float y = Mathf.Max(Mathf.Abs(b.min.y-cameraPosition.y), Mathf.Abs(b.max.y-cameraPosition.y)) + safeMargin + Mathf.Abs(driftAmplitude.y);
                half = Mathf.Max(half, x / PortraitAspect, y);
            }
            RequiredHalfHeight = half; view.orthographicSize = half;
        }
        public void Sample(float time)
        {
            CurrentDrift = driftEnabled ? new Vector2(Mathf.Sin(time * .075f) * driftAmplitude.x, Mathf.Sin(time * .054f) * driftAmplitude.y) : Vector2.zero;
            if(sceneAuthored)pose.Apply(transform,new Vector3(CurrentDrift.x,CurrentDrift.y),Quaternion.identity);
            else {transform.localPosition=new Vector3(CurrentDrift.x,CurrentDrift.y,-20);transform.localRotation=Quaternion.identity;}
        }
        public void MarkSceneAuthored(){sceneAuthored=true;pose.Capture(transform);authoredHalfHeight=GetComponent<Camera>().orthographicSize;}
        private void OnDisable(){if(sceneAuthored)pose.Restore();}
        private void OnDrawGizmosSelected()
        { Gizmos.color = Color.yellow; Gizmos.DrawWireCube(Vector3.zero, new Vector3(10.8f, 19.2f, .01f)); }
    }
}
