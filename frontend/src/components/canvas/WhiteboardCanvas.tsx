"use client";

import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { Stage, Layer, Line, Rect, Text, Group, Circle } from "react-konva";
import Konva from "konva";

import { socket } from "@/lib/socket";

import type {
  BoardAction,
  BoardActionPayload,
  BoardLine,
  BoardRect,
  BoardSticky,
  BoardText,
  BoardUser,
  CanvasItem,
  ImperativeHandle,
  PointerLikeEvent,
  SocketCursorPayload,
  UndoEntry,
  WhiteboardCanvasProps,
} from "./types";


import { STICKY_COLORS } from "./constants";
import { createId } from "./utils/ids";
import { getUserColor } from "./utils/colors";
import { getPointerPosition } from "./utils/pointer";
import { extractItem, getItemId } from "./utils/item";
import { buildBoardState } from "./utils/boardReplay";
import CursorLayer from "./layers/CursorLayer";
import StickyLayer from "./layers/StickyLayer";
import TextLayer from "./layers/TextLayer";
import ShapesLayer from "./layers/ShapesLayer";
import DrawingLayer from "./layers/DrawingLayer";



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
          <DrawingLayer lines={lines} />

          <ShapesLayer
            rects={rects}
            drawingRect={drawingRect}
          />

          <TextLayer texts={texts} />

          <StickyLayer
            stickies={stickies}
          />

          <CursorLayer
            cursors={cursors}
          />
        </Layer>
      </Stage>
    </div>
  );
});

export default WhiteboardCanvas;
