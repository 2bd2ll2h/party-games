import { useState, useEffect, useRef } from "react";
import "./GamePlay.css";

function GamePlay({ room, player, socket }) {
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [votedFor, setVotedFor] = useState(null);
  const [results, setResults] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(room.turnOrder[0]);
  const [timer, setTimer] = useState(20);
  const [showCard, setShowCard] = useState(true);
  
  const tickSound = useRef(new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg"));
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);













  



  
  // 1. استقبال الرسائل
  useEffect(() => {
    const handleServerMessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "chatMessage":
          setChatLog((prev) => [...prev, data.payload]);
          break;
        case "turnUpdate":
          setCurrentTurn(data.activePlayer);
          setTimer(20);
          break;
        case "votingStarted":
          setIsVoting(true);
          setVotedFor(null);
          break;
        case "gameResults":
          setResults(data);
          setIsVoting(false);
          break;
      }
    };
    socket.addEventListener("message", handleServerMessage);
    return () => socket.removeEventListener("message", handleServerMessage);
  }, [socket]);

  // 2. التايمر (تم تعديل المنطق هنا ليتوقف عند نهاية الجولات)
  useEffect(() => {
    if (showCard || isVoting || results) return;

// جوه useEffect بتاع التايمر في GamePlay.js
// جوه useEffect بتاع التايمر في GamePlay.js
// جوه useEffect بتاع التايمر في GamePlay.js
// جوه useEffect بتاع التايمر في GamePlay.js
const interval = setInterval(() => {
  setTimer((prev) => {
    if (prev <= 1) {
      // الأونر بس هو اللي بيبعت للسيرفر عشان الكل ينقل مع بعض
      if (player.name === room.owner) {
        socket.send(JSON.stringify({ type: "nextTurn", roomId: room.id }));
      }
      return 20; // ريست للتايمر محلياً لحد ما ييجي الـ Update من السيرفر
    }
    return prev - 1;
  });
}, 1000);
    return () => clearInterval(interval);
  }, [showCard, isVoting, results, room.owner, player.name, room.id, socket]);

  useEffect(() => {
    setTimeout(() => setShowCard(false), 5000);
  }, []);

  const sendMessage = () => {
    if (message.trim() === "" || currentTurn !== player.name || isVoting) return;
    socket.send(JSON.stringify({
      type: "sendMessage",
      roomId: room.id,
      payload: { user: player.name, text: message }
    }));
    setMessage("");
  };

 const handleVote = (targetName) => {
  // شيلنا شرط if (votedFor) return; عشان يقدر يغير صوته
  setVotedFor(targetName); 
  socket.send(JSON.stringify({
    type: "submitVote",
    roomId: room.id,
    voterName: player.name,
    votedForName: targetName
  }));
};







const handleGoHome = () => {
    // 1. تصفير الـ States محلياً فوراً
    setRoom(null);
    setPage("menu");
    
    // 2. إجبار السوكيت إنه ينسى الروم القديمة (اختياري بس بيحل مشاكل كتير)
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "leaveRoom" })); 
    }
    
    // 3. ريفريش خفيف للمتصفح عشان نكسح أي Memory قديمة
    window.location.reload();
};

  return (
    <div className="gameplay-wrapper">
      {showCard && (
        <div className="word-card-overlay">
          <div className="word-card glass-card">
            <p>كلمتك هي:</p>
            <h1 className="neon-text">{player.word}</h1>
          </div>
        </div>
      )}

      {isVoting && !results && (
        <div className="voting-overlay">
          <div className="voting-card glass-card">
            <h2 className="neon-text">مـن هـو الجاسـوس؟ 🕵️</h2>
            <div className="voting-grid">
              {room.players.map((p, i) => (
                <div key={i} className={`vote-item ${votedFor === p.name ? "selected" : ""}`} onClick={() => handleVote(p.name)}>
                  <span className="avatar-emoji">{p.avatar}</span>
                  <span className="player-name">{p.name}</span>
                  {votedFor === p.name && <span className="check-mark">✅</span>}
                </div>
              ))}
            </div>
            {player.name === room.owner && (
        <button 
          className="game-btn primary-btn" 
          style={{ marginTop: '20px', background: '#f59e0b' }}
          onClick={() => socket.send(JSON.stringify({ type: "revealResults", roomId: room.id, playerName: player.name }))}
        >
          كشف النتائج النهائية 🔍
        </button>
      )}

      {!votedFor && <p className="hint">اختر الشخص الذي تشك فيه...</p>}
      {votedFor && <p className="hint" style={{color: '#22c55e'}}>تم تسجيل صوتك! انتظر الأدمن يعرض النتيجة...</p>}
    




    
          </div>
        </div>
      )}

  {results && (
  <div className="results-overlay">
    <div className="results-card glass-card">
      <h1 className={results.isSpyCaught ? "win-text" : "lose-text"}>
        {/* لو اللاعب اللي فاتح الشاشة هو الجاسوس */}
        {player.isSpy ? (
          results.isSpyCaught 
            ? "💀 للاسف قفشوك وعملوا منك بطاطس!" 
            : "😂 وحش يا بطل! ضحكت عليهم وفزت!"
        ) : (
          /* لو لاعب عادي (الرسايل القديمة زي ما هي) */
          results.isSpyCaught 
            ? "🎉 قفشنا الجاسوس!" 
            : "💀 الجاسوس فاز عليكم!"
        )}
      </h1>
      
      <p>الجاسوس كان: <strong>{results.spyName}</strong></p>
      
      <button 
        className="game-btn primary-btn" 
        onClick={() => window.location.reload()}
        style={{ width: '100%', marginTop: '10px' }}
      >
        الرئيسية
      </button>
    </div>
  </div>
)}

      <div className="gameplay-container" style={{ filter: (showCard || isVoting || results) ? "blur(10px)" : "none" }}>
        <div className="sidebar">
          {/* تعديل: الزرار يظهر للأونر في أي وقت لإنهاء اللعبة يدوياً لو الجولات خلصت */}
          {player.name === room.owner && !isVoting && !results && (
            <button className="vote-trigger-btn" onClick={() => socket.send(JSON.stringify({ type: "startVoting", roomId: room.id, playerName: player.name }))}>
              📢 إنهاء وبدء التصويت
            </button>
          )}

          <div className="player-list">
            {room.turnOrder.map((name, i) => {
              const p = room.players.find(pl => pl.name === name);
              return (
                <div key={i} className={`player-item ${currentTurn === name ? "active" : ""}`}>
                  <span className="avatar">{p?.avatar}</span>
                  <span className="name">{name}</span> {/* الاسم رجع مكانه الطبيعي */}
                  {currentTurn === name && <div className="timer-dot">{timer}s</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="chat-section">
          <div className="messages-container">
            {chatLog.map((m, index) => (
              <div key={index} className={`msg-bubble ${m.user === player.name ? "me" : ""}`}>
                <strong>{m.user}:</strong> {m.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="input-area">
            <input
              type="text"
              value={message}
              disabled={currentTurn !== player.name || isVoting}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={currentTurn === player.name ? "اشرح كلمتك..." : "انتظر دورك..."}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} disabled={currentTurn !== player.name || isVoting}>  send</button>
          </div>
        </div>
      </div>
    </div>
  );




  
}

export default GamePlay;