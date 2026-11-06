using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using Newtonsoft.Json;
using TuTienLive.Network;
using UnityEngine;

namespace TuTienLive.UI
{
    // Explicit opt-in test telemetry only. No game save access and no server mutation.
    [RequireComponent(typeof(UnityWebSocketClient))]
    public sealed class NetworkTestProbe : MonoBehaviour
    {
        private UnityWebSocketClient client;
        private string reportPath;
        private double start, nextWrite;
        private int mainThread;
        private readonly HashSet<string> sessions = new HashSet<string>();
        private readonly Dictionary<string, int> rosters = new Dictionary<string, int>();
        private readonly List<string> transitions = new List<string>();
        private string previous;
        private int eventCallbacks, offThreadCallbacks, disconnects, maxPlayers;
        public static string Argument(string key)
        { var args = Environment.GetCommandLineArgs(); for (int i = 0; i + 1 < args.Length; i++) if (args[i] == key) return args[i + 1]; return null; }
        private void Start()
        {
            reportPath = Argument("--network-report");
            if (string.IsNullOrEmpty(reportPath)) { enabled = false; return; }
            reportPath = Path.GetFullPath(reportPath);
            client = GetComponent<UnityWebSocketClient>(); mainThread = Thread.CurrentThread.ManagedThreadId;
            start = Time.realtimeSinceStartupAsDouble;
            client.Events.Received += OnEvent;
            client.State.Changed += OnState;
        }
        private void OnEvent(Models.GameEvent value)
        { eventCallbacks++; if (Thread.CurrentThread.ManagedThreadId != mainThread) offThreadCallbacks++; }
        private void OnState()
        {
            if (Thread.CurrentThread.ManagedThreadId != mainThread) offThreadCallbacks++;
            if (!client.State.IsSynchronized) return;
            sessions.Add(client.State.SessionId); rosters[client.State.SessionId] = client.State.Snapshot.Players.Count;
            maxPlayers = Math.Max(maxPlayers, client.State.Snapshot.Players.Count);
        }
        private void Update()
        {
            if (client == null) return;
            if (client.Status != previous)
            {
                previous = client.Status;
                if (transitions.Count < 100) transitions.Add(previous);
                if (previous.StartsWith("Disconnected")) disconnects++;
            }
            double elapsed = Time.realtimeSinceStartupAsDouble - start;
            var duration = double.TryParse(Argument("--probe-seconds"), out var seconds) ? Math.Max(10, seconds) : 35;
            bool completed = elapsed >= duration;
            if (elapsed < nextWrite && !completed) return;
            nextWrite = elapsed + .5;
            var report = new { completed, unity = Application.unityVersion, platform = Application.platform.ToString(),
                elapsedSeconds = elapsed, status = client.Status, endpoint = client.Endpoint,
                sessions, rosters, eventCallbacks, offThreadCallbacks, disconnects, maxPlayers,
                snapshots = client.Protocol.SnapshotCount, rejected = client.Protocol.Rejected,
                lastError = client.Protocol.LastError, queue = client.PendingMessages,
                synchronized = client.State.IsSynchronized, phase = client.State.Snapshot?.Phase,
                players = client.State.Snapshot?.Players.Count, transitions };
            Directory.CreateDirectory(Path.GetDirectoryName(reportPath));
            File.WriteAllText(reportPath + ".tmp", JsonConvert.SerializeObject(report, Formatting.Indented));
            if (File.Exists(reportPath)) File.Delete(reportPath);
            File.Move(reportPath + ".tmp", reportPath);
            if (completed) { enabled = false; if (!Application.isEditor) Application.Quit(0); }
        }
        private void OnDestroy()
        { if (client?.Events != null) client.Events.Received -= OnEvent; if (client?.State != null) client.State.Changed -= OnState; }
    }
}
