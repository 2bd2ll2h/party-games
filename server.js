const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 5000 });



















// بنك الكلمات
const wordsBank = ["بيتزا", "طيارة", "موبايل", "كورة", "قهوة", "مستشفى"];
let rooms = {};






wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {



    
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case "createRoom":
          const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
          rooms[roomId] = {
            id: roomId,
            owner: data.player.name,
            players: [{ ...data.player, isReady: true }],
            gameStarted: false,
            config: data.config,
            turnOrder: [],
            currentTurnIndex: 0
          };
          ws.roomId = roomId;
          ws.playerName = data.player.name;
          ws.send(JSON.stringify({ type: "roomCreated", room: rooms[roomId] }));
          break;

        case "joinRoom":
          const targetRoom = rooms[data.roomId];
          if (targetRoom) {
            const isNameTaken = targetRoom.players.some(
              p => p.name.trim().toLowerCase() === data.player.name.trim().toLowerCase()
            );

            if (isNameTaken) {
              ws.send(JSON.stringify({ type: "error", message: "الاسم محجوز!" }));
              return;
            }

            targetRoom.players.push({ ...data.player, isReady: false });
            ws.roomId = data.roomId;
            ws.playerName = data.player.name;
            broadcastToRoom(data.roomId, { type: "roomUpdate", room: targetRoom });
          } else {
            ws.send(JSON.stringify({ type: "error", message: "كود الغرفة غير صحيح!" }));
          }
          break;

        case "toggleReady":
          const roomToToggle = rooms[data.roomId];
          if (roomToToggle) {
            const p = roomToToggle.players.find(pl => pl.name === data.playerName);
            if (p) {
              p.isReady = !p.isReady;
              broadcastToRoom(data.roomId, { type: "roomUpdate", room: roomToToggle });
            }
          }
          break;

        case "startGame":
          const roomToStart = rooms[data.roomId];
          if (roomToStart && roomToStart.owner === data.player.name) {
            const selectedWord = wordsBank[Math.floor(Math.random() * wordsBank.length)];
            const spyIndex = Math.floor(Math.random() * roomToStart.players.length);
            const spyName = roomToStart.players[spyIndex].name;
            
            // الترتيب الثابت
            const turnOrder = roomToStart.players.map(p => p.name);

            roomToStart.gameStarted = true;
            roomToStart.word = selectedWord;
            roomToStart.spyName = spyName;
            roomToStart.turnOrder = turnOrder; 
            roomToStart.currentTurnIndex = 0;

            broadcastToRoom(data.roomId, { type: "gameInfoUpdate", room: roomToStart });

            wss.clients.forEach((client) => {
              if (client.roomId === data.roomId) {
                const isSpy = client.playerName === spyName;
                client.send(JSON.stringify({
                  type: "gameStarted",
                  word: isSpy ? "أنت الجاسوس 🕵️" : selectedWord,
                  isSpy: isSpy,
                  room: roomToStart,
                  turnOrder: turnOrder 
                }));
              }
            });
          }
          break;

        case "sendMessage":
          // إرسال الرسالة للكل لضمان ظهورها في الشات
          broadcastToRoom(data.roomId, {
            type: "chatMessage",
            payload: { 
              user: data.payload.user, 
              text: data.payload.text,
              id: Math.random().toString() 
            }
          });
          break;

    // 1. تعديل منطق الانتقال للتصويت تلقائياً
case "nextTurn":
  const room = rooms[data.roomId];
  if (room && room.gameStarted) {
    room.currentTurnIndex++;
    
    // تأكدنا إننا بنستخدم الترتيب الثابت (turnOrder) عشان الحسبة متبوظش
    const playersCount = room.turnOrder.length;
    const maxRounds = parseInt(room.config.rounds) || 1;
    const totalTurnsNeeded = playersCount * maxRounds;

    if (room.currentTurnIndex >= totalTurnsNeeded) {
      // ✅ الانتقال التلقائي للتصويت
      room.isVoting = true;
      room.votes = {};
      broadcastToRoom(data.roomId, { type: "votingStarted", room: room });
    } else {
      // لسه فيه أدوار
      const nextPlayerIndex = room.currentTurnIndex % playersCount;
      broadcastToRoom(data.roomId, {
        type: "turnUpdate",
        activePlayer: room.turnOrder[nextPlayerIndex],
        currentIndex: nextPlayerIndex
      });
    }




    
  }
  break;



  case "startVoting":
  const roomToVote = rooms[data.roomId];
  if (roomToVote && roomToVote.owner === data.playerName) {
    roomToVote.isVoting = true;
    roomToVote.votes = {}; // لتخزين الأصوات: { "اسم_اللاعب": "اسم_المصوت_عليه" }
    broadcastToRoom(data.roomId, { type: "votingStarted", room: roomToVote });
  }
  break;


// 2. تعديل استقبال الأصوات (مش هنعرض النتايج تلقائي)
case "submitVote":
  const r = rooms[data.roomId];
  if (r && r.isVoting) {
    r.votes[data.voterName] = data.votedForName;
    // نبعت تحديث بعدد الناس اللي صوتت (اختياري للتشويق)
    broadcastToRoom(data.roomId, { type: "voteCountUpdate", count: Object.keys(r.votes).length });
  }
  break;

// 3. حالة جديدة للأدمن لعرض النتائج يدوياً
case "revealResults":
  const roomToReveal = rooms[data.roomId];
  if (roomToReveal && roomToReveal.owner === data.playerName) {
    processResults(data.roomId); // الدالة اللي عملناها قبل كدة بتحسب النتايج وبتبعتها
  }
  break;


          // جوه switch (data.type)



      }
    } catch (e) {
      console.log("Error logic:", e);
    }
  });

  ws.on("close", () => {
    if (ws.roomId && rooms[ws.roomId]) {
      const room = rooms[ws.roomId];
      room.players = room.players.filter(p => p.name !== ws.playerName);
      if (room.players.length === 0) {
        delete rooms[ws.roomId];
      } else {
        if (room.owner === ws.playerName) {
          room.owner = room.players[0].name;
          room.players[0].isReady = true;
        }
        broadcastToRoom(ws.roomId, { type: "roomUpdate", room: room });
      }
    }
  });
});

function broadcastToRoom(roomId, message) {
  wss.clients.forEach((client) => {
    if (client.roomId === roomId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}



function processResults(roomId) {
  const room = rooms[roomId];
  const voteCounts = {};
  
  // حساب الأصوات
  Object.values(room.votes).forEach(votedName => {
    voteCounts[votedName] = (voteCounts[votedName] || 0) + 1;
  });

  // تحديد أكتر واحد خد أصوات
  let maxVotes = 0;
  let votedOutPlayer = "";
  for (const name in voteCounts) {
    if (voteCounts[name] > maxVotes) {
      maxVotes = voteCounts[name];
      votedOutPlayer = name;
    }
  }

  const isSpyCaught = votedOutPlayer === room.spyName;
  broadcastToRoom(roomId, { 
    type: "gameResults", 
    winner: isSpyCaught ? "اللاعبين" : "الجاسوس",
    votedOutPlayer,
    spyName: room.spyName,
    isSpyCaught
  });
}

console.log("Server running on ws://localhost:5000");