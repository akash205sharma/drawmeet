"use client";

import { useState } from "react";
import axios from "axios";
import { X, Mail, UserPlus } from "lucide-react";
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
      setMessage("Please enter an email address.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/board/${board._id}/invite`,
        { email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(data.message || "Member invited successfully.");
      setEmail("");
    } catch (err: any) {
      setMessage(
        err.response?.data?.message ??
          "Unable to invite member."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">

      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <UserPlus size={22} />
            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Invite Member
              </h2>

              <p className="text-sm text-slate-500">
                Invite someone to collaborate.
              </p>

            </div>

          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={20} />
          </button>

        </div>

        {/* Body */}

        <div className="space-y-5 p-6">

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email Address
            </label>

            <div className="relative">

              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

          </div>

          {message && (

            <div
              className={`rounded-xl border p-3 text-sm ${
                message.toLowerCase().includes("success") ||
                message.toLowerCase().includes("added")
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>

          )}

        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={invite}
            className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Inviting..." : "Send Invite"}
          </button>

        </div>

      </div>

    </div>
  );
}