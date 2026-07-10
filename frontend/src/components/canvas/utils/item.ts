import type {
  BoardAction,
  BoardActionPayload,
  CanvasItem,
} from "../types";

export function getItemId(item: unknown) {
  if (!item || typeof item !== "object") {
    return undefined;
  }

  const candidate = item as {
    id?: string;
    item?: { id?: string };
    payload?: { id?: string; item?: { id?: string } };
  };

  return (
    candidate.id ||
    candidate.item?.id ||
    candidate.payload?.id ||
    candidate.payload?.item?.id
  );
}

export function extractItem(
  action: BoardAction | null | undefined
): CanvasItem | null {
  if (!action) {
    return null;
  }

  const payload = action.payload;

  if (
    payload &&
    typeof payload === "object" &&
    "item" in payload &&
    (payload as BoardActionPayload).item
  ) {
    return (payload as BoardActionPayload).item!;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "id" in payload
  ) {
    return payload as CanvasItem;
  }

  return null;
}