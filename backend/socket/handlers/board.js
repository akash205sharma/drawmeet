const BoardService = require('../../services/BoardService');
const ActionService = require('../../services/ActionService');
const {
  addBoardUser,
  clearBoardStateForUser,
  emitPresence,
  emitTyping,
} = require('./presence');

function leaveCurrentBoard(socket, io, context) {
  if (!socket.boardId) {
    return;
  }

  const boardId = socket.boardId;
  socket.leave(boardId);
  clearBoardStateForUser(context, boardId, socket.user.id);
  emitPresence(io, context, boardId);
  emitTyping(io, context, boardId);
  socket.boardId = null;
}

module.exports = function registerBoardHandlers(socket, io, context) {
  socket.on('join-board', async (data = {}, callback) => {
    try {
      const boardId = data.boardId;

      if (!boardId) {
        throw new Error('boardId is required');
      }

      const board = await BoardService.getBoardForMember(boardId, socket.user.id);

      if (socket.boardId && socket.boardId !== boardId) {
        leaveCurrentBoard(socket, io, context);
      }

      socket.join(boardId);
      socket.boardId = boardId;
      addBoardUser(context, boardId, socket.user);
      emitPresence(io, context, boardId);

      const payload = {
        ok: true,
        board: BoardService.toClientBoard(board),
      };

      if (typeof callback === 'function') {
        callback(payload);
        return;
      }

      socket.emit('board-joined', payload);
    } catch (err) {
      const payload = {
        ok: false,
        event: 'join-board',
        message: err.message || 'Unable to join board',
      };

      if (typeof callback === 'function') {
        callback(payload);
        return;
      }

      socket.emit('socket-error', payload);
    }
  });

  socket.on('get-board', async (data = {}, callback) => {
    try {
      const boardId = data.boardId || socket.boardId;

      if (!boardId) {
        throw new Error('boardId is required');
      }

      await BoardService.getBoardForMember(boardId, socket.user.id);
      const actions = await ActionService.getReplayActions(boardId);

      if (typeof callback === 'function') {
        callback({
          ok: true,
          actions,
        });
        return;
      }

      socket.emit('board-state', actions);
    } catch (err) {
      const payload = {
        ok: false,
        event: 'get-board',
        message: err.message || 'Unable to load board',
      };

      if (typeof callback === 'function') {
        callback(payload);
        return;
      }

      socket.emit('socket-error', payload);
    }
  });

  socket.on('disconnect', () => {
    if (!socket.boardId) {
      return;
    }

    const boardId = socket.boardId;
    clearBoardStateForUser(context, boardId, socket.user.id);
    emitPresence(io, context, boardId);
    emitTyping(io, context, boardId);
    socket.boardId = null;
  });
};