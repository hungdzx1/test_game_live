using System;
using System.Threading;
using TuTienLive.Models;

namespace TuTienLive.Presentation
{
    // All mutation is internal to the protocol pump. Presentation only reads immutable models.
    public sealed class LocalGameState
    {
        public Snapshot Snapshot { get; private set; }
        public string SessionId { get; private set; }
        public long LastSeq { get; private set; } = -1;
        public long ServerTime { get; private set; }
        public long ReceivedAt { get; private set; }
        public long ReceiptOffsetMs => ReceivedAt - ServerTime; // Wall-clock offset, NOT network RTT.
        public bool IsSynchronized => Snapshot != null;
        public long Revision { get; private set; }
        public event Action Changed;
        private readonly int owner = Thread.CurrentThread.ManagedThreadId;
        internal void AssertOwner()
        { if (Thread.CurrentThread.ManagedThreadId != owner) throw new InvalidOperationException("State must be pumped on its owning/main thread."); }
        internal void Clear(string session)
        { AssertOwner(); Snapshot = null; SessionId = session; LastSeq = -1; ServerTime = ReceivedAt = 0; Revision++; Changed?.Invoke(); }
        internal void Replace(Envelope message, long receivedAt)
        {
            AssertOwner(); Snapshot = message.Snapshot; SessionId = message.SessionId; LastSeq = message.Seq;
            ServerTime = message.ServerTime; ReceivedAt = receivedAt; Revision++; Changed?.Invoke();
        }
    }
    public sealed class EventDispatcher
    {
        public long Count { get; private set; }
        public GameEvent LastEvent { get; private set; }
        public event Action<GameEvent> Received;
        internal void Reset() { Count = 0; LastEvent = null; }
        internal void Dispatch(GameEvent value) { Count++; LastEvent = value; Received?.Invoke(value); }
    }
}
