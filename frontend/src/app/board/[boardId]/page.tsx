"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

import TopBar from "@/components/TopBar";
import SidebarToolbar from "@/components/SidebarToolbar";
import WhiteboardCanvas from "@/components/WhiteboardCanvas";
import ChatPanel from "@/components/ChatPanel";
import { socket, setSocketAuthToken } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  username: string;
  email: string;
}

interface Board {
  id: string;
  title: string;
  owner?: User | null;
  members?: User[];
}

interface ReplayAction {
  type: string;
  payload: unknown;
  createdAt?: string;
  user?: User | null;
}

interface ChatMessage {
  boardId?: string;
  text: string;
  createdAt?: string;
  user: User;
}

function getBoardParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toUsernames(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (item && typeof item === "object" && "username" in item) {
        return String((item as { username?: string }).username || "");
      }

      return "";
    })
    .filter(Boolean);
}

export default function BoardPage() {
  const params = useParams<{ boardId?: string | string[] }>();
  const boardId = getBoardParam(params.boardId);

  const router = useRouter();
  const { user, token, loading, logout } = useAuth();

  const [activeTool, setTool] = useState("pen");
  const [board, setBoard] = useState<Board | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [initialActions, setInitialActions] = useState<ReplayAction[]>([]);
  const [boardLoading, setBoardLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const whiteboardRef = useRef<{
    handleUndo?: () => void;
    handleRedo?: () => void;
    exportAsImage?: () => void;
  } | null>(null);

  const handleUndo = () => whiteboardRef.current?.handleUndo?.();
  const handleRedo = () => whiteboardRef.current?.handleRedo?.();
  const handleExport = () => whiteboardRef.current?.exportAsImage?.();

  const inviteLink = useMemo(() => {
    if (!boardId) {
      return "/board";
    }

    return `/board/${boardId}`;
  }, [boardId]);

  useEffect(() => {
    if (!loading && !token) {
      router.push("/auth");
    }
  }, [loading, token, router]);

  useEffect(() => {
    if (!token || !boardId) {
      return;
    }

    let cancelled = false;

    async function loadBoard() {
      setBoardLoading(true);

      try {
        const [boardResponse, replayResponse] = await Promise.all([
          axios.get<Board>(`${process.env.NEXT_PUBLIC_API_URL}/board/${boardId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get<ReplayAction[]>(`${process.env.NEXT_PUBLIC_API_URL}/board/${boardId}/replay`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (cancelled) {
          return;
        }

        setBoard(boardResponse.data);
        setInitialActions(replayResponse.data || []);
      } catch (requestError: unknown) {
        if (cancelled) {
          return;
        }

        const status = axios.isAxiosError(requestError)
          ? requestError.response?.status
          : undefined;

        if (status === 401) {
          router.push("/auth");
          return;
        }

        if (status === 403) {
          setShowRequestAccess(true);
          setBoardLoading(false);
          return;
        }

        if (status === 404) {
          setError("Board not found.");
          setBoardLoading(false);
          return;
        }

        const message = axios.isAxiosError(requestError)
          ? requestError.response?.data?.message
          : undefined;

        setError(message || "Unable to load the board.");
      } finally {
        if (!cancelled) {
          setBoardLoading(false);
        }
      }
    }

    loadBoard();

    return () => {
      cancelled = true;
    };
  }, [token, boardId, router]);

  useEffect(() => {
    if (!token || !boardId) {
      return;
    }

    setSocketAuthToken(token);

    if (!socket.connected) {
      socket.connect();
    }

    const handlePresence = (payload: { users?: unknown }) => {
      setOnlineUsers(toUsernames(payload?.users));
    };

    const handleTyping = (payload: { users?: unknown }) => {
      setTypingUsers(toUsernames(payload?.users));
    };

    const handleChat = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleBoardState = (actions: ReplayAction[]) => {
      setInitialActions(actions || []);
    };

    const handleSocketError = (payload: { message?: string }) => {
      setError(payload?.message || "Socket error");
    };

    socket.on("presence", handlePresence);
    socket.on("typing", handleTyping);
    socket.on("chat", handleChat);
    socket.on("board-state", handleBoardState);
    socket.on("socket-error", handleSocketError);

    socket.emit("join-board", { boardId }, (response: { ok?: boolean; board?: Board; message?: string }) => {
      if (!response?.ok) {
        setError(response?.message || "Unable to join board");
        return;
      }

      if (response.board) {
        setBoard(response.board);
      }

      socket.emit("get-board", { boardId }, (boardState: { ok?: boolean; actions?: ReplayAction[]; message?: string }) => {
        if (!boardState?.ok) {
          setError(boardState?.message || "Unable to load board state");
          return;
        }

        setInitialActions(boardState.actions || []);
      });
    });

    return () => {
      socket.off("presence", handlePresence);
      socket.off("typing", handleTyping);
      socket.off("chat", handleChat);
      socket.off("board-state", handleBoardState);
      socket.off("socket-error", handleSocketError);
      socket.disconnect();
    };
  }, [token, boardId]);

  const handleSend = () => {
    const text = chatInput.trim();

    if (!text || !boardId) {
      return;
    }

    socket.emit("chat", {
      boardId,
      payload: {
        text,
      },
    });

    setChatInput("");
  };

  const handleTyping = (value: string) => {
    if (!boardId) {
      return;
    }

    socket.emit("typing", {
      boardId,
      payload: {
        typing: Boolean(value.trim()),
      },
    });
  };

  if (loading || boardLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        Loading board...
      </div>
    );
  }
  if (showRequestAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">

        <div className="bg-slate-900 p-8 rounded-xl w-[420px]">

          <h1 className="text-2xl font-bold text-white mb-4">
            Private Board
          </h1>

          <p className="text-slate-300 mb-6">
            You don't have permission to access this board.
          </p>

          <button
            disabled={requestLoading}
            onClick={async () => {

              try {

                setRequestLoading(true);

                await axios.post(
                  `${process.env.NEXT_PUBLIC_API_URL}/board/${boardId}/request`,
                  {},
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                alert("Request sent successfully.");

                router.push("/dashboard");

              } catch (err: any) {

                alert(
                  err.response?.data?.message ??
                  "Unable to send request."
                );

              } finally {

                setRequestLoading(false);

              }

            }}
            className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700"
          >
            {requestLoading
              ? "Sending..."
              : "Request Access"}
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <TopBar
        boardId={boardId!}
        boardTitle={board?.title || "Untitled Board"}
        token={token!}
        inviteLink={inviteLink}
        onTitleChange={(title) =>
          setBoard((prev) =>
            prev
              ? {
                ...prev,
                title,
              }
              : prev
          )
        }
        onLogout={() => {
          logout();
          router.push("/auth");
        }}
      />

      <div className="flex-1 flex flex-row gap-4 p-4 sm:p-8">
        <div className="hidden md:flex flex-col items-center">
          <SidebarToolbar
            activeTool={activeTool}
            setTool={setTool}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onExport={handleExport}
          />
        </div>

        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          {error && (
            <div className="w-full max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          <WhiteboardCanvas
            key={boardId}
            ref={whiteboardRef}
            boardId={boardId || ""}
            authenticatedUser={user}
            activeTool={activeTool}
            initialActions={initialActions}
          />
        </main>

        <div className="hidden lg:flex flex-col">
          <ChatPanel
            currentUserId={user?.id || ""}
            messages={messages}
            input={chatInput}
            setInput={setChatInput}
            onSend={handleSend}
            typingUsers={typingUsers}
            onlineUsers={onlineUsers}
            onInputChange={handleTyping}
          />
        </div>
      </div>
    </div>
  );
}
