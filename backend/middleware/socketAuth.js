const jwt = require('jsonwebtoken');

const User = require('../models/User');

module.exports = async function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token
      || socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return next(new Error('Unauthorized')); 
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id username email');

    if (!user) {
      return next(new Error('Unauthorized'));
    }

    socket.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
};