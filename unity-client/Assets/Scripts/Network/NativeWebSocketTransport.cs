using System;
using System.Collections.Generic;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace TuTienLive.Network
{
    public enum TransportKind { Connecting, Open, Text, Disconnected }
    public sealed class TransportMessage
    {
        public TransportKind Kind { get; }
        public long Generation { get; }
        public string Text { get; }
        public long ReceivedAt { get; }
        public int RetryDelayMs { get; }
        internal TransportMessage(TransportKind kind, long generation, string text = null, int delay = 0)
        { Kind = kind; Generation = generation; Text = text; RetryDelayMs = delay; ReceivedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(); }
    }
    // Windows Editor/Windows Standalone only. No Unity API, send/RPC API or application-level ping.
    public sealed class NativeWebSocketTransport : IDisposable
    {
        public const int MaxQueuedMessages = 256, MaxQueueBytes = 8 * 1024 * 1024;
        private readonly object gate = new object();
        private readonly Queue<TransportMessage> queue = new Queue<TransportMessage>();
        private readonly CancellationTokenSource stop = new CancellationTokenSource();
        private ClientWebSocket socket;
        private int queuedBytes;
        private bool disposed;
        public Task Completion { get; private set; }
        public int Pending { get { lock (gate) return queue.Count; } }
        public static int BackoffMs(int attempt) => Math.Min(10000, 500 * (1 << Math.Min(Math.Max(attempt, 0), 5)));
        public void Start(Uri endpoint)
        {
#if !(UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN)
            throw new PlatformNotSupportedException("Native transport supports Windows Editor/Standalone only; WebGL needs a browser bridge.");
#else
            if (endpoint.Scheme != "ws" || endpoint.Host != "127.0.0.1" || endpoint.AbsolutePath != "/ws" || !string.IsNullOrEmpty(endpoint.Query) || !string.IsNullOrEmpty(endpoint.UserInfo))
                throw new ArgumentException("Use ws://127.0.0.1:<port>/ws on the local Node server.");
            lock (gate)
            {
                if (disposed || Completion != null) throw new InvalidOperationException("Transport already started/disposed.");
                Completion = Task.Run(() => Run(endpoint));
            }
#endif
        }
        public bool TryDequeue(out TransportMessage message)
        {
            lock (gate)
            {
                if (queue.Count == 0) { message = null; return false; }
                message = queue.Dequeue(); queuedBytes -= (message.Text?.Length ?? 0) * 2; return true;
            }
        }
        private void Enqueue(TransportMessage value)
        {
            lock (gate)
            {
                if (disposed) return;
                int bytes = (value.Text?.Length ?? 0) * 2;
                if (queue.Count >= MaxQueuedMessages || queuedBytes + bytes > MaxQueueBytes)
                {
                    queue.Clear(); queuedBytes = 0;
                    throw new IOException("Receive queue overflow; reconnect for full resynchronization.");
                }
                queue.Enqueue(value); queuedBytes += bytes;
            }
        }
        private async Task Run(Uri endpoint)
        {
            int attempt = 0; long generation = 0;
            try
            {
                while (!stop.IsCancellationRequested)
                {
                    generation++; string reason = "Server closed connection";
                    var connectedAt = DateTime.UtcNow;
                    try
                    {
                        Enqueue(new TransportMessage(TransportKind.Connecting, generation));
                        using var ws = new ClientWebSocket();
                        lock (gate) { if (disposed) break; socket = ws; }
                        using (var timeout = CancellationTokenSource.CreateLinkedTokenSource(stop.Token))
                        { timeout.CancelAfter(5000); await ws.ConnectAsync(endpoint, timeout.Token).ConfigureAwait(false); }
                        connectedAt = DateTime.UtcNow;
                        Enqueue(new TransportMessage(TransportKind.Open, generation));
                        var buffer = new byte[16 * 1024];
                        while (ws.State == WebSocketState.Open && !stop.IsCancellationRequested)
                        {
                            using var content = new MemoryStream();
                            using var deadline = CancellationTokenSource.CreateLinkedTokenSource(stop.Token);
                            deadline.CancelAfter(10000); // A silent or endlessly fragmented peer must not hold us forever.
                            WebSocketReceiveResult part;
                            do
                            {
                                part = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), deadline.Token).ConfigureAwait(false);
                                if (part.MessageType == WebSocketMessageType.Close) throw new IOException("Server closed connection");
                                if (part.MessageType != WebSocketMessageType.Text) throw new IOException("Expected text WebSocket message");
                                if (content.Length + part.Count > StateMapper.MaxMessageBytes) throw new IOException("WebSocket message exceeds 4 MiB");
                                content.Write(buffer, 0, part.Count);
                            } while (!part.EndOfMessage);
                            var text = new UTF8Encoding(false, true).GetString(content.GetBuffer(), 0, (int)content.Length);
                            Enqueue(new TransportMessage(TransportKind.Text, generation, text));
                        }
                    }
                    catch (Exception e) when (e is WebSocketException || e is IOException || e is OperationCanceledException || e is ObjectDisposedException || e is DecoderFallbackException)
                    { reason = e.GetType().Name + ": " + e.Message; }
                    finally { lock (gate) socket = null; }
                    if (stop.IsCancellationRequested) break;
                    // Reset only after a stable connection, preventing rapid open/close retry storms.
                    if ((DateTime.UtcNow - connectedAt).TotalSeconds >= 10) attempt = 0;
                    var delay = BackoffMs(attempt++);
                    Enqueue(new TransportMessage(TransportKind.Disconnected, generation, reason, delay));
                    await Task.Delay(delay, stop.Token).ConfigureAwait(false);
                }
            }
            catch (OperationCanceledException) when (stop.IsCancellationRequested) { }
        }
        public void Reconnect() { lock (gate) socket?.Abort(); }
        public void Dispose()
        {
            lock (gate)
            {
                if (disposed) return;
                disposed = true; stop.Cancel(); socket?.Abort(); queue.Clear(); queuedBytes = 0;
            }
            // The token source stays alive until the async receive loop exits.
            if (Completion != null) _ = Completion.ContinueWith(_ => stop.Dispose(), TaskScheduler.Default);
            else stop.Dispose();
        }
    }
}
