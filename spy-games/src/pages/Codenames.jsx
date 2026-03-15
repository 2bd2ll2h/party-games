import React, { useState, useEffect } from 'react';
import './Codenames.css';

// بنك الكلمات - ممكن تنقله لملف مستقل لاحقاً
const wordBank = ["أسد", "مصر", "طائرة", "مفتاح", "بحر", "تفاحة", "ساعة", "كتاب", "قهوة", "جبل", "سيارة", "خاتم", "شمس", "قمر", "برج", "ثلج", "نار", "قطة", "ذهب", "حديد", "ملح", "سكر", "عين", "يد", "مدرسة"];

function Codenames({ room, player, socket, onBack }) {
  const [isSpymaster, setIsSpymaster] = useState(false);

  // منطق الضغط على كلمة
  const handleCardClick = (index) => {
    // لو اللاعب مش سباي ماستر والكلمة لسه متكشفتش، يبعت للسيرفر
    if (!isSpymaster && socket) {
      socket.send(JSON.stringify({
        type: "codenames_reveal",
        roomId: room.id,
        cardIndex: index,
        playerName: player.name
      }));
    }
  };

  return (
    <div className="cn-game-wrapper">
      {/* الهيدر فيه النتيجة والدور */}
      <div className="cn-header glass-card">
        <div className="team-score red">Red: {room?.scores?.red || 0}</div>
        <div className="turn-info">
          <span className={`turn-dot ${room?.turn}`}></span>
          {room?.turn === "red" ? "RED TURN" : "BLUE TURN"}
        </div>
        <div className="team-score blue">Blue: {room?.scores?.blue || 0}</div>
      </div>

      {/* أدوات التحكم */}
      <div className="cn-controls">
        <button className="neon-btn toggle-spy" onClick={() => setIsSpymaster(!isSpymaster)}>
          {isSpymaster ? "👁️ Player View" : "🕵️ Spymaster View"}
        </button>
        <button className="neon-btn back-btn" onClick={onBack}>Exit</button>
      </div>

      {/* شبكة الكلمات 5x5 */}
      <div className="cn-grid">
        {(room?.grid || []).map((card, index) => (
          <div 
            key={index} 
            className={`cn-card ${card.revealed || isSpymaster ? card.color : ""} ${isSpymaster && !card.revealed ? "spy-mode" : ""}`}
            onClick={() => handleCardClick(index)}
          >
            <span className="cn-text">{card.text}</span>
            {card.revealed && <div className="revealed-stamp">✓</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Codenames;