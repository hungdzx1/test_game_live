using System;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using TuTienLive.Characters;
using TuTienLive.Scenes;
using TuTienLive.Network;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class Concept02SizeVerification
    {
        [Serializable] private class Audit{public Entry[] assets;}
        [Serializable] private class Entry{public string id;public int height;public int[] bbox32;}
        public static void Capture()
        {
            SectSceneSetup.CleanScenes();EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);
            var bindings=UnityEngine.Object.FindAnyObjectByType<SectSceneBindings>();var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();
            var blessing=UnityEngine.Object.FindAnyObjectByType<BlessingPanelHud>();var camera=bindings.cameraRig.GetComponent<Camera>();
            string output=Path.Combine(SectSceneSetup.RepositoryRoot(),"docs/unity-size-refinement");Directory.CreateDirectory(output);
            var audit=JsonUtility.FromJson<Audit>(File.ReadAllText(Concept02SceneSetup.ArtRoot+"asset-audit.json"));
            var preview=new CharacterView[3];var normal=new Vector3[3];var heights=new float[3];var scaleInfo=new JArray();
            hud.Render(null);blessing.Render(null);bindings.environment.Sample(0);
            for(int i=0;i<3;i++)
            {
                var prefab=AssetDatabase.LoadAssetAtPath<CharacterView>(Concept02SceneSetup.Root+"Prefabs/Character_"+(i+1)+".prefab");
                var view=UnityEngine.Object.Instantiate(prefab,bindings.groups[3]);preview[i]=view;view.transform.position=new Vector3((i-1)*2.8f,-5,8);
                view.pose.Sample("meditate",0);view.nameLabel.text="Mẫu "+(i+1);view.nameLabel.ForceMeshUpdate();normal[i]=view.transform.localScale;
                var entry=audit.assets.Single(e=>e.id=="Characters/Character_"+(i+1)+"/meditation.png");
                heights[i]=(entry.bbox32[3]-entry.bbox32[1])/view.pose.meditate.pixelsPerUnit*view.pose.transform.lossyScale.y;
                scaleInfo.Add(new JObject{["character"]=i+1,["visibleHeight"]=heights[i],["rootScale"]=view.transform.localScale.y});
            }
            if(heights.Any(h=>Mathf.Abs(h-heights[2])>.001f))throw new InvalidOperationException("Visible character heights differ.");
            Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,"characters-after-1080x1920.png"));
            Concept02Verification.CaptureCamera(camera,720,1280,Path.Combine(output,"characters-after-720x1280.png"));
            for(int i=0;i<2;i++)preview[i].transform.localScale=Vector3.one; // Exact original root; all child transforms are unchanged.
            Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,"characters-before-1080x1920.png"));
            foreach(var view in preview)UnityEngine.Object.DestroyImmediate(view.gameObject);
            var storm=bindings.tribulation.stormCloud.transform.parent;var stormPosition=storm.localPosition;
            if(Mathf.Abs(stormPosition.y-.3f)>.001f)throw new InvalidOperationException("Storm root was not raised by 0.3.");
            if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/Characters/ritual-start.json"),out var e1,out var error))throw new InvalidOperationException(error);
            bindings.characters.ApplySnapshot(e1.Snapshot,e1.SessionId);bindings.characters.Sample(1890,0);hud.Render(e1.Snapshot);blessing.Render(e1.Snapshot);
            if(bindings.tribulation.LightningFrameIndex!=2)throw new InvalidOperationException("Expected visible third PNG lightning frame.");
            Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,"storm-after-1080x1920.png"));
            Concept02Verification.CaptureCamera(camera,720,1280,Path.Combine(output,"storm-after-720x1280.png"));
            storm.localPosition=stormPosition-Vector3.up*.3f;
            Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,"storm-before-1080x1920.png"));storm.localPosition=stormPosition;
            if(!StateMapper.TryParse(File.ReadAllText("Assets/Tests/Fixtures/Blessing/active-30.json"),out var roster,out error))throw new InvalidOperationException(error);
            bindings.characters.ApplySnapshot(roster.Snapshot,roster.SessionId);bindings.characters.Sample(0,0);hud.Render(roster.Snapshot);blessing.Render(roster.Snapshot);
            Concept02Verification.CaptureCamera(camera,1080,1920,Path.Combine(output,"roster-after-1080x1920.png"));
            File.WriteAllText(Path.Combine(output,"unity-size-report.json"),new JObject{["result"]="PASS",["characters"]=scaleInfo,["heightTolerance"]=.001,["stormRootY"]=stormPosition.y,["savedPreviewPlayers"]=false}.ToString());
            Debug.Log("CONCEPT02_SIZE_CAPTURE_PASS "+SystemInfo.graphicsDeviceName);
        }
    }
}
