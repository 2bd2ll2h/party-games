import { useState, useEffect } from "react";
import "./GamePlay.css";

function GamePlay({ room, player, socket }) {
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(room.players[0].name); // مين اللي عليه الدور
  const [timer, setTimer] = useState(20);

  // استقبال الرسايل وتحديث الدور من السيرفر
  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chatMessage") {
        setChatLog((prev) => [...prev, data.payload]);
      }
      if (data.type === "turnUpdate") {
        setCurrentTurn(data.activePlayer);
        setTimer(20); // ريست للتايمر
      }
    };
  }, [socket]);

  const sendMessage = () => {
    if (message.trim() === "") return;
    socket.send(JSON.stringify({
      type: "sendMessage",
      roomId: room.id,
      payload: { user: player.name, text: message }
    }));
    setMessage("");
  };

  return (
    <div className="gameplay-container">
      {/* الجانب الأيسر: اللاعبين والشخصيات */}
      <div className="sidebar">
        <div className="room-info">ID: {room.id}</div>
        <div className="player-list">
          {room.players.map((p, i) => (
            <div key={i} className={`player-item ${currentTurn === p.name ? "active" : ""}`}>
              <span className="avatar">{p.avatar}</span>
              <span className="name">{p.name}</span>
              {currentTurn === p.name && <div className="timer-dot">{timer}s</div>}
            </div>
          ))}
        </div>
        <div className="your-word">
          <p>كلمتك السرية:</p>
          <h3>{player.word}</h3> 
        </div>
      </div>

      {/* الجانب الأيمن: الشات */}
      <div className="chat-section">
        <div className="messages-container">
          {chatLog.map((m, i) => (
            <div key={i} className={`msg-bubble ${m.user === player.name ? "me" : ""}`}>
              <strong>{m.user}:</strong> {m.text}
            </div>
          ))}
        </div>

        <div className="input-area">
          <input
            type="text"
            placeholder={currentTurn === player.name ? "اشرح الكلمة الآن..." : "انتظر دورك..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={currentTurn !== player.name} // قفل الكتابة لو مش دورك
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage} disabled={currentTurn !== player.name}>إرسال</button>
        </div>
      </div>
    </div>
  );
}

export default GamePlay;