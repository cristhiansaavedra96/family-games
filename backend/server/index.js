// Servidor Node.js + Socket.IO - Sala única, sorteo auto 1s/0.5s, voz manejada en frontend
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const { shuffleBag, generateCard, checkFigures } = require('./bingo');

dotenv.config();

const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();
app.use(cors({ origin: ORIGIN }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: ORIGIN } });

// Soporte de múltiples salas
const rooms = new Map(); // roomId -> state
let roomCounter = 1;

function createRoom() {
  const id = String(roomCounter++);
  const room = {
    id,
    name: `Sala ${id}`,
    started: false,
    paused: true,
  speed: 1, // multiplicador x0.5..x2
    cardsPerPlayer: 1,
    players: new Map(), // socketId -> { name, avatarUrl, cards: number[][] }
    hostId: null,
    bag: [],
    drawn: [],
    timer: null,
  announceTimeout: null,
    figuresClaimed: { corners: null, row: null, column: null, diagonal: null, border: null, full: null },
  };
  rooms.set(id, room);
  return room;
}

function getRoomsList() {
  return Array.from(rooms.values()).map(r => ({
    id: r.id,
    name: r.name,
    players: Array.from(r.players.entries()).map(([sid, p]) => ({ id: sid, name: p.name, avatarUrl: p.avatarUrl })),
    started: r.started,
    hostId: r.hostId,
  }));
}

function broadcastRoomsList() {
  io.emit('rooms', getRoomsList());
}

function broadcastRoomState(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const publicPlayers = Array.from(room.players.entries()).map(([sid, p]) => ({
    id: sid,
    name: p.name,
    avatarUrl: p.avatarUrl,
    cards: p.cards,
  }));
  io.to(roomId).emit('state', {
    roomId,
    name: room.name,
    started: room.started,
    paused: room.paused,
    speed: room.speed,
    cardsPerPlayer: room.cardsPerPlayer,
    hostId: room.hostId,
    players: publicPlayers,
    drawn: room.drawn,
    lastBall: room.drawn[room.drawn.length - 1] || null,
    figuresClaimed: room.figuresClaimed,
  });
}

function stopTimer(room) { if (room.timer) { clearInterval(room.timer); room.timer = null; } }
function startTimerIfNeeded(room) {
  if (!room.started || room.paused || room.timer) return;
  const baseMs = 6000;
  const factor = Number(room.speed) || 1;
  const intervalMs = Math.max(500, Math.round(baseMs / factor));
  room.timer = setInterval(() => drawNextBall(room), intervalMs);
}

function drawNextBall(room) {
  if (!room.started || room.paused) return;
  const n = room.bag.pop();
  if (n == null) return;
  room.drawn.push(n);
  io.to(room.id).emit('ball', n);
  broadcastRoomState(room.id);
}

function startGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.started = true;
  room.paused = false;
  // reiniciar velocidad por si quedó algo previo
  room.speed = room.speed || 1;
  room.bag = shuffleBag();
  room.drawn = [];
  room.figuresClaimed = { corners: null, row: null, column: null, diagonal: null, border: null, full: null };
  for (const p of room.players.values()) {
    p.cards = Array.from({ length: room.cardsPerPlayer }, () => generateCard());
  }
  broadcastRoomState(roomId);
  stopTimer(room);
  startTimerIfNeeded(room);
}

function validateAndFlags(roomId, socketId, cardIndex, markedFromClient) {
  const room = rooms.get(roomId);
  if (!room) return { ok: false, reason: 'room_not_found' };
  const player = room.players.get(socketId);
  if (!player) return { ok: false, reason: 'player_not_found' };
  const card = player.cards?.[cardIndex];
  if (!card) return { ok: false, reason: 'card_not_found' };
  // Validar matriz marcada enviada: sólo permite marcar números ya cantados o centro libre
  let marked = markedFromClient;
  if (!Array.isArray(marked) || marked.length !== 5 || marked.some(row => !Array.isArray(row) || row.length !== 5)) {
    return { ok: false, reason: 'invalid_marked' };
  }
  const drawnSet = new Set(room.drawn);
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const isCenter = r === 2 && c === 2;
      if (isCenter) {
        // centro siempre puede estar marcado
        if (!marked[r][c]) marked[r][c] = true;
        continue;
      }
      if (marked[r][c]) {
        const value = card[r][c];
        if (!drawnSet.has(value)) {
          return { ok: false, reason: 'marked_not_drawn' };
        }
      }
    }
  }
  const flags = checkFigures(marked);
  return { ok: true, flags };
}

function checkClaim(roomId, socketId, figure, cardIndex, markedFromClient) {
  const room = rooms.get(roomId);
  if (!room) return { ok: false, reason: 'room_not_found' };
  if (room.figuresClaimed[figure]) return { ok: false, reason: 'figure_taken' };
  const valid = validateAndFlags(roomId, socketId, cardIndex, markedFromClient);
  if (!valid.ok) return valid;
  const { flags } = valid;
  if (!flags[figure]) return { ok: false, reason: 'invalid' };
  room.figuresClaimed[figure] = socketId;
  broadcastRoomState(roomId);
  if (figure === 'full') {
    stopTimer(room);
    io.to(roomId).emit('gameOver', { roomId, winner: socketId, figuresClaimed: room.figuresClaimed });
  }
  return { ok: true };
}

function autoClaim(roomId, socketId, cardIndex, markedFromClient) {
  const room = rooms.get(roomId);
  if (!room) return { ok: false, reason: 'room_not_found' };
  const valid = validateAndFlags(roomId, socketId, cardIndex, markedFromClient);
  if (!valid.ok) return valid;
  const { flags } = valid;
  const newly = Object.keys(room.figuresClaimed)
    .filter(k => !room.figuresClaimed[k])
    .filter(k => flags[k]);
  if (newly.length === 0) return { ok: false, reason: 'no_new_figures' };
  for (const f of newly) room.figuresClaimed[f] = socketId;
  const player = room.players.get(socketId) || {};
  // Pausar sorteo mientras dura el anuncio
  stopTimer(room);
  room.paused = true;
  if (room.announceTimeout) { clearTimeout(room.announceTimeout); room.announceTimeout = null; }
  const ANNOUNCE_MS = 3500;
  io.to(roomId).emit('announcement', { roomId, playerId: socketId, playerName: player.name, playerAvatar: player.avatarUrl, figures: newly, cardIndex });
  room.announceTimeout = setTimeout(() => {
    room.paused = false;
    startTimerIfNeeded(room);
    broadcastRoomState(roomId);
    room.announceTimeout = null;
  }, ANNOUNCE_MS);
  broadcastRoomState(roomId);
  if (newly.includes('full')) {
    stopTimer(room);
    io.to(roomId).emit('gameOver', { roomId, winner: socketId, figuresClaimed: room.figuresClaimed });
  }
  return { ok: true, figures: newly };
}

io.on('connection', (socket) => {
  // Listado inicial de salas
  socket.emit('rooms', getRoomsList());

  socket.on('listRooms', () => {
    socket.emit('rooms', getRoomsList());
  });

  socket.on('createRoom', ({ player, cardsPerPlayer }) => {
    const room = createRoom();
    const { name, avatarUrl } = player || {};
    room.players.set(socket.id, { name, avatarUrl, cards: [] });
    room.hostId = socket.id;
    if (cardsPerPlayer) room.cardsPerPlayer = Math.max(1, Math.min(4, Number(cardsPerPlayer) || 1));
    socket.join(room.id);
    socket.data.roomId = room.id;
    socket.emit('joined', { id: socket.id, hostId: room.hostId, roomId: room.id });
    broadcastRoomState(room.id);
    broadcastRoomsList();
  });

  socket.on('joinRoom', ({ roomId, player }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const { name, avatarUrl } = player || {};
    room.players.set(socket.id, { name, avatarUrl, cards: [] });
    if (!room.hostId) room.hostId = socket.id;
    socket.join(room.id);
    socket.data.roomId = room.id;
    socket.emit('joined', { id: socket.id, hostId: room.hostId, roomId: room.id });
    broadcastRoomState(room.id);
    broadcastRoomsList();
  });

  socket.on('leaveRoom', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    room.players.delete(socket.id);
    socket.leave(roomId);
    socket.data.roomId = null;
    if (socket.id === room.hostId) {
      const next = room.players.keys().next();
      room.hostId = next.done ? null : next.value;
    }
    broadcastRoomState(roomId);
    if (room.players.size === 0) {
      stopTimer(room);
      rooms.delete(roomId);
    }
    broadcastRoomsList();
  });

  socket.on('configure', ({ roomId, cardsPerPlayer }) => {
    const room = rooms.get(roomId || socket.data.roomId);
    if (!room || socket.id !== room.hostId || room.started) return;
    room.cardsPerPlayer = Math.max(1, Math.min(4, Number(cardsPerPlayer) || 1));
    broadcastRoomState(room.id);
    broadcastRoomsList();
  });

  socket.on('setSpeed', ({ roomId, speed }) => {
    const room = rooms.get(roomId || socket.data.roomId);
    if (!room || socket.id !== room.hostId) return;
    const allowed = [0.5, 1, 1.5, 2];
    const s = Number(speed);
    if (!allowed.includes(s)) return;
    room.speed = s;
    stopTimer(room);
    startTimerIfNeeded(room);
    broadcastRoomState(room.id);
  });

  socket.on('startGame', ({ roomId }) => {
    const room = rooms.get(roomId || socket.data.roomId);
    if (!room || socket.id !== room.hostId) return;
    startGame(room.id);
  });

  // Se mantienen pero no se muestran en UI
  socket.on('pauseDraw', ({ roomId }) => {
    const room = rooms.get(roomId || socket.data.roomId);
    if (!room || socket.id !== room.hostId) return;
    room.paused = true; stopTimer(room); broadcastRoomState(room.id);
  });
  socket.on('resumeDraw', ({ roomId }) => {
    const room = rooms.get(roomId || socket.data.roomId);
    if (!room || socket.id !== room.hostId) return;
    room.paused = false; stopTimer(room); startTimerIfNeeded(room); broadcastRoomState(room.id);
  });
  socket.on('nextBall', ({ roomId }) => {
    const room = rooms.get(roomId || socket.data.roomId);
    if (!room || socket.id !== room.hostId) return;
    room.paused = true; stopTimer(room);
    const n = room.bag.pop(); if (n == null) return;
    room.drawn.push(n); io.to(room.id).emit('ball', n); broadcastRoomState(room.id);
  });

  socket.on('claim', ({ roomId, figure, cardIndex, marked }) => {
    const rid = roomId || socket.data.roomId;
    const res = figure
      ? checkClaim(rid, socket.id, figure, cardIndex, marked)
      : autoClaim(rid, socket.id, cardIndex, marked);
    socket.emit('claimResult', res);
  });

  socket.on('getState', ({ roomId }) => {
    const room = rooms.get(roomId || socket.data.roomId);
    if (!room) return;
    const publicPlayers = Array.from(room.players.entries()).map(([sid, p]) => ({ id: sid, name: p.name, avatarUrl: p.avatarUrl, cards: p.cards }));
    socket.emit('state', {
      roomId: room.id,
      name: room.name,
      started: room.started,
      paused: room.paused,
      cardsPerPlayer: room.cardsPerPlayer,
      hostId: room.hostId,
      players: publicPlayers,
      drawn: room.drawn,
      lastBall: room.drawn[room.drawn.length - 1] || null,
      figuresClaimed: room.figuresClaimed,
    });
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    room.players.delete(socket.id);
    if (socket.id === room.hostId) {
      const next = room.players.keys().next();
      room.hostId = next.done ? null : next.value;
    }
    broadcastRoomState(roomId);
    if (room.players.size === 0) {
      stopTimer(room);
      rooms.delete(roomId);
    }
    broadcastRoomsList();
  });
});

app.get('/', (_req, res) => res.send('Bingo backend OK'));

const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => console.log(`Backend listening on ${HOST}:${PORT}`));
