"use client";

import axios from "axios";
import { Board } from "./BoardCard";

interface Props {
  board: Board;
  token: string;
  onClose: () => void;
  onBoardUpdate: (board: Board) => void;
}

export default function ManageRequestsDialog({
  board,
  token,
  onClose,
  onBoardUpdate,
}: Props) {
  async function approve(requestId: string) {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/board/${board._id}/requests/${requestId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const approvedRequest = board.pendingRequests.find(
        (r) => r._id === requestId
      );

      if (!approvedRequest) return;

      onBoardUpdate({
        ...board,
        members: [...board.members, approvedRequest.user],
        pendingRequests: board.pendingRequests.filter(
          (r) => r._id !== requestId
        ),
      });
    } catch (err: any) {
      alert(err.response?.data?.message || "Unable to approve request.");
    }
  }

  async function reject(requestId: string) {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/board/${board._id}/requests/${requestId}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onBoardUpdate({
        ...board,
        pendingRequests: board.pendingRequests.filter(
          (r) => r._id !== requestId
        ),
      });
    } catch (err: any) {
      alert(err.response?.data?.message || "Unable to reject request.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">

      <div className="w-full max-w-lg rounded-xl bg-slate-900 p-6">

        <div className="mb-6 flex items-center justify-between">

          <h2 className="text-2xl font-bold text-white">
            Pending Requests
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-white"
          >
            ✕
          </button>

        </div>

        {board.pendingRequests.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            No pending requests.
          </div>
        ) : (
          <div className="space-y-4">

            {board.pendingRequests.map((request) => (
              <div
                key={request._id}
                className="rounded-lg border border-slate-700 p-4"
              >

                <h3 className="font-semibold text-white">
                  {request.user.username}
                </h3>

                <p className="text-sm text-gray-400">
                  {request.user.email}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Requested{" "}
                  {new Date(request.requestedAt).toLocaleString()}
                </p>

                <div className="mt-4 flex gap-3">

                  <button
                    onClick={() => approve(request._id)}
                    className="flex-1 rounded bg-green-600 py-2 text-white hover:bg-green-700"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => reject(request._id)}
                    className="flex-1 rounded bg-red-600 py-2 text-white hover:bg-red-700"
                  >
                    Reject
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}