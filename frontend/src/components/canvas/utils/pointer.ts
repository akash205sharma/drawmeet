import type { PointerLikeEvent } from "../types";

export function getPointerPosition(event: PointerLikeEvent) {
  return (
    event?.target
      ?.getStage?.()
      ?.getPointerPosition?.() || {
      x: 0,
      y: 0,
    }
  );
}