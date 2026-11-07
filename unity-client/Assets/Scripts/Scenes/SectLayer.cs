using System;
using UnityEngine;
using UnityEngine.Rendering;
using TuTienLive.Presentation;

namespace TuTienLive.Scenes
{
    public enum SectQuality { Low, Medium, High }
    public enum SectMotion { None, Cloud, Mist, Petals, Glow }

    [ExecuteAlways, RequireComponent(typeof(MeshFilter), typeof(MeshRenderer))]
    public sealed class SectLayer : MonoBehaviour
    {
        [Tooltip("Original PNG imported as Sprite. The plane uses the same texture, without recoloring.")]
        public Sprite sourceSprite;
        [Tooltip("Pixel rectangle from bottom-left of the source. Only transparent outer padding is omitted.")]
        public Rect sourcePixelRect;
        [Tooltip("Alpha >=32 content bounds, used only to place the anchor. Soft alpha is still rendered from sourcePixelRect.")]
        public Rect contentPixelRect;
        [Tooltip("Anchor in the visible rectangle: (0,0) bottom-left, (.5,0) bottom-center.")]
        public Vector2 anchor = new Vector2(.5f, 0);
        [Tooltip("1080 x 1920 layout: X rightwards, Y downwards from top-left.")]
        [HideInInspector] public Vector2 positionPixels;
        [HideInInspector,Min(.001f)] public float uniformScale = 1;
        [Tooltip("Keep 1 for architecture. Only rings use the documented ground ellipse ratio.")]
        [HideInInspector,Range(.1f, 1.5f)] public float verticalScale = 1;
        [Range(0, 1)] public float opacity = 1;
        [HideInInspector] public string sortingLayer = "SectBackground";
        [HideInInspector] public int sortingOrder;
        [HideInInspector] public bool sceneAuthored;
        [Tooltip("Baked once by migration. Layout uses Transform; sorting uses MeshRenderer.")]
        public Mesh bakedGeometry;
        public bool protectFromClipping;
        [Tooltip("Only background/atmosphere and waterfall tails may intentionally extend beyond the portrait frame.")]
        public bool allowFrameBleed;
        public SectQuality minimumQuality;
        public SectMotion motion;
        [Range(0, .5f)] public float parallax;
        public float phase;
        private Mesh ownedMesh;
        private MaterialPropertyBlock block;
        private bool dirty = true;
        private MeshRenderer view;
        private readonly TransformOffset offsetPose = new TransformOffset();
        private static readonly int ColorId = Shader.PropertyToID("_Color");
        public const float PixelsPerUnit = 100;
        public Bounds WorldBounds => GetComponent<MeshRenderer>().bounds;
        public Bounds ContentBounds
        {
            get
            {
                var center = (new Vector2(.5f, .5f) - anchor) * contentPixelRect.size / PixelsPerUnit;
                var local=new Bounds(new Vector3(center.x,center.y),new Vector3(contentPixelRect.width/PixelsPerUnit,contentPixelRect.height/PixelsPerUnit,.01f));
                var result=new Bounds(transform.TransformPoint(local.min),Vector3.zero);
                for(int x=0;x<2;x++)for(int y=0;y<2;y++)for(int z=0;z<2;z++)
                    result.Encapsulate(transform.TransformPoint(new Vector3(x==0?local.min.x:local.max.x,y==0?local.min.y:local.max.y,z==0?local.min.z:local.max.z)));
                return result;
            }
        }
        public Vector3 AuthoredPosition => new Vector3((positionPixels.x - 540) / PixelsPerUnit, (960 - positionPixels.y) / PixelsPerUnit, 10 - sortingOrder * .01f);
        private void OnEnable() { offsetPose.Capture(transform); dirty = true; ApplyLayout(); }
        private void OnValidate() { dirty = true; }
        private void Update() { if (dirty) ApplyLayout(); }
        public void ApplyLayout()
        {
            if (!sourceSprite) return;
            view = GetComponent<MeshRenderer>();
            if(sceneAuthored)
            {
                if(block==null)block=new MaterialPropertyBlock();
                if(!GetComponent<MeshFilter>().sharedMesh&&bakedGeometry)GetComponent<MeshFilter>().sharedMesh=bakedGeometry;
                dirty=false;ApplyOpacity(opacity);return;
            }
            if (!ownedMesh) { ownedMesh = new Mesh { name = name + "_OwnedQuad", hideFlags = HideFlags.HideAndDontSave }; GetComponent<MeshFilter>().sharedMesh = ownedMesh; }
            if (block == null) block = new MaterialPropertyBlock();
            var size = sourcePixelRect.size / PixelsPerUnit;
            var pivot = contentPixelRect.position + contentPixelRect.size * anchor;
            float left = (sourcePixelRect.xMin - pivot.x) / PixelsPerUnit, bottom = (sourcePixelRect.yMin - pivot.y) / PixelsPerUnit;
            ownedMesh.Clear();
            ownedMesh.vertices = new[] { new Vector3(left, bottom), new Vector3(left + size.x, bottom), new Vector3(left + size.x, bottom + size.y), new Vector3(left, bottom + size.y) };
            var texture = sourceSprite.texture;
            float x0 = sourcePixelRect.xMin / texture.width, x1 = sourcePixelRect.xMax / texture.width;
            float y0 = sourcePixelRect.yMin / texture.height, y1 = sourcePixelRect.yMax / texture.height;
            ownedMesh.uv = new[] { new Vector2(x0, y0), new Vector2(x1, y0), new Vector2(x1, y1), new Vector2(x0, y1) };
            ownedMesh.colors = new[] { Color.white, Color.white, Color.white, Color.white };
            ownedMesh.triangles = new[] { 0, 2, 1, 0, 3, 2 }; ownedMesh.RecalculateBounds();
            view.shadowCastingMode = ShadowCastingMode.Off; view.receiveShadows = false;
            view.lightProbeUsage = LightProbeUsage.Off; view.reflectionProbeUsage = ReflectionProbeUsage.Off;
            view.sortingLayerName = sortingLayer; view.sortingOrder = sortingOrder;
            dirty = false; Sample(0, Vector2.zero, SectQuality.High);
        }
        public void Sample(float time, Vector2 cameraOffset, SectQuality quality)
        {
            if (!view || block == null) return;
            view.enabled = quality >= minimumQuality;
            var offset = cameraOffset * parallax; float alpha = opacity;
            switch (motion)
            {
                case SectMotion.Cloud: offset += new Vector2(Mathf.Sin(time * .025f + phase) * .12f, 0); break;
                case SectMotion.Mist: offset += new Vector2(Mathf.Sin(time * .035f + phase) * .10f, Mathf.Sin(time * .02f) * .04f); break;
                case SectMotion.Petals: offset += new Vector2(Mathf.Sin(time * .10f + phase) * .08f, -Mathf.Sin(time * .045f + phase) * .12f); break;
                case SectMotion.Glow: alpha *= .92f + .08f * Mathf.Cos(time * .6f); break;
            }
            if(sceneAuthored)
            {
                // Scene Transform contains the old t=0 appearance. Only animate its delta.
                Vector2 initial=Vector2.zero;
                if(motion==SectMotion.Cloud)initial.x=Mathf.Sin(phase)*.12f;
                if(motion==SectMotion.Mist)initial.x=Mathf.Sin(phase)*.10f;
                if(motion==SectMotion.Petals)initial.x=Mathf.Sin(phase)*.08f;
                offsetPose.Apply(transform,new Vector3(offset.x-initial.x,offset.y-initial.y),Quaternion.identity);
            }
            else
            {
                transform.localPosition = AuthoredPosition + new Vector3(offset.x, offset.y);
                transform.localRotation = Quaternion.identity;
                transform.localScale = new Vector3(uniformScale, uniformScale * verticalScale, 1);
            }
            ApplyOpacity(alpha);
        }
        private void ApplyOpacity(float alpha)
        { if(view&&block!=null){block.SetColor(ColorId,new Color(1,1,1,alpha));view.SetPropertyBlock(block);} }
        public void RestoreAuthoredPose(){if(sceneAuthored)offsetPose.Restore();}
        public void MarkSceneAuthored(Mesh geometry)
        { bakedGeometry=geometry;sceneAuthored=true;offsetPose.Capture(transform);GetComponent<MeshFilter>().sharedMesh=geometry;dirty=true;ApplyLayout(); }
        private void OnDisable(){RestoreAuthoredPose();}
        private void OnDestroy()
        { if (ownedMesh) { if (Application.isPlaying) Destroy(ownedMesh); else DestroyImmediate(ownedMesh); } }
        private void OnDrawGizmosSelected()
        {
            Gizmos.color = protectFromClipping ? Color.green : Color.cyan;
            if (view) Gizmos.DrawWireCube(view.bounds.center, view.bounds.size);
            Gizmos.DrawWireSphere(transform.position, .06f);
        }
    }
}
