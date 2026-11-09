using UnityEngine;
using UnityEngine.UI;

namespace TuTienLive.UI
{
    // Cached UGUI geometry only. No texture generation, Update loop or gameplay state.
    [AddComponentMenu("Tu Tien LIVE/UI/Guide panel graphic"), RequireComponent(typeof(CanvasRenderer))]
    public sealed class GuidePanelGraphic : MaskableGraphic
    {
        public enum Shape { Panel, Star, Heart, Arrow, Diamond }
        public Shape shape;
        public float radius=14;
        public bool cornerAccents=true;
        public Color border=new Color(.87f,.74f,.44f,.8f);
        public Color innerBorder=new Color(.89f,.78f,.49f,.16f);
        protected override void OnPopulateMesh(VertexHelper vh)
        {
            vh.Clear();var r=GetPixelAdjustedRect();if(r.width<=0||r.height<=0)return;
            if(shape!=Shape.Panel){Symbol(vh,r);return;}
            Fill(vh,Points(r,radius),color);Ring(vh,r,radius,1,border);
            var inner=new Rect(r.x+5,r.y+5,r.width-10,r.height-10);
            if(inner.width>0&&inner.height>0)Ring(vh,inner,Mathf.Max(0,radius-4),1,innerBorder);
            if(!cornerAccents)return;
            var tint=new Color(1,.89f,.63f,.95f);
            foreach(int x in new[]{-1,1})foreach(int y in new[]{-1,1})
            {
                float px=x<0?r.xMin+5:r.xMax-22,py=y<0?r.yMin+5:r.yMax-7;
                Quad(vh,new Rect(px,py,17,2),tint);
                px=x<0?r.xMin+5:r.xMax-7;py=y<0?r.yMin+5:r.yMax-22;
                Quad(vh,new Rect(px,py,2,17),tint);
            }
        }
        private static Vector2[] Points(Rect r,float radius)
        {
            float d=Mathf.Clamp(radius,0,Mathf.Min(r.width,r.height)/2);var points=new Vector2[32];
            for(int i=0;i<32;i++)
            {
                int corner=i/8;float angle=(corner*90+(i%8)*90f/7)*Mathf.Deg2Rad;
                var c=new Vector2(corner==0||corner==3?r.xMax-d:r.xMin+d,corner<2?r.yMax-d:r.yMin+d);
                points[i]=c+new Vector2(Mathf.Cos(angle),Mathf.Sin(angle))*d;
            }
            return points;
        }
        private static void Fill(VertexHelper vh,Vector2[] p,Color tint)
        {
            int first=vh.currentVertCount;Vector2 center=Vector2.zero;foreach(var point in p)center+=point;center/=p.Length;
            vh.AddVert(center,tint,Vector2.zero);foreach(var point in p)vh.AddVert(point,tint,Vector2.zero);
            for(int i=0;i<p.Length;i++)vh.AddTriangle(first,first+1+i,first+1+(i+1)%p.Length);
        }
        private static void Ring(VertexHelper vh,Rect r,float radius,float width,Color tint)
        {
            if(r.width<=width*2||r.height<=width*2)return;
            var outer=Points(r,radius);var inner=Points(new Rect(r.x+width,r.y+width,r.width-2*width,r.height-2*width),Mathf.Max(0,radius-width));int first=vh.currentVertCount;
            for(int i=0;i<outer.Length;i++){vh.AddVert(outer[i],tint,Vector2.zero);vh.AddVert(inner[i],tint,Vector2.zero);}
            for(int i=0;i<outer.Length;i++){int a=first+2*i,b=first+2*((i+1)%outer.Length);vh.AddTriangle(a,b,a+1);vh.AddTriangle(a+1,b,b+1);}
        }
        private static void Quad(VertexHelper vh,Rect r,Color tint)=>Fill(vh,new[]{new Vector2(r.xMin,r.yMin),new Vector2(r.xMax,r.yMin),new Vector2(r.xMax,r.yMax),new Vector2(r.xMin,r.yMax)},tint);
        private void Symbol(VertexHelper vh,Rect r)
        {
            var c=r.center;float w=r.width/2,h=r.height/2;
            if(shape==Shape.Star){var p=new Vector2[8];for(int i=0;i<8;i++){float a=i*Mathf.PI/4;float factor=i%2==0?1:.22f;p[i]=c+new Vector2(Mathf.Cos(a)*w,Mathf.Sin(a)*h)*factor;}Fill(vh,p,color);}
            else if(shape==Shape.Diamond)Fill(vh,new[]{c+Vector2.left*w,c+Vector2.up*h,c+Vector2.right*w,c+Vector2.down*h},color);
            else if(shape==Shape.Arrow){Quad(vh,new Rect(c.x-w,c.y-1,r.width*.72f,2),color);Fill(vh,new[]{new Vector2(c.x+w,c.y),new Vector2(c.x+w*.25f,c.y+h*.7f),new Vector2(c.x+w*.25f,c.y-h*.7f)},color);}
            else if(shape==Shape.Heart)
            {
                var p=new Vector2[40];for(int i=0;i<p.Length;i++){float t=i*Mathf.PI*2/p.Length;float x=16*Mathf.Pow(Mathf.Sin(t),3);float y=13*Mathf.Cos(t)-5*Mathf.Cos(2*t)-2*Mathf.Cos(3*t)-Mathf.Cos(4*t);p[i]=c+new Vector2(x/17*w,(y+2)/18*h);}Fill(vh,p,color);
            }
        }
    }
}
