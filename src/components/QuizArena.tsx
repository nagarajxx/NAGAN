import React, { useState } from "react";
import { StudentProfile, QuizQuestion } from "../types";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Sparkles,
  Info,
} from "lucide-react";

interface QuizArenaProps {
  profile: StudentProfile;
}

const SAMPLE_QUIZ_TOPICS = [
  "Newton's Laws of Motion",
  "Photosynthesis & Plant Biology",
  "Quadratic Equations & Roots",
  "Python Loops & Conditionals",
  "Mughal Empire & Architecture",
  "Chemical Bonding & Valency",
];

export const QuizArena: React.FC<QuizArenaProps> = ({ profile }) => {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>("Medium");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateQuiz = async (selectedTopic?: string) => {
    const q = (selectedTopic || topic).trim();
    if (!q || loading) return;

    if (selectedTopic) setTopic(selectedTopic);
    setLoading(true);
    setError(null);
    setQuestions([]);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: q,
          count,
          difficulty,
          profile,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate quiz.");
      }

      const data = await res.json();
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("No quiz questions could be formatted. Please try a different topic.");
      }

      setQuestions(data.questions);
    } catch (err: any) {
      setError(err.message || "Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    // If already answered this question, don't re-select
    if (selectedAnswers[currentIndex] !== undefined) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  const currentQ = questions[currentIndex];
  const hasAnsweredCurrent = selectedAnswers[currentIndex] !== undefined;
  const currentSelection = selectedAnswers[currentIndex];
  const isCurrentCorrect = currentSelection === currentQ?.correctIndex;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
          <HelpCircle className="w-4 h-4" />
          <span>Interactive Knowledge Arena</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Test Your Conceptual Mastery with MCQs
        </h1>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          AI-generated practice questions that test reasoning, reveal instant feedback, and explain why each option is right or wrong.
        </p>
      </div>

      {/* Quiz Setup Controls */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Quiz Topic or Concept
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerateQuiz()}
              placeholder="e.g. Gravity and Kepler's Laws, Chemical Equilibrium, Python Dictionaries..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <button
              onClick={() => handleGenerateQuiz()}
              disabled={!topic.trim() || loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Quiz...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Practice Quiz</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Difficulty and Question count */}
        <div className="flex items-center gap-4 flex-wrap pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Questions:</span>
            {[3, 5, 8].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  count === n
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Difficulty:</span>
            {["Easy", "Medium", "Hard"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setDifficulty(lvl)}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  difficulty === lvl
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Sample Topics */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
          <span className="text-[11px] text-slate-400 shrink-0">Sample Quizzes:</span>
          {SAMPLE_QUIZ_TOPICS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleGenerateQuiz(item)}
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

      {/* Active Quiz Card */}
      {questions.length > 0 && !isCompleted && currentQ && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-300">
          {/* Header with Progress Bar */}
          <div className="p-5 bg-slate-950/80 border-b border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300">
                Question {currentIndex + 1} of {questions.length}
              </span>
              {currentQ.conceptTag && (
                <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 text-[11px]">
                  {currentQ.conceptTag}
                </span>
              )}
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="p-6 sm:p-8 space-y-6">
            <h2 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
              {currentQ.question}
            </h2>

            {/* Options List */}
            <div className="space-y-3">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = currentSelection === optIdx;
                const isCorrect = optIdx === currentQ.correctIndex;

                let buttonStyle =
                  "bg-slate-800/60 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600";
                let badgeStyle = "bg-slate-700 text-slate-300";

                if (hasAnsweredCurrent) {
                  if (isCorrect) {
                    buttonStyle =
                      "bg-emerald-950/40 border-emerald-500/80 text-emerald-200";
                    badgeStyle = "bg-emerald-600 text-white";
                  } else if (isSelected) {
                    buttonStyle =
                      "bg-red-950/40 border-red-500/80 text-red-200";
                    badgeStyle = "bg-red-600 text-white";
                  } else {
                    buttonStyle = "bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-60";
                    badgeStyle = "bg-slate-800 text-slate-500";
                  }
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    disabled={hasAnsweredCurrent}
                    className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between gap-3 cursor-pointer ${buttonStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 ${badgeStyle}`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </div>

                    {hasAnsweredCurrent && isCorrect && (
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Correct</span>
                      </div>
                    )}
                    {hasAnsweredCurrent && isSelected && !isCorrect && (
                      <div className="flex items-center gap-1 text-red-400 text-xs font-medium shrink-0">
                        <XCircle className="w-4 h-4" />
                        <span>Incorrect</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation Callout */}
            {hasAnsweredCurrent && (
              <div
                className={`p-4 rounded-xl border transition-all ${
                  isCurrentCorrect
                    ? "bg-emerald-950/20 border-emerald-800/60 text-emerald-200"
                    : "bg-amber-950/20 border-amber-800/60 text-amber-200"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="text-xs sm:text-sm space-y-1">
                    <p className="font-semibold text-white">
                      {isCurrentCorrect ? "Spot on!" : "Conceptual Review:"}
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      {currentQ.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!hasAnsweredCurrent}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md cursor-pointer"
            >
              <span>{currentIndex === questions.length - 1 ? "View Score" : "Next Question"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Completed Summary Card */}
      {isCompleted && (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-lg">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Quiz Complete!</h2>
            <p className="text-sm text-slate-400">
              Here is how you performed on <span className="text-white font-medium">{topic}</span>
            </p>
          </div>

          <div className="max-w-xs mx-auto p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">
              {calculateScore()} / {questions.length}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Score: {Math.round((calculateScore() / questions.length) * 100)}% accuracy
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSelectedAnswers({});
                setCurrentIndex(0);
                setIsCompleted(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry This Quiz</span>
            </button>
            <button
              onClick={() => {
                setQuestions([]);
                setSelectedAnswers({});
                setIsCompleted(false);
              }}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer shadow-md"
            >
              Choose New Topic
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
