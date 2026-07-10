import { Text } from "react-konva";
import type { BoardText } from "../types";

interface Props {
  texts: BoardText[];
}

export default function TextLayer({
  texts,
}: Props) {
  return (
    <>
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
    </>
  );
}