"use client";

import { useState } from "react";
import ManageRequestsDialog from "./ManageRequestsDialog";
import InviteMemberDialog from "./InviteMemberDialog";

import {
  FolderKanban,
  Users,
  Clock3,
  Crown,
  UserPlus,
  ClipboardList,
  Pencil,
  Trash2,
  ArrowRight,
} from "lucide-react";

interface User {
  _id: string;
  username: string;
  email: string;
}

interface JoinRequest {
  _id: string;
  user: User;
  requestedAt: string;
}

export interface Board {
  _id: string;
  title: string;
  updatedAt: string;
  owner: User;
  members: User[];
  pendingRequests: JoinRequest[];
}

interface Props {
  board: Board;
  token: string;
  currentUserId: string;
  onOpen: () => void;
  onBoardUpdate: (board: Board) => void;
  onDelete: (boardId: string) => void;
}

export default function BoardCard({
  board,
  token,
  currentUserId,
  onOpen,
  onBoardUpdate,
  onDelete,
}: Props) {
  const isOwner = board.owner._id === currentUserId;

  const [showRequests, setShowRequests] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  return (
    <>
      <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

        {/* Header */}

        <div className="border-b border-slate-100 p-6">

          <div className="flex items-start justify-between">

            <div className="flex items-center gap-4">

              <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">

                <FolderKanban size={28} />

              </div>

              <div>

                <h2 className="text-xl font-semibold text-slate-900">
                  {board.title}
                </h2>

                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">

                  <Crown size={14} className="text-amber-500" />

                  <span>
                    {isOwner ? "Owned by You" : board.owner.username}
                  </span>

                </div>

              </div>

            </div>

            {isOwner && board.pendingRequests.length > 0 && (

              <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">

                {board.pendingRequests.length} Pending

              </div>

            )}

          </div>

        </div>

        {/* Details */}

        <div className="space-y-5 p-6">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3 text-slate-600">

              <Users size={18} className="text-blue-600" />

              <span>Members</span>

            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">

              {board.members.length}

            </span>

          </div>

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3 text-slate-600">

              <Clock3 size={18} className="text-emerald-600" />

              <span>Last Updated</span>

            </div>

            <span className="text-sm text-slate-500">

              {new Date(board.updatedAt).toLocaleDateString()}

            </span>

          </div>

        </div>

        {/* Footer */}

        <div className="border-t border-slate-100 bg-slate-50 p-5">

          <button
            onClick={onOpen}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Open Board
            <ArrowRight size={18} />
          </button>

          {isOwner && (

            <div className="grid grid-cols-3 gap-3">

              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <UserPlus size={17} />
                Invite
              </button>

              <button
                onClick={() => setShowRequests(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
              >
                <ClipboardList size={17} />
                Requests
              </button>

              {/* <button
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
              >
                <Pencil size={17} />
                Rename
              </button> */}

              <button
                onClick={() => onDelete(board._id)}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-2 text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={17} />
                Delete
              </button>

            </div>

          )}

        </div>

      </div>

      {showRequests && (
        <ManageRequestsDialog
          board={board}
          token={token}
          onClose={() => setShowRequests(false)}
          onBoardUpdate={onBoardUpdate}
        />
      )}

      {showInvite && (
        <InviteMemberDialog
          board={board}
          token={token}
          onClose={() => setShowInvite(false)}
        />
      )}
    </>
  );
}