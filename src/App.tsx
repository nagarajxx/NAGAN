/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ActiveTab, StudentProfile } from "./types";
import { TopNav } from "./components/TopNav";
import { StudentProfileModal } from "./components/StudentProfileModal";
import { TutorChat } from "./components/TutorChat";
import { ConceptExplainer } from "./components/ConceptExplainer";
import { StudyNotesView } from "./components/StudyNotesView";
import { ExamPrepView } from "./components/ExamPrepView";
import { QuizArena } from "./components/QuizArena";
import { CodeLab } from "./components/CodeLab";
import { StudyPlannerView } from "./components/StudyPlannerView";
import { HintLadderView } from "./components/HintLadderView";
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  FileCheck2,
  Code2,
  CalendarDays,
  Lightbulb,
  GraduationCap,
  Globe,
  SlidersHorizontal,
} from "lucide-react";

import heroImg from "./assets/images/hero_learning_assistant_1790756110931.jpg";
import stemImg from "./assets/images/subject_stem_concept_1790756124217.jpg";
import codeImg from "./assets/images/subject_code_debugger_1790756137152.jpg";

const DEFAULT_PROFILE: StudentProfile = {
  name: "Alex",
  grade: "High School (Grades 9-10)",
  subject: "Physics",
  language: "English",
  level: "Intermediate",
};

export default function App() {
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem("gemini_student_profile");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return DEFAULT_PROFILE;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showWelcomeHero, setShowWelcomeHero] = useState<boolean>(() => {
    return !localStorage.getItem("dismissed_hero_v1");
  });

  useEffect(() => {
    try {
      localStorage.setItem("gemini_student_profile", JSON.stringify(profile));
    } catch (e) {
      // ignore
    }
  }, [profile]);

  const handleDismissHero = () => {
    setShowWelcomeHero(false);
    localStorage.setItem("dismissed_hero_v1", "true");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Bar with 3-Zone Contract */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onUpdateLanguage={(lang) => setProfile((p) => ({ ...p, language: lang }))}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Quick Subject Switcher Strip */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] mr-1">
              Subject:
            </span>
            {[
              "Physics",
              "Chemistry",
              "Biology",
              "Mathematics",
              "Computer Science & Coding",
              "Social Studies & History",
              "Commerce & Economics",
            ].map((sub) => {
              const isSelected = profile.subject === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setProfile((prev) => ({ ...prev, subject: sub as any }))}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer font-medium ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  {sub.split(" ")[0]}
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0 text-slate-400 text-xs">
            <span>Grade: <strong className="text-slate-200">{profile.grade.split(" (")[0]}</strong></span>
            <span>·</span>
            <span>Level: <strong className="text-slate-200">{profile.level}</strong></span>
          </div>
        </div>

        {/* Optional Collapsible Welcome Banner featuring generated study visual */}
        {showWelcomeHero && (
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center">
              <div className="p-6 sm:p-7 md:col-span-7 space-y-3 z-10">
                <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold tracking-wider uppercase">
                  <Sparkles className="w-4 h-4" />
                  <span>Google Gemini Powered Learning Studio</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Master Any Subject with Step-by-Step AI Guidance
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  Personalized for <strong className="text-white">{profile.grade}</strong> in{" "}
                  <strong className="text-indigo-300">{profile.language}</strong>. From 2-mark definitions and exam essays to interactive MCQs and code debugging.
                </p>

                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <button
                    onClick={() => setActiveTab("explain")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Explore Concept Explainer</span>
                  </button>
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Customize Profile</span>
                  </button>
                  <button
                    onClick={handleDismissHero}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors ml-auto cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              <div className="relative md:col-span-5 h-44 sm:h-52 md:h-full min-h-[190px] overflow-hidden bg-slate-900">
                <img
                  src={heroImg}
                  alt="Modern study workspace with holographic learning aids"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center opacity-85 transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Feature Navigation Tiles for Quick Switching */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            {
              id: "chat",
              label: "Tutor Chat",
              desc: "Step-by-step Q&A",
              icon: Sparkles,
              color: "hover:border-indigo-500/50",
            },
            {
              id: "explain",
              label: "Explainer",
              desc: "Analogies & examples",
              icon: BookOpen,
              color: "hover:border-sky-500/50",
            },
            {
              id: "notes",
              label: "Study Notes",
              desc: "Cheat sheets & cues",
              icon: GraduationCap,
              color: "hover:border-blue-500/50",
            },
            {
              id: "exam",
              label: "Exam Prep",
              desc: "2M, 5M & 10M answers",
              icon: FileCheck2,
              color: "hover:border-amber-500/50",
            },
            {
              id: "quiz",
              label: "Quiz Arena",
              desc: "MCQs with explanations",
              icon: HelpCircle,
              color: "hover:border-emerald-500/50",
            },
            {
              id: "code",
              label: "Code Lab",
              desc: "Debug & syntax guide",
              icon: Code2,
              color: "hover:border-purple-500/50",
            },
            {
              id: "planner",
              label: "Planner",
              desc: "Timetable & checklist",
              icon: CalendarDays,
              color: "hover:border-rose-500/50",
            },
            {
              id: "hints",
              label: "Hint Ladder",
              desc: "Socratic problem hints",
              icon: Lightbulb,
              color: "hover:border-teal-500/50",
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isCurrent
                    ? "bg-slate-800/90 border-indigo-500/60 shadow-sm"
                    : `bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 ${tab.color}`
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon
                    className={`w-4 h-4 ${
                      isCurrent ? "text-indigo-400" : "text-slate-400"
                    }`}
                  />
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  )}
                </div>
                <div>
                  <div
                    className={`text-xs font-bold leading-tight ${
                      isCurrent ? "text-white" : "text-slate-300"
                    }`}
                  >
                    {tab.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {tab.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Tab View */}
        <div className="transition-all duration-200">
          {activeTab === "chat" && <TutorChat profile={profile} />}
          {activeTab === "explain" && <ConceptExplainer profile={profile} />}
          {activeTab === "notes" && <StudyNotesView profile={profile} />}
          {activeTab === "exam" && <ExamPrepView profile={profile} />}
          {activeTab === "quiz" && <QuizArena profile={profile} />}
          {activeTab === "code" && <CodeLab profile={profile} />}
          {activeTab === "planner" && <StudyPlannerView profile={profile} />}
          {activeTab === "hints" && <HintLadderView profile={profile} />}
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Gemini StudyLab</span>
            <span>·</span>
            <span>Simplifying Concepts & Exam Preparation</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Preferences ({profile.language})
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab("chat")}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Ask Gemini
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab("quiz")}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Practice MCQs
            </button>
          </div>
        </div>
      </footer>

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
