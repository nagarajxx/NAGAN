import React, { useState } from "react";
import { StudentProfile } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  BookOpen,
  Printer,
  Copy,
  Check,
  FileText,
  BookmarkPlus,
  Sparkles,
} from "lucide-react";

interface StudyNotesViewProps {
  profile: StudentProfile;
}

const COMMON_NOTE_TOPICS = [
  "Thermodynamics Laws & Heat Engines",
  "Cellular Respiration (Glycolysis & Krebs)",
  "Calculus Derivatives & Integrals Sheet",
  "Periodic Table Trends & Chemical Bonding",
  "World War II Causes & Major Treaties",
  "Data Structures: Trees, Graphs & HashMaps",
  "Indian Constitution: Fundamental Rights",
];

export const StudyNotesView: React.FC<StudyNotesViewProps> = ({ profile }) => {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("bullet-points and cheat sheet");
  const [notes, setNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (selectedTopic?: string) => {
    const q = (selectedTopic || topic).trim();
    if (!q || loading) return;

    if (selectedTopic) setTopic(selectedTopic);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: q,
          format,
          profile,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate study notes.");
      }

      const data = await res.json();
      setNotes(data.text);
    } catch (err: any) {
      setError(err.message || "Failed to generate notes.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!notes) return;
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          <span>High-Yield Revision Notes</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Concise Notes, Formulas & Summary Cheat Sheets
        </h1>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Create structured revision summaries with definitions, laws, memory mnemonics, and last-minute exam checklists.
        </p>
      </div>

      {/* Input Form */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Subject or Chapter Title
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="e.g. Electromagnetic Spectrum, Periodic Trends, Trigonometric Identities..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
            <button
              onClick={() => handleGenerate()}
              disabled={!topic.trim() || loading}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generating Notes...</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Generate Notes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Format Selectors */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Style:</span>
          {[
            { id: "bullet-points and cheat sheet", label: "Cheat Sheet & Bullets" },
            { id: "formula sheet with definitions", label: "Formulas & Definitions" },
            { id: "mnemonics and memory cues", label: "Mnemonics & Cues" },
            { id: "last-minute 1-page summary", label: "1-Page Rapid Revision" },
          ].map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => setFormat(fmt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                format === fmt.id
                  ? "bg-sky-600/30 text-sky-200 border border-sky-500/40"
                  : "bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-slate-700/60"
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>

        {/* Quick Suggestions */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
          <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            Suggested:
          </span>
          {COMMON_NOTE_TOPICS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleGenerate(item)}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1 rounded-full whitespace-nowrap border border-slate-700/60 transition-colors cursor-pointer shrink-0"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Generated Notes Card */}
      {notes && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-300">
          <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-semibold text-white">
                Study Notes: <span className="text-sky-300">{topic}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                title="Print Notes"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <MarkdownRenderer content={notes} />
          </div>
        </div>
      )}
    </div>
  );
};
