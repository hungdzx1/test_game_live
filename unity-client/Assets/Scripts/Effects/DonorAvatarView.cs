using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using TMPro;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;
using TuTienLive.Network;

namespace TuTienLive.Effects
{
    public enum AvatarLoadState { Hidden, Missing, Loading, Ready, Failed }
    // Viewer-supplied profile photo, not a game asset. Transient bounded cache; never written to disk.
    public sealed class DonorAvatarView : MonoBehaviour
    {
        public RawImage portrait;
        public TMP_Text fallback;
        private readonly Dictionary<string,Texture2D> cache=new Dictionary<string,Texture2D>(StringComparer.Ordinal);
        private readonly Queue<string> order=new Queue<string>();
        private Coroutine loading;
        private UnityWebRequest request;
        private int generation;
        public int CachedCount=>cache.Count;
        public AvatarLoadState State { get; private set; }
        public string Error { get; private set; }
        public string StatusText=>State==AvatarLoadState.Ready?"Đã tải ảnh":State==AvatarLoadState.Loading?"Đang tải":State==AvatarLoadState.Missing?"Không có ảnh":State==AvatarLoadState.Failed?"Tải lỗi"+(string.IsNullOrEmpty(Error)?"":" · "+Error):"";
        public static bool IsSafeUrl(string value)
        {
            if(string.IsNullOrEmpty(value)||value.Length>2048||!Uri.TryCreate(value,UriKind.Absolute,out var uri)||uri.Scheme!="https"||!string.IsNullOrEmpty(uri.UserInfo)||!uri.IsDefaultPort)return false;
            foreach(var host in new[]{"tiktokcdn.com","tiktokcdn-us.com","tiktokcdn-eu.com","tiktokcdn-in.com","tiktokv.com","byteoversea.com","ibytedtos.com","muscdn.com"})if(uri.Host==host||uri.Host.EndsWith("."+host,StringComparison.OrdinalIgnoreCase))return true;
            return false;
        }
        public void Present(string name,string url)
        {
            Cancel();Error=null;State=AvatarLoadState.Missing;if(portrait){portrait.texture=null;portrait.enabled=false;}if(fallback){fallback.enabled=true;fallback.text=string.IsNullOrWhiteSpace(name)?"?":StringInfo.GetNextTextElement(name.Trim()).ToUpperInvariant();}
            if(string.IsNullOrEmpty(url))return;if(!IsSafeUrl(url)){Fail("URL ảnh không hợp lệ");return;}
            if(cache.TryGetValue(url,out var texture)){Show(texture);return;}
            State=AvatarLoadState.Loading;
            if(Application.isPlaying&&isActiveAndEnabled)loading=StartCoroutine(Load(url,generation));
        }
        private IEnumerator Load(string url,int revision)
        {
            var network=FindAnyObjectByType<UnityWebSocketClient>();
            string local=RequestUrl(url,network?network.Endpoint:null);
            if(local==null){Fail("Chưa có máy chủ avatar");yield break;}
            using(var web=UnityWebRequest.Get(local))
            {
                request=web;web.timeout=8;web.redirectLimit=0;web.SendWebRequest();
                while(!web.isDone){if(web.downloadedBytes>524288){web.Abort();request=null;Fail("Ảnh quá lớn");yield break;}yield return null;}
                request=null;if(revision!=generation)yield break;
                if(web.result!=UnityWebRequest.Result.Success){Fail(RequestError(web.GetResponseHeader("X-Avatar-Error"),web.responseCode));yield break;}
                AcceptImage(url,web.downloadHandler.data);
            }
            loading=null;
        }
        public static string RequestUrl(string source,string endpoint)
        {
            if(!IsSafeUrl(source)||!Uri.TryCreate(endpoint,UriKind.Absolute,out var server)||server.Scheme!="ws"||!string.IsNullOrEmpty(server.UserInfo)||(server.Host!="127.0.0.1"&&server.Host!="localhost"))return null;
            return "http://"+server.Authority+"/api/avatar?url="+Uri.EscapeDataString(source);
        }
        public static string RequestError(string code,long status)
        {
            switch(code){case "decode":return "Máy chủ không giải mã được ảnh";case "source_size":case "output_size":return "Ảnh quá lớn";case "busy":return "Máy chủ ảnh đang bận";case "timeout":return "Hết thời gian tải ảnh";case "url":return "URL ảnh không hợp lệ";case "upstream_http":return "CDN từ chối ảnh";case "network":return "Không kết nối được CDN";}
            return status==404?"Cần khởi động lại Node":status>0?"HTTP "+status:"Không tải được ảnh";
        }
        private bool AcceptImage(string url,byte[] data)
        {
            if(!IsSafeUrl(url)){Fail("URL ảnh không hợp lệ");return false;}
            if(data==null||data.Length==0||data.Length>524288){Fail("Ảnh rỗng hoặc quá lớn");return false;}
            var texture=new Texture2D(2,2,TextureFormat.RGBA32,false){name="Donor avatar",hideFlags=HideFlags.DontSave};
            bool decoded=false;try{decoded=texture.LoadImage(data);}catch(Exception){ }
            if(!decoded){Release(texture);Fail("Không giải mã được PNG/JPEG");return false;}
            if(texture.width>1024||texture.height>1024){Release(texture);Fail("Ảnh vượt1024×1024");return false;}
            texture.filterMode=FilterMode.Bilinear;texture.wrapMode=TextureWrapMode.Clamp;
            if(cache.TryGetValue(url,out var prior))Release(prior);else order.Enqueue(url);cache[url]=texture;
            while(order.Count>8){var oldest=order.Dequeue();if(cache.TryGetValue(oldest,out var old)){cache.Remove(oldest);Release(old);}}
            Show(texture);return true;
        }
        private void Fail(string error){Error=error;State=AvatarLoadState.Failed;}
        private static void Release(Texture texture){if(!texture)return;if(Application.isPlaying)Destroy(texture);else DestroyImmediate(texture);}
        private void Show(Texture texture){Error=null;State=AvatarLoadState.Ready;if(portrait){portrait.texture=texture;portrait.enabled=true;}if(fallback)fallback.enabled=false;}
        public void Hide(){Cancel();State=AvatarLoadState.Hidden;Error=null;if(portrait){portrait.texture=null;portrait.enabled=false;}if(fallback)fallback.enabled=false;}
        private void Cancel(){generation++;if(request!=null)request.Abort();request=null;if(loading!=null)StopCoroutine(loading);loading=null;}
        private void OnDisable(){Hide();}
        private void OnDestroy(){Cancel();foreach(var texture in cache.Values)Release(texture);cache.Clear();order.Clear();}
    }
}
