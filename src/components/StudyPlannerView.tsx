import React, { useState } from "react";
import { StudentProfile } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  CalendarDays,
  Clock,
  Target,
  Sparkles,
  Copy,
  Check,
  CheckSquare,
  Square,
} from "lucide-react";

interface StudyPlannerViewProps {
  profile: StudentProfile;
}

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({ profile }) => {
  const [goal, setGoal] = useState("Ace upcoming term exams with solid conceptual understanding");
  const [subjects, setSubjects] = useState("Physics (Optics & Waves), Mathematics (Calculus), Chemistry (Bonding)");
  const [hoursPerDay, setHoursPerDay] = useState<number>(3);
  const [examDate, setExamDate] = useState("In 2 weeks");
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Interactive local study tasks checklist
  const [checklist, setChecklist] = useState<{ id: number; text: string; done: boolean }[]>([
    { id: 1, text: "Review fundamental formulas and definitions (30 mins)", done: false },
    { id: 2, text: "Solve 5 practice problems independently (45 mins)", done: false },
    { id: 3, text: "Active Recall: Explain concept without looking at notes (15 mins)", done: false },
    { id: 4, text: "Attempt 1 practice exam question from Exam Prep (20 mins)", done: false },
  ]);

  const [newTaskText, setNewTaskText] = useState("");

  const handleGeneratePlan = async () => {
    if (!subjects.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects,
          examDate,
          hoursPerDay,
          goal,
          profile,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate study timetable.");
      }

      const data = await res.json();
      setPlan(data.text);
    } catch (err: any) {
      setError(err.message || "Failed to generate plan.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (id: number) => {
    setChecklist((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setChecklist((prev) => [
      ...prev,
      { id: Date.now(), text: newTaskText.trim(), done: false },
    ]);
    setNewTaskText("");
  };

  const handleCopy = () => {
    if (!plan) return;
    navigator.clipboard.writeText(plan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
          <CalendarDays className="w-4 h-4" />
          <span>Personalized Timetable & Goal Tracker</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Scientific Study Timetable & Daily Checklist
        </h1>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Generates structured Pomodoro schedules, spaced revision timelines, and milestone checkpoints tailored to your daily study hours.
        </p>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs (2 Cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              Primary Goal / Milestone
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Master Organic Reactions before unit test, score 95% in Math..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Subjects or Chapters to Cover
            </label>
            <textarea
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              rows={2}
              placeholder="e.g. Calculus (Integration), Physics (Thermodynamics), History (Ch 3-4)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Daily Available Study Time
                </span>
                <span className="text-indigo-300 font-mono font-bold">
                  {hoursPerDay} {hoursPerDay === 1 ? "hour" : "hours"}/day
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Exam Deadline / Target Date
              </label>
              <input
                type="text"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                placeholder="e.g. In 10 days, or Next Monday"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={!subjects.trim() || loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Building Timetable...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Smart Timetable</span>
              </>
            )}
          </button>
        </div>

        {/* Daily Study Checklist (1 Col) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Today's Study Checklist</span>
              </h3>
              <span className="text-[11px] text-emerald-400 font-mono">
                {checklist.filter((t) => t.done).length}/{checklist.length} done
              </span>
            </div>

            <div className="space-y-2 mt-3 max-h-56 overflow-y-auto pr-1">
              {checklist.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all cursor-pointer ${
                    task.done
                      ? "bg-emerald-950/20 border-emerald-900/60 text-slate-400 line-through"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {task.done ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{task.text}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={addTask} className="flex gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Add personal study task..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 cursor-pointer"
            >
              Add
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Generated Timetable */}
      {plan && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-300">
          <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">
                Personalized Timetable & Spaced Revision Guide
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
                  <span>Copy Timetable</span>
                </>
              )}
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <MarkdownRenderer content={plan} />
          </div>
        </div>
      )}
    </div>
  );
};
