const mongoose = require("mongoose");

const Board = require("../../models/Board");
const BoardService = require("../../services/BoardService");

jest.mock("../../models/Board");

describe("BoardService", () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("isBoardMember", () => {

        test("returns true if user is owner", () => {

            const ownerId = new mongoose.Types.ObjectId();
            const memberId = new mongoose.Types.ObjectId();

            const board = {
                owner: { _id: ownerId },
                members: [{ _id: memberId }]
            };

            expect(
                BoardService.isBoardMember(board, ownerId)
            ).toBe(true);

        });

        test("returns true if user is a member", () => {

            const ownerId = new mongoose.Types.ObjectId();
            const memberId = new mongoose.Types.ObjectId();

            const board = {
                owner: { _id: ownerId },
                members: [{ _id: memberId }]
            };

            expect(
                BoardService.isBoardMember(board, memberId)
            ).toBe(true);

        });

        test("returns false for outsider", () => {

            const ownerId = new mongoose.Types.ObjectId();
            const memberId = new mongoose.Types.ObjectId();
            const outsider = new mongoose.Types.ObjectId();

            const board = {
                owner: { _id: ownerId },
                members: [{ _id: memberId }]
            };

            expect(
                BoardService.isBoardMember(board, outsider)
            ).toBe(false);

        });

    });

    describe("toClientBoard", () => {

        test("transforms board correctly", () => {

            const ownerId = new mongoose.Types.ObjectId();
            const memberId = new mongoose.Types.ObjectId();
            const boardId = new mongoose.Types.ObjectId();

            const board = {

                _id: boardId,

                title: "System Design",

                owner: {
                    _id: ownerId,
                    username: "akash",
                    email: "akash@test.com"
                },

                members: [
                    {
                        _id: memberId,
                        username: "john",
                        email: "john@test.com"
                    }
                ],

                notes: ["abc"],

                createdAt: new Date(),

                updatedAt: new Date()
            };

            const result = BoardService.toClientBoard(board);

            expect(result.id).toBe(boardId.toString());

            expect(result.title).toBe("System Design");

            expect(result.owner.username).toBe("akash");

            expect(result.members).toHaveLength(1);

            expect(result.members[0].username).toBe("john");

            expect(result.notes).toEqual(["abc"]);

        });

    });

    describe("getBoardForMember", () => {

        test("returns board if member has access", async () => {

            const ownerId = new mongoose.Types.ObjectId();
            const memberId = new mongoose.Types.ObjectId();

            const board = {
                owner: { _id: ownerId },
                members: [{ _id: memberId }]
            };

            const populate2 = jest.fn().mockResolvedValue(board);
            const populate1 = jest.fn().mockReturnValue({
                populate: populate2
            });

            Board.findById.mockReturnValue({
                populate: populate1
            });

            const result = await BoardService.getBoardForMember(
                "board123",
                memberId
            );

            expect(result).toBe(board);

        });

        test("throws 404 if board does not exist", async () => {

            const populate2 = jest.fn().mockResolvedValue(null);
            const populate1 = jest.fn().mockReturnValue({
                populate: populate2
            });

            Board.findById.mockReturnValue({
                populate: populate1
            });

            await expect(

                BoardService.getBoardForMember(
                    "board123",
                    "user123"
                )

            ).rejects.toMatchObject({

                message: "Board not found",
                statusCode: 404

            });

        });

        test("throws 403 if user is not a member", async () => {

            const ownerId = new mongoose.Types.ObjectId();
            const memberId = new mongoose.Types.ObjectId();
            const outsider = new mongoose.Types.ObjectId();

            const board = {

                owner: { _id: ownerId },

                members: [
                    { _id: memberId }
                ]

            };

            const populate2 = jest.fn().mockResolvedValue(board);
            const populate1 = jest.fn().mockReturnValue({
                populate: populate2
            });

            Board.findById.mockReturnValue({
                populate: populate1
            });

            await expect(

                BoardService.getBoardForMember(
                    "board123",
                    outsider
                )

            ).rejects.toMatchObject({

                message: "Access denied",
                statusCode: 403

            });

        });

    });

});