"use client";

import { Loader2, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  summary: string;
}

export default function AISummaryDialog({
  open,
  onOpenChange,
  loading,
  summary,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                AI Board Summary
              </h2>

              <p className="text-sm text-neutral-500">
                Automatically generated from your whiteboard
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">

          {loading ? (
            <div className="flex h-60 flex-col items-center justify-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
              </div>

              <div className="text-center">
                <p className="font-medium">
                  AI is analyzing your board...
                </p>

                <p className="mt-1 text-sm text-neutral-500">
                  Understanding relationships, structure and key ideas.
                </p>
              </div>

            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">

              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mb-4">{children}</h1>
                  ),

                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold mt-6 mb-3">
                      {children}
                    </h2>
                  ),

                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold mt-5 mb-2 text-violet-600 dark:text-violet-400">
                      {children}
                    </h3>
                  ),

                  p: ({ children }) => (
                    <p className="leading-7 mb-4 text-neutral-700 dark:text-neutral-300">
                      {children}
                    </p>
                  ),

                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 space-y-2 mb-5">
                      {children}
                    </ul>
                  ),

                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 space-y-2 mb-5">
                      {children}
                    </ol>
                  ),

                  li: ({ children }) => (
                    <li className="leading-7">
                      {children}
                    </li>
                  ),

                  strong: ({ children }) => (
                    <strong className="font-semibold text-neutral-900 dark:text-white">
                      {children}
                    </strong>
                  ),

                  code: ({ children }) => (
                    <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-sm">
                      {children}
                    </code>
                  ),
                }}
              >
                {summary}
              </ReactMarkdown>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}