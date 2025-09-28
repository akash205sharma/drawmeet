import { Button } from "./ui/button";
import { Copy, LogOut } from "lucide-react";

export default function TopBar({ boardTitle, inviteLink, onLogout }: { boardTitle: string; inviteLink: string; onLogout: () => void }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
  };
  return (
    <header className="w-full flex items-center justify-between px-6 py-3 bg-white/80 dark:bg-neutral-900/80 shadow-sm rounded-b-xl">
      <div className="font-bold text-lg tracking-tight truncate max-w-[40vw]">{boardTitle}</div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy} className="flex gap-1">
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
