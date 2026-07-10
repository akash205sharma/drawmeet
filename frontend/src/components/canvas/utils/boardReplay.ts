import type {
  BoardAction,
  BoardActionPayload,
  BoardLine,
  BoardRect,
  BoardSticky,
  BoardText,
  CanvasItem,
  UndoEntry,
} from "../types";

import {
  extractItem,
  getItemId,
} from "./item";

export function buildBoardState(actions: BoardAction[]) {
  const lines: BoardLine[] = [];
  const rects: BoardRect[] = [];
  const texts: BoardText[] = [];
  const stickies: BoardSticky[] = [];
  const undoStack: UndoEntry[] = [];

  const removeById = <T extends CanvasItem>(
    collection: T[],
    item: CanvasItem | null
  ) => {
    const itemId = getItemId(item);

    if (!itemId) {
      collection.pop();
      return;
    }

    const index = collection.findIndex(
      (entry) => getItemId(entry) === itemId
    );

    if (index >= 0) {
      collection.splice(index, 1);
    }
  };

  actions.forEach((action) => {
    const type = action?.type;
    const item = extractItem(action);

    if (!type || !item) return;

    switch (type) {
      case "draw":
        lines.push(item as BoardLine);
        undoStack.push({ type: "draw", item });
        break;

      case "shape":
        rects.push(item as BoardRect);
        undoStack.push({ type: "shape", item });
        break;

      case "text":
        texts.push(item as BoardText);
        undoStack.push({ type: "text", item });
        break;

      case "sticky":
      case "note":
        stickies.push(item as BoardSticky);
        undoStack.push({ type: "sticky", item });
        break;

      case "undo": {
        const payload =
          action.payload &&
          typeof action.payload === "object"
            ? (action.payload as BoardActionPayload)
            : undefined;

        const target =
          payload?.item ||
          payload?.targetItem ||
          item;

        if (payload?.actionType === "shape") {
          removeById(rects, target);
        } else if (payload?.actionType === "text") {
          removeById(texts, target);
        } else if (payload?.actionType === "sticky") {
          removeById(stickies, target);
        } else {
          removeById(lines, target);
        }

        const targetId = getItemId(target);

        const historyIndex = undoStack.findIndex(
          (entry) => getItemId(entry.item) === targetId
        );

        if (historyIndex >= 0) {
          undoStack.splice(historyIndex, 1);
        }

        break;
      }

      case "redo": {
        const payload =
          action.payload &&
          typeof action.payload === "object"
            ? (action.payload as BoardActionPayload)
            : undefined;

        if (payload?.actionType === "shape") {
          rects.push(item as BoardRect);
        } else if (payload?.actionType === "text") {
          texts.push(item as BoardText);
        } else if (payload?.actionType === "sticky") {
          stickies.push(item as BoardSticky);
        } else {
          lines.push(item as BoardLine);
        }

        undoStack.push({
          type: payload?.actionType || type,
          item,
        });

        break;
      }
    }
  });

  return {
    lines,
    rects,
    texts,
    stickies,
    undoStack,
    redoStack: [],
  };
}