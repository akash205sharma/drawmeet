"use client";


import { Plus, LogOut, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import BoardCard, { Board } from "@/components/dashboard/BoardCard";

export default function Dashboard() {
  const { user, token, loading, logout } = useAuth();

  const router = useRouter();

  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !token) {
      router.push("/auth");
      return;
    }

    if (!loading && token) {
      loadBoards();
    }
  }, [loading, token]);

  async function loadBoards() {
    try {
      const { data } = await axios.get<Board[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/board`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBoards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setBoardsLoading(false);
    }
  }

  async function createBoard() {
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/board`,
        {
          title: "Untitled Board",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      router.push(`/board/${data._id || data.id}`);
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteBoard(boardId: string) {
    const confirmDelete = window.confirm(
      "Delete this board?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/board/${boardId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBoards((prev) =>
        prev.filter((board) => board._id !== boardId)
      );
    } catch (err: any) {
      alert(
        err.response?.data?.message ??
        "Unable to delete board."
      );
    }
  }

  if (loading || boardsLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-white bg-slate-950">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

      {/* Header */}

      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">

          <div className="flex items-center gap-4">

            <div className="rounded-xl bg-blue-600 p-3">

              <LayoutDashboard size={24} />

            </div>

            <div>

              <h1 className="text-3xl font-bold tracking-tight">
                DrawMeet
              </h1>

              <p className="text-sm text-slate-400">
                Collaborative Whiteboard Workspace
              </p>

            </div>

          </div>

          <div className="flex items-center gap-5">

            <div className="text-right">

              <p className="text-sm text-slate-400">
                Welcome back
              </p>

              <p className="font-semibold">
                {user?.username}
              </p>

            </div>

            <button
              onClick={() => {
                logout();
                router.push("/auth");
              }}
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 transition hover:bg-red-500 hover:text-white"
            >
              <LogOut size={18} />
              Logout
            </button>

          </div>

        </div>

      </header>

      <main className="mx-auto max-w-7xl px-8 py-10">

        {/* Top Section */}

        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div>

            <h2 className="text-3xl font-bold">
              Your Boards
            </h2>

            <p className="mt-2 text-slate-400">
              Create, collaborate and manage all your whiteboards.
            </p>

          </div>

          <button
            onClick={createBoard}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30"
          >
            <Plus size={20} />
            New Board
          </button>

        </div>

        {/* Stats */}

        <div className="mb-10 grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">

            <p className="text-sm text-slate-400">
              Total Boards
            </p>

            <h3 className="mt-3 text-4xl font-bold">
              {boards.length}
            </h3>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">

            <p className="text-sm text-slate-400">
              Owned Boards
            </p>

            <h3 className="mt-3 text-4xl font-bold">
              {boards.filter(b => b.owner._id === user?.id).length}
            </h3>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">

            <p className="text-sm text-slate-400">
              Shared With You
            </p>

            <h3 className="mt-3 text-4xl font-bold">
              {boards.filter(b => b.owner._id !== user?.id).length}
            </h3>

          </div>

        </div>

        {/* Empty */}

        {boards.length === 0 ? (

          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-20 text-center">

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800">

              <LayoutDashboard size={36} />

            </div>

            <h2 className="text-2xl font-bold">
              No Boards Yet
            </h2>

            <p className="mt-3 text-slate-400">
              Create your first collaborative whiteboard.
            </p>

            <button
              onClick={createBoard}
              className="mt-8 rounded-xl bg-blue-600 px-6 py-3 transition hover:bg-blue-700"
            >
              Create Board
            </button>

          </div>

        ) : (

          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">

            {boards.map((board) => (

              <BoardCard
                key={board._id}
                board={board}
                token={token!}
                currentUserId={user!.id}
                onOpen={() => router.push(`/board/${board._id}`)}
                onDelete={deleteBoard}
                onBoardUpdate={(updatedBoard) => {
                  setBoards((prev) =>
                    prev.map((b) =>
                      b._id === updatedBoard._id
                        ? updatedBoard
                        : b
                    )
                  );
                }}
              />

            ))}

          </div>

        )}

      </main>

    </div>
  );

}