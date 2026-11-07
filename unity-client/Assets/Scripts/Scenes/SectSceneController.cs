using UnityEngine;

namespace TuTienLive.Scenes
{
    [ExecuteAlways]
    public sealed class SectSceneController : MonoBehaviour
    {
        public SectQuality quality = SectQuality.Medium;
        public CameraRig cameraRig;
        public SectLayer[] layers;
        public bool animate = true;
        private int lastWidth, lastHeight;
        private void OnEnable() { ApplyQuality(); if(Application.isPlaying)Sample(0); }
        private void Update()
        {
            if (!cameraRig) return;
            if (Screen.width != lastWidth || Screen.height != lastHeight)
            { lastWidth = Screen.width; lastHeight = Screen.height; cameraRig.ConfigureViewport(lastWidth, lastHeight); }
            if (Application.isPlaying) Sample(animate ? Time.timeSinceLevelLoad : 0);
        }
        [ContextMenu("Apply scene quality")]
        public void ApplyQuality()
        {
            // Presentation only; caidat.json/WS and global quality configuration are not modified.
            if (cameraRig)
            {
                var camera = cameraRig.GetComponent<Camera>();
                camera.allowHDR = false; camera.allowMSAA = false;
            }
            if (Application.isPlaying) Application.targetFrameRate = quality == SectQuality.Low ? 30 : 60;
        }
        public void Sample(float time)
        {
            if (!cameraRig || layers == null) return;
            ApplyQuality(); cameraRig.Sample(quality==SectQuality.Low?0:time);
            foreach (var layer in layers) if (layer) layer.Sample(time, cameraRig.CurrentDrift, quality);
            cameraRig.FitBounds();
        }
    }
}
