"use client";
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Stage, Layer, Line, Rect, Text, Group, Circle } from "react-konva";
import { socket } from "../lib/socket";

const STICKY_COLORS = ["#fef08a", "#a7f3d0", "#fca5a5", "#c7d2fe", "#fcd34d"];
const CURSOR_COLORS = ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#f472b6"];

function getUserColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

const WhiteboardCanvas = forwardRef(function WhiteboardCanvas({
  width = 1200,
  height = 700,
  activeTool = "pen",
  username = "User",
  onUndo,
  onRedo,
}: {
  width?: number;
  height?: number;
  activeTool?: string;
  username?: string;
  onUndo?: () => void;
  onRedo?: () => void;
}, ref) {
  const [lines, setLines] = useState<any[]>([]);
  const [rects, setRects] = useState<any[]>([]);
  const [texts, setTexts] = useState<any[]>([]);
  const [stickies, setStickies] = useState<any[]>([]);
  const [drawingRect, setDrawingRect] = useState<any>(null);
  const [drawingText, setDrawingText] = useState<any>(null);
  const [drawingSticky, setDrawingSticky] = useState<any>(null);
  const [cursors, setCursors] = useState<Record<string, {x:number, y:number}>>({});
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const isDrawing = useRef(false);
  const stageRef = useRef<any>(null);

  useEffect(() => {
    socket.on("draw", (line) => setLines((prev) => [...prev, line]));
    socket.on("shape", (rect) => setRects((prev) => [...prev, rect]));
    socket.on("text", (text) => setTexts((prev) => [...prev, text]));
    socket.on("note", (note) => setStickies((prev) => [...prev, note]));
    socket.on("cursor", ({ user, x, y }) => {
      setCursors((prev) => ({ ...prev, [user]: { x, y } }));
    });
    socket.on("undo", (action) => handleRemoteUndo(action));
    socket.on("redo", (action) => handleRemoteRedo(action));
    return () => {
      socket.off("draw");
      socket.off("shape");
      socket.off("text");
      socket.off("note");
      socket.off("cursor");
      socket.off("undo");
      socket.off("redo");
    };
  }, []);

  // Undo/redo logic
  const handleUndo = () => {
    let lastAction;
    if (lines.length) {
      lastAction = { type: "line", data: lines[lines.length - 1] };
      setLines((prev) => prev.slice(0, -1));
    } else if (rects.length) {
      lastAction = { type: "rect", data: rects[rects.length - 1] };
      setRects((prev) => prev.slice(0, -1));
    } else if (texts.length) {
      lastAction = { type: "text", data: texts[texts.length - 1] };
      setTexts((prev) => prev.slice(0, -1));
    } else if (stickies.length) {
      lastAction = { type: "sticky", data: stickies[stickies.length - 1] };
      setStickies((prev) => prev.slice(0, -1));
    }
    if (lastAction) {
      setUndoStack((prev) => [...prev, lastAction]);
      socket.emit("undo", lastAction);
    }
  };
  const handleRedo = () => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    if (last.type === "line") setLines((prev) => [...prev, last.data]);
    if (last.type === "rect") setRects((prev) => [...prev, last.data]);
    if (last.type === "text") setTexts((prev) => [...prev, last.data]);
    if (last.type === "sticky") setStickies((prev) => [...prev, last.data]);
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, last]);
    socket.emit("redo", last);
  };
  const handleRemoteUndo = (action: any) => {
    if (action.type === "line") setLines((prev) => prev.slice(0, -1));
    if (action.type === "rect") setRects((prev) => prev.slice(0, -1));
    if (action.type === "text") setTexts((prev) => prev.slice(0, -1));
    if (action.type === "sticky") setStickies((prev) => prev.slice(0, -1));
  };
  const handleRemoteRedo = (action: any) => {
    if (action.type === "line") setLines((prev) => [...prev, action.data]);
    if (action.type === "rect") setRects((prev) => [...prev, action.data]);
    if (action.type === "text") setTexts((prev) => [...prev, action.data]);
    if (action.type === "sticky") setStickies((prev) => [...prev, action.data]);
  };

  // Drawing handlers
  const handleMouseDown = (e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    if (activeTool === "pen") {
      isDrawing.current = true;
      setLines((prev) => [...prev, { points: [pos.x, pos.y], color: "#222", strokeWidth: 3 }]);
    } else if (activeTool === "eraser") {
      isDrawing.current = true;
      setLines((prev) => [...prev, { points: [pos.x, pos.y], color: "#fff", strokeWidth: 24, eraser: true }]);
    } else if (activeTool === "shapes") {
      setDrawingRect({ x: pos.x, y: pos.y, width: 0, height: 0, color: "#60a5fa" });
    } else if (activeTool === "text") {
      setDrawingText({ x: pos.x, y: pos.y, text: "", editing: true });
    } else if (activeTool === "sticky") {
      setDrawingSticky({ x: pos.x, y: pos.y, text: "", color: STICKY_COLORS[Math.floor(Math.random()*STICKY_COLORS.length)], editing: true });
    }
  };

  const handleMouseMove = (e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    socket.emit("cursor", { user: username, x: pos.x, y: pos.y });
    if ((activeTool === "pen" || activeTool === "eraser") && isDrawing.current) {
      setLines((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        const newLine = { ...last, points: [...last.points, pos.x, pos.y] };
        return [...prev.slice(0, -1), newLine];
      });
    } else if (activeTool === "shapes" && drawingRect) {
      setDrawingRect({ ...drawingRect, width: pos.x - drawingRect.x, height: pos.y - drawingRect.y });
    }
  };

  const handleMouseUp = (e: any) => {
    if ((activeTool === "pen" || activeTool === "eraser") && isDrawing.current) {
      isDrawing.current = false;
      const lastLine = lines[lines.length - 1];
      if (lastLine) socket.emit("draw", lastLine);
    } else if (activeTool === "shapes" && drawingRect) {
      setRects((prev) => [...prev, drawingRect]);
      socket.emit("shape", drawingRect);
      setDrawingRect(null);
    } else if (activeTool === "text" && drawingText) {
      const text = prompt("Enter text:") || "";
      if (text) {
        const newText = { ...drawingText, text };
        setTexts((prev) => [...prev, newText]);
        socket.emit("text", newText);
      }
      setDrawingText(null);
    } else if (activeTool === "sticky" && drawingSticky) {
      const text = prompt("Sticky note text:") || "";
      if (text) {
        const newSticky = { ...drawingSticky, text };
        setStickies((prev) => [...prev, newSticky]);
        socket.emit("note", newSticky);
      }
      setDrawingSticky(null);
    }
  };

  useImperativeHandle(ref, () => ({
    handleUndo,
    handleRedo,
    exportAsImage: () => {
      if (stageRef.current) {
        const dataURL = stageRef.current.toDataURL();
        const link = document.createElement("a");
        link.download = "drawmeet-board.png";
        link.href = dataURL;
        link.click();
      }
    },
  }));

  return (
    <div className="flex-1 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-xl shadow-inner min-h-[400px]">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        className="rounded-xl bg-transparent"
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <Layer>
          {/* Freehand lines */}
          {lines.map((line, i) => (
            <Line
              key={"line-"+i}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation={line.eraser ? "destination-out" : "source-over"}
            />
          ))}
          {/* Rectangles */}
          {rects.map((rect, i) => (
            <Rect
              key={"rect-"+i}
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
          {/* Texts */}
          {texts.map((t, i) => (
            <Text key={"text-"+i} x={t.x} y={t.y} text={t.text} fontSize={22} fill="#222" />
          ))}
          {/* Sticky notes */}
          {stickies.map((s, i) => (
            <Group key={"sticky-"+i} x={s.x} y={s.y}>
              <Rect width={160} height={120} fill={s.color} cornerRadius={12} shadowBlur={8} opacity={0.95} />
              <Text text={s.text} x={12} y={16} width={136} height={88} fontSize={18} fill="#222" fontStyle="bold" />
            </Group>
          ))}
          {/* Live cursors */}
          {Object.entries(cursors).map(([user, pos], i) => (
            <Group key={user} x={pos.x} y={pos.y}>
              <Circle radius={8} fill={getUserColor(user)} shadowBlur={4} />
              <Text text={user} x={12} y={-8} fontSize={14} fill={getUserColor(user)} fontStyle="bold" />
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
});
export default WhiteboardCanvas;
