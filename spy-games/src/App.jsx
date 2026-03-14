import { useState, useEffect } from "react";
import PlayerSetup from "./pages/PlayerSetup";
import Rooms from "./pages/Rooms";
import JoinRoomPage from "./pages/JoinRoomPage";
import GamePlay from "./pages/GamePlay"; 
import "./App.css";
// استبدل السطر القديم بالسطر ده
const socket = new WebSocket("wss://partygames-2hh2887f.b4a.run");

function App() {
  const [page, setPage] = useState("menu");
  const [player, setPlayer] = useState(null);
  const [room, setRoom] = useState(null);

  useEffect(() => {
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case "roomCreated":
    case "roomUpdate":
      setRoom(data.room);
      setPage("lobby");
      break;

    case "error":
      // لو الرسالة فيها كلمة "الاسم"، نرجعه لصفحة الـ setup
      if (data.message.includes("الاسم")) {
        alert("⚠️ " + data.message);
        setPage("setup"); // 🚀 الحركة دي هي اللي هتحل المشكلة
      } else {
        alert("⚠️ " + data.message);
      }
      break;




      
      case "kicked":
  alert("❌ لقد تم طردك من الغرفة!");
  setRoom(null);
  setPage("rooms");
  break;
 case "gameStarted":
  // 1. تحديث بيانات اللاعب أولاً
  setPlayer(prev => ({
    ...prev,
    word: data.word,
    isSpy: data.isSpy
  }));
  
  // 2. تحديث الغرفة
  setRoom(data.room);

  // 3. تأخير بسيط جداً (50ms) عشان نضمن إن الـ State سمع
  setTimeout(() => {
    setPage("gamePlay");
  }, 50). 
  break;
      }




    };






  }, []); 

  const handleCreateRoom = (roomSettings) => {
    socket.send(JSON.stringify({ 
      type: "createRoom", 
      player, 
      config: roomSettings 
    }));
  };

  const handleJoinRoom = (roomIdFromInput) => {
    socket.send(JSON.stringify({ type: "joinRoom", roomId: roomIdFromInput, player }));
  };

  const handleStartGame = () => {
    socket.send(JSON.stringify({ type: "startGame", roomId: room.id, player }));
  };

  const handleToggleReady = () => {
    if (!room || !player) return;
    socket.send(JSON.stringify({
      type: "toggleReady",
      roomId: room.id,
      playerName: player.name
    }));
  };

  // --- منطق عرض الصفحات ---

if (page === "setup") {
  return (
    <PlayerSetup 
      initialData={player} // بنبعت الداتا القديمة عشان لو رجعنا نلاقي الاسم مكتوب
      startGame={(data) => { 
        setPlayer(data); 
        setPage("rooms"); 
      }} 
    />
  );
}
  if (page === "rooms") {
    return  ( <Rooms player={player} onCreateRoom={() => setPage("createRoom")} onJoinRoom={() => setPage("joinRoom")}  





    

  onBack={() => setPage("setup")} // 🚀 هنا خليناه يرجع لصفحة الـ setup
    />
  );
}







  
  
if (page === "createRoom") {
  return (
    <div className="create-room-page">
      <div className="glass-card">
        <button className="back-btn-mini" onClick={() => setPage("rooms")}>← Back</button>
        <h2 style={{color: 'var(--accent-color)'}}> ROOM SETTING </h2>
        <div className="input-group">
          <label>Round Numbers(1 - 3)</label>
          <input 
            type="number" 
            defaultValue="1" 
            id="room-rounds" 
            min="1" 
            max="3" 
            onInput={(e) => { if(e.target.value > 3) e.target.value = 3; if(e.target.value < 1) e.target.value = 1; }}
          />
          
          <label>Max players (3 - 10)</label>
          <input 
            type="number" 
            defaultValue="6" 
            id="room-max" 
            min="3" 
            max="10" 
            onInput={(e) => { if(e.target.value > 10) e.target.value = 10; if(e.target.value < 3) e.target.value = 3; }}
          />
        </div>
        <button className="game-btn primary-btn" onClick={() => {
          const rounds = parseInt(document.getElementById("room-rounds").value);
          const maxPlayers = parseInt(document.getElementById("room-max").value);
          
          handleCreateRoom({ rounds, maxPlayers });
        }}> Create ROOM </button>
        <button className="game-btn secondary-btn" onClick={() => setPage("rooms")}> Cancel </button>
      </div>
    </div>
  );
}



 if (page === "joinRoom") {
  return (
    <div className="join-room-page">
      <div className="glass-card">
        <h2 style={{color: 'var(--accent-color)'}}>ENTER ROOM ID</h2>
        <input 
          type="text" 
          placeholder="e.g. AB12CD" 
          id="join-id-input" 
          style={{textAlign: 'center', fontSize: '24px', letterSpacing: '4px'}}
        />
        <button className="game-btn primary-btn" onClick={() => {
          const id = document.getElementById("join-id-input").value.toUpperCase();
          handleJoinRoom(id);
        }}>Join Mission</button>
        <button className="game-btn secondary-btn" onClick={() => setPage("rooms")}>Back</button>
      </div>
    </div>
  );
}
if (page === "lobby") {

  if (!room || !player) return <div className="container"><h1>Loading...</h1></div>;



  const myData = room.players.find(p => p.name === player.name);

  const isOwner = player.name === room.owner;

  const allReady = room.players.every(p => p.isReady);

  const playersCount = room.players.length;



  const handleStartWithValidation = () => {

    if (playersCount < 3) {

      alert("لا يمكن البدء، يجب تواجد 3 لاعبين على الأقل!");

      return;

    }

    if (!allReady) {

      alert("لا يمكن البدء، تأكد أن جميع اللاعبين مستعدون!");

      return;

    }

    handleStartGame();

  };



  return (

    <div className="lobby-wrapper">

      <div className="lobby-header glass-card">

        <h2 className="neon-text">SPY LOBBY</h2>

        <p>Players: {playersCount} / {room.config?.maxPlayers || 6}</p>

        <p className="room-id-tag">ROOM ID: {room.id}</p>

      </div>



      <div className="players-grid">

        {room.players.map((p, i) => {

          const isThisPlayerMe = p.name === player.name;

          const isThisPlayerOwner = p.name === room.owner;

          

          // تحديد لون الأفاتار (الخلفية بتاعته مثلاً)

          let avatarBg = "transparent";

          if (isThisPlayerMe) avatarBg = "rgba(56, 189, 248, 0.3)"; // لون ليك أنت (أزرق خفيف)

          if (p.isReady) avatarBg = "rgba(34, 197, 94, 0.5)"; // لون اللي استعد (أخضر)

{isThisPlayerOwner && !isThisPlayerMe && (
  <button 
    className="kick-btn" 
    onClick={() => socket.send(JSON.stringify({ 
      type: "kickPlayer", 
      roomId: room.id, 
      adminName: player.name, 
      targetName: p.name 
    }))}
  >
    ➖
  </button>
)}

          return (

            <div key={i} className={`player-card ${p.isReady ? "ready-mode" : ""}`}>

              <div className="avatar-box" style={{ backgroundColor: avatarBg, borderRadius: '50%', padding: '10px' }}>

                <span className="avatar-emoji" style={{ filter: p.isReady ? 'drop-shadow(0 0 5px #22c55e)' : 'none' }}>

                  {p.avatar}

                </span>

                {isThisPlayerOwner && <span className="crown">👑</span>}

              </div>

              <div className="name-plate" style={{ fontWeight: isThisPlayerMe ? 'bold' : 'normal' }}>

                {p.name} {isThisPlayerMe && "(YOU)"}

              </div>

            </div>

          );

        })}

      </div>

      <div className="lobby-footer">
        {isOwner ? (
          <button className="game-btn primary-btn" onClick={handleStartWithValidation}>
            START MISSION
          </button>
        ) : (
          <button 
            className={`game-btn ${myData?.isReady ? 'secondary-btn' : 'primary-btn'}`}
            style={{ background: myData?.isReady ? '#ef4444' : '' }}
            onClick={handleToggleReady}
          >
            {myData?.isReady ? "NOT READY" : "READY UP!"}
          </button>
        )}
      </div>
    </div>
  );
}

  if (page === "gamePlay") return <GamePlay room={room} player={player} socket={socket} />;

  // الصفحة الرئيسية (Menu)
  return (
    <div className="container">
      <h1>🎮 Online Party Games</h1>
      <div className="games-grid">
        <div className="game-card spy" onClick={() => setPage("setup")}>
          🕵️
          <h2>Spy Game</h2>
        </div>
        <div className="game-card disabled">🎮<h2>Coming Soon</h2></div>
        <div className="game-card disabled">🎮<h2>Coming Soon</h2></div>
        <div className="game-card disabled">🎮<h2>Coming Soon</h2></div>
      </div>
    </div>
  );
}

export default App;