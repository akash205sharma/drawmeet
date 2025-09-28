const express = require('express');
const Board = require('../models/Board');
const Action = require('../models/Action');
const Message = require('../models/Message');

const router = express.Router();

// Create board
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    const board = await Board.create({ title });
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get board state
router.get('/:id', async (req, res) => {
  try {
    const board = await Board.findById(req.params.id).populate('users');
    if (!board) return res.status(404).json({ message: 'Board not found' });
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Replay board actions
router.get('/:id/replay', async (req, res) => {
  try {
    const actions = await Action.find({ board: req.params.id }).sort('createdAt');
    res.json(actions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
