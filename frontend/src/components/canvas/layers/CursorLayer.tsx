import {
  Circle,
  Group,
  Text,
} from "react-konva";

import { getUserColor } from "../utils/colors";

interface Props {
  cursors: Record<
    string,
    {
      x: number;
      y: number;
      username: string;
    }
  >;
}

export default function CursorLayer({
  cursors,
}: Props) {
  return (
    <>
      {Object.entries(cursors).map(
        ([userId, cursor]) => {
          const color = getUserColor(
            cursor.username
          );

          return (
            <Group
              key={userId}
              x={cursor.x}
              y={cursor.y}
            >
              <Circle
                radius={8}
                fill={color}
                shadowBlur={4}
              />

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
        }
      )}
    </>
  );
}