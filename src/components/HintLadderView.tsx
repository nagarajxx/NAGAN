import React, { useState } from "react";
import { StudentProfile } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  Lightbulb,
  Unlock,
  Lock,
  ChevronDown,
  Sparkles,
  HelpCircle,
  RotateCcw,
} from "lucide-react";

interface HintLadderViewProps {
  profile: StudentProfile;
}

const SAMPLE_CHALLENGES = [
  "A ball is thrown upward at 20 m/s from a 15m cliff. What is the total time before it hits the ground? (g = 9.8 m/s²)",
  "Evaluate the limit as x approaches 0 of (sin(3x) - 3x) / x³ without using a calculator.",
  "Find the equilibrium constant Kc for N2 + 3H2 ⇌ 2NH3 given equilibrium concentrations.",
  "Given an array of integers, find if there exists a contiguous subarray with sum equal to K in O(n) time.",
];

export const HintLadderView: React.FC<HintLadderViewProps> = ({ profile }) => {
  const [problem, setProblem] = useState(SAMPLE_CHALLENGES[0]);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(0);
  const [hints, setHints] = useState<Record<number, string>>({});
  const [loadingLevel, setLoadingLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const HINT_TIERS = [
    {
      level: 1,
      title: "Hint 1: Conceptual Nudge",
      desc: "Identifies the core governing principle and asks guiding questions to trigger intuition.",
    },
    {
      level: 2,
      title: "Hint 2: Relevant Formula & Setup",
      desc: "Reveals the key theorem, formula, or system equations without the full arithmetic.",
    },
    {
      level: 3,
      title: "Hint 3: Halfway Step-by-Step Walkthrough",
      desc: "Walks through the first critical steps, setting up the calculation for you to complete.",
    },
    {
      level: 4,
      title: "Tier 4: Full Verified Solution",
      desc: "Complete step-by-step working from beginning to end with the final verified answer.",
    },
  ];

  const fetchHint = async (level: number) => {
    if (!problem.trim() || loadingLevel !== null) return;

    // If already fetched, just unlock
    if (hints[level]) {
      setUnlockedLevel(Math.max(unlockedLevel, level));
      return;
    }

    setLoadingLevel(level);
    setError(null);

    try {
      const res = await fetch("/api/interactive-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem,
          hintLevel: level,
          profile,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate hint.");
      }

      const data = await res.json();
      setHints((prev) => ({ ...prev, [level]: data.hint }));
      setUnlockedLevel(Math.max(unlockedLevel, level));
    } catch (err: any) {
      setError(err.message || "Failed to retrieve hint.");
    } finally {
      setLoadingLevel(null);
    }
  };

  const handleResetLadder = (newProblem?: string) => {
    if (newProblem) setProblem(newProblem);
    setUnlockedLevel(0);
    setHints({});
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
          <Lightbulb className="w-4 h-4" />
          <span>Socratic Problem Solver</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          The Socratic Hint Ladder
        </h1>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Stuck on homework or a practice question? Don't spoil the whole answer—unlock progressive hints step-by-step and build genuine problem-solving intuition!
        </p>
      </div>

      {/* Problem Input Box */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Paste the Problem You Are Solving
            </label>
            <button
              onClick={() => handleResetLadder()}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Ladder</span>
            </button>
          </div>
          <textarea
            value={problem}
            onChange={(e) => {
              setProblem(e.target.value);
              if (unlockedLevel > 0) {
                // If question text changes, reset hints
                setUnlockedLevel(0);
                setHints({});
              }
            }}
            rows={3}
            placeholder="Type or paste any science, math, or reasoning question..."
            className="w-full p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all leading-relaxed"
          />
        </div>

        {/* Sample Problems */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] text-slate-400 shrink-0">Sample Problems:</span>
          {SAMPLE_CHALLENGES.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleResetLadder(item)}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1 rounded-full whitespace-nowrap border border-slate-700/60 transition-colors cursor-pointer shrink-0 truncate max-w-xs"
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

      {/* The 4 Hint Tiers */}
      <div className="space-y-4">
        {HINT_TIERS.map((tier) => {
          const isUnlocked = unlockedLevel >= tier.level;
          const isLoading = loadingLevel === tier.level;
          const hintContent = hints[tier.level];

          return (
            <div
              key={tier.level}
              className={`rounded-2xl border transition-all ${
                isUnlocked
                  ? "bg-slate-900 border-emerald-500/40 shadow-lg"
                  : "bg-slate-900/60 border-slate-800/80 opacity-90"
              }`}
            >
              <div className="p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isUnlocked
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      {tier.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{tier.desc}</p>
                  </div>
                </div>

                {!isUnlocked && (
                  <button
                    onClick={() => fetchHint(tier.level)}
                    disabled={isLoading || !problem.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Unlocking...</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Unlock {tier.level === 4 ? "Full Solution" : `Hint ${tier.level}`}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Revealed Content */}
              {isUnlocked && hintContent && (
                <div className="p-5 sm:p-6 bg-slate-950/60 border-t border-slate-800/80 rounded-b-2xl animate-in fade-in duration-300">
                  <MarkdownRenderer content={hintContent} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
