import React from "react";
import { StudentProfile, LearningProgressState } from "../types";
import {
  Trophy,
  Flame,
  HelpCircle,
  FileText,
  CheckCircle2,
  BookOpen,
  Calendar,
  Sparkles,
  TrendingUp,
  Clock,
  RotateCcw,
  Award,
} from "lucide-react";

interface LearningProgressViewProps {
  profile: StudentProfile;
  progress: LearningProgressState;
  onResetProgress: () => void;
  onSelectTab: (tab: any) => void;
}

export const LearningProgressView: React.FC<LearningProgressViewProps> = ({
  profile,
  progress,
  onResetProgress,
  onSelectTab,
}) => {
  const accuracy =
    progress.totalQuestionsAttempted > 0
      ? Math.round((progress.correctAnswers / progress.totalQuestionsAttempted) * 100)
      : 0;

  const totalActions =
    progress.questionsAsked +
    progress.notesSummarized +
    progress.quizzesTaken;

  const dailyGoal = 5;
  const goalPercent = Math.min(Math.round((totalActions / dailyGoal) * 100), 100);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
          <TrendingUp className="w-4 h-4" />
          <span>EduGenie Learning Dashboard</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Learning Progress & Performance
            </h1>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              Track your conceptual mastery, quiz accuracy, daily study streak, and completed topics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Daily Streak Badge */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 shadow-xs">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400/30 animate-pulse" />
              <div>
                <div className="text-xs font-bold leading-none">{progress.streakDays} Day Streak</div>
                <div className="text-[10px] text-amber-400/80 mt-0.5">Keep learning daily!</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Questions Asked</span>
            <HelpCircle className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
            {progress.questionsAsked}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Academic doubts clarified</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Notes Summarized</span>
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
            {progress.notesSummarized}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Lecture summaries generated</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Quizzes Completed</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
            {progress.quizzesTaken}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">MCQ sets practiced</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Quiz Accuracy</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
            {accuracy}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {progress.correctAnswers}/{progress.totalQuestionsAttempted} correct answers
          </div>
        </div>
      </div>

      {/* Daily Target Progress Bar Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Today's Learning Goal</h3>
          </div>
          <span className="text-xs font-mono font-semibold text-indigo-300">
            {totalActions} of {dailyGoal} activities completed ({goalPercent}%)
          </span>
        </div>

        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${goalPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Complete 5 study actions daily to maintain your learning streak!</span>
          {goalPercent >= 100 && (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Goal achieved today!
            </span>
          )}
        </div>
      </div>

      {/* Two Column Layout: Mastered Topics & Recent Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Mastered Topics (5 Cols) */}
        <div className="md:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Mastered Concepts</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {progress.masteredTopics.length} topics
            </span>
          </div>

          {progress.masteredTopics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {progress.masteredTopics.map((topic, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs space-y-2">
              <p>No topics marked as mastered yet.</p>
              <button
                onClick={() => onSelectTab("quiz")}
                className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                Take a practice quiz to earn mastery badges!
              </button>
            </div>
          )}
        </div>

        {/* Activity Timeline (7 Cols) */}
        <div className="md:col-span-7 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Recent Activity Feed</span>
            </h3>
            {progress.recentActivities.length > 0 && (
              <button
                onClick={onResetProgress}
                className="text-[11px] text-slate-400 hover:text-red-400 transition-colors cursor-pointer flex items-center gap-1"
                title="Reset local activity logs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Data</span>
              </button>
            )}
          </div>

          {progress.recentActivities.length > 0 ? (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {progress.recentActivities.slice(0, 10).map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{act.title}</div>
                    {act.detail && (
                      <div className="text-[11px] text-slate-400 truncate">{act.detail}</div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 tabular-nums">
                    {act.timestamp}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              <p>Your study activities will be tracked here in real-time as you ask questions, summarize notes, and take quizzes!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
