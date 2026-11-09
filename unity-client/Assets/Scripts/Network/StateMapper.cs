using System;
using System.IO;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using TuTienLive.Models;

namespace TuTienLive.Network
{
    public static class StateMapper
    {
        public const int MaxMessageBytes = 4 * 1024 * 1024;
        public static bool TryParse(string json, out Envelope envelope, out string error)
        {
            envelope = null; error = null;
            try
            {
                Require(json != null && json.Length <= MaxMessageBytes, "Message size");
                using var reader = new JsonTextReader(new StringReader(json)) { DateParseHandling = DateParseHandling.None, MaxDepth = 64 };
                var root = JObject.Load(reader, new JsonLoadSettings { DuplicatePropertyNameHandling = DuplicatePropertyNameHandling.Error });
                Require(!reader.Read(), "Trailing JSON");
                ValidateTree(root);
                Require(Int(root, "version") == 1, "Unsupported version");
                var type = Text(root, "type");
                Require(type == "state:snapshot" || type == "game:event", "Unknown envelope type");
                var session = Text(root, "sessionId");
                long seq = Int(root, "seq"), time = Int(root, "serverTime");
                Require(seq >= 0 && time >= 0, "Negative metadata");
                var payload = root["payload"] as JObject;
                Require(payload != null, "Missing object payload");
                Snapshot snapshot = null; GameEvent gameEvent = null;
                if (type == "state:snapshot")
                {
                    Text(payload, "phase"); Text(payload, "effectivePhase");
                    Numeric(payload, "remainingMs"); Numeric(payload, "elapsedMs");
                    var players = payload["players"] as JArray;
                    Require(players != null && players.Count <= 500, "Invalid players array");
                    var ids = new System.Collections.Generic.HashSet<string>(StringComparer.Ordinal);
                    foreach (var token in players)
                    {
                        Require(token is JObject, "Invalid player"); var p = (JObject)token;
                        Require(ids.Add(Text(p, "userId")), "Duplicate player ID"); Text(p, "name");
                        long seed = Int(p, "seed"); Require(seed >= 0 && seed <= uint.MaxValue, "Seed range");
                        long realm = Int(p, "realmIndex"), stage = Int(p, "stageIndex");
                        Require(realm >= 0 && realm <= 10 && stage >= 0 && stage <= 3, "Player indices");
                        Numeric(p, "cultivation"); NumberMap(p, "inventory");
                        OptionalNumbers(p, "cultivationRequired", "hp", "atk", "def", "x", "z", "animationStartMs");
                    }
                    OptionalNumbers(payload, "phaseStart", "elapsedActiveMs", "breakthroughQueueLength");
                    OptionalIntegers(payload, "breakthroughQueueLength");
                    foreach (var key in new[] { "breakthrough", "breakthroughResult", "battle", "battleResult", "config", "interactions", "tiktok" }) OptionalObject(payload, key);
                    if(payload["config"] is JObject config)
                    {OptionalObject(config,"live");if(config["live"] is JObject live)OptionalBool(live,"avatarTestEnabled");}
                    if(payload["interactions"] is JObject interactions)
                    {
                        OptionalObject(interactions,"blessing");
                        if(interactions["blessing"] is JObject blessing)
                        {
                            Numeric(blessing,"remainingMs");Numeric(blessing,"durationMs");
                            double left=(double)blessing["remainingMs"],duration=(double)blessing["durationMs"];
                            Require(left>=0&&duration>=left&&duration<=9007199254740991d&&Int(blessing,"multiplier")==2,"Blessing range");
                        }
                        OptionalObject(interactions,"sectEnergy");
                        if(interactions["sectEnergy"] is JObject energy)
                        {
                            long level=Int(energy,"level"),power=Int(energy,"power"),threshold=Int(energy,"threshold"),maxLevel=energy["maxLevel"]==null?3:Int(energy,"maxLevel");
                            Require(maxLevel>=1&&maxLevel<=50&&level>=1&&level<=maxLevel&&power>=0&&threshold>0&&threshold<=1000000000&&power<=threshold,"Sect energy range");
                            Require(energy["full"]?.Type==JTokenType.Boolean,"Sect energy full flag");
                            Require((bool)energy["full"]==(level==maxLevel&&power==threshold)&&(level==maxLevel||power<threshold),"Sect energy completion");
                        }
                    }
                    if (payload["breakthrough"] is JObject b)
                    { Text(b, "id"); Text(b, "userId"); OptionalNumbers(b, "elapsedMs", "durationMs"); OptionalIntegers(b, "realmIndex", "lightningCount"); OptionalBool(b, "guaranteed"); }
                    if (payload["breakthroughResult"] is JObject r)
                    { Text(r, "id"); Text(r, "userId"); OptionalBool(r, "outcome"); OptionalNumbers(r, "remainingMs"); OptionalIntegers(r, "realmIndex"); }
                    if (payload["battle"] is JObject battle) ValidateBattle(battle);
                    snapshot = new Snapshot(payload);
                }
                else
                {
                    Text(payload, "eventId"); Text(payload, "kind"); Int(payload, "timestamp");
                    Require(Absent(payload["userId"]) || payload["userId"].Type == JTokenType.String, "Event userId");
                    if((string)payload["kind"]=="avatar:test")
                    {
                        Require(Text(payload,"userId").StartsWith("tt:",StringComparison.Ordinal)&&Text(payload,"source")=="tiktok"&&Int(payload,"durationMs")==10000,"LIVE avatar test source/duration");
                        string name=Text(payload,"name");Require(name.Length>0&&name.Length<=100,"Avatar test name");
                        Require(Absent(payload["avatar"])||payload["avatar"].Type==JTokenType.String&&((string)payload["avatar"]).Length<=2048,"Avatar test image");
                    }
                    if((string)payload["kind"]=="blessing:activated"&&payload["donor"]!=null)
                    {
                        Require(payload["donor"] is JObject,"Donor object");var donor=(JObject)payload["donor"];
                        Require(Text(donor,"userId").Length<=100&&Text(donor,"name").Length<=100,"Donor text length");
                        Require(Absent(donor["avatar"])||donor["avatar"].Type==JTokenType.String&&((string)donor["avatar"]).Length<=2048,"Donor avatar");
                    }
                    gameEvent = new GameEvent(payload);
                }
                envelope = new Envelope(type, session, seq, time, snapshot, gameEvent); return true;
            }
            catch (Exception ex) when (ex is JsonException || ex is ArgumentException || ex is InvalidOperationException || ex is OverflowException || ex is FormatException)
            { error = ex.Message; return false; }
        }
        private static void ValidateBattle(JObject b)
        {
            Text(b, "id"); Text(b, "status"); OptionalNumbers(b, "elapsedMs", "durationMs"); OptionalIntegers(b, "viewId", "manualView");
            if((string)b["format"]=="shared-boss-v1")
            {
                long index=Int(b,"bossIndex");Require(index>=0&&index<=2,"Boss sequence index");
                Require(b["fields"] is JArray fields&&fields.Count==1,"Shared boss arena count");
                var active=b["view"]?["activeBoss"] as JObject;Require(active!=null,"Shared boss missing");
                Numeric(active,"hp");Numeric(active,"maxHp");Numeric(active,"elapsedMs");Numeric(active,"durationMs");
                OptionalBool(b,"endOnKill");OptionalBool(active,"endOnKill");bool untimed=(bool?)b["endOnKill"]==true;
                Require(Int(active,"type")==index&&(double)active["maxHp"]>0&&(double)active["hp"]>=0&&(double)active["hp"]<=(double)active["maxHp"]&&(double)active["elapsedMs"]>=0,"Shared boss ranges");
                Require(untimed?(bool?)active["endOnKill"]==true&&(double)active["durationMs"]==0&&(double?)b["durationMs"]==0:(double)active["durationMs"]>0&&(double)active["elapsedMs"]<=(double)active["durationMs"],"Shared boss duration");
                if(active["warningDurationMs"]!=null||active["warningElapsedMs"]!=null)
                {
                    Numeric(active,"warningDurationMs");Numeric(active,"warningElapsedMs");
                    Require((double)active["warningDurationMs"]==3000&&(double)active["warningElapsedMs"]>=0&&(double)active["warningElapsedMs"]<=3000,"Boss warning ranges");
                    Require((double)active["warningElapsedMs"]>=3000||(double)active["elapsedMs"]==0,"Combat before boss warning ended");
                }
            }
            ObjectList(b, "fields", f => { OptionalIntegers(f, "id", "count"); });
            OptionalObject(b, "view");
            if (!(b["view"] is JObject view)) return;
            OptionalIntegers(view, "id"); OptionalObject(view, "participants");
            if (view["participants"] is JObject participants)
                foreach (var p in participants.Properties())
                {
                    Require(p.Value is JObject, "Participant object"); var v = (JObject)p.Value;
                    Require(Text(v, "userId") == p.Name, "Participant identity mismatch");
                    OptionalNumbers(v, "hp", "maxHp", "damage", "x", "z"); NumberMap(v, "cooldowns");
                }
            Action<JObject> monster = m => { Text(m, "id"); OptionalNumbers(m, "hp", "maxHp", "x", "z"); };
            ObjectList(view, "mobs", monster); ObjectList(view, "bossHistory", monster);
            OptionalObject(view, "activeBoss"); if (view["activeBoss"] is JObject boss) monster(boss);
        }
        private static void ValidateTree(JToken token)
        {
            Require(token.Type == JTokenType.Object || token.Type == JTokenType.Array || token.Type == JTokenType.Property ||
                token.Type == JTokenType.Integer || token.Type == JTokenType.Float || token.Type == JTokenType.String ||
                token.Type == JTokenType.Boolean || token.Type == JTokenType.Null, "Non-JSON token");
            if (token.Type == JTokenType.Float) Require(!double.IsNaN((double)token) && !double.IsInfinity((double)token), "Nonfinite number");
            if (token.Type == JTokenType.Integer) Require((double)token >= -9007199254740991d && (double)token <= 9007199254740991d, "Unsafe JSON integer");
            if (token is JContainer container) foreach (var child in container.Children()) ValidateTree(child);
        }
        private static bool Absent(JToken t) => t == null || t.Type == JTokenType.Null;
        private static void OptionalObject(JObject o, string k) => Require(Absent(o[k]) || o[k] is JObject, k + " must be object/null");
        private static void OptionalBool(JObject o, string k) => Require(Absent(o[k]) || o[k].Type == JTokenType.Boolean, k + " must be boolean/null");
        private static void OptionalNumbers(JObject o, params string[] keys) { foreach (var k in keys) if (!Absent(o[k])) Numeric(o, k); }
        private static void OptionalIntegers(JObject o, params string[] keys)
        { foreach (var k in keys) if (!Absent(o[k])) { var n = Int(o, k); Require(n >= int.MinValue && n <= int.MaxValue, "Integer range " + k); } }
        private static void ObjectList(JObject o, string k, Action<JObject> validate)
        {
            if (Absent(o[k])) return;
            Require(o[k] is JArray, k + " must be array");
            foreach (var v in (JArray)o[k]) { Require(v is JObject, k + " member must be object"); validate((JObject)v); }
        }
        private static void NumberMap(JObject o, string key)
        { OptionalObject(o, key); if (o[key] is JObject map) foreach (var p in map.Properties()) Numeric(map, p.Name); }
        private static string Text(JObject o, string k)
        { Require(o[k]?.Type == JTokenType.String && !string.IsNullOrWhiteSpace((string)o[k]), "Missing string " + k); return (string)o[k]; }
        private static long Int(JObject o, string k)
        { Require(o[k]?.Type == JTokenType.Integer, "Missing integer " + k); var n = (long)o[k]; Require(n >= -9007199254740991L && n <= 9007199254740991L, "Unsafe integer " + k); return n; }
        private static void Numeric(JObject o, string k) => Require(o[k]?.Type == JTokenType.Integer || o[k]?.Type == JTokenType.Float, "Missing number " + k);
        private static void Require(bool condition, string reason) { if (!condition) throw new JsonSerializationException(reason); }
    }
}
