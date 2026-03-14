import { useState } from "react";

function JoinRoomPage({ player, onJoin, onBack }) {
  const [roomIdInput, setRoomIdInput] = useState("");

 // داخل JoinRoomPage.js (تأكد أن الـ handleJoinRoom تستدعى هكذا)
// داخل JoinRoomPage.js (تأكد أن الـ handleJoinRoom تستدعى هكذا)
// داخل JoinRoomPage.js (تأكد أن الـ handleJoinRoom تستدعى هكذا)
const handleJoin = () => {
  const idInput = document.getElementById("join-id-input").value.toUpperCase();
  if(idInput) {
    onJoin(idInput); // دي اللي بتبعت للسيرفر من App.js
  }
};





  return (
    <div className="join-room-page">
      <div className="join-card">
        <h1>Join Room</h1>
        <input
          type="text"
          placeholder="Enter Room ID (e.g. 8X2K9)"
          value={roomIdInput}
          onChange={(e) => setRoomIdInput(e.target.value)}
          style={{ textTransform: "uppercase" }}
        />
        <div className="join-btns">
          <button className="create-btn" onClick={handleJoin}>Join Now</button>
          <button className="back-btn" onClick={onBack}>Back</button>
        </div>
      </div>
    </div>
  );
}

export default JoinRoomPage;