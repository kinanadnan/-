import { setupTouchControls } from './touchControls.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const socket = io();

const keys = new Set();
const players = new Map();
let myId = null;

const CAR_LENGTH = 40;
const CAR_WIDTH = 24;
const MAX_SPEED = 4.2;
const ACCELERATION = 0.12;
const FRICTION = 0.05;
const TURN_RATE = 0.045;

setupTouchControls(action => {
  switch (action) {
    case 'accelerate':
      keys.add('ArrowUp');
      break;
    case 'reverse':
      keys.add('ArrowDown');
      break;
    case 'left':
      keys.add('ArrowLeft');
      break;
    case 'right':
      keys.add('ArrowRight');
      break;
    case 'brake':
      keys.add('Space');
      break;
  }
}, action => {
  switch (action) {
    case 'accelerate':
      keys.delete('ArrowUp');
      break;
    case 'reverse':
      keys.delete('ArrowDown');
      break;
    case 'left':
      keys.delete('ArrowLeft');
      break;
    case 'right':
      keys.delete('ArrowRight');
      break;
    case 'brake':
      keys.delete('Space');
      break;
  }
});

socket.on('init', payload => {
  myId = payload.id;
  payload.players.forEach(player => players.set(player.id, player));
});

socket.on('playerJoined', player => {
  players.set(player.id, player);
});

socket.on('playerMoved', player => {
  players.set(player.id, player);
});

socket.on('playerLeft', id => {
  players.delete(id);
});

window.addEventListener('keydown', event => {
  keys.add(event.key);
});

window.addEventListener('keyup', event => {
  keys.delete(event.key);
});

function updateLocalPlayer() {
  if (!myId || !players.has(myId)) return;
  const player = players.get(myId);

  if (keys.has('ArrowUp')) {
    player.speed = Math.min(player.speed + ACCELERATION, MAX_SPEED);
  }
  if (keys.has('ArrowDown')) {
    player.speed = Math.max(player.speed - ACCELERATION, -MAX_SPEED / 2);
  }
  if (keys.has('Space')) {
    player.speed *= 0.85;
  }

  if (!keys.has('ArrowUp') && !keys.has('ArrowDown')) {
    if (player.speed > 0) {
      player.speed = Math.max(0, player.speed - FRICTION);
    } else if (player.speed < 0) {
      player.speed = Math.min(0, player.speed + FRICTION);
    }
  }

  if (keys.has('ArrowLeft')) {
    player.angle -= TURN_RATE * Math.sign(player.speed || 1);
  }
  if (keys.has('ArrowRight')) {
    player.angle += TURN_RATE * Math.sign(player.speed || 1);
  }

  player.x += Math.cos(player.angle) * player.speed;
  player.y += Math.sin(player.angle) * player.speed;

  player.x = Math.max(CAR_WIDTH, Math.min(canvas.width - CAR_WIDTH, player.x));
  player.y = Math.max(CAR_LENGTH / 2, Math.min(canvas.height - CAR_LENGTH / 2, player.y));

  socket.emit('stateUpdate', player);
  players.set(myId, player);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTrack();
  players.forEach(player => drawCar(player));
  requestAnimationFrame(render);
}

function drawTrack() {
  const laneWidth = 120;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  ctx.save();

  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 8;
  ctx.setLineDash([25, 25]);
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 300, 200, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 300 - laneWidth, 200 - laneWidth, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 300 + laneWidth, 200 + laneWidth, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawCar(player) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = player.color;
  ctx.fillRect(-CAR_LENGTH / 2, -CAR_WIDTH / 2, CAR_LENGTH, CAR_WIDTH);

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(CAR_LENGTH / 2 - 6, -CAR_WIDTH / 2 + 4, 6, CAR_WIDTH - 8);

  ctx.restore();
}

function gameLoop() {
  updateLocalPlayer();
}

setInterval(gameLoop, 1000 / 60);
requestAnimationFrame(render);
