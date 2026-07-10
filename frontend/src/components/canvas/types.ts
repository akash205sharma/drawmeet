export type BoardUser = {
  id: string;
  username: string;
  email: string;
};

export type BoardLine = {
  id: string;
  opId: string;
  points: number[];
  color: string;
  strokeWidth: number;
  eraser?: boolean;
};

export type BoardRect = {
  id: string;
  opId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

export type BoardText = {
  id: string;
  opId: string;
  x: number;
  y: number;
  text: string;
};

export type BoardSticky = {
  id: string;
  opId: string;
  x: number;
  y: number;
  text: string;
  color: string;
};

export type CanvasItem =
  | BoardLine
  | BoardRect
  | BoardText
  | BoardSticky;

export type BoardActionPayload = {
  opId?: string;
  id?: string;
  actionType?: string;
  item?: CanvasItem;
  targetItem?: CanvasItem;
  x?: number;
  y?: number;
};

export type BoardAction = {
  type: string;
  payload?: unknown;
  user?: BoardUser | null;
  opId?: string;
};

export type PointerLikeEvent = {
  target?: {
    getStage?: () => {
      getPointerPosition?: () => { x: number; y: number } | null;
    } | null;
  } | null;
};

export type SocketCursorPayload = {
  x: number;
  y: number;
  opId?: string;
};

export type ImperativeHandle = {
  handleUndo?: () => void;
  handleRedo?: () => void;
  exportAsImage?: () => void;
};

export type UndoEntry = {
  type: string;
  item: CanvasItem;
};

export type WhiteboardCanvasProps = {
  width?: number;
  height?: number;
  activeTool?: string;
  boardId?: string;
  authenticatedUser?: BoardUser | null;
  initialActions?: BoardAction[];
};