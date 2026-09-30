import React from "react";
import { ActiveTab, StudentProfile, LanguagePreference, SubjectArea } from "../types";
import {
  MessageSquare,
  Sparkles,
  BookOpen,
  FileCheck2,
  HelpCircle,
  Code2,
  CalendarDays,
  Lightbulb,
  SlidersHorizontal,
  Globe,
} from "lucide-react";

interface TopNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  profile: StudentProfile;
  onOpenProfile: () => void;
  onUpdateLanguage: (lang: LanguagePreference) => void;
}

const NAV_ITEMS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
  { id: "chat", label: "Tutor Chat", icon: MessageSquare },
  { id: "explain", label: "Concept Explainer", icon: Sparkles },
  { id: "notes", label: "Study Notes", icon: BookOpen },
  { id: "exam", label: "Exam Prep", icon: FileCheck2 },
  { id: "quiz", label: "Quiz Arena", icon: HelpCircle },
  { id: "code", label: "Code Lab", icon: Code2 },
  { id: "planner", label: "Study Planner", icon: CalendarDays },
  { id: "hints", label: "Hint Ladder", icon: Lightbulb },
];

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  profile,
  onOpenProfile,
  onUpdateLanguage,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-sm font-black text-sm">
            G
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white select-none">
            Gemini StudyLab
          </span>
        </div>

        {/* Zone 2: Navigation tabs with single-line controls */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Quick Language Switcher & Profile Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Language Toggle */}
          <div className="hidden sm:flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            {(["English", "Tamil", "Tanglish"] as LanguagePreference[]).map((lang) => (
              <button
                key={lang}
                onClick={() => onUpdateLanguage(lang)}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  profile.language === lang
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {lang === "Tamil" ? "தமிழ்" : lang}
              </button>
            ))}
          </div>

          {/* Profile settings button */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors cursor-pointer group shadow-sm"
            title="Configure Student Profile & Preferences"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-45 transition-transform" />
            <div className="hidden sm:flex items-center gap-1.5 text-left">
              <span className="font-semibold text-white max-w-[90px] truncate">
                {profile.name}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 max-w-[80px] truncate">{profile.subject}</span>
            </div>
            <span className="sm:hidden font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Mobile / Tablet sub-nav horizontal scroller */}
      <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-800/80 bg-slate-950 no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white bg-slate-900/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};

