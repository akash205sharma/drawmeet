import { Line } from "react-konva";
import type { BoardLine } from "../types";

interface Props {
  lines: BoardLine[];
}

export default function DrawingLayer({ lines }: Props) {
  return (
    <>
      {lines.map((line) => (
        <Line
          key={line.id}
          points={line.points}
          stroke={line.color}
          strokeWidth={line.strokeWidth}
          tension={0.5}
          lineCap="round"
          globalCompositeOperation={
            line.eraser
              ? "destination-out"
              : "source-over"
          }
        />
      ))}
    </>
  );
}