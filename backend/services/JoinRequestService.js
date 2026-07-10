const Board = require("../models/Board");
const User = require("../models/User");
const JoinRequest = require("../models/JoinRequest");

// =======================================
// Verify Owner
// =======================================

async function verifyOwner(boardId, ownerId) {
    const board = await Board.findById(boardId);

    if (!board) {
        const err = new Error("Board not found");
        err.statusCode = 404;
        throw err;
    }

    if (board.owner.toString() !== ownerId.toString()) {
        const err = new Error("Only board owner can perform this action");
        err.statusCode = 403;
        throw err;
    }

    return board;
}

// =======================================
// Request Access
// =======================================

async function requestAccess(boardId, user) {

    const board = await Board.findById(boardId);

    if (!board) {
        const err = new Error("Board not found");
        err.statusCode = 404;
        throw err;
    }

    // Already Member
    if (
        board.owner.toString() === user.id ||
        board.members.some(
            member => member.toString() === user.id
        )
    ) {
        const err = new Error("You already have access to this board");
        err.statusCode = 400;
        throw err;
    }

    // Already Requested
    const existing = await JoinRequest.findOne({
        board: boardId,
        user: user.id,
        status: "pending",
    });

    if (existing) {
        const err = new Error("Request already sent");
        err.statusCode = 400;
        throw err;
    }

    const request = await JoinRequest.create({
        board: boardId,
        user: user.id,
    });

    return request;
}

// =======================================
// Invite By Email
// =======================================

async function inviteByEmail(boardId, ownerId, email) {

    const board = await verifyOwner(boardId, ownerId);

    const user = await User.findOne({
        email,
    });

    if (!user) {
        const err = new Error("User not found");
        err.statusCode = 404;
        throw err;
    }

    const alreadyMember =
        board.owner.toString() === user._id.toString() ||
        board.members.some(
            member => member.toString() === user._id.toString()
        );

    if (alreadyMember) {
        const err = new Error("User is already a member");
        err.statusCode = 400;
        throw err;
    }

    board.members.push(user._id);

    await board.save();

    return board;
}

// =======================================
// Pending Requests
// =======================================

async function getPendingRequests(boardId, ownerId) {

    await verifyOwner(boardId, ownerId);

    return JoinRequest.find({
        board: boardId,
        status: "pending",
    })
        .populate("user", "username email")
        .sort({
            requestedAt: -1,
        });

}

// =======================================
// Approve Request
// =======================================

async function approveRequest(
    boardId,
    requestId,
    ownerId
) {

    const board = await verifyOwner(boardId, ownerId);

    const request = await JoinRequest.findOne({
        _id: requestId,
        board: boardId,
    });

    if (!request) {
        const err = new Error("Request not found");
        err.statusCode = 404;
        throw err;
    }

    if (request.status !== "pending") {
        const err = new Error("Request already processed");
        err.statusCode = 400;
        throw err;
    }

    const alreadyMember =
        board.members.some(
            member => member.toString() === request.user.toString()
        );

    if (!alreadyMember) {
        board.members.push(request.user);
        await board.save();
    }

    request.status = "approved";
    request.respondedAt = new Date();

    await request.save();

    return request;
}

// =======================================
// Reject Request
// =======================================

async function rejectRequest(
    boardId,
    requestId,
    ownerId
) {

    await verifyOwner(boardId, ownerId);

    const request = await JoinRequest.findOne({
        _id: requestId,
        board: boardId,
    });

    if (!request) {
        const err = new Error("Request not found");
        err.statusCode = 404;
        throw err;
    }

    request.status = "rejected";
    request.respondedAt = new Date();

    await request.save();

    return request;
}

module.exports = {
    requestAccess,
    inviteByEmail,
    getPendingRequests,
    approveRequest,
    rejectRequest,
};