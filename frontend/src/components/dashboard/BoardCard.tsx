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
    console.log("isOwner", isOwner, board, currentUserId);

    const [showRequests, setShowRequests] = useState(false);
    const [showInvite, setShowInvite] = useState(false);

    return (
        <>
            <div className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10">

                {/* Top */}

                <div className="border-b border-slate-800 p-6">

                    <div className="flex items-start justify-between">

                        <div className="flex items-center gap-4">

                            <div className="rounded-2xl bg-blue-600/20 p-3 text-blue-400">

                                <FolderKanban size={28} />

                            </div>

                            <div>

                                <h2 className="text-xl font-bold text-white">
                                    {board.title}
                                </h2>

                                <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">

                                    <Crown size={14} />

                                    <span>
                                        {isOwner ? "You" : board.owner.username}
                                    </span>

                                </div>

                            </div>

                        </div>

                        {isOwner && board.pendingRequests.length > 0 && (

                            <div className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">

                                {board.pendingRequests.length} Request
                                {board.pendingRequests.length > 1 ? "s" : ""}

                            </div>

                        )}

                    </div>

                </div>

                {/* Stats */}

                <div className="space-y-5 p-6">

                    <div className="flex items-center justify-between">

                        <div className="flex items-center gap-3 text-slate-300">

                            <Users size={18} className="text-blue-400" />

                            Members

                        </div>

                        <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold">

                            {board.members.length}

                        </span>

                    </div>

                    <div className="flex items-center justify-between">

                        <div className="flex items-center gap-3 text-slate-300">

                            <Clock3 size={18} className="text-emerald-400" />

                            Updated

                        </div>

                        <span className="text-sm text-slate-400">

                            {new Date(board.updatedAt).toLocaleDateString()}

                        </span>

                    </div>

                </div>

                {/* Actions */}

                <div className="border-t border-slate-800 bg-slate-900/50 p-5">

                    <button
                        onClick={onOpen}
                        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-medium transition hover:bg-blue-700"
                    >
                        Open Board

                        <ArrowRight size={18} />
                    </button>

                    {isOwner && (

                        <div className="grid grid-cols-2 gap-3">

                            <button
                                onClick={() => setShowInvite(true)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 py-2 transition hover:border-emerald-500 hover:bg-emerald-500/10"
                            >
                                <UserPlus size={17} />

                                Invite

                            </button>

                            <button
                                onClick={() => setShowRequests(true)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 py-2 transition hover:border-yellow-500 hover:bg-yellow-500/10"
                            >
                                <ClipboardList size={17} />

                                Requests

                            </button>

                            <button
                                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 py-2 transition hover:border-blue-500 hover:bg-blue-500/10"
                            >
                                <Pencil size={17} />

                                Rename

                            </button>

                            <button
                                onClick={() => onDelete(board._id)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 py-2 text-red-400 transition hover:bg-red-500 hover:text-white"
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