import React, { useState } from "react";
import { StudentProfile } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  Sparkles,
  Search,
  BookOpen,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Lightbulb,
} from "lucide-react";

interface ConceptExplainerProps {
  profile: StudentProfile;
}

const TOPIC_SUGGESTIONS = [
  "Photosynthesis & Light Reactions",
  "Newton's Three Laws of Motion",
  "How Binary Search Works",
  "DNA Replication & Polymerase",
  "Inflation & Purchasing Power",
  "Ohm's Law & Circuit Resistance",
  "Recursion & Call Stack in Programming",
  "Electromagnetic Induction",
  "Normal Distribution & Bell Curve",
];

export const ConceptExplainer: React.FC<ConceptExplainerProps> = ({ profile }) => {
  const [topic, setTopic] = useState("");
  const [detailLevel, setDetailLevel] = useState<"quick" | "standard" | "deep">("standard");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleExplain = async (targetTopic?: string) => {
    const q = (targetTopic || topic).trim();
    if (!q || loading) return;

    if (targetTopic) setTopic(targetTopic);
    setLoading(true);
    setError(null);
    window.speechSynthesis?.cancel();
    setSpeaking(false);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: q,
          profile,
          detailLevel:
            detailLevel === "quick"
              ? "quick intuition and simple summary"
              : detailLevel === "deep"
              ? "thorough in-depth explanation with mechanisms and edge cases"
              : "standard balanced explanation",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to explain topic");
      }

      const data = await res.json();
      setResult(data.text);
    } catch (err: any) {
      setError(err.message || "An error occurred while generating explanation.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!("speechSynthesis" in window) || !result) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const cleanText = result
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[#*`_]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Intuitive Concept Simplifier</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Understand Difficult Topics Without Confusion
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Gemini breaks down complex theories into simple everyday analogies, step-by-step mechanisms, and real-life examples in {profile.language}.
          </p>
        </div>
      </div>

      {/* Input Form Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Enter Any Concept, Theory or Question
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExplain()}
                placeholder="e.g. Photoelectric Effect, Dijkstra's Algorithm, Mitosis vs Meiosis..."
                className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>

            {/* Depth Selector */}
            <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700/80 shrink-0">
              <button
                type="button"
                onClick={() => setDetailLevel("quick")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  detailLevel === "quick"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Quick
              </button>
              <button
                type="button"
                onClick={() => setDetailLevel("standard")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  detailLevel === "standard"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setDetailLevel("deep")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  detailLevel === "deep"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                In-Depth
              </button>
            </div>

            <button
              onClick={() => handleExplain()}
              disabled={!topic.trim() || loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Simplifying...</span>
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4" />
                  <span>Explain Topic</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick topic inspiration */}
        <div className="pt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-medium text-slate-400 shrink-0">Popular:</span>
          {TOPIC_SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleExplain(item)}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1 rounded-full whitespace-nowrap border border-slate-700/60 transition-colors cursor-pointer shrink-0"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-300">
          <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">
                Explanation for: <span className="text-indigo-300">{topic}</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSpeak}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                {speaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="text-amber-400">Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Read Aloud</span>
                  </>
                )}
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
            <MarkdownRenderer content={result} />
          </div>
        </div>
      )}
    </div>
  );
};
