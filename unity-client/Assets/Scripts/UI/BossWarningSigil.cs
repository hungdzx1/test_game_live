using UnityEngine;
using UnityEngine.UI;

namespace TuTienLive.UI
{
    [RequireComponent(typeof(CanvasRenderer))]
    public sealed class BossWarningSigil : MaskableGraphic
    {
        protected override void OnPopulateMesh(VertexHelper mesh)
        {
            mesh.Clear();var rect=GetPixelAdjustedRect();var c=rect.center;float radius=Mathf.Min(rect.width,rect.height)*.46f;
            for(int ring=0;ring<2;ring++)for(int i=0;i<80;i++)
            {
                float a=i*Mathf.PI*2/80,b=(i+1)*Mathf.PI*2/80,r=radius-ring*9;
                Line(mesh,c+new Vector2(Mathf.Cos(a),Mathf.Sin(a))*r,c+new Vector2(Mathf.Cos(b),Mathf.Sin(b))*r,1.4f);
            }
            var top=c+Vector2.up*radius*.70f;var left=c+new Vector2(-radius*.70f,-radius*.48f);var right=c+new Vector2(radius*.70f,-radius*.48f);
            Line(mesh,top,left,2.4f);Line(mesh,left,right,2.4f);Line(mesh,right,top,2.4f);
            Line(mesh,c+Vector2.up*radius*.28f,c-Vector2.up*radius*.08f,4);
            Line(mesh,c-Vector2.up*radius*.25f,c-Vector2.up*radius*.28f,5);
            for(int i=0;i<4;i++){float a=i*Mathf.PI/2;var v=new Vector2(Mathf.Cos(a),Mathf.Sin(a));Line(mesh,c+v*(radius-6),c+v*(radius+4),1.2f);}
        }
        private void Line(VertexHelper mesh,Vector2 a,Vector2 b,float width)
        {
            var d=(b-a).normalized;var n=new Vector2(-d.y,d.x)*width/2;int first=mesh.currentVertCount;
            mesh.AddVert(a-n,color,Vector2.zero);mesh.AddVert(a+n,color,Vector2.zero);mesh.AddVert(b+n,color,Vector2.zero);mesh.AddVert(b-n,color,Vector2.zero);
            mesh.AddTriangle(first,first+1,first+2);mesh.AddTriangle(first,first+2,first+3);
        }
    }
}
