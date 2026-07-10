"use client";

import axios from "axios";
import {
  X,
  UserCheck,
  UserX,
  Users,
  Mail,
  Calendar,
} from "lucide-react";
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
      alert(
        err.response?.data?.message ||
          "Unable to approve request."
      );
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
      alert(
        err.response?.data?.message ||
          "Unable to reject request."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">

      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
              <Users size={22} />
            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Pending Requests
              </h2>

              <p className="text-sm text-slate-500">
                Review collaboration requests.
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

        <div className="max-h-[500px] overflow-y-auto p-6">

          {board.pendingRequests.length === 0 ? (

            <div className="py-16 text-center">

              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">

                <Users size={34} className="text-slate-400" />

              </div>

              <h3 className="text-xl font-semibold text-slate-900">
                No Pending Requests
              </h3>

              <p className="mt-2 text-slate-500">
                You're all caught up.
              </p>

            </div>

          ) : (

            <div className="space-y-5">

              {board.pendingRequests.map((request) => (

                <div
                  key={request._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >

                  <div className="flex items-start justify-between">

                    <div className="flex items-center gap-4">

                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">

                        {request.user.username.charAt(0).toUpperCase()}

                      </div>

                      <div>

                        <h3 className="font-semibold text-slate-900">
                          {request.user.username}
                        </h3>

                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          <Mail size={15} />
                          {request.user.email}
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                          <Calendar size={14} />
                          Requested on{" "}
                          {new Date(
                            request.requestedAt
                          ).toLocaleString()}
                        </div>

                      </div>

                    </div>

                  </div>

                  <div className="mt-5 flex gap-3">

                    <button
                      onClick={() => approve(request._id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 font-medium text-white transition hover:bg-green-700"
                    >
                      <UserCheck size={18} />
                      Approve
                    </button>

                    <button
                      onClick={() => reject(request._id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 font-medium text-red-600 transition hover:bg-red-100"
                    >
                      <UserX size={18} />
                      Reject
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}