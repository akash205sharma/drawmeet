import { Button } from "./ui/button";
import { Pencil, Square, Type, StickyNote, Undo2, Redo2, Download } from "lucide-react";

const tools = [
  { icon: Pencil, label: "Pen", value: "pen" },
  { icon: Square, label: "Shapes", value: "shapes" },
  { icon: Type, label: "Text", value: "text" },
  { icon: StickyNote, label: "Sticky", value: "sticky" },
];

export default function SidebarToolbar({ activeTool, setTool, onUndo, onRedo, onExport }: {
  activeTool: string;
  setTool: (tool: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
}) {
  return (
    <aside className="flex flex-col gap-2 p-3 bg-white/80 dark:bg-neutral-900/80 rounded-xl shadow-md items-center">
      {tools.map(({ icon: Icon, label, value }) => (
        <Button
          key={value}
          variant={activeTool === value ? "default" : "ghost"}
          size="icon"
          aria-label={label}
          onClick={() => setTool(value)}
          className="mb-1"
        >
          <Icon className="w-5 h-5" />
        </Button>
      ))}
      <div className="h-4" />
      <Button variant="ghost" size="icon" aria-label="Undo" onClick={onUndo}>
        <Undo2 className="w-5 h-5" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Redo" onClick={onRedo}>
        <Redo2 className="w-5 h-5" />
      </Button>
      <div className="h-4" />
      <Button variant="outline" size="icon" aria-label="Export" onClick={onExport}>
        <Download className="w-5 h-5" />
      </Button>
    </aside>
  );
}
