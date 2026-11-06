using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using TuTienLive.Network;
using UnityEngine;

namespace TuTienLive.Tests
{
    public sealed class NetworkProtocolTests
    {
        private static string Fixture(string file) => File.ReadAllText(Path.Combine(Application.dataPath, "Tests/Fixtures/" + file + ".json"));
        private static JObject Snapshot(long seq = 10, string session = "test-session")
        { var j = JObject.Parse(Fixture("cultivation")); j["seq"] = seq; j["sessionId"] = session; return j; }
        private static JObject Event(long seq = 11, string session = "test-session")
        { var j = (JObject)JArray.Parse(Fixture("events"))[0]; j["seq"] = seq; j["sessionId"] = session; return j; }
        private static bool Accept(ProtocolSession p, JObject j, long generation = 1) => p.Accept(j.ToString(), generation, 1900000000123);
        private static ProtocolSession Ready()
        { var p = new ProtocolSession(); p.Open(1); Assert.That(Accept(p, Snapshot()), Is.True); return p; }

        [TestCase("stopped")][TestCase("cultivation")][TestCase("breakthrough")]
        [TestCase("breakthrough-result")][TestCase("battle")][TestCase("paused-battle")][TestCase("battle-result")]
        public void ParsesActualEngineSnapshots(string file)
        {
            Assert.That(StateMapper.TryParse(Fixture(file), out var result, out var error), Is.True, error);
            Assert.That(result.Snapshot.Players.Count, Is.EqualTo(2));
            Assert.That(result.Snapshot.Players.ContainsKey("__proto__"), Is.True);
            Assert.That(result.Snapshot.Players["unity-fixture:1"].Name, Does.Contain("Ánh Nguyệt"));
        }
        [Test] public void ParsesAllActualEvents()
        { foreach (var j in JArray.Parse(Fixture("events"))) Assert.That(StateMapper.TryParse(j.ToString(), out _, out var e), Is.True, e); }
        [Test] public void DynamicBattleAndRitualSchema()
        {
            Assert.That(StateMapper.TryParse(Fixture("battle"), out var b, out _), Is.True);
            Assert.That(b.Snapshot.Battle.Fields.Count, Is.EqualTo(11));
            Assert.That(b.Snapshot.Battle.View.Participants.Values.First().Cooldowns.ContainsKey("1"), Is.True);
            Assert.That(b.Snapshot.Battle.View.Mobs.Count, Is.GreaterThan(0));
            Assert.That(StateMapper.TryParse(Fixture("breakthrough"), out var r, out _), Is.True);
            Assert.That(r.Snapshot.Breakthrough, Is.Not.Null);
            Assert.That(r.Snapshot.Breakthrough.CopyField("outcome"), Is.Null);
            Assert.That(r.Snapshot.Breakthrough.CopyField("probability"), Is.Null);
        }
        [Test] public void NumericPrecisionOptionalAndUnknownFields()
        {
            var j = Snapshot(); j["seq"] = 9007199254740991L;
            var player = (JObject)j["payload"]["players"][0];
            player["seed"] = uint.MaxValue; player["cultivation"] = 123456789012.25;
            player["cultivationRequired"] = null; player.Remove("inventory");
            j["payload"]["future"] = new JObject { ["1"] = "kept", ["$type"] = "System.IO.FileInfo" };
            Assert.That(StateMapper.TryParse(j.ToString(), out var e, out var error), Is.True, error);
            Assert.That(e.Seq, Is.EqualTo(9007199254740991L));
            Assert.That(e.Snapshot.Players.Values.First().Seed, Is.EqualTo(uint.MaxValue));
            Assert.That(e.Snapshot.Players.Values.First().Cultivation, Is.EqualTo(123456789012.25));
            Assert.That(e.Snapshot.Players.Values.First().CultivationRequired, Is.Null);
            Assert.That(e.Snapshot.CopyField("future")["1"].Value<string>(), Is.EqualTo("kept"));
        }
        [Test] public void ReplayAndEventDuplicateDoNotDispatchTwice()
        {
            var p = Ready(); int calls = 0; p.Events.Received += _ => calls++;
            Assert.That(Accept(p, Snapshot(9)), Is.False);
            var e = Event(); Assert.That(Accept(p, e), Is.True);
            e["seq"] = 12; Assert.That(Accept(p, e), Is.False); Assert.That(calls, Is.EqualTo(1));
        }
        [Test] public void ReconnectWaitsForFullSnapshotAndRetainsDedup()
        {
            var p = Ready(); Accept(p, Event()); p.Disconnect(1);
            Assert.That(p.State.Snapshot, Is.Null); p.Open(2);
            Assert.That(Accept(p, Event(1), 2), Is.False);
            Assert.That(Accept(p, Snapshot(2), 1), Is.False); // old socket callback
            var j = Snapshot(3); ((JArray)j["payload"]["players"]).RemoveAt(0);
            Assert.That(Accept(p, j, 2), Is.True); Assert.That(p.State.Snapshot.Players.Count, Is.EqualTo(1));
            Assert.That(Accept(p, Event(4), 2), Is.False); Assert.That(p.Events.Count, Is.EqualTo(1));
        }
        [Test] public void SessionResetClearsOldRosterAndEventState()
        {
            var p = Ready(); Accept(p, Event());
            Assert.That(Accept(p, Event(1, "new-session")), Is.False);
            Assert.That(p.State.Snapshot, Is.Null); Assert.That(p.Events.Count, Is.Zero);
            Accept(p, Snapshot(2, "new-session"));
            Assert.That(Accept(p, Event(3, "new-session")), Is.True);
            Assert.That(p.State.SessionId, Is.EqualTo("new-session"));
        }
        [Test] public void MalformedPacketCannotPoisonSessionOrSequence()
        {
            var p = Ready(); var j = Snapshot(999, "bad"); j["payload"]["players"] = "wrong";
            Assert.That(Accept(p, j), Is.False); Assert.That(p.State.SessionId, Is.EqualTo("test-session"));
            Assert.That(Accept(p, Snapshot(11)), Is.True);
        }
        [TestCase("version", "2")][TestCase("seq", "-1")][TestCase("serverTime", "1.5")]
        [TestCase("payload", "null")][TestCase("sessionId", "\"\"")][TestCase("type", "\"unknown\"")]
        public void RejectsMalformedEnvelope(string key, string value)
        { var j = Snapshot(); j[key] = JToken.Parse(value); Assert.That(StateMapper.TryParse(j.ToString(), out _, out _), Is.False); }
        [Test] public void RejectsMalformedNestedData()
        {
            foreach (var value in new[] { "\"oops\"", "[]", "true" })
            { var j = Snapshot(); j["payload"]["players"][0]["inventory"] = JToken.Parse(value); Assert.That(StateMapper.TryParse(j.ToString(), out _, out _), Is.False); }
            var duplicate = Snapshot(); ((JArray)duplicate["payload"]["players"]).Add(duplicate["payload"]["players"][0].DeepClone());
            Assert.That(StateMapper.TryParse(duplicate.ToString(), out _, out _), Is.False);
            foreach (var raw in new[] { "{", "[]", Snapshot().ToString() + "{}", "{\"seq\":1,\"seq\":2}", Snapshot().ToString().Replace("12.5", "NaN") + "garbage" })
                Assert.That(StateMapper.TryParse(raw, out _, out _), Is.False);
            foreach (var rawNumber in new[] { "NaN", "Infinity", "1e999", "undefined" })
            {
                var j = Snapshot(); j["payload"]["players"][0]["cultivation"] = "replace-number";
                Assert.That(StateMapper.TryParse(j.ToString().Replace("\"replace-number\"", rawNumber), out _, out _), Is.False);
            }
        }
        [Test] public void ImmutableStateCannotBeChangedByConsumers()
        {
            var p = Ready(); var before = p.State.Snapshot.Players.Count;
            ((JArray)p.State.Snapshot.CopyJson()["players"]).Clear();
            var player = p.State.Snapshot.Players.Values.First(); var cultivation = player.Cultivation;
            player.CopyJson()["cultivation"] = 9999;
            Assert.That(player.Cultivation, Is.EqualTo(cultivation)); Assert.That(p.State.Snapshot.Players.Count, Is.EqualTo(before));
        }
        [Test] public void OwnerThreadIsEnforced()
        {
            var p = Ready(); var error = Task.Run(() => { try { p.Open(2); return false; } catch (InvalidOperationException) { return true; } }).Result;
            Assert.That(error, Is.True);
        }
        [Test] public void EventHistoryIsBoundedAndBackoffCapped()
        {
            var p = Ready();
            for(int i = 0; i < 250; i++) { var e = Event(11+i); e["payload"]["eventId"] = "bounded-" + i; Assert.That(Accept(p, e), Is.True); }
            Assert.That(p.Events.Count, Is.EqualTo(250));
            var old = Event(300); old["payload"]["eventId"] = "bounded-0";
            Assert.That(Accept(p, old), Is.True, "Oldest ID must be evicted after 200 entries");
            var recent = Event(301); recent["payload"]["eventId"] = "bounded-249";
            Assert.That(Accept(p, recent), Is.False);
            Assert.That(new[] { 0, 1, 2, 3, 4, 5, 100 }.Select(NativeWebSocketTransport.BackoffMs), Is.EqualTo(new[] { 500, 1000, 2000, 4000, 8000, 10000, 10000 }));
        }
    }
}
