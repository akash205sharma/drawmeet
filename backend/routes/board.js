const express = require("express");

const Board = require("../models/Board");
const authMiddleware = require("../middleware/authMiddleware");
const BoardService = require("../services/BoardService");
const { getReplayActions } = require("../services/ActionService");
const JoinRequestService = require("../services/JoinRequestService");
const JoinRequest = require("../models/JoinRequest");
const router = express.Router();
const Action=require("../models/Action");


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
        .populate("owner","username email")
        .sort({updatedAt:-1});

        const result = await Promise.all(

            boards.map(async(board)=>{

                let pendingRequests=[];

                if(board.owner._id.toString()===req.user.id){

                    pendingRequests=
                    await JoinRequest.find({

                        board:board._id,

                        status:"pending"

                    })
                    .populate("user","username email");

                }

                return{

                    ...board.toObject(),

                    pendingRequests

                };

            })

        );

        res.json(result);

    }

    catch(err){

        console.error(err);

        res.status(500).json({
            message:"Server error"
        });

    }

});


// =======================================
// Get Single Board
// GET /board/:id
// =======================================

router.get("/:id", authMiddleware, async (req, res) => {

    try {
        const board = await BoardService.getBoardForMember(req.params.id, req.user.id);

        res.json(BoardService.toClientBoard(board));

    } catch (err) {

        console.error(err);

        if (err.statusCode === 403 || err.statusCode === 404) {
            return res.status(err.statusCode).json({
                message: err.message,
            });
        }

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
        await BoardService.getBoardForMember(req.params.id, req.user.id);

        const actions = await getReplayActions(req.params.id);

        res.json(actions);

    } catch (err) {

        console.error(err);

        if (err.statusCode === 403 || err.statusCode === 404) {
            return res.status(err.statusCode).json({
                message: err.message,
            });
        }

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



// =======================================
// Request Access to Board
// POST /board/:id/request
// =======================================

router.post("/:id/request", authMiddleware, async (req, res) => {
    try {

        await JoinRequestService.requestAccess(
            req.params.id,
            req.user
        );

        res.status(201).json({
            message: "Join request sent successfully."
        });

    } catch (err) {

        console.error(err);

        res.status(err.statusCode || 500).json({
            message: err.message || "Server error"
        });

    }
});


// =======================================
// Get Pending Join Requests
// GET /board/:id/requests
// =======================================

router.get("/:id/requests", authMiddleware, async (req, res) => {

    try {

        const requests =
            await JoinRequestService.getPendingRequests(
                req.params.id,
                req.user.id
            );

        res.json(requests);

    } catch (err) {

        console.error(err);

        res.status(err.statusCode || 500).json({
            message: err.message || "Server error"
        });

    }

});



// =======================================
// Approve Join Request
// PATCH /board/:id/requests/:requestId/approve
// =======================================

router.patch(
    "/:id/requests/:requestId/approve",
    authMiddleware,
    async (req, res) => {

        try {

            const request =
                await JoinRequestService.approveRequest(

                    req.params.id,

                    req.params.requestId,

                    req.user.id

                );

            res.json({
                message: "User approved successfully.",
                request,
            });

        } catch (err) {

            console.error(err);

            res.status(err.statusCode || 500).json({
                message: err.message || "Server error"
            });

        }

    }
);


// =======================================
// Reject Join Request
// PATCH /board/:id/requests/:requestId/reject
// =======================================

router.patch(
    "/:id/requests/:requestId/reject",
    authMiddleware,
    async (req, res) => {

        try {

            const request =
                await JoinRequestService.rejectRequest(

                    req.params.id,

                    req.params.requestId,

                    req.user.id

                );

            res.json({
                message: "Request rejected.",
                request,
            });

        } catch (err) {

            console.error(err);

            res.status(err.statusCode || 500).json({
                message: err.message || "Server error"
            });

        }

    }
);


// =======================================
// Invite Member by Email
// POST /board/:id/invite
// =======================================
    
router.post(
    "/:id/invite",
    authMiddleware,
    async (req, res) => {

        try {

            const { email } = req.body;

            if (!email) {

                return res.status(400).json({
                    message: "Email is required"
                });

            }

            await JoinRequestService.inviteByEmail(

                req.params.id,

                req.user.id,

                email

            );

            res.json({
                message: "Member added successfully."
            });

        } catch (err) {

            console.error(err);

            res.status(err.statusCode || 500).json({
                message: err.message || "Server error"
            });

        }

    }
);


module.exports = router;