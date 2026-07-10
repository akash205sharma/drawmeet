"use client";

import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { Stage, Layer, Line, Rect, Text, Group, Circle } from "react-konva";
import Konva from "konva";

import { socket } from "../lib/socket";

const STICKY_COLORS = ["#fef08a", "#a7f3d0", "#fca5a5", "#c7d2fe", "#fcd34d"];
const CURSOR_COLORS = ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#f472b6"];

type BoardUser = {
  id: string;
  username: string;
  email: string;
};

type BoardLine = {
  id: string;
  opId: string;
  points: number[];
  color: string;
  strokeWidth: number;
  eraser?: boolean;
};

type BoardRect = {
  id: string;
  opId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

type BoardText = {
  id: string;
  opId: string;
  x: number;
  y: number;
  text: string;
};

type BoardSticky = {
  id: string;
  opId: string;
  x: number;
  y: number;
  text: string;
  color: string;
};

type CanvasItem = BoardLine | BoardRect | BoardText | BoardSticky;

type BoardActionPayload = {
  opId?: string;
  id?: string;
  actionType?: string;
  item?: CanvasItem;
  targetItem?: CanvasItem;
  x?: number;
  y?: number;
};

type BoardAction = {
  type: string;
  payload?: unknown;
  user?: BoardUser | null;
  opId?: string;
};

type PointerLikeEvent = {
  target?: {
    getStage?: () => {
      getPointerPosition?: () => { x: number; y: number } | null;
    } | null;
  } | null;
};

type SocketCursorPayload = {
  x: number;
  y: number;
  opId?: string;
};

type ImperativeHandle = {
  handleUndo?: () => void;
  handleRedo?: () => void;
  exportAsImage?: () => void;
};

type UndoEntry = {
  type: string;
  item: CanvasItem;
};

type WhiteboardCanvasProps = {
  width?: number;
  height?: number;
  activeTool?: string;
  boardId?: string;
  authenticatedUser?: BoardUser | null;
  initialActions?: BoardAction[];
};

function getUserColor(name: string) {
  let hash = 0;

  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }

  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getPointerPosition(event: PointerLikeEvent) {
  return event?.target?.getStage?.()?.getPointerPosition?.() || { x: 0, y: 0 };
}

function getItemId(item: unknown) {
  if (!item || typeof item !== "object") {
    return undefined;
  }

  const candidate = item as {
    id?: string;
    item?: { id?: string };
    payload?: { id?: string; item?: { id?: string } };
  };

  return candidate.id || candidate.item?.id || candidate.payload?.id || candidate.payload?.item?.id;
}

function extractItem(action: BoardAction | null | undefined) {
  if (!action) {
    return null;
  }

  const payload = action.payload;

  if (payload && typeof payload === "object" && "item" in payload && (payload as BoardActionPayload).item) {
    return (payload as BoardActionPayload).item || null;
  }

  if (payload && typeof payload === "object" && "id" in payload) {
    return payload as CanvasItem;
  }

  return null;
}

function buildBoardState(actions: BoardAction[]) {
  const lines: BoardLine[] = [];
  const rects: BoardRect[] = [];
  const texts: BoardText[] = [];
  const stickies: BoardSticky[] = [];
  const undoStack: UndoEntry[] = [];

  const removeById = <T extends CanvasItem>(collection: T[], item: CanvasItem | null) => {
    const itemId = getItemId(item);

    if (!itemId) {
      collection.pop();
      return;
    }

    const index = collection.findIndex((entry) => getItemId(entry) === itemId);

    if (index >= 0) {
      collection.splice(index, 1);
    }
  };

  actions.forEach((action) => {
    const type = action?.type;
    const item = extractItem(action);

    if (!type || !item) {
      return;
    }

    if (type === "draw") {
      lines.push(item as BoardLine);
      undoStack.push({ type: "draw", item });
      return;
    }

    if (type === "shape") {
      rects.push(item as BoardRect);
      undoStack.push({ type: "shape", item });
      return;
    }

    if (type === "text") {
      texts.push(item as BoardText);
      undoStack.push({ type: "text", item });
      return;
    }

    if (type === "sticky" || type === "note") {
      stickies.push(item as BoardSticky);
      undoStack.push({ type: "sticky", item });
      return;
    }

    if (type === "undo") {
      const payload = action?.payload && typeof action.payload === "object" ? action.payload as BoardActionPayload : undefined;
      const target = payload?.item || payload?.targetItem || item;

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
      const historyIndex = undoStack.findIndex((entry) => getItemId(entry.item) === targetId);

      if (historyIndex >= 0) {
        undoStack.splice(historyIndex, 1);
      }
      return;
    }

    if (type === "redo") {
      const payload = action?.payload && typeof action.payload === "object" ? action.payload as BoardActionPayload : undefined;

      if (payload?.actionType === "shape") {
        rects.push(item as BoardRect);
      } else if (payload?.actionType === "text") {
        texts.push(item as BoardText);
      } else if (payload?.actionType === "sticky") {
        stickies.push(item as BoardSticky);
      } else {
        lines.push(item as BoardLine);
      }

      undoStack.push({ type: payload?.actionType || type, item });
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

const WhiteboardCanvas = forwardRef(function WhiteboardCanvas(
  {
    width = 1200,
    height = 700,
    activeTool = "pen",
    boardId = "",
    authenticatedUser,
    initialActions = [],
  }: WhiteboardCanvasProps,
  ref: React.ForwardedRef<ImperativeHandle>,
) {
  const [lines, setLines] = useState<BoardLine[]>([]);
  const [rects, setRects] = useState<BoardRect[]>([]);
  const [texts, setTexts] = useState<BoardText[]>([]);
  const [stickies, setStickies] = useState<BoardSticky[]>([]);
  const [drawingRect, setDrawingRect] = useState<BoardRect | null>(null);
  const [drawingText, setDrawingText] = useState<BoardText | null>(null);
  const [drawingSticky, setDrawingSticky] = useState<BoardSticky | null>(null);
  const [cursors, setCursors] = useState<
    Record<
      string,
      {
        x: number;
        y: number;
        username: string;
      }
    >
  >({});
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [redoStack, setRedoStack] = useState<UndoEntry[]>([]);

  const isDrawing = useRef(false);
  const stageRef = useRef<Konva.Stage | null>(null);
  const activeLineRef = useRef<BoardLine | null>(null);
  const appliedOperationIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const replayState = buildBoardState(initialActions);
    setLines(replayState.lines);
    setRects(replayState.rects);
    setTexts(replayState.texts);
    setStickies(replayState.stickies);
    setUndoStack(replayState.undoStack);
    setRedoStack([]);
    setDrawingRect(null);
    setDrawingText(null);
    setDrawingSticky(null);
    setCursors({});
    appliedOperationIds.current = new Set(
      initialActions
        .map((action) => {
          const payload = action.payload && typeof action.payload === "object" ? action.payload as BoardActionPayload : undefined;
          return payload?.opId || payload?.item?.opId || payload?.id || action?.opId;
        })
        .filter((value): value is string => Boolean(value)),
    );
  }, [boardId, initialActions]);

  useEffect(() => {
    const handleAction = (type: string, action: BoardAction) => {
      const payload = action?.payload && typeof action.payload === "object" ? action.payload as BoardActionPayload : undefined;
      const opId = payload?.opId || payload?.item?.opId || action?.opId;

      if (opId && appliedOperationIds.current.has(opId)) {
        return;
      }

      if (opId) {
        appliedOperationIds.current.add(opId);
      }

      if (type === "draw") {
        const item = extractItem(action);
        if (!item) {
          return;
        }

        const line = item as BoardLine;
        setLines((prev) => (prev.some((entry) => getItemId(entry) === getItemId(line)) ? prev : [...prev, line]));
        setUndoStack((prev) => [...prev, { type: "draw", item }]);
        setRedoStack([]);
        return;
      }

      if (type === "shape") {
        const item = extractItem(action);
        if (!item) {
          return;
        }

        const rect = item as BoardRect;
        setRects((prev) => (prev.some((entry) => getItemId(entry) === getItemId(rect)) ? prev : [...prev, rect]));
        setUndoStack((prev) => [...prev, { type: "shape", item }]);
        setRedoStack([]);
        return;
      }

      if (type === "text") {
        const item = extractItem(action);
        if (!item) {
          return;
        }

        const textItem = item as BoardText;
        setTexts((prev) => (prev.some((entry) => getItemId(entry) === getItemId(textItem)) ? prev : [...prev, textItem]));
        setUndoStack((prev) => [...prev, { type: "text", item }]);
        setRedoStack([]);
        return;
      }

      if (type === "sticky") {
        const item = extractItem(action);
        if (!item) {
          return;
        }

        const sticky = item as BoardSticky;
        setStickies((prev) => (prev.some((entry) => getItemId(entry) === getItemId(sticky)) ? prev : [...prev, sticky]));
        setUndoStack((prev) => [...prev, { type: "sticky", item }]);
        setRedoStack([]);
        return;
      }

      if (type === "undo") {
        const payload = action?.payload && typeof action.payload === "object" ? action.payload as BoardActionPayload : undefined;
        const target = payload?.item || payload?.targetItem || extractItem(action);
        const targetType = payload?.actionType;
        const targetId = getItemId(target);

        if (targetType === "shape") {
          setRects((prev) => prev.filter((entry) => getItemId(entry) !== targetId));
        } else if (targetType === "text") {
          setTexts((prev) => prev.filter((entry) => getItemId(entry) !== targetId));
        } else if (targetType === "sticky") {
          setStickies((prev) => prev.filter((entry) => getItemId(entry) !== targetId));
        } else {
          setLines((prev) => prev.filter((entry) => getItemId(entry) !== targetId));
        }

        setUndoStack((prev) => prev.filter((entry) => getItemId(entry.item) !== targetId));
        if (target) {
          setRedoStack((prev) => [...prev, { type: targetType || "draw", item: target }]);
        }
        return;
      }

      if (type === "redo") {
        const payload = action?.payload && typeof action.payload === "object" ? action.payload as BoardActionPayload : undefined;
        const target = payload?.item || extractItem(action);
        const targetType = payload?.actionType;

        if (!target) {
          return;
        }

        if (targetType === "shape") {
          const rect = target as BoardRect;
          setRects((prev) => (prev.some((entry) => getItemId(entry) === getItemId(rect)) ? prev : [...prev, rect]));
        } else if (targetType === "text") {
          const textItem = target as BoardText;
          setTexts((prev) => (prev.some((entry) => getItemId(entry) === getItemId(textItem)) ? prev : [...prev, textItem]));
        } else if (targetType === "sticky") {
          const sticky = target as BoardSticky;
          setStickies((prev) => (prev.some((entry) => getItemId(entry) === getItemId(sticky)) ? prev : [...prev, sticky]));
        } else {
          const line = target as BoardLine;
          setLines((prev) => (prev.some((entry) => getItemId(entry) === getItemId(line)) ? prev : [...prev, line]));
        }

        setRedoStack((prev) => prev.filter((entry) => getItemId(entry.item) !== getItemId(target)));
        setUndoStack((prev) => [...prev, { type: targetType || type, item: target }]);
      }
    };

    const handleDraw = (action: BoardAction) => handleAction("draw", action);
    const handleShape = (action: BoardAction) => handleAction("shape", action);
    const handleText = (action: BoardAction) => handleAction("text", action);
    const handleSticky = (action: BoardAction) => handleAction("sticky", action);
    const handleUndo = (action: BoardAction) => handleAction("undo", action);
    const handleRedo = (action: BoardAction) => handleAction("redo", action);

    const handleCursor = (action: { payload?: SocketCursorPayload; user?: BoardUser }) => {
      const payload = action?.payload;
      const user = action?.user;

      if (!payload || !user || user.id === authenticatedUser?.id) {
        return;
      }

      setCursors((prev) => ({
        ...prev,
        [user.id]: {
          x: payload.x,
          y: payload.y,
          username: user.username,
        },
      }));
    };

    socket.on("draw", handleDraw);
    socket.on("shape", handleShape);
    socket.on("text", handleText);
    socket.on("sticky", handleSticky);
    socket.on("undo", handleUndo);
    socket.on("redo", handleRedo);
    socket.on("cursor", handleCursor);

    return () => {
      socket.off("draw", handleDraw);
      socket.off("shape", handleShape);
      socket.off("text", handleText);
      socket.off("sticky", handleSticky);
      socket.off("undo", handleUndo);
      socket.off("redo", handleRedo);
      socket.off("cursor", handleCursor);
    };
  }, [authenticatedUser?.id]);

  const pushUndoEntry = (type: string, item: CanvasItem) => {
    setUndoStack((prev) => [...prev, { type, item }]);
    setRedoStack([]);
  };

  const emitBoardEvent = (type: string, payload: BoardActionPayload | SocketCursorPayload | CanvasItem) => {
    if (!boardId) {
      return;
    }

    socket.emit(type, {
      boardId,
      payload,
    });
  };

  const handleUndo = () => {
    const last = undoStack[undoStack.length - 1];

    if (!last) {
      return;
    }

    const itemId = getItemId(last.item);

    if (last.type === "shape") {
      setRects((prev) => prev.filter((entry) => getItemId(entry) !== itemId));
    } else if (last.type === "text") {
      setTexts((prev) => prev.filter((entry) => getItemId(entry) !== itemId));
    } else if (last.type === "sticky") {
      setStickies((prev) => prev.filter((entry) => getItemId(entry) !== itemId));
    } else {
      setLines((prev) => prev.filter((entry) => getItemId(entry) !== itemId));
    }

    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, last]);

    emitBoardEvent("undo", {
      opId: createId(),
      actionType: last.type,
      item: last.item,
    });
  };

  const handleRedo = () => {
    const last = redoStack[redoStack.length - 1];

    if (!last) {
      return;
    }

    if (last.type === "shape") {
      setRects((prev) => [...prev, last.item as BoardRect]);
    } else if (last.type === "text") {
      setTexts((prev) => [...prev, last.item as BoardText]);
    } else if (last.type === "sticky") {
      setStickies((prev) => [...prev, last.item as BoardSticky]);
    } else {
      setLines((prev) => [...prev, last.item as BoardLine]);
    }

    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, last]);

    emitBoardEvent("redo", {
      opId: createId(),
      actionType: last.type,
      item: last.item,
    });
  };

  const handleMouseDown = (event: PointerLikeEvent) => {
    const pos = getPointerPosition(event);

    if (activeTool === "pen" || activeTool === "eraser") {
      const item = {
        id: createId(),
        opId: createId(),
        points: [pos.x, pos.y],
        color: activeTool === "eraser" ? "#fff" : "#222",
        strokeWidth: activeTool === "eraser" ? 24 : 3,
        eraser: activeTool === "eraser",
      };

      isDrawing.current = true;
      activeLineRef.current = item;
      appliedOperationIds.current.add(item.opId);
      setLines((prev) => [...prev, item]);
      pushUndoEntry("draw", item);
      return;
    }

    if (activeTool === "shapes") {
      setDrawingRect({
        id: createId(),
        opId: createId(),
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        color: "#60a5fa",
      });
      return;
    }

    if (activeTool === "text") {
      setDrawingText({
        id: createId(),
        opId: createId(),
        x: pos.x,
        y: pos.y,
        text: "",
      });
      return;
    }

    if (activeTool === "sticky") {
      setDrawingSticky({
        id: createId(),
        opId: createId(),
        x: pos.x,
        y: pos.y,
        text: "",
        color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
      });
    }
  };

  const handleMouseMove = (event: PointerLikeEvent) => {
    const pos = getPointerPosition(event);

    if (boardId) {
      emitBoardEvent("cursor", {
        x: pos.x,
        y: pos.y,
        opId: createId(),
      });
    }

    if ((activeTool === "pen" || activeTool === "eraser") && isDrawing.current) {
      const current = activeLineRef.current;

      if (!current) {
        return;
      }

      const nextPoints = [...current.points, pos.x, pos.y];
      activeLineRef.current = {
        ...current,
        points: nextPoints,
      };

      setLines((prev) => {
        const next = [...prev];
        if (activeLineRef.current) {
          next[next.length - 1] = activeLineRef.current;
        }
        return next;
      });
      return;
    }

    if (activeTool === "shapes" && drawingRect) {
      setDrawingRect({
        ...drawingRect,
        width: pos.x - drawingRect.x,
        height: pos.y - drawingRect.y,
      });
    }
  };

  const handleMouseUp = () => {
    if ((activeTool === "pen" || activeTool === "eraser") && isDrawing.current) {
      isDrawing.current = false;
      const line = activeLineRef.current;
      activeLineRef.current = null;

      if (line) {
        emitBoardEvent("draw", line);
      }

      return;
    }

    if (activeTool === "shapes" && drawingRect) {
      const shape = drawingRect;
      setRects((prev) => [...prev, shape]);
      setDrawingRect(null);
      pushUndoEntry("shape", shape);
      emitBoardEvent("shape", shape);
      return;
    }

    if (activeTool === "text" && drawingText) {
      const text = prompt("Enter text:") || "";

      if (text.trim()) {
        const item = {
          ...drawingText,
          text,
        };

        setTexts((prev) => [...prev, item]);
        pushUndoEntry("text", item);
        emitBoardEvent("text", item);
      }

      setDrawingText(null);
      return;
    }

    if (activeTool === "sticky" && drawingSticky) {
      const text = prompt("Sticky note text:") || "";

      if (text.trim()) {
        const item = {
          ...drawingSticky,
          text,
        };

        setStickies((prev) => [...prev, item]);
        pushUndoEntry("sticky", item);
        emitBoardEvent("sticky", item);
      }

      setDrawingSticky(null);
    }
  };

  useImperativeHandle(ref, () => ({
    handleUndo,
    handleRedo,
    exportAsImage: () => {
      if (!stageRef.current) {
        return;
      }

      const dataURL = stageRef.current.toDataURL();
      const link = document.createElement("a");
      link.download = "drawmeet-board.png";
      link.href = dataURL;
      link.click();
    },
  }));

  return (
    <div className="flex-1 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-xl shadow-inner min-h-[400px] overflow-hidden">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        className="rounded-xl bg-transparent"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <Layer>
          {lines.map((line) => (
            <Line
              key={line.id}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation={line.eraser ? "destination-out" : "source-over"}
            />
          ))}

          {rects.map((rect) => (
            <Rect
              key={rect.id}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={rect.color}
              opacity={0.4}
              cornerRadius={8}
            />
          ))}

          {drawingRect && (
            <Rect
              x={drawingRect.x}
              y={drawingRect.y}
              width={drawingRect.width}
              height={drawingRect.height}
              fill={drawingRect.color}
              opacity={0.3}
              cornerRadius={8}
            />
          )}

          {texts.map((textItem) => (
            <Text
              key={textItem.id}
              x={textItem.x}
              y={textItem.y}
              text={textItem.text}
              fontSize={22}
              fill="#222"
            />
          ))}

          {stickies.map((sticky) => (
            <Group key={sticky.id} x={sticky.x} y={sticky.y}>
              <Rect width={160} height={120} fill={sticky.color} cornerRadius={12} shadowBlur={8} opacity={0.95} />
              <Text text={sticky.text} x={12} y={16} width={136} height={88} fontSize={18} fill="#222" fontStyle="bold" />
            </Group>
          ))}

          {Object.entries(cursors).map(([userId, cursor]) => {
            const color = getUserColor(cursor.username);

            return (
              <Group key={userId} x={cursor.x} y={cursor.y}>
                <Circle radius={8} fill={color} shadowBlur={4} />
                <Text
                  text={cursor.username}
                  x={12}
                  y={-8}
                  fontSize={14}
                  fill={color}
                  fontStyle="bold"
                />
              </Group>
            );
          })}

        </Layer>
      </Stage>
    </div>
  );
});

export default WhiteboardCanvas;
