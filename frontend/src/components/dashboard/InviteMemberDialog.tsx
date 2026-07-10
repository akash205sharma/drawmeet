"use client";

import { useState } from "react";
import axios from "axios";
import { Board } from "./BoardCard";

interface Props {
  board: Board;
  token: string;
  onClose: () => void;
}

export default function InviteMemberDialog({
  board,
  token,
  onClose,
}: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function invite() {
    if (!email.trim()) {
      setMessage("Please enter an email.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/board/${board._id}/invite`,
        {
          email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(data.message || "Member added successfully.");

      setEmail("");
    } catch (err: any) {
      setMessage(
        err.response?.data?.message || "Unable to invite member."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">

      <div className="w-full max-w-md rounded-xl bg-slate-900 p-6">

        <div className="mb-6 flex items-center justify-between">

          <h2 className="text-2xl font-bold text-white">
            Invite Member
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-white"
          >
            ✕
          </button>

        </div>

        <label className="mb-2 block text-sm text-gray-300">
          Email Address
        </label>

        <input
          type="email"
          placeholder="abc@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
        />

        {message && (
          <p className="mt-4 text-sm text-gray-300">
            {message}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="rounded bg-slate-700 px-5 py-2 text-white hover:bg-slate-600"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={invite}
            className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Inviting..." : "Invite"}
          </button>

        </div>

      </div>

    </div>
  );
}