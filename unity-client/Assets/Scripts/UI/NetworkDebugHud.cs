using System;
using UnityEngine;
using TuTienLive.Network;

namespace TuTienLive.UI
{
    [RequireComponent(typeof(UnityWebSocketClient))]
    public sealed class NetworkDebugHud : MonoBehaviour
    {
        private UnityWebSocketClient client;
        private GUIStyle label;
        private void Awake() { client = GetComponent<UnityWebSocketClient>(); }
        private void OnGUI()
        {
            if (label == null) label = new GUIStyle(GUI.skin.label) { fontSize = 22, wordWrap = true };
            float scale = Mathf.Max(.3f, Mathf.Min(Screen.width / 540f, Screen.height / 960f));
            GUI.matrix = Matrix4x4.Scale(new Vector3(scale, scale, 1));
            GUILayout.BeginArea(new Rect(20, 30, 500, 900));
            var state = client.State; var snapshot = state?.Snapshot;
            GUILayout.Label("TU TIEN LIVE / NETWORK TEST", label);
            GUILayout.Space(20);
            foreach (var line in new[] {
                client.Endpoint, "WS: " + client.Status,
                "Session: " + (state?.SessionId ?? "-"),
                "Phase: " + (snapshot?.Phase ?? "awaiting snapshot"),
                "Effective: " + (snapshot?.EffectivePhase ?? "-"),
                "remainingMs: " + (snapshot?.RemainingMs.ToString("F0") ?? "-"),
                "Players: " + (snapshot?.Players.Count ?? 0),
                "Events (session): " + (client.Events?.Count ?? 0),
                "Last event: " + (client.Events?.LastEvent?.Kind ?? "-"),
                "Snapshot seq: " + (state?.LastSeq ?? -1),
                "Receipt - serverTime: " + (state?.IsSynchronized == true ? state.ReceiptOffsetMs + " ms (clock offset)" : "-"),
                "Queue age: " + client.QueueAgeMs.ToString("F0") + " ms / pending " + client.PendingMessages,
                "Snapshot age: " + (state?.IsSynchronized == true ? (DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - state.ReceivedAt) + " ms" : "-"),
                "Rejected: " + (client.Protocol?.Rejected ?? 0),
                "Read-only client. No gameplay simulation."
            }) GUILayout.Label(line, label);
            GUILayout.EndArea();
        }
    }
}
