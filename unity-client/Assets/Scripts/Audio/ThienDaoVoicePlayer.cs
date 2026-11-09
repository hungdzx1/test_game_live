using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;
using TuTienLive.Models;
using TuTienLive.Network;

namespace TuTienLive.Audio
{
    // One presentation channel. No gameplay decisions or file/save writes.
    [DisallowMultipleComponent]
    public sealed class ThienDaoVoicePlayer : MonoBehaviour
    {
        public UnityWebSocketClient network;
        public TMP_Text subtitle;
        public string Status { get; private set; } = "Chờ máy chủ giọng đọc";
        public string LastText { get; private set; }
        public int Played { get; private set; }
        public int QueueCount => queue.Count+(preparing!=null?1:0);
        public int CachedDynamicCount => clips.Keys.Count(k=>!pinned.Contains(k));
        public bool IsSpeaking => active!=null;
        public bool IsPaused => paused;
        public AudioSource[] Sources => sources.ToArray();
        private sealed class Line
        {
            public string Id,Type,Text,Fallback,Cycle;
            public string[] Keys;
            public int Priority;
            public double Created,Deadline,Expires;
        }
        private static readonly Regex Hash = new Regex("^[a-f0-9]{64}$",RegexOptions.CultureInvariant);
        private readonly List<Line> queue=new List<Line>();
        private readonly HashSet<string> seen=new HashSet<string>(StringComparer.Ordinal),pinned=new HashSet<string>(StringComparer.Ordinal),loading=new HashSet<string>(StringComparer.Ordinal);
        private readonly Queue<string> seenOrder=new Queue<string>();
        private readonly Dictionary<string,AudioClip> clips=new Dictionary<string,AudioClip>(StringComparer.Ordinal);
        private readonly Dictionary<string,double> used=new Dictionary<string,double>(StringComparer.Ordinal);
        private readonly List<AudioSource> sources=new List<AudioSource>();
        private readonly HashSet<UnityWebRequest> requests=new HashSet<UnityWebRequest>();
        private ProtocolSession bound;
        private Snapshot snapshot;
        private string session,mode;
        private bool allowed,paused;
        private float volume;
        private double serverAt,receiptAt,endDsp,playbackStart,playbackCursor,subtitleUntil,nextManifest;
        private int revision;
        private Coroutine manifestJob,prepareJob;
        private Line active,preparing;
        private GameObject subtitleRoot;
        public double ServerNow => serverAt+(Time.realtimeSinceStartupAsDouble-receiptAt)*1000;

        public static string BaseUrl(string endpoint)
        {
            if(!Uri.TryCreate(endpoint,UriKind.Absolute,out var uri)||uri.Scheme!="ws"||!string.IsNullOrEmpty(uri.UserInfo)||(uri.Host!="localhost"&&uri.Host!="127.0.0.1"))return null;
            return "http://"+uri.Authority;
        }
        public static bool ValidKeys(JToken value)
        {return value is JArray a&&a.Count>=1&&a.Count<=8&&a.All(t=>t.Type==JTokenType.String&&Hash.IsMatch((string)t));}
        private static Line Parse(GameEvent value)
        {
            if(value?.Kind!="voice:announcement")return null;var v=value.CopyJson();
            if(!ValidKeys(v["clips"])||v["fallback"]?.Type!=JTokenType.String||!Hash.IsMatch((string)v["fallback"]))return null;
            foreach(var key in new[]{"createdAt","deadlineAt","expiresAt","priority","count"})if(v[key]?.Type!=JTokenType.Integer)return null;
            long created=(long)v["createdAt"],deadline=(long)v["deadlineAt"],expires=(long)v["expiresAt"];
            int priority=(int)v["priority"],count=(int)v["count"];
            string type=(string)v["voiceType"],text=(string)v["text"],id=(string)v["voiceId"];
            if(created<0||deadline!=created+2000||expires!=created+15000||priority<1||priority>4||count<1||count>500||string.IsNullOrEmpty(id)||id.Length>100||string.IsNullOrEmpty(text)||text.Length>600||!new[]{"join","donor","breakthrough","boss"}.Contains(type)||priority!=(type=="boss"?4:type=="donor"?3:type=="breakthrough"?2:1))return null;
            return new Line{Id=id,Type=type,Text=text,Fallback=(string)v["fallback"],Cycle=(string)v["cycleId"],Keys=((JArray)v["clips"]).Values<string>().ToArray(),Priority=priority,Created=created,Deadline=deadline,Expires=expires};
        }
        private void OnEnable(){Refresh();}
        private void Update(){Refresh();}
        public void Refresh()
        {
            if(!Application.isPlaying||!isActiveAndEnabled)return;
            var protocol=network?network.Protocol:null;
            if(bound!=protocol){Unbind();bound=protocol;if(bound!=null){bound.State.Changed+=StateChanged;bound.Events.Received+=HandleEvent;}StateChanged();}
            double now=ServerNow;queue.RemoveAll(l=>l.Expires<=now||l.Type=="boss"&&!BossValid(l));
            if(active?.Type=="boss"&&!BossValid(active))StopPlayback();
            if(active!=null&&!paused&&AudioSettings.dspTime>=endDsp)StopPlayback();
            if(subtitle&&Time.realtimeSinceStartupAsDouble>subtitleUntil){subtitle.text="";if(subtitleRoot)subtitleRoot.SetActive(false);}
            if(!allowed)return;
            if(network&&network.isActiveAndEnabled&&manifestJob==null&&Time.realtimeSinceStartupAsDouble>=nextManifest)manifestJob=StartCoroutine(Manifest(revision));
            if(!paused&&active==null&&prepareJob==null&&queue.Count>0)
            {
                var line=queue.OrderByDescending(l=>l.Priority).ThenBy(l=>l.Created).First();queue.Remove(line);preparing=line;
                prepareJob=StartCoroutine(Prepare(line,revision));
            }
        }
        private void StateChanged()
        {
            var state=bound?.State;var next=state?.Snapshot;bool enabled=false;float nextVolume=0;
            var audio=(next?.CopyField("config") as JObject)?["audio"] as JObject;
            if(next!=null)
            {
                enabled=Bool(audio,"enabled",true)&&Bool(audio,"speech",true);
                nextVolume=Vol(audio,"masterVolume",.5f)*Vol(audio,"speechVolume",.8f);
            }
            bool reset=next==null||state.SessionId!=session||next.Mode!=mode||enabled!=allowed;
            if(reset)ResetRuntime();session=state?.SessionId;mode=next?.Mode;snapshot=next;allowed=next!=null&&enabled;
            if(next==null)return;serverAt=state.ServerTime;receiptAt=Time.realtimeSinceStartupAsDouble;volume=nextVolume;
            foreach(var source in sources)source.volume=volume;
            bool freeze=next.Phase=="paused"||next.Phase=="stopped";
            if(freeze!=paused)
            {
                if(freeze){playbackCursor=Math.Max(0,AudioSettings.dspTime-playbackStart);foreach(var source in sources)source.Stop();}
                else if(active!=null)Schedule(playbackCursor);
                paused=freeze;
            }
        }
        private static bool Bool(JObject o,string k,bool fallback)=>o?[k]==null?fallback:o[k].Type==JTokenType.Boolean&&(bool)o[k];
        private static float Vol(JObject o,string k,float fallback){var t=o?[k];if(t==null)return fallback;if(t.Type!=JTokenType.Integer&&t.Type!=JTokenType.Float)return 0;double n=(double)t;return !double.IsNaN(n)&&!double.IsInfinity(n)&&n>=0&&n<=1?(float)n:0;}
        private bool BossValid(Line l)=>snapshot!=null&&snapshot.EffectivePhase=="cultivation"&&snapshot.CycleId==l.Cycle;
        public void HandleEvent(GameEvent value)
        {
            if(!allowed||snapshot==null)return;Line line;
            if(value?.Kind=="voice:notice")
            {
                var text=value.CopyField("text");var expires=value.CopyField("expiresAt");
                if(text?.Type==JTokenType.String&&((string)text).Length<=600&&expires?.Type==JTokenType.Integer&&(double)expires>ServerNow)ShowText((string)text);
                return;
            }
            try{line=Parse(value);}catch(Exception){return;}
            if(line==null||line.Expires<=ServerNow||!seen.Add(line.Id))return;
            seenOrder.Enqueue(line.Id);if(seenOrder.Count>2000)seen.Remove(seenOrder.Dequeue());
            ShowText(line.Text);
            if(line.Type=="boss")
            {
                if(!BossValid(line))return;
                if(active!=null&&active.Priority<line.Priority)StopPlayback();
                if(preparing!=null&&preparing.Priority<line.Priority)CancelPreparation();
            }
            queue.Add(line);
            if(QueueCount>20)
            {
                var lowest=queue.OrderBy(l=>l.Priority).ThenBy(l=>l.Created).First();
                if(preparing!=null&&(preparing.Priority<lowest.Priority||preparing.Priority==lowest.Priority&&preparing.Created<=lowest.Created))CancelPreparation();
                else queue.Remove(lowest);
            }
        }
        private IEnumerator Manifest(int rev)
        {
            // The initial yield ensures the coroutine handle exists even on early failure.
            yield return null;nextManifest=Time.realtimeSinceStartupAsDouble+3;
            string baseUrl=BaseUrl(network?network.Endpoint:null);
            if(baseUrl!=null)
            {
                using(var web=UnityWebRequest.Get(baseUrl+"/api/voice/manifest"))
                {
                    requests.Add(web);web.timeout=3;web.redirectLimit=0;yield return web.SendWebRequest();requests.Remove(web);
                    JObject json=null;
                    if(web.result==UnityWebRequest.Result.Success&&web.downloadedBytes<16384)try{json=JObject.Parse(web.downloadHandler.text);}catch(Exception){}
                    if(rev!=revision)yield break;
                    Status=(string)json?["status"]??"Không kết nối được Piper · dùng thông báo chữ";
                    if(json?["clips"] is JObject fixedClips)
                        foreach(var field in fixedClips.Properties())
                            if(field.Value.Type==JTokenType.String&&Hash.IsMatch((string)field.Value)){string key=(string)field.Value;pinned.Add(key);yield return Load(key,rev,double.PositiveInfinity);}
                    if((bool?)json?["ready"]==true&&pinned.Count==5&&pinned.All(k=>clips.ContainsKey(k)))nextManifest=Time.realtimeSinceStartupAsDouble+30;
                }
            }
            manifestJob=null;
        }
        private IEnumerator Prepare(Line line,int rev)
        {
            yield return null;string[] keys=line.Keys;
            foreach(string key in keys){if(rev!=revision)yield break;if(ServerNow>=line.Deadline&&!clips.ContainsKey(key))break;yield return Load(key,rev,line.Deadline);}
            if(rev!=revision)yield break;
            if(keys.Any(k=>!clips.ContainsKey(k))){keys=new[]{line.Fallback};yield return Load(line.Fallback,rev,Math.Max(ServerNow+500,line.Deadline));}
            if(rev==revision&&allowed&&line.Expires>ServerNow&&keys.All(k=>clips.ContainsKey(k)))
            {
                if(paused)queue.Add(line);
                else
                {
                    double duration=keys.Sum(k=>(double)clips[k].samples/clips[k].frequency);
                    double speed=(double?)snapshot.CopyField("demoSpeed")??1;
                    double left=snapshot.RemainingMs-Math.Max(0,ServerNow-serverAt)*speed;
                    if(line.Type!="boss"||BossValid(line)&&duration*1000*speed+200<left)Play(line,keys);
                }
            }
            preparing=null;prepareJob=null;TrimCache();
        }
        private IEnumerator Load(string key,int rev,double deadline)
        {
            if(clips.ContainsKey(key)){used[key]=Time.realtimeSinceStartupAsDouble;yield break;}
            while(loading.Contains(key)&&rev==revision&&ServerNow<deadline)yield return null;
            if(clips.ContainsKey(key)||rev!=revision||ServerNow>=deadline)yield break;
            string baseUrl=BaseUrl(network?network.Endpoint:null);if(baseUrl==null)yield break;loading.Add(key);
            using(var web=UnityWebRequest.Get(baseUrl+"/api/voice/clip/"+key+".wav"))
            {
                requests.Add(web);web.timeout=2;web.redirectLimit=0;web.SendWebRequest();
                while(!web.isDone){if(rev!=revision||ServerNow>=deadline||web.downloadedBytes>2*1024*1024){web.Abort();break;}yield return null;}
                requests.Remove(web);
                if(rev==revision&&web.result==UnityWebRequest.Result.Success&&web.downloadedBytes<=2*1024*1024)
                {
                    var clip=DecodeWav(web.downloadHandler.data,key);if(clip){clips[key]=clip;used[key]=Time.realtimeSinceStartupAsDouble;}
                }
            }
            loading.Remove(key);TrimCache();
        }
        public static AudioClip DecodeWav(byte[] bytes,string name)
        {
            try
            {
                if(bytes==null||bytes.Length<44||bytes.Length>2*1024*1024||System.Text.Encoding.ASCII.GetString(bytes,0,4)!="RIFF"||System.Text.Encoding.ASCII.GetString(bytes,8,4)!="WAVE")return null;
                int rate=0,start=0,length=0;
                for(int i=12;i+8<=bytes.Length;){int n=BitConverter.ToInt32(bytes,i+4);if(n<0||n>bytes.Length-i-8)return null;string tag=System.Text.Encoding.ASCII.GetString(bytes,i,4);if(tag=="fmt "){if(n<16||BitConverter.ToInt16(bytes,i+8)!=1||BitConverter.ToInt16(bytes,i+10)!=1||BitConverter.ToInt16(bytes,i+22)!=16)return null;rate=BitConverter.ToInt32(bytes,i+12);}if(tag=="data"){start=i+8;length=n;}i+=8+n+(n%2);}
                if(rate!=22050||length<=0||length%2!=0)return null;var data=new float[length/2];for(int i=0;i<data.Length;i++)data[i]=BitConverter.ToInt16(bytes,start+i*2)/32768f;
                var clip=AudioClip.Create("Thiên Đạo "+name,data.Length,1,rate,false);clip.SetData(data,0);return clip;
            }catch(Exception){return null;}
        }
        private void Play(Line line,string[] keys)
        {
            StopPlayback();active=line;
            foreach(string key in keys)
            {
                var source=gameObject.AddComponent<AudioSource>();source.playOnAwake=false;source.spatialBlend=0;source.volume=volume;source.clip=clips[key];sources.Add(source);used[key]=Time.realtimeSinceStartupAsDouble;
            }
            Schedule(0);Played++;LastText=line.Text;ShowText(line.Text);Status="Đang đọc";
        }
        private void Schedule(double cursor)
        {
            playbackCursor=cursor;playbackStart=AudioSettings.dspTime+.1-cursor;double offset=0;
            foreach(var source in sources)
            {
                double length=(double)source.clip.samples/source.clip.frequency;
                source.Stop();
                if(offset+length>cursor){double seek=Math.Max(0,cursor-offset);source.timeSamples=Math.Min(source.clip.samples-1,(int)(seek*source.clip.frequency));source.PlayScheduled(playbackStart+Math.Max(offset,cursor));}
                offset+=length;
            }
            endDsp=playbackStart+offset;
        }
        private void StopPlayback(){foreach(var source in sources){if(source){source.Stop();Destroy(source);}}sources.Clear();active=null;}
        private void CancelPreparation(){if(prepareJob!=null)StopCoroutine(prepareJob);prepareJob=null;preparing=null;foreach(var web in requests.ToArray())web.Abort();loading.Clear();}
        private void TrimCache()
        {
            while(CachedDynamicCount>32)
            {
                string key=clips.Keys.Where(k=>!pinned.Contains(k)&&!(active?.Keys.Contains(k)??false)&&!(preparing?.Keys.Contains(k)??false)).OrderBy(k=>used.TryGetValue(k,out var t)?t:0).FirstOrDefault();if(key==null)break;
                Destroy(clips[key]);clips.Remove(key);used.Remove(key);
            }
        }
        private void ShowText(string text)
        {
            LastText=text;subtitleUntil=Time.realtimeSinceStartupAsDouble+8;
            if(!subtitle)
            {
                var font=FindObjectsByType<TMP_Text>(FindObjectsSortMode.None).FirstOrDefault(t=>t.font&&t.GetComponentInParent<Canvas>()&&t.GetComponentInParent<Canvas>().renderMode!=RenderMode.WorldSpace);var canvas=font?font.GetComponentInParent<Canvas>():null;
                if(canvas)
                {
                    subtitleRoot=new GameObject("Thiên Đạo — lời đọc",typeof(RectTransform),typeof(Image));subtitleRoot.transform.SetParent(canvas.transform,false);
                    var rect=(RectTransform)subtitleRoot.transform;rect.anchorMin=new Vector2(.08f,.13f);rect.anchorMax=new Vector2(.92f,.21f);rect.offsetMin=rect.offsetMax=Vector2.zero;
                    var image=subtitleRoot.GetComponent<Image>();image.color=new Color(.03f,.05f,.09f,.8f);image.raycastTarget=false;
                    var child=new GameObject("Lời thoại",typeof(RectTransform),typeof(TextMeshProUGUI));child.transform.SetParent(rect,false);var tr=(RectTransform)child.transform;tr.anchorMin=Vector2.zero;tr.anchorMax=Vector2.one;tr.offsetMin=new Vector2(10,5);tr.offsetMax=new Vector2(-10,-5);
                    subtitle=child.GetComponent<TextMeshProUGUI>();subtitle.font=font.font;subtitle.fontSize=23;subtitle.enableAutoSizing=true;subtitle.fontSizeMin=14;subtitle.fontSizeMax=23;subtitle.alignment=TextAlignmentOptions.Center;subtitle.richText=false;subtitle.raycastTarget=false;
                }
            }
            if(subtitle)subtitle.text=text;if(subtitleRoot)subtitleRoot.SetActive(true);
        }
        private void ResetRuntime()
        {
            revision++;StopAllCoroutines();manifestJob=prepareJob=null;preparing=null;foreach(var web in requests.ToArray()){web.Abort();web.Dispose();}requests.Clear();loading.Clear();queue.Clear();seen.Clear();seenOrder.Clear();StopPlayback();paused=false;nextManifest=0;if(subtitle)subtitle.text="";if(subtitleRoot)subtitleRoot.SetActive(false);
        }
        private void Unbind(){if(bound!=null){bound.State.Changed-=StateChanged;bound.Events.Received-=HandleEvent;}bound=null;}
        private void OnDisable(){Unbind();ResetRuntime();snapshot=null;allowed=false;foreach(var clip in clips.Values)if(clip)Destroy(clip);clips.Clear();used.Clear();pinned.Clear();if(subtitleRoot)Destroy(subtitleRoot);}
    }
}
