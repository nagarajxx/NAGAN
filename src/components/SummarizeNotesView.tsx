import React, { useState } from "react";
import { StudentProfile } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  ArrowRight,
  BookmarkPlus,
} from "lucide-react";

interface SummarizeNotesViewProps {
  profile: StudentProfile;
  onActivityLogged?: (title: string, detail?: string) => void;
}

const SAMPLE_NOTES = [
  {
    title: "Biology: Photosynthesis & Chloroplasts",
    text: `Photosynthesis is the biological process used by plants, algae, and cyanobacteria to convert light energy into chemical energy stored in glucose molecules. 

The overall balanced chemical equation is:
6CO2 + 6H2O + Light Energy -> C6H12O6 + 6O2

The process takes place inside chloroplast organelles, specifically in two main phases:
1. Light-Dependent Reactions: Occur in the thylakoid membranes where chlorophyll absorbs sunlight. Water molecules are photolysed (split) into oxygen gas, protons, and electrons. ATP and NADPH are synthesized to power the next phase.
2. Light-Independent Reactions (Calvin Cycle): Takes place in the liquid stroma. Carbon dioxide is captured by the enzyme RuBisCO in carbon fixation. ATP and NADPH reduce 3-phosphoglycerate into G3P, which combines to form glucose and other carbohydrates.

Limiting factors include light intensity, carbon dioxide concentration, and ambient temperature. Extreme heat denatures enzymes like RuBisCO, reducing the rate of photosynthesis.`,
  },
  {
    title: "History: Causes of World War I",
    text: `The outbreak of World War I in 1914 was driven by long-term structural tensions summarized by the acronym M-A-I-N, culminating in an immediate spark:

1. Militarism: European great powers engaged in a massive arms race, particularly the naval rivalry between Great Britain and Imperial Germany.
2. Alliances: Secret mutual defense treaties divided Europe into opposing camps: the Triple Entente (Britain, France, Russia) and the Triple Alliance (Germany, Austria-Hungary, Italy).
3. Imperialism: Fierce competition for colonial territories in Africa and Asia heightened distrust between European empires.
4. Nationalism: Intense national pride and Slavic nationalist movements in the Balkan peninsula, often called the "powder keg of Europe."

The immediate catalyst occurred on June 28, 1914, in Sarajevo, when Archduke Franz Ferdinand, heir to the Austro-Hungarian throne, was assassinated by Gavrilo Princip, a Serbian nationalist. Austria-Hungary issued an ultimatum to Serbia, activating the web of alliance commitments and triggering continental war within weeks.`,
  },
  {
    title: "Computer Science: Operating System Deadlocks",
    text: `A deadlock in an operating system occurs when a set of concurrent processes are permanently blocked because each process holds a resource and waits for another resource held by another process in the same set.

For a deadlock to occur, four Coffman conditions must hold simultaneously:
1. Mutual Exclusion: At least one resource must be held in a non-shareable mode (only one process can use it at a time).
2. Hold and Wait: A process must currently hold at least one resource and be requesting additional resources held by other processes.
3. No Preemption: Resources cannot be forcibly confiscated from a process; they can only be released voluntarily after completing its task.
4. Circular Wait: A closed chain of processes exists where P0 waits for a resource held by P1, P1 waits for P2, and Pn waits for P0.

Deadlock handling strategies include Deadlock Prevention (invalidating at least one of the four conditions), Deadlock Avoidance (using algorithms like Dijkstra's Banker's Algorithm to ensure safe states), and Deadlock Detection and Recovery.`,
  },
];

export const SummarizeNotesView: React.FC<SummarizeNotesViewProps> = ({
  profile,
  onActivityLogged,
}) => {
  const [notesText, setNotesText] = useState(SAMPLE_NOTES[0].text);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = notesText.trim() ? notesText.trim().split(/\s+/).length : 0;
  const charCount = notesText.length;

  const handleSummarize = async () => {
    if (!notesText.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notesText,
          profile,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to summarize notes.");
      }

      const data = await res.json();
      setSummary(data.text);
      if (onActivityLogged) {
        onActivityLogged("Summarized Study Notes", `${wordCount} words summarized`);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while generating summary.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadSample = (sample: (typeof SAMPLE_NOTES)[0]) => {
    setNotesText(sample.text);
    setSummary(null);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
          <FileText className="w-4 h-4" />
          <span>EduGenie Notes Summarizer</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Turn Lengthy Study Notes into Crisp, High-Yield Summaries
        </h1>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Paste your lecture slides, textbook excerpts, or revision notes. EduGenie distills the core ideas, highlights key takeaways, and pulls out important definitions.
        </p>
      </div>

      {/* Input Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Paste Your Study Notes or Lecture Text
          </label>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>{wordCount} words</span>
            <span>·</span>
            <span>{charCount} characters</span>
            {notesText && (
              <>
                <span>·</span>
                <button
                  onClick={() => setNotesText("")}
                  className="hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        <textarea
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
          rows={9}
          placeholder="Paste notes, textbook paragraphs, or lecture transcripts here..."
          className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all leading-relaxed"
        />

        {/* Quick Sample Presets */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-medium text-slate-400 shrink-0">Try Sample Notes:</span>
            {SAMPLE_NOTES.map((sample, i) => (
              <button
                key={i}
                onClick={() => handleLoadSample(sample)}
                className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1 rounded-full whitespace-nowrap border border-slate-700/60 transition-colors cursor-pointer shrink-0"
              >
                {sample.title}
              </button>
            ))}
          </div>

          <button
            onClick={handleSummarize}
            disabled={!notesText.trim() || loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0 ml-auto"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Summarizing Notes...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Summarize & Highlight Points</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Generated Summary Card */}
      {summary && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-300">
          <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">
                EduGenie High-Yield Summary
              </h2>
            </div>
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
                  <span>Copy Summary</span>
                </>
              )}
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <MarkdownRenderer content={summary} />
          </div>
        </div>
      )}
    </div>
  );
};
