"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import { Copy, LogOut, Pencil } from "lucide-react";

interface TopBarProps {
  boardId: string;
  boardTitle: string;
  inviteLink: string;
  token: string;
  onTitleChange: (title: string) => void;
  onLogout: () => void;
}

export default function TopBar({
  boardId,
  boardTitle,
  inviteLink,
  token,
  onTitleChange,
  onLogout,
}: TopBarProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(boardTitle);
  const [saving, setSaving] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
  };

  async function saveTitle() {
    const newTitle = title.trim();

    if (!newTitle || newTitle === boardTitle) {
      setTitle(boardTitle);
      setEditing(false);
      return;
    }

    try {
      setSaving(true);

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/board/${boardId}`,
        {
          title: newTitle,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onTitleChange(newTitle);
      setEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Unable to rename board.");
      setTitle(boardTitle);
    } finally {
      setSaving(false);
    }
  }

  return (
    <header className="w-full flex items-center justify-between px-6 py-3 bg-white/80 dark:bg-neutral-900/80 shadow-sm rounded-b-xl">
      <div className="flex items-center gap-2">
        {editing ? (
          <input
            autoFocus
            value={title}
            disabled={saving}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                saveTitle();
              }

              if (e.key === "Escape") {
                setTitle(boardTitle);
                setEditing(false);
              }
            }}
            className="rounded border bg-transparent px-2 py-1 font-bold text-lg outline-none"
          />
        ) : (
          <>
            <div className="font-bold text-lg tracking-tight truncate max-w-[40vw]">
              {boardTitle}
            </div>

            <button onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex gap-1"
        >
          <Copy className="w-4 h-4" />
          <span className="hidden sm:inline">Invite</span>
        </Button>

        <Button variant="ghost" size="icon" onClick={onLogout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}