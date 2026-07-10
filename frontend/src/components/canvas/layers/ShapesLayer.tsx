import { Rect } from "react-konva";
import type { BoardRect } from "../types";

interface Props {
  rects: BoardRect[];
  drawingRect: BoardRect | null;
}

export default function ShapesLayer({
  rects,
  drawingRect,
}: Props) {
  return (
    <>
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
    </>
  );
}