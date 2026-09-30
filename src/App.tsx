/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  EduGenieTab,
  StudentProfile,
  LanguagePreference,
  SubjectArea,
  LearningProgressState,
  LearningActivityItem,
} from "./types";
import { StudentProfileModal } from "./components/StudentProfileModal";
import { TutorChat } from "./components/TutorChat";
import { ConceptExplainer } from "./components/ConceptExplainer";
import { SummarizeNotesView } from "./components/SummarizeNotesView";
import { QuizArena } from "./components/QuizArena";
import { StudyPlannerView } from "./components/StudyPlannerView";
import { CodeLab } from "./components/CodeLab";
import { LearningProgressView } from "./components/LearningProgressView";
import { ExamPrepView } from "./components/ExamPrepView";
import { HintLadderView } from "./components/HintLadderView";
import {
  Sparkles,
  HelpCircle,
  FileText,
  CalendarDays,
  Code2,
  TrendingUp,
  SlidersHorizontal,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BookOpen,
  Award,
  Lightbulb,
} from "lucide-react";

const DEFAULT_PROFILE: StudentProfile = {
  name: "Alex",
  grade: "High School (Grades 9-10)",
  subject: "Physics",
  language: "English",
  level: "Beginner",
};

const INITIAL_PROGRESS: LearningProgressState = {
  questionsAsked: 3,
  notesSummarized: 1,
  quizzesTaken: 2,
  correctAnswers: 8,
  totalQuestionsAttempted: 10,
  streakDays: 3,
  masteredTopics: [
    "Newton's Laws of Motion",
    "Photosynthesis Light Reactions",
    "Binary Search Algorithm",
  ],
  recentActivities: [
    {
      id: "act-1",
      type: "quiz",
      title: "Completed Quiz on Newton's Laws",
      detail: "Scored 4/5 (80% accuracy)",
      timestamp: "Today, 10:30 AM",
    },
    {
      id: "act-2",
      type: "explain",
      title: "Explored Concept: How Binary Search Works",
      detail: "Beginner-friendly explanation with analogy",
      timestamp: "Today, 09:15 AM",
    },
    {
      id: "act-3",
      type: "summarize",
      title: "Summarized Lecture Notes on Cell Biology",
      detail: "Extracted 4 key takeaways & terms",
      timestamp: "Yesterday, 04:20 PM",
    },
  ],
};

const EDUGENIE_NAV_ITEMS: {
  id: EduGenieTab | "exam" | "hints";
  label: string;
  desc: string;
  icon: React.ElementType;
  badge?: string;
  category: "core" | "tools";
}[] = [
  {
    id: "ask",
    label: "Ask Questions",
    desc: "Step-by-step academic Q&A",
    icon: MessageSquare,
    category: "core",
  },
  {
    id: "explain",
    label: "Simple Explanation",
    desc: "Beginner-friendly with examples",
    icon: Sparkles,
    badge: "Popular",
    category: "core",
  },
  {
    id: "summarize",
    label: "Summarize Notes",
    desc: "Extract key points from notes",
    icon: FileText,
    badge: "New",
    category: "core",
  },
  {
    id: "quiz",
    label: "Quiz Generator",
    desc: "Interactive 4-option practice MCQs",
    icon: HelpCircle,
    category: "core",
  },
  {
    id: "study",
    label: "Study Assistant",
    desc: "Timetable & topic breakdowns",
    icon: CalendarDays,
    category: "core",
  },
  {
    id: "code",
    label: "Code Learning",
    desc: "Java, Python, C & JS tutorials",
    icon: Code2,
    category: "core",
  },
  {
    id: "progress",
    label: "Learning Progress",
    desc: "Scores, streak & mastered topics",
    icon: TrendingUp,
    badge: "3d Streak",
    category: "core",
  },
  {
    id: "exam",
    label: "Exam Prep (2M/5M/10M)",
    desc: "Structured board & university answers",
    icon: Award,
    category: "tools",
  },
  {
    id: "hints",
    label: "Hint Ladder",
    desc: "Socratic progressive problem hints",
    icon: Lightbulb,
    category: "tools",
  },
];

const QUICK_SUBJECTS: SubjectArea[] = [
  "Physics",
  "Chemistry",
  "Biology",
  "Mathematics",
  "Computer Science & Coding",
  "Social Studies & History",
  "Commerce & Economics",
  "English & Literature",
];

export default function App() {
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem("edugenie_student_profile");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return DEFAULT_PROFILE;
  });

  const [progress, setProgress] = useState<LearningProgressState>(() => {
    try {
      const saved = localStorage.getItem("edugenie_progress_v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_PROGRESS;
  });

  const [activeTab, setActiveTab] = useState<EduGenieTab | "exam" | "hints">("ask");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("edugenie_student_profile", JSON.stringify(profile));
    } catch (e) {
      // ignore
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem("edugenie_progress_v2", JSON.stringify(progress));
    } catch (e) {
      // ignore
    }
  }, [progress]);

  const updateLanguage = (lang: LanguagePreference) => {
    setProfile((prev) => ({ ...prev, language: lang }));
  };

  const updateSubject = (sub: SubjectArea) => {
    setProfile((prev) => ({ ...prev, subject: sub }));
  };

  const logActivity = (type: LearningActivityItem["type"], title: string, detail?: string) => {
    const newItem: LearningActivityItem = {
      id: `act-${Date.now()}`,
      type,
      title,
      detail,
      timestamp: "Just now",
    };

    setProgress((prev) => {
      let qAsked = prev.questionsAsked;
      let nSumm = prev.notesSummarized;

      if (type === "ask") qAsked++;
      if (type === "summarize") nSumm++;

      return {
        ...prev,
        questionsAsked: qAsked,
        notesSummarized: nSumm,
        recentActivities: [newItem, ...prev.recentActivities.slice(0, 19)],
      };
    });
  };

  const handleQuizCompleted = (score: number, total: number, topic: string) => {
    const isPassing = score / total >= 0.7;
    setProgress((prev) => {
      const updatedTopics = isPassing && !prev.masteredTopics.includes(topic)
        ? [...prev.masteredTopics, topic]
        : prev.masteredTopics;

      const newAct: LearningActivityItem = {
        id: `act-${Date.now()}`,
        type: "quiz",
        title: `Completed Quiz on ${topic}`,
        detail: `Scored ${score}/${total} (${Math.round((score / total) * 100)}%)`,
        timestamp: "Just now",
      };

      return {
        ...prev,
        quizzesTaken: prev.quizzesTaken + 1,
        correctAnswers: prev.correctAnswers + score,
        totalQuestionsAttempted: prev.totalQuestionsAttempted + total,
        masteredTopics: updatedTopics,
        recentActivities: [newAct, ...prev.recentActivities.slice(0, 19)],
      };
    });
  };

  const handleResetProgress = () => {
    if (window.confirm("Reset your learning progress logs?")) {
      setProgress({
        questionsAsked: 0,
        notesSummarized: 0,
        quizzesTaken: 0,
        correctAnswers: 0,
        totalQuestionsAttempted: 0,
        streakDays: 1,
        masteredTopics: [],
        recentActivities: [],
      });
    }
  };

  const currentNav =
    EDUGENIE_NAV_ITEMS.find((item) => item.id === activeTab) || EDUGENIE_NAV_ITEMS[0];
  const ActiveIcon = currentNav.icon;

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Modern Left Studio Sidebar for EduGenie */}
      <aside
        className={`fixed md:relative z-50 flex flex-col h-full bg-slate-900/95 border-r border-slate-800/90 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "w-20" : "w-72"
        } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-sky-400 flex items-center justify-center text-white shadow-md font-black text-sm shrink-0">
              ✨
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-base tracking-tight text-white select-none">
                  EduGenie
                </span>
                <span className="text-[10px] text-indigo-400 font-medium tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  AI Learning Assistant
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center">
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Student Profile Quick Widget in Sidebar */}
        {!sidebarCollapsed && (
          <div className="p-3.5 mx-3 mt-3 rounded-xl bg-slate-950/70 border border-slate-800/80 shadow-xs space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">
                    {profile.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {profile.grade.split(" (")[0]}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Edit Student Profile"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Instant Language Switcher */}
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
              {(["English", "Tamil", "Tanglish"] as LanguagePreference[]).map((lang) => {
                const isActive = profile.language === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => updateLanguage(lang)}
                    className={`py-1 rounded font-medium transition-all cursor-pointer text-center truncate ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lang === "Tamil" ? "தமிழ்" : lang}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Subject Picker in Sidebar */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-3 shrink-0">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Current Subject Focus
            </label>
            <select
              value={profile.subject}
              onChange={(e) => updateSubject(e.target.value as SubjectArea)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {QUICK_SUBJECTS.map((sub) => (
                <option key={sub} value={sub} className="bg-slate-900 text-white">
                  {sub}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Scrollable EduGenie 7 Core Navigation Features */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 no-scrollbar">
          {/* Main EduGenie Features */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                EDUGENIE FEATURES
              </div>
            )}
            {EDUGENIE_NAV_ITEMS.filter((i) => i.category === "core").map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer text-left group ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"
                    }`}
                  />
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              isActive
                                ? "bg-indigo-800 text-indigo-200"
                                : "bg-slate-800 text-indigo-400"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Academic Power Tools */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            {!sidebarCollapsed && (
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                POWER TOOLS
              </div>
            )}
            {EDUGENIE_NAV_ITEMS.filter((i) => i.category === "tools").map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer text-left group ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"
                    }`}
                  />
                  {!sidebarCollapsed && (
                    <span className="text-xs truncate">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 shrink-0">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 text-xs transition-colors cursor-pointer ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-400 shrink-0" />
            {!sidebarCollapsed && <span>Profile Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Workspace Top Header Bar */}
        <header className="h-16 px-4 sm:px-6 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between gap-4 shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <ActiveIcon className="w-5 h-5 text-indigo-400" />
              <div className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-white">
                <span>{currentNav.label}</span>
                <span className="text-slate-600 font-normal">/</span>
                <span className="text-xs font-medium text-indigo-300">
                  {profile.subject}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Context Chips on Header */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-500">Language:</span>
              <strong className="text-slate-200">{profile.language}</strong>
            </div>

            <button
              onClick={() => setActiveTab("ask")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask Question</span>
            </button>
          </div>
        </header>

        {/* Workspace Main Stage (Scrollable Content) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* 1. Ask Questions */}
            {activeTab === "ask" && (
              <TutorChat
                profile={profile}
                onActivityLogged={(title, detail) => logActivity("ask", title, detail)}
              />
            )}

            {/* 2. Simple Explanation */}
            {activeTab === "explain" && (
              <ConceptExplainer
                profile={profile}
                onActivityLogged={(title, detail) => logActivity("explain", title, detail)}
              />
            )}

            {/* 3. Summarize Notes */}
            {activeTab === "summarize" && (
              <SummarizeNotesView
                profile={profile}
                onActivityLogged={(title, detail) => logActivity("summarize", title, detail)}
              />
            )}

            {/* 4. Quiz Generator */}
            {activeTab === "quiz" && (
              <QuizArena
                profile={profile}
                onQuizCompleted={handleQuizCompleted}
              />
            )}

            {/* 5. Study Assistant */}
            {activeTab === "study" && (
              <StudyPlannerView
                profile={profile}
                onActivityLogged={(title, detail) => logActivity("study", title, detail)}
              />
            )}

            {/* 6. Code Learning */}
            {activeTab === "code" && (
              <CodeLab
                profile={profile}
                onActivityLogged={(title, detail) => logActivity("code", title, detail)}
              />
            )}

            {/* 7. Learning Progress */}
            {activeTab === "progress" && (
              <LearningProgressView
                profile={profile}
                progress={progress}
                onResetProgress={handleResetProgress}
                onSelectTab={(tab) => setActiveTab(tab)}
              />
            )}

            {/* Extra Power Tools */}
            {activeTab === "exam" && <ExamPrepView profile={profile} />}
            {activeTab === "hints" && <HintLadderView profile={profile} />}
          </div>
        </main>
      </div>

      {/* Student Profile Personalization Modal */}
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSave={(updated) => setProfile(updated)}
      />
    </div>
  );
}
