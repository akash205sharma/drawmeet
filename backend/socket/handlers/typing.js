const { addTypingUser, removeTypingUser, serializeTypingUsers, emitTyping } = require('./presence');

module.exports = function registerTypingHandlers(socket, io, context) {
  socket.on('typing', (data = {}) => {
    const boardId = socket.boardId;

    if (!boardId) {
      return;
    }

    const payload = data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'payload')
      ? data.payload
      : data;

    const typing = Boolean(
      typeof payload === 'object'
        ? (payload.typing ?? payload.isTyping)
        : payload,
    );

    if (typing) {
      addTypingUser(context, boardId, socket.user.id);
    } else {
      removeTypingUser(context, boardId, socket.user.id);
    }

    io.to(boardId).emit('typing', {
      boardId,
      users: serializeTypingUsers(context, boardId),
    });
  });
};