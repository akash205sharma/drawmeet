function ensureBoardUsers(map, boardId) {
  if (!map.has(boardId)) {
    map.set(boardId, new Map());
  }

  return map.get(boardId);
}

function ensureTypingUsers(map, boardId) {
  if (!map.has(boardId)) {
    map.set(boardId, new Set());
  }

  return map.get(boardId);
}

function addBoardUser(context, boardId, user) {
  ensureBoardUsers(context.boardUsers, boardId).set(user.id, user);
}

function removeBoardUser(context, boardId, userId) {
  const users = context.boardUsers.get(boardId);

  if (!users) {
    return;
  }

  users.delete(userId);

  if (users.size === 0) {
    context.boardUsers.delete(boardId);
  }
}

function addTypingUser(context, boardId, userId) {
  ensureTypingUsers(context.typingUsers, boardId).add(userId);
}

function removeTypingUser(context, boardId, userId) {
  const users = context.typingUsers.get(boardId);

  if (!users) {
    return;
  }

  users.delete(userId);

  if (users.size === 0) {
    context.typingUsers.delete(boardId);
  }
}

function serializeBoardUsers(context, boardId) {
  const users = context.boardUsers.get(boardId);
  return users ? Array.from(users.values()) : [];
}

function serializeTypingUsers(context, boardId) {
  const typingUsers = context.typingUsers.get(boardId);
  const users = context.boardUsers.get(boardId);

  if (!typingUsers || !users) {
    return [];
  }

  return Array.from(typingUsers)
    .map((userId) => users.get(userId))
    .filter(Boolean);
}

function emitPresence(io, context, boardId) {
  io.to(boardId).emit('presence', {
    boardId,
    users: serializeBoardUsers(context, boardId),
  });
}

function emitTyping(io, context, boardId) {
  io.to(boardId).emit('typing', {
    boardId,
    users: serializeTypingUsers(context, boardId),
  });
}

function clearBoardStateForUser(context, boardId, userId) {
  removeBoardUser(context, boardId, userId);
  removeTypingUser(context, boardId, userId);
}

module.exports = {
  addBoardUser,
  removeBoardUser,
  addTypingUser,
  removeTypingUser,
  serializeBoardUsers,
  serializeTypingUsers,
  emitPresence,
  emitTyping,
  clearBoardStateForUser,
};