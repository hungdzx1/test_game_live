using System;
using System.Collections.Generic;
using TuTienLive.Presentation;

namespace TuTienLive.Network
{
    public sealed class ProtocolSession
    {
        public LocalGameState State { get; } = new LocalGameState();
        public EventDispatcher Events { get; } = new EventDispatcher();
        public long Rejected { get; private set; }
        public long SnapshotCount { get; private set; }
        public string LastError { get; private set; }
        private readonly HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
        private readonly Queue<string> order = new Queue<string>();
        private long generation = -1, lastSeq = -1;
        private bool connected;
        private string session;
        public void Open(long connectionGeneration)
        {
            State.AssertOwner(); generation = connectionGeneration; connected = true; lastSeq = -1;
            State.Clear(session); // A fresh snapshot replaces the complete character roster.
        }
        public void Disconnect(long connectionGeneration)
        { State.AssertOwner(); if (connectionGeneration != generation) return; connected = false; State.Clear(session); }
        public bool Accept(string json, long connectionGeneration, long receivedAt)
        {
            State.AssertOwner();
            if (!connected || connectionGeneration != generation) return Reject("Obsolete connection");
            if (!StateMapper.TryParse(json, out var message, out var error)) return Reject(error);
            if (session != message.SessionId)
            {
                // A new session can arrive as an event before its first snapshot (e.g. mode switch).
                session = message.SessionId; lastSeq = -1; seen.Clear(); order.Clear(); Events.Reset(); State.Clear(session);
            }
            if (message.Seq <= lastSeq) return Reject("Old/replayed sequence");
            lastSeq = message.Seq;
            if (message.Snapshot != null)
            {
                SnapshotCount++; LastError = null; State.Replace(message, receivedAt); return true;
            }
            // Never replay effects onto an unsynchronized/stale scene. Server snapshots repair state.
            if (!State.IsSynchronized) return Reject("Awaiting snapshot");
            if (!seen.Add(message.Event.EventId)) return Reject("Duplicate event");
            order.Enqueue(message.Event.EventId); if (order.Count > 200) seen.Remove(order.Dequeue());
            Events.Dispatch(message.Event); return true;
        }
        private bool Reject(string reason) { Rejected++; LastError = reason; return false; }
    }
}
