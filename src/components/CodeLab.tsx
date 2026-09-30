import React, { useState } from "react";
import { StudentProfile } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  Code2,
  Bug,
  BookOpen,
  Sparkles,
  Copy,
  Check,
  Play,
  RotateCcw,
} from "lucide-react";

interface CodeLabProps {
  profile: StudentProfile;
}

const PROGRAMMING_LANGUAGES = [
  "Python",
  "JavaScript",
  "Java",
  "C++",
  "C",
  "TypeScript",
  "SQL",
];

const CODE_PRESETS = [
  {
    title: "Off-by-One Loop Error",
    lang: "Python",
    code: `def calculate_average(grades):
    total = 0
    # Bug: range index out of bounds
    for i in range(len(grades) + 1):
        total += grades[i]
    return total / len(grades)

scores = [85, 90, 78, 92]
print(calculate_average(scores))`,
    question: "This gives IndexError: list index out of range. How do I fix it?",
  },
  {
    title: "Recursion Missing Base Case",
    lang: "Python",
    code: `def factorial(n):
    # Missing base case check for n <= 1
    return n * factorial(n - 1)

print(factorial(5))`,
    question: "Why does this give RecursionError: maximum recursion depth exceeded?",
  },
  {
    title: "Binary Search Walkthrough",
    lang: "Python",
    code: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,
    question: "Explain how this algorithm narrows down the search space in O(log n) time.",
  },
];

export const CodeLab: React.FC<CodeLabProps> = ({ profile }) => {
  const [language, setLanguage] = useState<string>("Python");
  const [mode, setMode] = useState<"debug" | "explain" | "tutorial">("debug");
  const [code, setCode] = useState<string>(CODE_PRESETS[0].code);
  const [question, setQuestion] = useState<string>(CODE_PRESETS[0].question);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleAnalyze = async () => {
    if ((!code.trim() && !question.trim()) || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/code-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          question,
          mode,
          profile,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to analyze code.");
      }

      const data = await res.json();
      setResult(data.text);
    } catch (err: any) {
      setError(err.message || "Failed to process code.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: typeof CODE_PRESETS[0]) => {
    setLanguage(preset.lang);
    setCode(preset.code);
    setQuestion(preset.question);
    setResult(null);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
          <Code2 className="w-4 h-4" />
          <span>Interactive Programming Lab</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Debug Code & Master Core Algorithms
        </h1>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Get step-by-step logic explanations, find bugs with pinpoint explanations, and learn clean coding patterns in {language}.
        </p>
      </div>

      {/* Main Workspace */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-5">
        {/* Top Controls: Mode & Language */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
          {/* Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode("debug")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                mode === "debug"
                  ? "bg-red-600/30 text-red-200 border border-red-500/50"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Debug & Fix</span>
            </button>

            <button
              onClick={() => setMode("explain")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                mode === "explain"
                  ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/50"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Line-by-Line Breakdown</span>
            </button>

            <button
              onClick={() => setMode("tutorial")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                mode === "tutorial"
                  ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/50"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Concept Tutorial</span>
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {PROGRAMMING_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Code Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Source Code
            </label>
            <button
              onClick={() => setCode("")}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={8}
            placeholder={`Paste your ${language} code here...`}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-emerald-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all leading-relaxed"
          />
        </div>

        {/* Question or Error Message Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Error Message or Specific Question
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="e.g. Why am I getting an IndexError? Or explain what line 5 does"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Presets and Submit */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] text-slate-400 shrink-0">Try Presets:</span>
            {CODE_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleApplyPreset(p)}
                className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1 rounded-full whitespace-nowrap border border-slate-700/60 transition-colors cursor-pointer shrink-0"
              >
                {p.title}
              </button>
            ))}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={(!code.trim() && !question.trim()) || loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0 ml-auto"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Analyzing Code...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Analysis</span>
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

      {/* Analysis Result */}
      {result && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-300">
          <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">
                Programming Assistant Feedback
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
                  <span>Copy Explanation</span>
                </>
              )}
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <MarkdownRenderer content={result} />
          </div>
        </div>
      )}
    </div>
  );
};
