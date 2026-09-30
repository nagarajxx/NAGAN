import React, { useState } from "react";
import { StudentProfile } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  FileCheck2,
  Award,
  Copy,
  Check,
  Printer,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface ExamPrepViewProps {
  profile: StudentProfile;
}

const SAMPLE_EXAM_TOPICS = [
  "Bernoulli's Principle & Aerodynamics",
  "Electromagnetic Induction & Faraday's Law",
  "Krebs Cycle / Citric Acid Cycle",
  "SQL Joins (Inner, Left, Right, Full)",
  "Central Tendency: Mean, Median, Mode",
  "Keynesian Theory of Employment & Income",
  "Types of Chemical Reactions",
];

export const ExamPrepView: React.FC<ExamPrepViewProps> = ({ profile }) => {
  const [topic, setTopic] = useState("");
  const [markType, setMarkType] = useState<"all" | "2-mark" | "5-mark" | "10-mark">("all");
  const [examData, setExamData] = useState<string | null>(null);
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
      const res = await fetch("/api/exam-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: q,
          markType,
          profile,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate exam model answers.");
      }

      const data = await res.json();
      setExamData(data.text);
    } catch (err: any) {
      setError(err.message || "Failed to generate exam prep.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!examData) return;
    navigator.clipboard.writeText(examData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
          <Award className="w-4 h-4" />
          <span>Exam Question Bank & Model Answers</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Score Full Marks with Structured Answers
        </h1>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Generates 2-mark crisp definitions, 5-mark structured point answers with diagram suggestions, and 10-mark comprehensive essays with examiner marking criteria for {profile.grade}.
        </p>
      </div>

      {/* Input Form */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Target Exam Topic or Question
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="e.g. Photoelectric Effect, Dijkstra's Algorithm, Mitosis vs Meiosis..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
            <button
              onClick={() => handleGenerate()}
              disabled={!topic.trim() || loading}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Formatting Answers...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Generate Answers</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mark Type Filter Tabs */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Exam Weightage:</span>
          {[
            { id: "all", label: "Full Question Bank (2M + 5M + 10M)" },
            { id: "2-mark", label: "2-Mark Short (Definitions & 2 Points)" },
            { id: "5-mark", label: "5-Mark Medium (Structured & Diagrams)" },
            { id: "10-mark", label: "10-Mark Essay (In-Depth Presentation)" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMarkType(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                markType === item.id
                  ? "bg-amber-600/30 text-amber-200 border border-amber-500/50 shadow-sm"
                  : "bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-slate-700/60"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Sample Topics */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
          <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Quick Try:
          </span>
          {SAMPLE_EXAM_TOPICS.map((item, idx) => (
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

      {/* Model Answer Results */}
      {examData && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-300">
          <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">
                Exam Model Answers: <span className="text-amber-300">{topic}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Paper</span>
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
            <MarkdownRenderer content={examData} />
          </div>
        </div>
      )}
    </div>
  );
};
