import { Arrow } from "react-konva";
import type { BoardArrow } from "../types";

interface Props {
  arrows: BoardArrow[];
}

export default function ArrowLayer({
  arrows,
}: Props) {
  return (
    <>
      {arrows.map((arrow) => (
        <Arrow
          key={arrow.id}
          points={arrow.points}
          stroke={arrow.color}
          fill={arrow.color}
          strokeWidth={arrow.strokeWidth}
          pointerLength={12}
          pointerWidth={12}
        />
      ))}
    </>
  );
}