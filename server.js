const WebSocket = require("ws");
const http = require("http");

// 1. تحديد البورت (Back4app بيستخدم بورت متغير، وإنت في الـ Dockerfile محدد 5000)
// السطر ده بيخلي السيرفر يشتغل على أي بورت تطلبه المنصة
const PORT = process.env.PORT || 5000; 

// 2. إنشاء سيرفر HTTP بسيط جداً (عشان الـ Health Check ينجح)
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Spy Game Server is Running...');
});

// 3. ربط الـ WebSocket بنفس السيرفر
const wss = new WebSocket.Server({ server });













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
            gameType: data.gameType,
            owner: data.player.name,
            blueOwner: null,
            players: [{ ...data.player, isReady: true  ,  team: data.gameType === "codenames" ? "red" : null }],
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
          // تعيين القائد الأزرق
case "assignBlueLeader":
    const rC = rooms[data.roomId];
    if (rC && rC.owner === data.adminName) {
        const target = rC.players.find(p => p.name === data.targetName);
        if (target) {
            rC.blueOwner = target.name;
            target.team = "blue";
            target.isReady = true;
            broadcastToRoom(data.roomId, { type: "roomUpdate", room: rC });
        }
    }
    break;

// انضمام لاعب لفريق
case "joinTeam":
    const roomT = rooms[data.roomId];
    if (roomT && roomT.gameType === "codenames") {
        const p = roomT.players.find(player => player.name === data.playerName);
        if (p) {
            p.team = data.team; // 'red' or 'blue'
            broadcastToRoom(data.roomId, { type: "roomUpdate", room: roomT });
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
                  
                  word: isSpy ? " you  are the spy 🕵️" : selectedWord,
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












          case "kickPlayer":
  /*const roomToKick = rooms[data.roomId];
  if (roomToKick && roomToKick.owner === data.adminName) {
    roomToKick.players = roomToKick.players.filter(p => p.name !== data.targetName);
    broadcastToRoom(data.roomId, { type: "roomUpdate", room: roomToKick });
    // إرسال تنبيه للشخص المطرود
    wss.clients.forEach(client => {
      if (client.roomId === data.roomId && client.playerName === data.targetName) {
        client.send(JSON.stringify({ type: "kicked" }));
        client.roomId = null; // فصله عن الغرفة*/

const roomK = rooms[data.roomId];
    if (!roomK) break;

    const isMainOwner = roomK.owner === data.adminName;
    const isBlueOwner = roomK.blueOwner === data.adminName;
    const targetP = roomK.players.find(p => p.name === data.targetName);

    let canKick = false;
    if (roomK.gameType === "spy") {
        canKick = isMainOwner; // في الجاسوس، الأونر فقط يطرد
    } else {
        // في كود جيم: الأونر الأساسي يطرد أي حد، الأونر الأزرق يطرد فريقه فقط
        canKick = isMainOwner || (isBlueOwner && targetP.team === "blue");
    }

    if (canKick) {
        roomK.players = roomK.players.filter(p => p.name !== data.targetName);
        if (roomK.blueOwner === data.targetName) roomK.blueOwner = null;
        broadcastToRoom(data.roomId, { type: "roomUpdate", room: roomK });
        // إرسال تنبيه للمطرود
        wss.clients.forEach(c => {
            if (c.roomId === data.roomId && c.playerName === data.targetName) {
                c.send(JSON.stringify({ type: "kicked" }));
                c.roomId = null;



      }
    });
  }
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
    
    // إذا كانت اللعبة شغال وفيه حد خرج
    if (room.gameStarted) {
      const isSpyLeaving = (ws.playerName === room.spyName);

      if (isSpyLeaving) {
        // لو الجاسوس خرج.. نرجع الكل للوبي فوراً
        room.gameStarted = false;
        broadcastToRoom(ws.roomId, { 
          type: "chatMessage", 
          payload: { user: "SYSTEM", text: `الجاسوس ${ws.playerName} هرب! العودة للانتظار...` } 
        });
        broadcastToRoom(ws.roomId, { type: "roomUpdate", room: room });
      } else {
        // لو لاعب عادي خرج.. نحذفه من الترتيب ونكمل
        room.turnOrder = room.turnOrder.filter(name => name !== ws.playerName);
        room.players = room.players.filter(p => p.name !== ws.playerName);
        broadcastToRoom(ws.roomId, { type: "gameInfoUpdate", room: room });
      }
    } else {
      // المنطق القديم للوبي
      room.players = room.players.filter(p => p.name !== ws.playerName);
      if (room.players.length === 0) {
        delete rooms[ws.roomId];
      } else {
        if (room.owner === ws.playerName) {
          room.owner = room.players[0].name;
        }
        broadcastToRoom(ws.roomId, { type: "roomUpdate", room: room });
      }
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










server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});