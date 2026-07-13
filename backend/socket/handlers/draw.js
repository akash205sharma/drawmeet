const ActionService = require('../../services/ActionService');

const SUPPORTED_EVENTS = new Set(['draw', 'shape', 'arrow', 'text', 'sticky', 'note', 'erase', 'undo', 'redo']);

function getPayload(data) {
  if (data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'payload')) {
    return data.payload;
  }

  return data;
}

function normalizeEventName(eventName) {
  return eventName === 'note' ? 'sticky' : eventName;
}

module.exports = function registerDrawHandlers(socket, io) {
  SUPPORTED_EVENTS.forEach((eventName) => {
    socket.on(eventName, async (data = {}) => {
      const boardId = socket.boardId;

      if (!boardId) {
        socket.emit('socket-error', {
          event: eventName,
          message: 'Join a board before sending drawing events',
        });
        return;
      }

      const actionType = normalizeEventName(eventName);
      const payload = getPayload(data);

      try {
        const action = await ActionService.createBoardAction({
          board: boardId,
          user: socket.user.id,
          type: actionType,
          payload,
        });

        io.to(boardId).emit(actionType, {
          boardId,
          type: actionType,
          payload,
          createdAt: action.createdAt,
          user: socket.user,
        });
      } catch (err) {
        socket.emit('socket-error', {
          event: eventName,
          message: err.message || 'Unable to save board action',
        });
      }
    });
  });
};