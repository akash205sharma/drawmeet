const ActionService = require('../../services/ActionService');

module.exports = function registerChatHandlers(socket, io) {
  socket.on('chat', async (data = {}) => {
    const boardId = socket.boardId;

    if (!boardId) {
      socket.emit('socket-error', {
        event: 'chat',
        message: 'Join a board before sending chat messages',
      });
      return;
    }

    const payload = data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'payload')
      ? data.payload
      : data;

    const text = typeof payload === 'string'
      ? payload
      : payload?.text;

    if (!text || !text.trim()) {
      return;
    }

    try {
      const message = await ActionService.createBoardMessage({
        board: boardId,
        user: socket.user.id,
        text: text.trim(),
      });

      io.to(boardId).emit('chat', {
        boardId,
        text: message.text,
        createdAt: message.createdAt,
        user: socket.user,
      });
    } catch (err) {
      socket.emit('socket-error', {
        event: 'chat',
        message: err.message || 'Unable to save chat message',
      });
    }
  });
};