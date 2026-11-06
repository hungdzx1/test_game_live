using UnityEngine;

namespace TuTienLive.Characters
{
    // Prioritize the subject without moving the protected stage-03 camera or opening a card.
    // Keeping the full frame is deliberate: courtyard players and the ritual stay visible.
    public sealed class CameraDirector : MonoBehaviour
    {
        public string FollowUserId { get; private set; }
        public string Reason { get; private set; }
        private string eventUser;
        private float remaining;
        private int priority;
        public void Request(string userId, int importance, string reason)
        {
            if (userId == null || remaining > 0 && importance < priority) return;
            eventUser = userId; priority = importance; remaining = 3; Reason = reason;
        }
        public void Sample(string ritualUser, string serverFollow, float delta)
        {
            remaining = Mathf.Max(0, remaining - delta);
            FollowUserId = ritualUser ?? (remaining > 0 ? eventUser : serverFollow);
            if (ritualUser != null) Reason = "breakthrough";
            else if (remaining <= 0) Reason = serverFollow != null ? "server follow" : "overview";
        }
        public void ResetFocus() { FollowUserId = eventUser = null; remaining = 0; priority = 0; Reason = "overview"; }
    }
}
