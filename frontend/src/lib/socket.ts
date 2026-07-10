import { io, Socket } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const socket: Socket = io(URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export function setSocketAuthToken(token: string | null) {
  socket.auth = token ? { token } : {};
}
