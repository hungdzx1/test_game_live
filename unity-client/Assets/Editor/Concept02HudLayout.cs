using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using TuTienLive.UI;

namespace TuTienLive.Editor
{
    public static class Concept02HudLayout
    {
        public static void Configure(Concept02Hud hud)
        {
            if(hud.rankRows.Length==3&&hud.energyFill)return; // Preserve subsequent Inspector edits.
            var rows=new[]{hud.connectionLabel,hud.rosterLabel,hud.ritualLabel};
            var texture=AssetDatabase.LoadAssetAtPath<Texture2D>(Concept02SceneSetup.ArtRoot+"UI/ui_rank_icons.png");
            int[,] bounds={{135,158,640,526},{840,146,1357,529},{1563,159,2078,531}};
            hud.rankRows=rows;hud.rankIcons=new RawImage[3];
            for(int i=0;i<3;i++)
            {
                var label=rows[i];var rect=label.rectTransform;float width=rect.sizeDelta.x;float rowDrop=i==0?10:i==1?6:3;
                var iconGo=new GameObject("RankIcon_"+(i+1),typeof(RectTransform),typeof(RawImage));iconGo.transform.SetParent(rect.parent,false);
                var iconRect=(RectTransform)iconGo.transform;iconRect.anchorMin=rect.anchorMin;iconRect.anchorMax=rect.anchorMax;iconRect.pivot=new Vector2(.5f,.5f);
                iconRect.sizeDelta=new Vector2(34,34);iconRect.anchoredPosition=rect.anchoredPosition+new Vector2(-width/2+13,-rowDrop);
                var image=iconGo.GetComponent<RawImage>();image.texture=texture;image.raycastTarget=false;
                float x=bounds[i,0]-8,y=bounds[i,1]-8,w=bounds[i,2]-bounds[i,0]+16,h=bounds[i,3]-bounds[i,1]+16;
                image.uvRect=new Rect(x/texture.width,1-(y+h)/texture.height,w/texture.width,h/texture.height);hud.rankIcons[i]=image;
                rect.sizeDelta=new Vector2(width-40,rect.sizeDelta.y);rect.anchoredPosition+=new Vector2(20,-rowDrop);
                label.gameObject.name="Rank_"+(i+1);label.fontSize=16;label.enableAutoSizing=true;label.fontSizeMin=13;label.fontSizeMax=16;
                label.richText=false;label.alignment=TextAlignmentOptions.MidlineLeft;label.textWrappingMode=TextWrappingModes.NoWrap;label.overflowMode=TextOverflowModes.Ellipsis;
                label.text=i==0?"Đang chờ máy chủ":"—";
            }
            var canvas=hud.transform;
            var title=canvas.Find("NoticePanel/NoticeTitle").GetComponent<TMP_Text>();title.fontSize=19;title.rectTransform.anchoredPosition+=Vector2.down*5;
            hud.energyTitle=canvas.Find("Header/EnergyTitle").GetComponent<TMP_Text>();hud.energyTitle.fontSize=15;
            hud.energyLabel=canvas.Find("Header/EnergyUnavailable").GetComponent<TMP_Text>();hud.energyLabel.gameObject.name="EnergyValue";hud.energyLabel.text="-- / -- TIM";
            var fill=canvas.Find("Header/ProgressFill - unbound").GetComponent<RawImage>();fill.gameObject.name="EnergyFill";
            hud.energyFill=fill;hud.energyFillWidth=fill.rectTransform.sizeDelta.x;hud.energyFillUv=fill.uvRect;
            fill.rectTransform.pivot=new Vector2(0,.5f);fill.rectTransform.anchoredPosition-=new Vector2(hud.energyFillWidth/2,0);
            ConfigureEnergyFill(hud);
            EditorUtility.SetDirty(hud);
        }
        public static void ConfigureEnergyFill(Concept02Hud hud)
        {
            var frame=hud.transform.Find("Header/ProgressFrame").GetComponent<RawImage>();
            var fill=hud.energyFill;
            fill.texture=AssetDatabase.LoadAssetAtPath<Texture2D>(Concept02SceneSetup.ArtRoot+"UI/ui_progress_fill.png");
            // The frame PNG includes an opaque dark center. Draw the energy above it, inside its rim.
            int index=frame.transform.GetSiblingIndex();if(fill.transform.GetSiblingIndex()>index)index++;
            fill.transform.SetSiblingIndex(index);
            hud.energyFillWidth=frame.rectTransform.sizeDelta.x-12;
            fill.rectTransform.pivot=new Vector2(0,.5f);
            fill.rectTransform.anchoredPosition=frame.rectTransform.anchoredPosition-new Vector2(hud.energyFillWidth/2,0);
            fill.rectTransform.sizeDelta=new Vector2(hud.energyFillWidth,26);
            // Significant-alpha rectangle plus 8px guard; preserve the original PNG and its glow.
            hud.energyFillUv=new Rect(222f/2172,1-483f/724,1744f/2172,226f/724);
            fill.uvRect=hud.energyFillUv;fill.gameObject.SetActive(false);
            EditorUtility.SetDirty(hud);EditorUtility.SetDirty(fill);
        }
        public static void UpgradeValidation()
        {
            string expected=Path.Combine(SectSceneSetup.RepositoryRoot(),"test-results/unity-concept02/project/Assets");
            if(!string.Equals(Path.GetFullPath(Application.dataPath),Path.GetFullPath(expected),StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Use isolated validation project.");
            SectSceneSetup.CleanScenes();EditorSceneManager.OpenScene(Concept02SceneSetup.ScenePath);
            var hud=UnityEngine.Object.FindAnyObjectByType<Concept02Hud>();Configure(hud);
            hud.characters.scene.cameraRig.ConfigureViewport(1080,1920); // Do not serialize the batch Editor's temporary letterbox viewport.
            EditorSceneManager.MarkSceneDirty(hud.gameObject.scene);
            EditorSceneManager.SaveScene(hud.gameObject.scene);AssetDatabase.SaveAssets();Debug.Log("SECT_HUD_LAYOUT_PASS");
        }
    }
}
