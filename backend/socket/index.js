const socketAuth = require('../middleware/socketAuth');
const registerBoardHandlers = require('./handlers/board');
const registerDrawHandlers = require('./handlers/draw');
const registerCursorHandlers = require('./handlers/cursor');
const registerChatHandlers = require('./handlers/chat');
const registerTypingHandlers = require('./handlers/typing');

module.exports = function registerSocket(io) {
  const context = {
    boardUsers: new Map(),
    typingUsers: new Map(),
  };

  io.use(socketAuth);

  io.on('connection', (socket) => {
    registerBoardHandlers(socket, io, context);
    registerDrawHandlers(socket, io, context);
    registerCursorHandlers(socket, io, context);
    registerChatHandlers(socket, io, context);
    registerTypingHandlers(socket, io, context);
  });
};