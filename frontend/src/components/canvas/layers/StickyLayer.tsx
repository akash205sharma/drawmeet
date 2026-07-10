import { Group, Rect, Text } from "react-konva";
import type { BoardSticky } from "../types";

interface Props {
  stickies: BoardSticky[];
}

export default function StickyLayer({
  stickies,
}: Props) {
  return (
    <>
      {stickies.map((sticky) => (
        <Group
          key={sticky.id}
          x={sticky.x}
          y={sticky.y}
        >
          <Rect
            width={160}
            height={120}
            fill={sticky.color}
            cornerRadius={12}
            shadowBlur={8}
            opacity={0.95}
          />

          <Text
            text={sticky.text}
            x={12}
            y={16}
            width={136}
            height={88}
            fontSize={18}
            fill="#222"
            fontStyle="bold"
          />
        </Group>
      ))}
    </>
  );
}