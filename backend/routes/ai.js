const crypto = require("crypto");
const express = require("express");
const axios = require("axios");

const authMiddleware = require("../middleware/authMiddleware");

const BoardService = require("../services/BoardService");
const ActionService = require("../services/ActionService");


const { getIO } = require("../socket");

const io = getIO();

const router = express.Router();

// Enriches an AI action with unique identifiers for the item and operation.

function enrichAIAction(action) {
  const id = crypto.randomUUID();
  const opId = crypto.randomUUID();

  switch (action.type) {
    case "shape":
      return {
        type: "shape",
        payload: {
          item: {
            id,
            opId,
            ...action.payload,
          },
        },
      };

    case "text":
      return {
        type: "text",
        payload: {
          item: {
            id,
            opId,
            ...action.payload,
          },
        },
      };

    case "arrow":
      return {
        type: "arrow",
        payload: {
          item: {
            id,
            opId,
            ...action.payload,
          },
        },
      };

    default:
      throw new Error(`Unsupported AI action: ${action.type}`);
  }
}


function getItemId(item) {
  return (
    item?.id ||
    item?._id ||
    item?.opId ||
    null
  );
}

function buildCurrentBoardState(actions) {
  const state = {
    lines: [],
    rects: [],
    arrows: [],
    texts: [],
    stickies: [],
  };

  function removeById(collection, item) {
    const id = getItemId(item);

    if (!id) {
      collection.pop();
      return;
    }

    const index = collection.findIndex(
      (x) => getItemId(x) === id
    );

    if (index >= 0) {
      collection.splice(index, 1);
    }
  }

  actions.forEach((action) => {
    const payload = action.payload?.item || action.payload || {};

    switch (action.type) {
      case "shape":
        state.rects.push(payload);
        break;

      case "text":
        state.texts.push(payload);
        break;

      case "sticky":
      case "note":
        state.stickies.push(payload);
        break;

      case "draw":
        state.lines.push(payload);
        break;

      case "arrow":
        state.arrows.push(payload);
        break;

      case "undo": {
        const target =
          action.payload?.targetItem ||
          action.payload?.item ||
          payload;

        switch (action.payload?.actionType) {
          case "shape":
            removeById(state.rects, target);
            break;

          case "text":
            removeById(state.texts, target);
            break;

          case "sticky":
            removeById(state.stickies, target);
            break;

          case "arrow":
            removeById(state.arrows, target);
            break;

          default:
            removeById(state.lines, target);
        }

        break;
      }

      case "redo": {
        switch (action.payload?.actionType) {
          case "shape":
            state.rects.push(payload);
            break;

          case "text":
            state.texts.push(payload);
            break;

          case "sticky":
            state.stickies.push(payload);
            break;

          case "arrow":
            state.arrows.push(payload);
            break;

          default:
            state.lines.push(payload);
        }

        break;
      }
    }
  });

  return state;
}



// Builds a prompt string for the AI model based on the current state of the board.

function buildBoardPrompt(state) {
  const lines = [];

  lines.push("Collaborative Whiteboard");
  lines.push("");

  state.rects.forEach((shape) => {
    lines.push(
      `Rectangle at (${shape.x}, ${shape.y}) size (${shape.width}x${shape.height}) color ${shape.color}`
    );
  });

  state.texts.forEach((text) => {
    lines.push(
      `Text "${text.text}" at (${text.x}, ${text.y})`
    );
  });

  state.stickies.forEach((sticky) => {
    lines.push(
      `Sticky "${sticky.text}" at (${sticky.x}, ${sticky.y})`
    );
  });

  state.arrows.forEach((arrow) => {
    lines.push(
      `Arrow through points: ${arrow.points.join(" -> ")}`
    );
  });

  state.lines.forEach((line) => {
    lines.push(
      `Freehand drawing with ${line.points?.length || 0} points`
    );
  });

  return lines.join("\n");
}



// function buildBoardPrompt(actions) {
//   const lines = [];

//   lines.push("Collaborative Whiteboard");
//   lines.push("");

//   actions.forEach((action) => {
//     const payload = action.payload?.item || action.payload || {};


//     // console.log("Processing action:", action.type, payload);


//     switch (action.type) {
//       case "shape":
//         lines.push(
//           `Shape (${payload.shape || "rectangle"}) at (${payload.x}, ${payload.y}), size (${payload.width}x${payload.height}), color ${payload.color}`
//         );
//         break;

//       case "text":
//         lines.push(
//           `Text "${payload.text}" at (${payload.x}, ${payload.y})`
//         );
//         break;

//       case "sticky":
//         lines.push(
//           `Sticky "${payload.text}" at (${payload.x}, ${payload.y})`
//         );
//         break;

//       case "draw":
//         lines.push(
//           `Drawing with ${payload.points?.length || 0} points`
//         );
//         break;

//       case "arrow":
//         lines.push(
//           `Arrow with points: ${(payload.points || []).join(", ")}`
//         );
//         break;

//       default:
//         break;
//     }
//   });

//   // console.log("Board prompt built:", lines.join("\n"));

//   return lines.join("\n");
// }



router.post(
  "/diagram",
  authMiddleware,
  async (req, res) => {

    try {

      const { boardId, prompt } = req.body;

      if (!boardId || !prompt) {

        return res.status(400).json({
          message: "boardId and prompt are required"
        });

      }

      await BoardService.getBoardForMember(
        boardId,
        req.user.id
      );

      const response = await axios.post(

        `${process.env.AI_SERVICE_URL}/generate`,

        {
          prompt,
        }

      );

      const actions = response.data.actions;

      const io = getIO();

      for (const action of actions) {

        const boardAction = enrichAIAction(action);

        const savedAction =
          await ActionService.createBoardAction({

            board: boardId,

            user: req.user.id,

            type: boardAction.type,

            payload: boardAction.payload,

          });

        io.to(boardId).emit(

          boardAction.type,

          {

            boardId,

            type: boardAction.type,

            payload: boardAction.payload,

            createdAt: savedAction.createdAt,

            user: req.user,
          }
        );
      }

      res.json({

        success: true,

        generated: actions.length,

      });

    }

    catch (err) {

      console.error(err);

      res.status(500).json({

        message: err.message || "Unable to generate diagram",

      });

    }

  }
);


router.post(
  "/summarize",
  authMiddleware,
  async (req, res) => {
    try {
      const { boardId } = req.body;

      if (!boardId) {
        return res.status(400).json({
          message: "boardId is required",
        });
      }

      await BoardService.getBoardForMember(
        boardId,
        req.user.id
      );

      const actions = await ActionService.getReplayActions(boardId);


      const currentState = buildCurrentBoardState(actions);

      const board = buildBoardPrompt(currentState);

      // const board = buildBoardPrompt(actions);

      const response = await axios.post(
        `${process.env.AI_SERVICE_URL}/summarize`,
        {
          board,
        },
        {
    timeout: 60000
}
      );

      res.json(response.data);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          err.message || "Unable to summarize board",
      });
    }
  }
);

module.exports = router;
