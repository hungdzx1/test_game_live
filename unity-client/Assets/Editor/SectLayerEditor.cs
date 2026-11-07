using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Scenes;

namespace TuTienLive.Editor
{
    // Author the pixel layout instead of moving the transient animated Transform.
    [CustomEditor(typeof(SectLayer)), CanEditMultipleObjects]
    public sealed class SectLayerEditor : UnityEditor.Editor
    {
        private void OnDisable() { Tools.hidden = false; }

        private void OnSceneGUI()
        {
            if(((SectLayer)target).sceneAuthored){Tools.hidden=false;return;}
            bool editing = !Application.isPlaying && Tools.current == Tool.Move;
            Tools.hidden = editing;
            if (!editing) return;
            var layer = (SectLayer)target;
            var origin = layer.transform.position;
            EditorGUI.BeginChangeCheck();
            var destination = Handles.PositionHandle(origin, Quaternion.identity);
            if (!EditorGUI.EndChangeCheck()) return;
            var delta = destination - origin;
            MoveLayers(targets, delta);
        }

        public static void MoveLayers(Object[] layers, Vector3 worldDelta)
        {
            Undo.RecordObjects(layers, "Move sect layer");
            foreach (var item in layers)
            {
                var selected = (SectLayer)item;
                Undo.RecordObject(selected.transform, "Move sect layer");
                if(selected.sceneAuthored)
                {
                    selected.transform.position+=worldDelta;
                    PrefabUtility.RecordPrefabInstancePropertyModifications(selected.transform);
                    EditorSceneManager.MarkSceneDirty(selected.gameObject.scene);continue;
                }
                var localDelta = selected.transform.parent
                    ? selected.transform.parent.InverseTransformVector(worldDelta) : worldDelta;
                selected.positionPixels += new Vector2(localDelta.x, -localDelta.y) * SectLayer.PixelsPerUnit;
                selected.ApplyLayout();
                PrefabUtility.RecordPrefabInstancePropertyModifications(selected);
                PrefabUtility.RecordPrefabInstancePropertyModifications(selected.transform);
                EditorSceneManager.MarkSceneDirty(selected.gameObject.scene);
            }
        }
    }
}
