import { useState, useEffect } from "react";

import PlayerSetup from "./pages/PlayerSetup";

import Rooms from "./pages/Rooms";

import JoinRoomPage from "./pages/JoinRoomPage";

import GamePlay from "./pages/GamePlay";

import CodenamesGame from "./pages/Codenames";

import "./App.css";

// استبدل السطر القديم بالسطر ده

const socket = new WebSocket("wss://partygames-8ck30nmt.b4a.run");







function App() {

  const [page, setPage] = useState("menu");

  const [player, setPlayer] = useState(null);

  const [room, setRoom] = useState(null);

  const [gameType, setGameType] = useState(null); // 'spy' or 'codenames'

const copyRoomId = () => {

    navigator.clipboard.writeText(room.id);

    alert("تم نسخ الكود: " + room.id);

  };

  useEffect(() => {

socket.onmessage = (event) => {

  const data = JSON.parse(event.data);

 

  switch (data.type) {

    case "roomCreated":

   case "roomUpdate":

  setRoom(data.room);

  if (!data.room.gameStarted) {

    setPage("lobby"); // لو السيرفر بعت إن اللعبة مش بدأت، يرجعه اللوبي فوراً

  }

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

      config: roomSettings ,

      gameType: gameType

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

  return (

    <Rooms

      player={player}

      onCreateRoom={() => setPage("createRoom")}

      onJoinRoom={() => setPage("joinRoom")}

      onBack={() => setPage("setup")} // بيرجعك لصفحة الاسم والأفاتار

    />

  );

}









 















 

if (page === "createRoom") {

  // شروط الإعدادات بناءً على نوع اللعبة

  const isCodenames = gameType === "codenames";



  return (

    <div className="create-room-page">

      <div className="glass-card">

        <h2 style={{ color: 'var(--accent-color)' }}>

          {isCodenames ? "CODE GAME SETTINGS" : "SPY GAME SETTINGS"}

        </h2>

       

        <div className="input-group">

          {/* إعدادات الجولات تظهر فقط في لعبة Spy */}

          {!isCodenames && (

            <>

              <label>Round Numbers (1 - 3)</label>

              <input

                type="number"

                defaultValue="1"

                id="room-rounds"

                min="1"

                max="3"

              />

            </>

          )}



          {/* إعدادات مشتركة أو خاصة بـ Code Game */}

          <label>Max players ({isCodenames ? "4 - 12" : "3 - 10"})</label>

          <input

            type="number"

            defaultValue={isCodenames ? "8" : "6"}

            id="room-max"

            min={isCodenames ? "4" : "3"}

            max={isCodenames ? "12" : "10"}

          />



          {isCodenames && (

            <>

              <label>Word Language</label>

              <select id="room-lang" className="game-input">

                <option value="ar">العربية 🇪🇬</option>

                <option value="en">English 🇺🇸</option>

              </select>

            </>

          )}

        </div>



        <button className="game-btn primary-btn" onClick={() => {

          const maxPlayers = parseInt(document.getElementById("room-max").value);

         

          let roomSettings = { maxPlayers };



          if (isCodenames) {

            // منطق Code Game: لا توجد جولات، نرسل إعدادات اللغة مثلاً

            roomSettings.language = document.getElementById("room-lang").value;

            roomSettings.rounds = 1; // جولة واحدة مفتوحة

          } else {

            // منطق Spy Game

            roomSettings.rounds = parseInt(document.getElementById("room-rounds").value);

          }

         

          handleCreateRoom(roomSettings);

        }}>

          CREATE {isCodenames ? "CODE" : "SPY"} ROOM

        </button>

       

        <button className="game-btn secondary-btn" onClick={() => setPage("rooms")}>

          Cancel

        </button>

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



if (!room || !player) return <div>Loading...</div>;



  // لو اللعبة هي Code Game، نعرض اللوبي الجديدة

// --- كود لوبي Code Game الجديد (يتم وضعه داخل شرط if (page === "lobby")) ---

// --- كود لوبي Code Game الجديد (يتم وضعه داخل شرط if (page === "lobby")) ---

// --- كود لوبي Code Game الجديد بالكامل ---
// انسخ هذا الجزء وضعه بدلاً من كود الوبي القديم داخل شرط if (page === "lobby")

// --- كود لوبي Code Game الجديد بالكامل ---
// انسخ هذا الجزء وضعه بدلاً من كود الوبي القديم داخل شرط if (page === "lobby")

if (gameType === "codenames") {
  const isMainOwner = player.name === room.owner; // صاحب الروم (ليدر أزرق)👑
  const isRedOwner = player.name === room.blueOwner; // ليدر الفريق الأحمر (اللي الأونر اختاره)⭐
  
  const waitingPlayers = room.players.filter(p => !p.team);
  const redTeam = room.players.filter(p => p.team === "red");
  const blueTeam = room.players.filter(p => p.team === "blue");

  // دالة لرسم كارت اللاعب بنظام الهرم والصلاحيات
  const renderPlayerCard = (p, team) => {
    const isLeader = (team === "blue" && p.name === room.owner) || (team === "red" && p.name === room.blueOwner);
    
    // منطق ظهور زر الطرد (-)
    let showKick = false;
    // 1. الأونر الأساسي يطرد أي حد (بما فيهم ليدر الأحمر)
    if (isMainOwner && p.name !== player.name) showKick = true;
    // 2. ليدر الأحمر يطرد فريقه فقط (بشرط ميكونش هو الأونر الأساسي)
    if (isRedOwner && team === "red" && p.name !== player.name && !isMainOwner) showKick = true;

    return (
      <div key={p.name} className={`player-pyramid-card ${isLeader ? "leader-card-glow" : ""}`}>
        {showKick && (
          <button 
            className="kick-btn-absolute" 
            onClick={() => socket.send(JSON.stringify({type: "kickPlayer", roomId: room.id, adminName: player.name, targetName: p.name}))}
          > ➖ </button>
        )}
        <div className="avatar-display">{p.avatar}</div>
        <div className="name-tag-display">
          {p.name} 
          {team === "blue" && p.name === room.owner && " 👑"}
          {team === "red" && p.name === room.blueOwner && " ⭐"}
        </div>
      </div>
    );
  };

  return (
    <div className="codenames-lobby-page-wrapper">
      {/* خلفية متحركة حلوة */}
      <div className="animated-lobby-bg"></div>

      {/* الهيدر العلوي */}
      <div className="lobby-top-header">
        <h1 className="neon-text-main">CODE GAME MISSION</h1>
        <div className="room-id-badge-large" onClick={copyRoomId}>
          ID: <span className="id-text">{room.id}</span> 📋
        </div>
      </div>

      {/* المحتوى الأساسي: تقسيم الثلاثة أعمدة */}
      <div className="lobby-main-grid">
        
        {/* العمود الأيسر: الفريق الأحمر (Red Team) */}
        <div className="team-column red-column">
          <div className="team-header-box red-header">🔴 RED TEAM</div>
          
          <div className="pyramid-container-layout">
            {/* قمة الهرم: مكان ليدر الأحمر (⭐) */}
            <div className="pyramid-leader-spot">
              {redTeam.filter(p => p.name === room.blueOwner).map(p => renderPlayerCard(p, "red"))}
            </div>
            {/* قاعدة الهرم: باقي الفريق في صفوف */}
            <div className="pyramid-members-base">
              {redTeam.filter(p => p.name !== room.blueOwner).map(p => renderPlayerCard(p, "red"))}
            </div>
          </div>
          
          {/* زر انضمام للأحمر: يظهر بس لو اللاعب مش ليدر الفريق التاني ومختارش فريق لسه */}
          {(!myData?.team) && (
            <button className="join-btn-large red-gradient-btn" onClick={() => socket.send(JSON.stringify({type: "joinTeam", roomId: room.id, playerName: player.name, team: "red"}))}>Join Red</button>
          )}
        </div>

        {/* العمود الأوسط: قائمة الانتظار (Waiting Room) */}
        <div className="waiting-room-column">
          <div className="waiting-header-box">📥 Waiting Room</div>
          <div className="waiting-players-list-scroll">
            {waitingPlayers.length === 0 && (
              <div className="empty-waiting-text">Everyone is ready!</div>
            )}
            {waitingPlayers.map(p => (
              <div key={p.name} className="waiting-player-row-card">
                <span className="w-player-info">{p.avatar} {p.name}</span>
                {isMainOwner && (
                  <div className="admin-quick-actions">
                    <button className="mini-action-btn make-leader-btn" title="Make Red Leader" onClick={() => socket.send(JSON.stringify({type: "assignBlueLeader", roomId: room.id, adminName: player.name, targetName: p.name}))}>⭐</button>
                    <button className="mini-action-btn kick-btn-mini" title="Kick" onClick={() => socket.send(JSON.stringify({type: "kickPlayer", roomId: room.id, adminName: player.name, targetName: p.name}))}>➖</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* العمود الأيمن: الفريق الأزرق (Blue Team) */}
        <div className="team-column blue-column">
          <div className="team-header-box blue-header">🔵 BLUE TEAM</div>
          
          <div className="pyramid-container-layout">
            {/* قمة الهرم: مكان ليدر الأزرق (👑 - الأونر) */}
            <div className="pyramid-leader-spot">
              {blueTeam.filter(p => p.name === room.owner).map(p => renderPlayerCard(p, "blue"))}
            </div>
            {/* قاعدة الهرم: باقي الفريق في صفوف */}
            <div className="pyramid-members-base">
              {blueTeam.filter(p => p.name !== room.owner).map(p => renderPlayerCard(p, "blue"))}
            </div>
          </div>
          
          {/* زر انضمام للأزرق */}
          {(!myData?.team) && (
            <button className="join-btn-large blue-gradient-btn" onClick={() => socket.send(JSON.stringify({type: "joinTeam", roomId: room.id, playerName: player.name, team: "blue"}))}>Join Blue</button>
          )}
        </div>

      </div>

      {/* زر البداية العملاق للأونر في الأسفل */}
      {isMainOwner && (
        <div className="lobby-footer-actions">
          <button className="big-start-btn-glow" onClick={handleStartGame} disabled={redTeam.length < 2 || blueTeam.length < 2}>START MISSION 🚀</button>
          {(redTeam.length < 2 || blueTeam.length < 2) && (
            <p className="hint-text">Need at least 2 players in each team to start.</p>
          )}
        </div>
      )}
    </div>
  );
}


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



  {/* التعديل هنا: الـ ID والأيقونة في سطر واحد وقابل للضغط */}

  <p

   className="room-id-tag" onClick={copyRoomId} style={{ cursor: 'pointer' }}>

            ROOM ID: {room.id} 📋

          </p>

        </div>





























































































































      <div className="players-grid">



        {room.players.map((p, i) => {



          const isThisPlayerMe = p.name === player.name;



          const isThisPlayerOwner = p.name === room.owner;



         



          // تحديد لون الأفاتار (الخلفية بتاعته مثلاً)



          let avatarBg = "transparent";



          if (isThisPlayerMe) avatarBg = "rgba(56, 189, 248, 0.3)"; // لون ليك أنت (أزرق خفيف)



          if (p.isReady) avatarBg = "rgba(34, 197, 94, 0.5)"; // لون اللي استعد (أخضر)







     return (

            <div

              key={i}

              className={`player-card ${p.isReady ? "ready-mode" : ""} ${isThisPlayerOwner ? "owner-card" : ""}`}

            >

              {/* زر الطرد: يظهر للأونر فقط، وعلى اللاعبين الآخرين فقط */}

              {isOwner && !isThisPlayerMe && (

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



if (page === "gamePlay") {

  if (gameType === "spy") return <GamePlay room={room} player={player} socket={socket} />;

  if (gameType === "codenames") return <CodenamesGame room={room} player={player} socket={socket} />;

}

  // الصفحة الرئيسية (Menu)

  return (

    <div className="container">

      <h1>🎮 Online Party Games</h1>

      <div className="games-grid">

<div className="game-card spy" onClick={() => { setGameType("spy"); setPage("setup"); }}>

  🕵️

  <h2>Spy Game</h2>

</div>



<div className="game-card codenames" onClick={() => { setGameType("codenames"); setPage("setup"); }}>

  🔑

        <h2>  code game </h2>

      </div>

        <div className="game-card disabled">🎮<h2>Coming Soon</h2></div>

        <div className="game-card disabled">🎮<h2>Coming Soon</h2></div>

      </div>

    </div>

  );

}



export default App;