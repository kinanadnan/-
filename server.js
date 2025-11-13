const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const players = new Map();

io.on('connection', socket => {
  const color = getRandomColor();
  const player = {
    id: socket.id,
    x: 400 + Math.random() * 100 - 50,
    y: 300 + Math.random() * 100 - 50,
    angle: 0,
    speed: 0,
    color
  };
  players.set(socket.id, player);

  socket.emit('init', {
    id: socket.id,
    players: Array.from(players.values())
  });

  socket.broadcast.emit('playerJoined', player);

  socket.on('stateUpdate', state => {
    if (!players.has(socket.id)) return;
    const current = players.get(socket.id);
    current.x = state.x;
    current.y = state.y;
    current.angle = state.angle;
    current.speed = state.speed;
    players.set(socket.id, current);
    socket.broadcast.emit('playerMoved', current);
  });

  socket.on('disconnect', () => {
    players.delete(socket.id);
    socket.broadcast.emit('playerLeft', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

function getRandomColor() {
  const colors = ['#ff4b5c', '#56cfe1', '#3bceac', '#ffd23f', '#d45d79', '#6a4c93'];
  return colors[Math.floor(Math.random() * colors.length)];
}
