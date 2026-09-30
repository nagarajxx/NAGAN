import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse markdown into sections
  const renderFormattedText = (raw: string) => {
    // Split by code blocks first
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let codeIndex = 0;

    while ((match = codeBlockRegex.exec(raw)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <div key={`text-${lastIndex}`} className="space-y-3">
            {renderMarkdownBlocks(raw.slice(lastIndex, match.index))}
          </div>
        );
      }

      const lang = match[1] || "text";
      const codeSnippet = match[2];
      const currentCodeIndex = codeIndex++;

      parts.push(
        <div
          key={`code-${match.index}`}
          className="my-4 rounded-xl border border-slate-700/80 bg-slate-950 overflow-hidden shadow-md"
        >
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
            <span className="font-mono text-xs uppercase text-slate-300 font-semibold tracking-wider">
              {lang}
            </span>
            <button
              onClick={() => handleCopy(codeSnippet, currentCodeIndex)}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer text-xs"
              title="Copy code"
            >
              {copiedIndex === currentCodeIndex ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed text-emerald-300/90 bg-slate-950">
            <code>{codeSnippet}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < raw.length) {
      parts.push(
        <div key={`text-end`} className="space-y-3">
          {renderMarkdownBlocks(raw.slice(lastIndex))}
        </div>
      );
    }

    return parts;
  };

  const renderMarkdownBlocks = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let listType: "ul" | "ol" | null = null;

    const flushList = () => {
      if (currentList.length > 0 && listType) {
        if (listType === "ul") {
          elements.push(
            <ul
              key={`list-${elements.length}`}
              className="list-disc list-inside space-y-1.5 my-2 text-slate-200 pl-2 leading-relaxed"
            >
              {currentList.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {parseInlineFormatting(item)}
                </li>
              ))}
            </ul>
          );
        } else {
          elements.push(
            <ol
              key={`list-${elements.length}`}
              className="list-decimal list-inside space-y-1.5 my-2 text-slate-200 pl-2 leading-relaxed"
            >
              {currentList.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {parseInlineFormatting(item)}
                </li>
              ))}
            </ol>
          );
        }
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Heading 1
      if (trimmed.startsWith("# ")) {
        flushList();
        elements.push(
          <h1
            key={`h1-${idx}`}
            className="text-2xl font-bold tracking-tight text-white mt-5 mb-2.5 border-b border-slate-700/60 pb-2"
          >
            {parseInlineFormatting(trimmed.substring(2))}
          </h1>
        );
        return;
      }

      // Heading 2
      if (trimmed.startsWith("## ")) {
        flushList();
        elements.push(
          <h2
            key={`h2-${idx}`}
            className="text-lg sm:text-xl font-semibold tracking-tight text-indigo-200 mt-4 mb-2 flex items-center gap-2"
          >
            {parseInlineFormatting(trimmed.substring(3))}
          </h2>
        );
        return;
      }

      // Heading 3
      if (trimmed.startsWith("### ")) {
        flushList();
        elements.push(
          <h3
            key={`h3-${idx}`}
            className="text-base font-semibold text-slate-100 mt-3 mb-1.5"
          >
            {parseInlineFormatting(trimmed.substring(4))}
          </h3>
        );
        return;
      }

      // Unordered list
      if (/^[-*+]\s+/.test(trimmed)) {
        if (listType !== "ul") {
          flushList();
          listType = "ul";
        }
        currentList.push(trimmed.replace(/^[-*+]\s+/, ""));
        return;
      }

      // Ordered list
      if (/^\d+\.\s+/.test(trimmed)) {
        if (listType !== "ol") {
          flushList();
          listType = "ol";
        }
        currentList.push(trimmed.replace(/^\d+\.\s+/, ""));
        return;
      }

      // Blockquote
      if (trimmed.startsWith("> ")) {
        flushList();
        elements.push(
          <blockquote
            key={`quote-${idx}`}
            className="border-l-4 border-indigo-500 pl-4 py-1.5 my-3 italic text-indigo-100/90 bg-indigo-950/20 rounded-r-lg"
          >
            {parseInlineFormatting(trimmed.substring(2))}
          </blockquote>
        );
        return;
      }

      // Horizontal divider
      if (trimmed === "---" || trimmed === "***") {
        flushList();
        elements.push(
          <hr key={`hr-${idx}`} className="border-slate-800 my-4" />
        );
        return;
      }

      // Regular paragraph or empty line
      flushList();
      if (trimmed.length > 0) {
        elements.push(
          <p key={`p-${idx}`} className="text-slate-200 leading-relaxed my-1.5">
            {parseInlineFormatting(line)}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  const parseInlineFormatting = (text: string): React.ReactNode => {
    // Process bold, italics, inline code
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;
    let i = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.slice(lastIdx, match.index));
      }

      const matchText = match[0];
      if (matchText.startsWith("**") && matchText.endsWith("**")) {
        parts.push(
          <strong key={`b-${i++}`} className="font-semibold text-white">
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith("*") && matchText.endsWith("*")) {
        parts.push(
          <em key={`em-${i++}`} className="italic text-slate-300">
            {matchText.slice(1, -1)}
          </em>
        );
      } else if (matchText.startsWith("`") && matchText.endsWith("`")) {
        parts.push(
          <code
            key={`c-${i++}`}
            className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-xs border border-slate-700/60"
          >
            {matchText.slice(1, -1)}
          </code>
        );
      }

      lastIdx = match.index + matchText.length;
    }

    if (lastIdx < text.length) {
      parts.push(text.slice(lastIdx));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div
      className={`prose prose-invert max-w-none text-slate-200 text-sm sm:text-base ${className}`}
    >
      {renderFormattedText(content)}
    </div>
  );
};
