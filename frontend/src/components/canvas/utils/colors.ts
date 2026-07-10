import { CURSOR_COLORS } from "../constants";

export function getUserColor(name: string) {
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}