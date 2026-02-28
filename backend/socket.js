// backend/socket.js
const { Server } = require('socket.io');
let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);
  });

  return io;
}

function getSocket() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

module.exports = { initSocket, getSocket };