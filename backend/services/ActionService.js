const Action = require('../models/Action');
const Message = require('../models/Message');

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

async function createBoardAction({ board, user, type, payload }) {
  return Action.create({ board, user, type, payload });
}

async function getReplayActions(boardId) {
  const actions = await Action.find({ board: boardId })
    .sort({ createdAt: 1 })
    .populate('user', 'username email');

  return actions.map((action) => ({
    type: action.type,
    payload: action.payload,
    createdAt: action.createdAt,
    user: toUser(action.user),
  }));
}

async function createBoardMessage({ board, user, text }) {
  return Message.create({ board, user, text });
}

module.exports = {
  createBoardAction,
  getReplayActions,
  createBoardMessage,
};