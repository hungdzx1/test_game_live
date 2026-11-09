using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace TuTienLive.Models
{
    // Immutable views over an exclusively owned JSON tree. Unknown fields are retained,
    // but callers only receive a deep copy. No reflection-based type activation.
    public abstract class JsonModel
    {
        private readonly JObject data;
        internal JsonModel(JObject owned) { data = owned; }
        public JObject CopyJson() => (JObject)data.DeepClone();
        public JToken CopyField(string name) => data[name]?.DeepClone();
        protected string Text(string key) => data[key]?.Type == JTokenType.String ? (string)data[key] : null;
        protected double? Number(string key) => data[key]?.Type == JTokenType.Integer || data[key]?.Type == JTokenType.Float ? (double?)data[key] : null;
        protected bool? Flag(string key) => data[key]?.Type == JTokenType.Boolean ? (bool?)data[key] : null;
        protected JObject Object(string key) => data[key] as JObject;
        protected JArray Array(string key) => data[key] as JArray;
        protected IReadOnlyDictionary<string, double> Numbers(string key) => new ReadOnlyDictionary<string, double>(
            (Object(key)?.Properties() ?? Enumerable.Empty<JProperty>()).ToDictionary(p => p.Name, p => (double)p.Value, StringComparer.Ordinal));
        protected IReadOnlyList<T> List<T>(string key, Func<JObject, T> create) => System.Array.AsReadOnly(
            (Array(key) ?? new JArray()).Cast<JObject>().Select(create).ToArray());
    }

    public sealed class Envelope
    {
        public string Type { get; }
        public int Version => 1;
        public string SessionId { get; }
        public long Seq { get; }
        public long ServerTime { get; }
        public Snapshot Snapshot { get; }
        public GameEvent Event { get; }
        internal Envelope(string type, string session, long seq, long time, Snapshot snapshot, GameEvent gameEvent)
        { Type = type; SessionId = session; Seq = seq; ServerTime = time; Snapshot = snapshot; Event = gameEvent; }
    }

    public sealed class Snapshot : JsonModel
    {
        public string Phase => Text("phase");
        public string EffectivePhase => Text("effectivePhase");
        public string Mode => Text("mode");
        public string FocusedScene => Text("focusedScene");
        public string CameraUserId => Text("cameraUserId");
        public string CycleId => Text("cycleId");
        public double RemainingMs => Number("remainingMs").Value;
        public double ElapsedMs => Number("elapsedMs").Value;
        public double? ElapsedActiveMs => Number("elapsedActiveMs");
        public long? PhaseStart => (long?)Number("phaseStart");
        public int? BreakthroughQueueLength => (int?)Number("breakthroughQueueLength");
        public IReadOnlyDictionary<string, PlayerState> Players { get; }
        public BreakthroughState Breakthrough { get; }
        public BreakthroughResult BreakthroughResult { get; }
        public BattleState Battle { get; }
        public SectEnergyState SectEnergy { get; }
        public BlessingState Blessing { get; }
        // Config/interactions/battleResult/tiktok remain lossless dynamic data via CopyField.
        internal Snapshot(JObject value) : base(value)
        {
            Players = new ReadOnlyDictionary<string, PlayerState>(List("players", p => new PlayerState(p)).ToDictionary(p => p.UserId, StringComparer.Ordinal));
            Breakthrough = Object("breakthrough") is JObject b ? new BreakthroughState(b) : null;
            BreakthroughResult = Object("breakthroughResult") is JObject r ? new BreakthroughResult(r) : null;
            Battle = Object("battle") is JObject battle ? new BattleState(battle) : null;
            SectEnergy = Object("interactions")?["sectEnergy"] is JObject energy ? new SectEnergyState(energy) : null;
            Blessing = Object("interactions")?["blessing"] is JObject blessing ? new BlessingState(blessing) : null;
        }
    }

    public sealed class BlessingState : JsonModel
    {
        public double RemainingMs => Number("remainingMs").Value;
        public double DurationMs => Number("durationMs").Value;
        public int Multiplier => (int)Number("multiplier").Value;
        internal BlessingState(JObject value) : base(value) { }
    }

    public sealed class SectEnergyState : JsonModel
    {
        public int Level => (int)Number("level").Value;
        public int MaxLevel => (int)(Number("maxLevel")??3);
        public long Power => (long)Number("power").Value;
        public long Threshold => (long)Number("threshold").Value;
        public bool Full => Flag("full").Value;
        internal SectEnergyState(JObject value) : base(value) { }
    }

    public sealed class PlayerState : JsonModel
    {
        public string UserId => Text("userId");
        public string Name => Text("name");
        public uint Seed => (uint)Number("seed").Value;
        public int RealmIndex => (int)Number("realmIndex").Value;
        public int StageIndex => (int)Number("stageIndex").Value;
        public string Realm => Text("realm");
        public string Stage => Text("stage");
        public double Cultivation => Number("cultivation").Value;
        public double? CultivationRequired => Number("cultivationRequired");
        public double? Hp => Number("hp");
        public double? Atk => Number("atk");
        public double? Def => Number("def");
        public double? X => Number("x");
        public double? Z => Number("z");
        public string Animation => Text("animation");
        public double? AnimationStartMs => Number("animationStartMs");
        public IReadOnlyDictionary<string, double> Inventory { get; }
        internal PlayerState(JObject value) : base(value) { Inventory = Numbers("inventory"); }
    }

    public sealed class BreakthroughState : JsonModel
    {
        public string Id => Text("id");
        public string UserId => Text("userId");
        public int? RealmIndex => (int?)Number("realmIndex");
        public double? ElapsedMs => Number("elapsedMs");
        public double? DurationMs => Number("durationMs");
        public int? LightningCount => (int?)Number("lightningCount");
        public bool? Guaranteed => Flag("guaranteed");
        // Public active ritual intentionally has NO roll, outcome or probability.
        internal BreakthroughState(JObject value) : base(value) { }
    }
    public sealed class BreakthroughResult : JsonModel
    {
        public string Id => Text("id");
        public string UserId => Text("userId");
        public bool? Outcome => Flag("outcome");
        public double? RemainingMs => Number("remainingMs");
        public int? RealmIndex => (int?)Number("realmIndex");
        internal BreakthroughResult(JObject value) : base(value) { }
    }
    public sealed class BattleState : JsonModel
    {
        public bool SharedBoss => Text("format") == "shared-boss-v1";
        public bool EndOnKill => Flag("endOnKill")??false;
        public int? BossIndex => (int?)Number("bossIndex");
        public string Id => Text("id");
        public string Status => Text("status");
        public double? ElapsedMs => Number("elapsedMs");
        public double? DurationMs => Number("durationMs");
        public int? ViewId => (int?)Number("viewId");
        public int? ManualView => (int?)Number("manualView");
        public IReadOnlyList<FieldSummary> Fields { get; }
        public BattleField View { get; }
        internal BattleState(JObject value) : base(value)
        {
            Fields = List("fields", p => new FieldSummary(p));
            View = Object("view") is JObject view ? new BattleField(view) : null;
        }
    }
    public sealed class FieldSummary : JsonModel
    {
        public int? Id => (int?)Number("id");
        public string Name => Text("name");
        public int? Count => (int?)Number("count");
        public string Status => Text("status");
        public string BossName => Text("bossName");
        internal FieldSummary(JObject value) : base(value) { }
    }
    public sealed class BattleField : JsonModel
    {
        public int? Id => (int?)Number("id");
        public string Name => Text("name");
        public IReadOnlyDictionary<string, BattleParticipant> Participants { get; }
        public IReadOnlyList<MonsterState> Mobs { get; }
        public IReadOnlyList<MonsterState> BossHistory { get; }
        public MonsterState ActiveBoss { get; }
        internal BattleField(JObject value) : base(value)
        {
            Participants = new ReadOnlyDictionary<string, BattleParticipant>((Object("participants")?.Properties() ?? Enumerable.Empty<JProperty>())
                .ToDictionary(p => p.Name, p => new BattleParticipant((JObject)p.Value), StringComparer.Ordinal));
            Mobs = List("mobs", m => new MonsterState(m));
            BossHistory = List("bossHistory", m => new MonsterState(m));
            ActiveBoss = Object("activeBoss") is JObject boss ? new MonsterState(boss) : null;
        }
    }
    public sealed class BattleParticipant : JsonModel
    {
        public string UserId => Text("userId");
        public string Name => Text("name");
        public double? Hp => Number("hp");
        public double? MaxHp => Number("maxHp");
        public double? Damage => Number("damage");
        public double? X => Number("x");
        public double? Z => Number("z");
        public string Animation => Text("animation");
        public IReadOnlyDictionary<string, double> Cooldowns { get; }
        internal BattleParticipant(JObject value) : base(value) { Cooldowns = Numbers("cooldowns"); }
    }
    public sealed class MonsterState : JsonModel
    {
        public bool EndOnKill => Flag("endOnKill")??false;
        public int? Type => (int?)Number("type");
        public string AssetId => Text("assetId");
        public double WarningDurationMs => Number("warningDurationMs")??0;
        public double WarningElapsedMs => Number("warningElapsedMs")??0;
        public bool IsWarning => WarningElapsedMs < WarningDurationMs;
        public double? ElapsedMs => Number("elapsedMs");
        public double? DurationMs => Number("durationMs");
        public string Id => Text("id");
        public string Kind => Text("kind");
        public string Name => Text("name");
        public string Status => Text("status");
        public double? Hp => Number("hp");
        public double? MaxHp => Number("maxHp");
        public double? X => Number("x");
        public double? Z => Number("z");
        internal MonsterState(JObject value) : base(value) { }
    }
    public sealed class GameEvent : JsonModel
    {
        public string EventId => Text("eventId");
        public string Kind => Text("kind");
        public string UserId => Text("userId");
        public long Timestamp => (long)Number("timestamp").Value;
        internal GameEvent(JObject value) : base(value) { }
    }
}
