import { Button } from "./ui/button";
import {
  Pencil,
  Square,
  Type,
  StickyNote,
  Undo2,
  Redo2,
  Download,
  Eraser,
  Sparkles,
  ScrollText,
} from "lucide-react";

const tools = [
  { icon: Pencil, label: "Pen", value: "pen" },
  { icon: Square, label: "Shapes", value: "shapes" },
  { icon: Type, label: "Text", value: "text" },
  { icon: StickyNote, label: "Sticky", value: "sticky" },
  { icon: Eraser, label: "Eraser", value: "eraser" },
];

export default function SidebarToolbar({
  activeTool,
  setTool,
  onUndo,
  onRedo,
  onExport,
  onAI,
  onSummarize,
}: {
  activeTool: string;
  setTool: (tool: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onAI: () => void;
  onSummarize: () => void;
}) {
  return (
    <aside className="flex flex-col items-center gap-2 rounded-xl border bg-white/90 dark:bg-neutral-900/90 p-3 shadow-lg backdrop-blur-md">
      {/* Drawing Tools */}
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Tools
      </div>

      {tools.map(({ icon: Icon, label, value }) => (
        <Button
          key={value}
          variant={activeTool === value ? "default" : "ghost"}
          size="icon"
          aria-label={label}
          title={label}
          onClick={() => setTool(value)}
          className="transition-all hover:scale-105"
        >
          <Icon className="h-5 w-5" />
        </Button>
      ))}

      <div className="my-2 h-px w-8 bg-border" />

      {/* AI Tools */}
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        AI
      </div>

      <Button
        variant="outline"
        size="icon"
        aria-label="Generate Diagram"
        title="Generate Diagram"
        onClick={onAI}
        className="border-violet-200 hover:bg-violet-50 dark:hover:bg-violet-950 transition-all hover:scale-105"
      >
        <Sparkles className="h-5 w-5 text-violet-500" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        aria-label="Summarize Board"
        title="Summarize Board"
        onClick={onSummarize}
        className="border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all hover:scale-105"
      >
        <ScrollText className="h-5 w-5 text-blue-500" />
      </Button>

      <div className="my-2 h-px w-8 bg-border" />

      {/* History */}
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Edit
      </div>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Undo"
        title="Undo"
        onClick={onUndo}
        className="transition-all hover:scale-105"
      >
        <Undo2 className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Redo"
        title="Redo"
        onClick={onRedo}
        className="transition-all hover:scale-105"
      >
        <Redo2 className="h-5 w-5" />
      </Button>

      <div className="my-2 h-px w-8 bg-border" />

      {/* Export */}
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Share
      </div>

      <Button
        variant="outline"
        size="icon"
        aria-label="Export"
        title="Export"
        onClick={onExport}
        className="transition-all hover:scale-105"
      >
        <Download className="h-5 w-5" />
      </Button>
    </aside>
  );
}