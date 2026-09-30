import React from "react";
import { StudentProfile, EducationLevel, SubjectArea, LanguagePreference, LearningPace } from "../types";
import { X, Check, Sparkles, User, Globe, GraduationCap, BookOpen } from "lucide-react";

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSave: (updated: StudentProfile) => void;
}

const EDUCATION_LEVELS: EducationLevel[] = [
  "Middle School (Grades 6-8)",
  "High School (Grades 9-10)",
  "Senior High School (Grades 11-12)",
  "College / Undergraduate",
  "Competitive Exams (JEE / NEET / GATE / UPSC)",
];

const SUBJECTS: SubjectArea[] = [
  "Physics",
  "Chemistry",
  "Biology",
  "Mathematics",
  "Computer Science & Coding",
  "Social Studies & History",
  "Commerce & Economics",
  "English & Literature",
  "General Science",
];

const LANGUAGES: { id: LanguagePreference; label: string; desc: string }[] = [
  { id: "English", label: "English", desc: "Clear, universal, simple English" },
  { id: "Tamil", label: "தமிழ் (Tamil)", desc: "Pure Tamil script & explanations" },
  { id: "Tanglish", label: "Tanglish (Tamil in English)", desc: "Conversational Tamil written in English letters" },
];

const PACES: { id: LearningPace; label: string; desc: string }[] = [
  { id: "Beginner", label: "Beginner", desc: "Step-by-step from absolute fundamentals" },
  { id: "Intermediate", label: "Intermediate", desc: "Core concepts with practical exam depth" },
  { id: "Advanced", label: "Advanced", desc: "Rigorous proofs, edge cases & deep reasoning" },
];

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [formData, setFormData] = React.useState<StudentProfile>(profile);

  React.useEffect(() => {
    setFormData(profile);
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Personalized Learning Profile
              </h2>
              <p className="text-xs text-slate-400">
                Tailors Gemini's tone, difficulty, examples, and language to your needs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Student Name or Nickname
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="e.g. Sneha or Karthik"
            />
          </div>

          {/* Education Level */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              Grade / Education Stage
            </label>
            <select
              value={formData.grade}
              onChange={(e) =>
                setFormData({ ...formData, grade: e.target.value as EducationLevel })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
            >
              {EDUCATION_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl} className="bg-slate-900 text-white">
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Focus */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Primary Subject Focus
            </label>
            <select
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value as SubjectArea })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
            >
              {SUBJECTS.map((sub) => (
                <option key={sub} value={sub} className="bg-slate-900 text-white">
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Language Preference */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              Language / Medium of Explanation
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {LANGUAGES.map((lang) => {
                const isSelected = formData.language === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, language: lang.id })}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-sm"
                        : "bg-slate-800/50 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{lang.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {lang.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Learning Pace */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Learning Level / Pace
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PACES.map((p) => {
                const isSelected = formData.level === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, level: p.id })}
                    className={`py-2 px-3 text-center rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                        : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
