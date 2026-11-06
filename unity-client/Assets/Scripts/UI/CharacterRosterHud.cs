using UnityEngine;
using TuTienLive.Characters;

namespace TuTienLive.UI
{
    public sealed class CharacterRosterHud : MonoBehaviour
    {
        public CharacterManager manager;
        public TextMesh label;
        private string previous;
        private void LateUpdate()
        {
            if(!manager||!label)return;
            string next=manager.network&&manager.network.State?.IsSynchronized==true
                ? manager.TotalPlayers+" đệ tử · "+manager.Views.Count+" hiện hình"
                : "Đang chờ snapshot máy chủ";
            if(next==previous)return;previous=next;label.text=next;
        }
    }
}
