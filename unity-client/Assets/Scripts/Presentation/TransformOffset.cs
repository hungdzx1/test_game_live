using UnityEngine;

namespace TuTienLive.Presentation
{
    // Nonserialized runtime offset. The Transform saved by Unity remains the authored pose.
    // Rebase explicit edits made during a preview instead of snapping them back.
    public sealed class TransformOffset
    {
        private Transform target;
        private Vector3 position, scale, lastPosition, lastScale;
        private Quaternion rotation, lastRotation;
        public void Capture(Transform value)
        {
            target=value; position=lastPosition=value.localPosition;
            rotation=lastRotation=value.localRotation;scale=lastScale=value.localScale;
        }
        private void Rebase(Transform value)
        {
            if(target!=value){Capture(value);return;}
            position+=value.localPosition-lastPosition;
            rotation=value.localRotation*Quaternion.Inverse(lastRotation)*rotation;
            var current=value.localScale;
            scale=Vector3.Scale(scale,new Vector3(Ratio(current.x,lastScale.x),Ratio(current.y,lastScale.y),Ratio(current.z,lastScale.z)));
        }
        private static float Ratio(float a,float b)=>Mathf.Abs(b)>.000001f?a/b:1;
        public void Apply(Transform value,Vector3 translation,Quaternion turn,float size=1)
        {
            Rebase(value);
            value.localPosition=lastPosition=position+translation;
            value.localRotation=lastRotation=rotation*turn;
            value.localScale=lastScale=scale*size;
        }
        public void Restore()
        {
            if(!target)return;Rebase(target);
            target.localPosition=lastPosition=position;target.localRotation=lastRotation=rotation;target.localScale=lastScale=scale;
        }
    }
}
