module.exports = function registerCursorHandlers(socket, io) {
  socket.on('cursor', (data = {}) => {
    const boardId = socket.boardId;

    if (!boardId) {
      return;
    }

    const payload = data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'payload')
      ? data.payload
      : data;

    io.to(boardId).emit('cursor', {
      boardId,
      user: socket.user,
      payload,
    });
  });
};