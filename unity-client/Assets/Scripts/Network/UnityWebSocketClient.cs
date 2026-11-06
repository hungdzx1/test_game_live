using System;
using System.Diagnostics;
using UnityEngine;
using TuTienLive.Presentation;

namespace TuTienLive.Network
{
    public sealed class UnityWebSocketClient : MonoBehaviour
    {
        [SerializeField] private string endpoint = "ws://127.0.0.1:3000/ws";
        public ProtocolSession Protocol { get; private set; }
        public LocalGameState State => Protocol?.State;
        public EventDispatcher Events => Protocol?.Events;
        public string Status { get; private set; } = "Stopped";
        public string Endpoint => endpoint;
        public long ConnectionGeneration { get; private set; }
        public int PendingMessages => transport?.Pending ?? 0;
        public double QueueAgeMs { get; private set; }
        private NativeWebSocketTransport transport;
        private double lastSnapshotAt;
        private bool awaiting;
        private void OnEnable()
        {
            Protocol = new ProtocolSession();
            var args = Environment.GetCommandLineArgs();
            for (int i = 0; i + 1 < args.Length; i++) if (args[i] == "--ws-url") endpoint = args[i + 1];
            try { transport = new NativeWebSocketTransport(); transport.Start(new Uri(endpoint)); Status = "Connecting"; }
            catch (Exception ex) { Status = "Unsupported/configuration error: " + ex.Message; transport?.Dispose(); transport = null; }
        }
        private void Update()
        {
            if (transport == null) return;
            var budget = Stopwatch.StartNew(); int processed = 0;
            while (processed++ < 32 && budget.Elapsed.TotalMilliseconds < 4 && transport.TryDequeue(out var m))
            {
                QueueAgeMs = Math.Max(0, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - m.ReceivedAt);
                switch (m.Kind)
                {
                    case TransportKind.Connecting: Status = "Connecting"; break;
                    case TransportKind.Open:
                        ConnectionGeneration = m.Generation; Protocol.Open(m.Generation); Status = "Connected - awaiting snapshot";
                        awaiting = true; lastSnapshotAt = Time.realtimeSinceStartupAsDouble; break;
                    case TransportKind.Disconnected:
                        Protocol.Disconnect(m.Generation); awaiting = false;
                        Status = "Disconnected - retry " + m.RetryDelayMs + " ms (" + m.Text + ")"; break;
                    case TransportKind.Text:
                        var before = Protocol.SnapshotCount;
                        Protocol.Accept(m.Text, m.Generation, m.ReceivedAt);
                        if (Protocol.SnapshotCount != before) { lastSnapshotAt = Time.realtimeSinceStartupAsDouble; Status = "Synchronized"; }
                        else if (!State.IsSynchronized) Status = "Connected - awaiting valid snapshot";
                        break;
                }
            }
            if (awaiting && Time.realtimeSinceStartupAsDouble - lastSnapshotAt > 10)
            { Protocol.Disconnect(ConnectionGeneration); Status = "Snapshot timeout - reconnecting"; awaiting = false; transport.Reconnect(); }
            if (transport.Completion.IsFaulted) { Status = "Transport fault: " + transport.Completion.Exception?.GetBaseException().Message; Protocol.Disconnect(ConnectionGeneration); }
        }
        private void OnDisable() { transport?.Dispose(); transport = null; Protocol?.Disconnect(ConnectionGeneration); Status = "Stopped"; }
    }
}
