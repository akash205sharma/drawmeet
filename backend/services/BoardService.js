const Board = require('../models/Board');

function toUser(user) {
  if (!user) {
    return null;
  }

  if (typeof user.toObject === 'function') {
    const plain = user.toObject();
    return {
      id: plain._id.toString(),
      username: plain.username,
      email: plain.email,
    };
  }

  return {
    id: user._id?.toString?.() || user.id?.toString?.() || String(user.id || user._id),
    username: user.username,
    email: user.email,
  };
}

function isBoardMember(board, userId) {
  const normalizedUserId = userId.toString();
  const ownerId = board.owner?._id?.toString?.() || board.owner?.toString?.();

  if (ownerId === normalizedUserId) {
    return true;
  }

  return board.members.some((member) => {
    const memberId = member?._id?.toString?.() || member?.toString?.();
    return memberId === normalizedUserId;
  });
}

async function getBoardForMember(boardId, userId) {
  const board = await Board.findById(boardId)
    .populate('owner', 'username email')
    .populate('members', 'username email');

  if (!board) {
    const error = new Error('Board not found');
    error.statusCode = 404;
    throw error;
  }

  if (!isBoardMember(board, userId)) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  return board;
}

function toClientBoard(board) {
  return {
    id: board._id.toString(),
    title: board.title,
    owner: toUser(board.owner),
    members: board.members.map(toUser),
    notes: board.notes || [],
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}

module.exports = {
  getBoardForMember,
  toClientBoard,
  isBoardMember,
};