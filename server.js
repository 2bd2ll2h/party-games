const WebSocket = require("ws");
const http = require("http");










// 1. تحديد البورت
const PORT = process.env.PORT || 5000; 

// 2. إنشاء سيرفر HTTP للـ Health Check
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Spy Game Server is Running...');
});

// 3. ربط الـ WebSocket بالسيرفر
const wss = new WebSocket.Server({ server });

// بنك الكلمات والمتغيرات العامة
const wordsBank = ["بيتزا", "طيارة", "موبايل", "كورة", "قهوة", "مستشفى"];
let rooms = {};
let disconnectTimeouts = {}; 

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
                        players: [{ ...data.player, isReady: true, team: data.gameType === "codenames" ? "red" : null }],
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
                    if (!targetRoom) {
                        ws.send(JSON.stringify({ type: "error", message: "كود الغرفة غير صحيح!" }));
                        break;
                    }
                    const incomingName = data.player.name.trim();

                    if (targetRoom.gameStarted) {
                        const isReturningPlayer = targetRoom.players.some(p => p.name === incomingName);
                        if (!isReturningPlayer) {
                            ws.send(JSON.stringify({ type: "error", message: "المهمة بدأت بالفعل! الغرفة مغلقة حالياً." }));
                            break;
                        }
                    }

                    const existingPlayer = targetRoom.players.find(p => p.name === incomingName);
                    if (existingPlayer) {
                        if (disconnectTimeouts[data.roomId]) {
                            clearTimeout(disconnectTimeouts[data.roomId]);
                            delete disconnectTimeouts[data.roomId];
                            console.log(`✅ تم إلغاء تايمر الهروب، اللاعب ${incomingName} عاد.`);
                        }
                        ws.roomId = data.roomId;
                        ws.playerName = incomingName;
                        if (targetRoom.gameStarted) {
                            const isSpy = incomingName === targetRoom.spyName;
                            ws.send(JSON.stringify({
                                type: "gameStarted",
                                word: isSpy ? " you are the spy 🕵️" : targetRoom.word,
                                isSpy: isSpy,
                                room: targetRoom
                            }));
                        } else {
                            ws.send(JSON.stringify({ type: "roomUpdate", room: targetRoom }));
                        }
                        return;
                    }

                    if (targetRoom.players.length >= (targetRoom.config?.maxPlayers || 10)) {
                        ws.send(JSON.stringify({ type: "error", message: "الغرفة ممتلئة!" }));
                        break;
                    }
                    ws.roomId = data.roomId;
                    ws.playerName = incomingName;
                    targetRoom.players.push({ ...data.player, isReady: false });
                    broadcastToRoom(data.roomId, { type: "roomUpdate", room: targetRoom });
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

                case "assignBlueLeader":
                    const roomAssign = rooms[data.roomId];
                    if (roomAssign && roomAssign.owner === data.adminName) {
                        const target = roomAssign.players.find(p => p.name === data.targetName);
                        if (target) {
                            roomAssign.blueOwner = target.name;
                            target.team = "blue";
                            target.isReady = true;
                            broadcastToRoom(data.roomId, { type: "roomUpdate", room: roomAssign });
                        }
                    }
                    break;

                case "joinTeam":
                    const roomJoinT = rooms[data.roomId];
                    if (roomJoinT && roomJoinT.gameType === "codenames") {
                        const p = roomJoinT.players.find(player => player.name === data.playerName);
                        if (p) {
                            p.team = data.team;
                            broadcastToRoom(data.roomId, { type: "roomUpdate", room: roomJoinT });
                        }
                    }
                    break;

                case "startGame":
                    const roomToStart = rooms[data.roomId];
                    if (roomToStart && roomToStart.owner === data.player.name) {
                        const selectedWord = wordsBank[Math.floor(Math.random() * wordsBank.length)];
                        const spyIndex = Math.floor(Math.random() * roomToStart.players.length);
                        const spyName = roomToStart.players[spyIndex].name;
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
                                    word: isSpy ? " you are the spy 🕵️" : selectedWord,
                                    isSpy: isSpy,
                                    room: roomToStart,
                                    turnOrder: turnOrder 
                                }));
                            }
                        });
                    }
                    break;

                case "sendMessage":
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
                    const roomK = rooms[data.roomId];
                    if (!roomK) break;
                    const isMainOwner = roomK.owner === data.adminName;
                    const isBlueOwner = roomK.blueOwner === data.adminName;
                    const targetP = roomK.players.find(p => p.name === data.targetName);

                    let canKick = false;
                    if (roomK.gameType === "spy") {
                        canKick = isMainOwner;
                    } else {
                        canKick = isMainOwner || (isBlueOwner && targetP && targetP.team === "blue");
                    }

                    if (canKick) {
                        roomK.players = roomK.players.filter(p => p.name !== data.targetName);
                        if (roomK.blueOwner === data.targetName) roomK.blueOwner = null;
                        broadcastToRoom(data.roomId, { type: "roomUpdate", room: roomK });
                        wss.clients.forEach(c => {
                            if (c.roomId === data.roomId && c.playerName === data.targetName) {
                                c.send(JSON.stringify({ type: "kicked" }));
                                c.roomId = null;
                            }
                        });
                    }
                    break;

                case "nextTurn":
                    const roomN = rooms[data.roomId];
                    if (roomN && roomN.gameStarted) {
                        roomN.currentTurnIndex++;
                        const playersCount = roomN.turnOrder.length;
                        const maxRounds = parseInt(roomN.config.rounds) || 1;
                        const totalTurnsNeeded = playersCount * maxRounds;

                        if (roomN.currentTurnIndex >= totalTurnsNeeded) {
                            roomN.isVoting = true;
                            roomN.votes = {};
                            broadcastToRoom(data.roomId, { type: "votingStarted", room: roomN });
                        } else {
                            const nextPlayerIndex = roomN.currentTurnIndex % playersCount;
                            broadcastToRoom(data.roomId, {
                                type: "turnUpdate",
                                activePlayer: roomN.turnOrder[nextPlayerIndex],
                                currentIndex: nextPlayerIndex
                            });
                        }
                    }
                    break;

                case "startVoting":
                    const roomV = rooms[data.roomId];
                    if (roomV && roomV.owner === data.playerName) {
                        roomV.isVoting = true;
                        roomV.votes = {}; 
                        broadcastToRoom(data.roomId, { type: "votingStarted", room: roomV });
                    }
                    break;

                case "submitVote":
                    const roomVote = rooms[data.roomId];
                    if (roomVote && roomVote.isVoting) {
                        roomVote.votes[data.voterName] = data.votedForName;
                        broadcastToRoom(data.roomId, { type: "voteCountUpdate", count: Object.keys(roomVote.votes).length });
                    }
                    break;

                case "revealResults":
                    const roomReveal = rooms[data.roomId];
                    if (roomReveal && roomReveal.owner === data.playerName) {
                        processResults(data.roomId);
                    }
                    break;
            }
        } catch (e) {
            console.log("Error logic:", e);
        }
    });

    ws.on("close", () => {
        if (ws.roomId && rooms[ws.roomId]) {
            const room = rooms[ws.roomId];
            const rId = ws.roomId;

            if (!room.gameStarted) {
                room.players = room.players.filter(p => p.name !== ws.playerName);
                if (room.players.length === 0) {
                    delete rooms[rId];
                } else {
                    if (room.owner === ws.playerName) room.owner = room.players[0].name;
                    broadcastToRoom(rId, { type: "roomUpdate", room: room });
                }
            } else {
                const isSpyLeaving = (ws.playerName === room.spyName);
                if (isSpyLeaving) {
                    console.log(`الجاسوس ${ws.playerName} فصل.. مهلة 20 ثانية للعودة.`);
                    disconnectTimeouts[rId] = setTimeout(() => {
                        if (rooms[rId] && rooms[rId].gameStarted) {
                            rooms[rId].gameStarted = false;
                            broadcastToRoom(rId, { 
                                type: "chatMessage", 
                                payload: { user: "SYSTEM", text: `الجاسوس ${ws.playerName} هرب! العودة للانتظار...` } 
                            });
                            broadcastToRoom(rId, { type: "roomUpdate", room: rooms[rId] });
                        }
                        delete disconnectTimeouts[rId];
                    }, 20000); 
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
    if (!room) return;
    const voteCounts = {};
    Object.values(room.votes).forEach(votedName => {
        voteCounts[votedName] = (voteCounts[votedName] || 0) + 1;
    });
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