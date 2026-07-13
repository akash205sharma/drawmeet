"use client";

import { useState } from "react";
import { generateDiagram } from "@/lib/ai";

interface Props {
  open: boolean;
  onClose: () => void;
  token: string | null;
  boardId: string | undefined;
}

export default function GenerateDiagramDialog({
  open,
  onClose,
  token,
  boardId,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleGenerate() {
    if (!prompt.trim()) return;

    try {
      setLoading(true);

      await generateDiagram({
        token,
        boardId,
        prompt,
      });

      onClose();
      setPrompt("");
    } catch (err) {
      console.error(err);
      alert("Failed to generate diagram");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl w-[500px] p-6 space-y-5">

        <h2 className="text-xl font-semibold">
          Generate Diagram
        </h2>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: Generate a login architecture diagram"
          className="border rounded-lg w-full p-3 h-40"
        />

        <div className="flex justify-end gap-3">

          <button
            onClick={onClose}
            className="border px-4 py-2 rounded-lg"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={handleGenerate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            {loading ? "Generating..." : "Generate"}
          </button>

        </div>

      </div>
    </div>
  );
}