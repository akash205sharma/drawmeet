"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Board {
  _id: string;
  title: string;
  updatedAt: string;
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      fetchBoards();
    }
  }, [loading]);

  async function fetchBoards() {
    try {
      const token = localStorage.getItem("token");

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
      console.log(err);
    } finally {
      setBoardsLoading(false);
    }
  }

  async function createBoard() {
    const token = localStorage.getItem("token");

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

    router.push(`/board/${data._id}`);
  }

  if (loading || boardsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <header className="flex items-center justify-between border-b border-slate-800 px-10 py-6">

        <div>
          <h1 className="text-3xl font-bold">
            DrawMeet
          </h1>

          <p className="text-gray-400">
            Welcome {user?.username}
          </p>
        </div>

        <button
          onClick={() => {
            logout();
            router.push("/auth");
          }}
          className="rounded bg-red-600 px-4 py-2"
        >
          Logout
        </button>

      </header>

      <main className="mx-auto max-w-7xl p-10">

        <div className="mb-8 flex justify-between">

          <h2 className="text-2xl font-semibold">
            Your Boards
          </h2>

          <button
            onClick={createBoard}
            className="rounded bg-blue-600 px-5 py-3"
          >
            + New Board
          </button>

        </div>

        {boards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-16 text-center">
            No boards yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <div
                key={board._id}
                onClick={() => router.push(`/board/${board._id}`)}
                className="cursor-pointer rounded-xl bg-slate-800 p-6 transition hover:bg-slate-700"
              >
                <h3 className="mb-3 text-xl font-semibold">
                  {board.title}
                </h3>

                <p className="text-sm text-gray-400">
                  Updated
                </p>

                <p>
                  {new Date(board.updatedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}