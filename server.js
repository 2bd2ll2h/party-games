const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 5000 });



// بنك الكلمات

const wordsBank = ["بيتزا", "طيارة", "موبايل", "كورة", "قهوة", "مستشفى"];

let rooms = {};



wss.on("connection", (ws) => {

  console.log("New client connected");



  ws.on("message", (message) => {

    const data = JSON.parse(message);



    switch (data.type) {

 // server.js

// server.js









// داخل switch (data.type) في server.js



// داخل switch (data.type) في server.js



case "createRoom":

  // فحص إذا كان الاسم مستخدم في أي غرفة (اختياري لكن يفضل منعه عالمياً أو لكل غرفة)

  // هنا سنكتفي بإنشاء الغرفة لأن الأونر هو أول واحد

  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

  rooms[roomId] = {

    id: roomId,

    owner: data.player.name,

    players: [{ ...data.player, isReady: true }],

    gameStarted: false,

    config: data.config

  };

  ws.roomId = roomId;

  ws.playerName = data.player.name;

  ws.send(JSON.stringify({ type: "roomCreated", room: rooms[roomId] }));

  break;



case "joinRoom":

  const targetRoom = rooms[data.roomId];

  if (targetRoom) {

    // الكود السحري لمنع تكرار الاسم

    const isNameTaken = targetRoom.players.some(

      p => p.name.trim().toLowerCase() === data.player.name.trim().toLowerCase()

    );



    if (isNameTaken) {

      ws.send(JSON.stringify({

        type: "error",

        message: "للأسف، هذا الاسم محجوز داخل هذه الغرفة. غير اسمك وجرب تاني!"

      }));

      return;

    }



    if (targetRoom.players.length >= targetRoom.config.maxPlayers) {

      ws.send(JSON.stringify({ type: "error", message: "الغرفة ممتلئة!" }));

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

      p.isReady = !p.isReady; // قلب الحالة

      // أهم سطر: ابعت التحديث لكل الناس اللي في الأوضة

      broadcastToRoom(data.roomId, { type: "roomUpdate", room: roomToToggle });

    }

  }

  break;



      case "startGame":

        const roomToStart = rooms[data.roomId];

        // التأكد إن كل اللاعبين مستعدين قبل البدء

        const allReady = roomToStart.players.every(p => p.isReady);

       

        if (roomToStart && roomToStart.owner === data.player.name && allReady) {

          const selectedWord = wordsBank[Math.floor(Math.random() * wordsBank.length)];

          const spyIndex = Math.floor(Math.random() * roomToStart.players.length);

          const spyName = roomToStart.players[spyIndex].name;

         

          roomToStart.gameStarted = true;

          roomToStart.word = selectedWord;

          roomToStart.spyName = spyName;



          wss.clients.forEach((client) => {

            if (client.roomId === data.roomId) {

              const isSpy = client.playerName === spyName;

              client.send(JSON.stringify({

                type: "gameStarted",

                word: isSpy ? "أنت الجاسوس 🕵️" : selectedWord,

                isSpy: isSpy,

                room: roomToStart

              }));

            }

          });

        }

        break;

    }

  });



  // --- منطق الخروج الذكي ---

  ws.on("close", () => {

    console.log(`Client ${ws.playerName} disconnected`);

   

    if (ws.roomId && rooms[ws.roomId]) {

      const room = rooms[ws.roomId];

     

      // مسح اللاعب من مصفوفة الغرفة

      room.players = room.players.filter(p => p.name !== ws.playerName);

     

      if (room.players.length === 0) {

        // لو مفيش حد، احذف الغرفة

        delete rooms[ws.roomId];

      } else {

        // لو الأونر هو اللي خرج، انقل الملكية للي بعده

        if (room.owner === ws.playerName) {

          room.owner = room.players[0].name;

          room.players[0].isReady = true; // الأونر الجديد جاهز تلقائياً

        }

        // بلغ الكل إن فيه حد خرج عشان صورته تختفي

        broadcastToRoom(ws.roomId, { type: "roomUpdate", room: room });

      }

    }

  });

});



// دالة للإرسال لكل اللي في الغرفة

function broadcastToRoom(roomId, message) {

  wss.clients.forEach((client) => {

    if (client.roomId === roomId && client.readyState === WebSocket.OPEN) {

      client.send(JSON.stringify(message));

    }

  });

}



console.log("Server running on ws://localhost:5000");