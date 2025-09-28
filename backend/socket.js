const onlineUsers = new Set();
const typingUsers = new Set();

module.exports = (io) => {
  io.on('connection', (socket) => {
    let currentUser = null;

    socket.on('join', ({ user }) => {
      currentUser = user;
      onlineUsers.add(user);
      io.emit('presence', Array.from(onlineUsers));
    });

    socket.on('chat', (data) => {
      io.emit('chat', data); // everyone including sender
    });

    socket.on('typing', ({ user, typing }) => {
      if (typing) {
        typingUsers.add(user);
      } else {
        typingUsers.delete(user);
      }
      io.emit('typing', Array.from(typingUsers));
    });

    socket.on('draw', (data) => {
      socket.broadcast.emit('draw', data);
    });

    socket.on('shape', (data) => {
      socket.broadcast.emit('shape', data);
    });

    socket.on('text', (data) => {
      socket.broadcast.emit('text', data);
    });

    socket.on('note', (data) => {
      socket.broadcast.emit('note', data);
    });

    socket.on('cursor', (data) => {
      io.emit('cursor', data);
    });

    socket.on('undo', (data) => {
      socket.broadcast.emit('undo', data);
    });

    socket.on('redo', (data) => {
      socket.broadcast.emit('redo', data);
    });

    // Board state persistence (stub)
    socket.on('get-board', (boardId) => {
      // TODO: Load board state from DB and emit to socket
      // socket.emit('board-state', { lines: [], rects: [], texts: [], stickies: [] });
    });
    socket.on('replay', (boardId) => {
      // TODO: Load actions from DB and emit to socket as a timeline
      // socket.emit('replay-actions', []);
    });

    socket.on('disconnect', () => {
      if (currentUser) {
        onlineUsers.delete(currentUser);
        typingUsers.delete(currentUser);
        io.emit('presence', Array.from(onlineUsers));
        io.emit('typing', Array.from(typingUsers));
      }
      console.log('User disconnected:', socket.id);
    });
  });
};
