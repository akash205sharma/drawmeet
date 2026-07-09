const express = require("express");

const Board = require("../models/Board");
const Action = require("../models/Action");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// =======================================
// Create Board
// POST /board
// =======================================

router.post("/", authMiddleware, async (req, res) => {
    try {

        const { title } = req.body;

        const board = await Board.create({
            title: title || "Untitled Board",

            owner: req.user.id,

            members: [
                req.user.id,
            ],
        });

        res.status(201).json(board);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server error",
        });
    }
});


// =======================================
// Get All Boards of Logged-in User
// GET /board
// =======================================

router.get("/", authMiddleware, async (req, res) => {

    try {

        const boards = await Board.find({
            members: req.user.id,
        })
            .sort({
                updatedAt: -1,
            })
            .populate("owner", "username email");

        res.json(boards);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server error",
        });
    }

});


// =======================================
// Get Single Board
// GET /board/:id
// =======================================

router.get("/:id", authMiddleware, async (req, res) => {

    try {

        const board = await Board.findById(req.params.id)
            .populate("owner", "username email")
            .populate("members", "username email");

        if (!board) {
            return res.status(404).json({
                message: "Board not found",
            });
        }

        const hasAccess = board.members.some(
            (member) => member._id.toString() === req.user.id
        );

        if (!hasAccess) {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        res.json(board);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server error",
        });
    }

});


// =======================================
// Replay Board Actions
// GET /board/:id/replay
// =======================================

router.get("/:id/replay", authMiddleware, async (req, res) => {

    try {

        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({
                message: "Board not found",
            });
        }

        const hasAccess = board.members.some(
            (memberId) => memberId.toString() === req.user.id
        );

        if (!hasAccess) {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        const actions = await Action.find({
            board: req.params.id,
        }).sort({
            createdAt: 1,
        });

        res.json(actions);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server error",
        });
    }

});


// =======================================
// Rename Board
// PATCH /board/:id
// =======================================

router.patch("/:id", authMiddleware, async (req, res) => {

    try {

        const { title } = req.body;

        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({
                message: "Board not found",
            });
        }

        if (board.owner.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Only owner can rename the board",
            });
        }

        board.title = title;

        await board.save();

        res.json(board);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server error",
        });
    }

});


// =======================================
// Delete Board
// DELETE /board/:id
// =======================================

router.delete("/:id", authMiddleware, async (req, res) => {

    try {

        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({
                message: "Board not found",
            });
        }

        if (board.owner.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Only owner can delete the board",
            });
        }

        await Action.deleteMany({
            board: board._id,
        });

        await board.deleteOne();

        res.json({
            message: "Board deleted successfully",
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server error",
        });
    }

});

module.exports = router;