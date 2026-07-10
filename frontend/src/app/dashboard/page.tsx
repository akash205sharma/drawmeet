"use client";

import { Plus, LogOut, LayoutDashboard, Trash2 } from "lucide-react";
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
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && (!token || !user)) {
      router.push("/auth");
      return;
    }

    if (!loading && token) {
      loadBoards();
    }
  }, [loading, token, user]);

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

  async function deleteBoard() {
    if (!boardToDelete) return;

    try {
      setDeleting(true);

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/board/${boardToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBoards((prev) =>
        prev.filter((board) => board._id !== boardToDelete._id)
      );

      setBoardToDelete(null);
    } catch (err: any) {
      alert(
        err.response?.data?.message ??
        "Unable to delete board."
      );
    } finally {
      setDeleting(false);
    }
  }


  if (loading || boardsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-md">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-slate-900">

      {/* HEADER */}

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">

          <div className="flex items-center gap-4">

            <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">

              <LayoutDashboard size={26} />

            </div>

            <div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                DrawMeet
              </h1>

              <p className="text-sm text-slate-500">
                Collaborative Whiteboard Workspace
              </p>

            </div>

          </div>

          <div className="flex items-center gap-6">

            <div className="text-right">

              <p className="text-sm text-slate-500">
                Welcome back
              </p>

              <h3 className="font-semibold text-slate-900 text-lg">
                {user?.username}
              </h3>

            </div>

            <button
              onClick={() => {
                logout();
                router.push("/auth");
              }}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
              Logout
            </button>

          </div>

        </div>

      </header>

      <main className="mx-auto max-w-7xl px-8 py-10">

        {/* TOP */}

        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          <div>

            <h2 className="text-4xl font-bold text-slate-900">
              Your Boards
            </h2>

            <p className="mt-2 text-slate-500 max-w-xl">
              Create, organize and collaborate with your team on
              interactive whiteboards.
            </p>

          </div>

          <button
            onClick={createBoard}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
          >
            <Plus size={20} />
            New Board
          </button>

        </div>

        {/* STATS */}

        <div className="mb-12 grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">

            <p className="text-sm text-slate-500">
              Total Boards
            </p>

            <h2 className="mt-3 text-4xl font-bold text-slate-900">
              {boards.length}
            </h2>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">

            <p className="text-sm text-slate-500">
              Owned Boards
            </p>

            <h2 className="mt-3 text-4xl font-bold text-slate-900">
              {boards.filter((b) => b.owner._id === user?.id).length}
            </h2>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">

            <p className="text-sm text-slate-500">
              Shared With You
            </p>

            <h2 className="mt-3 text-4xl font-bold text-slate-900">
              {boards.filter((b) => b.owner._id !== user?.id).length}
            </h2>

          </div>

        </div>

        {boards.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-20 text-center shadow-sm">

            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-blue-600">

              <LayoutDashboard size={42} />

            </div>

            <h2 className="text-3xl font-bold text-slate-900">
              No Boards Yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-slate-500">
              Create your first collaborative whiteboard and invite
              your teammates to brainstorm, draw and work together in
              real time.
            </p>

            <button
              onClick={createBoard}
              className="mt-8 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
            >
              Create Your First Board
            </button>

          </div>

        ) : (

          <>

            <div className="mb-8 flex items-center justify-between">

              <h3 className="text-xl font-semibold text-slate-900">
                Recent Boards
              </h3>

              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                {boards.length} Boards
              </span>

            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

              {boards.map((board) => (

                <BoardCard
                  key={board._id}
                  board={board}
                  token={token!}
                  currentUserId={user?.id ?? ""}
                  onOpen={() => router.push(`/board/${board._id}`)}
                  onDelete={(id) => {
                    const board = boards.find((b) => b._id === id);
                    if (board) setBoardToDelete(board);
                  }}
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

          </>

        )}

      </main>

      {boardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">

              <Trash2 className="text-red-600" size={30} />

            </div>

            <h2 className="text-center text-2xl font-bold text-slate-900">
              Delete Board?
            </h2>

            <p className="mt-3 text-center text-slate-500">
              This will permanently delete
            </p>

            <p className="mt-1 text-center font-semibold text-slate-900">
              "{boardToDelete.title}"
            </p>

            <p className="mt-4 text-center text-sm text-slate-500">
              This action cannot be undone.
            </p>

            <div className="mt-8 flex gap-3">

              <button
                onClick={() => setBoardToDelete(null)}
                className="flex-1 rounded-xl border border-slate-300 py-3 font-medium transition hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={deleteBoard}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>



  );

}