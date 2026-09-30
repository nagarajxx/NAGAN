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
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Split,
  Terminal,
  Zap,
} from "lucide-react";

interface CodeLabProps {
  profile: StudentProfile;
}

const PROGRAMMING_LANGUAGES = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "C++",
  "C",
  "SQL",
];

interface BugPreset {
  title: string;
  category: string;
  lang: string;
  code: string;
  question: string;
}

const BUG_PRESETS: BugPreset[] = [
  {
    title: "Off-by-One Index Error",
    category: "IndexError",
    lang: "Python",
    code: `def calculate_average(grades):
    total = 0
    # Bug: range(len + 1) causes IndexError on last iteration!
    for i in range(len(grades) + 1):
        total += grades[i]
    return total / len(grades)

scores = [85, 90, 78, 92]
print("Class Average:", calculate_average(scores))`,
    question: "This throws IndexError: list index out of range at the last step. How do I fix it?",
  },
  {
    title: "Infinite Loop Missing Increment",
    category: "InfiniteLoop",
    lang: "JavaScript",
    code: `function findFirstPrime(limit) {
    let num = 2;
    while (num < limit) {
        let isPrime = true;
        for (let d = 2; d * d <= num; d++) {
            if (num % d === 0) {
                isPrime = false;
                break;
            }
        }
        if (isPrime) return num;
        // Bug: forgot to increment num++! Freezes the browser
    }
    return -1;
}

console.log(findFirstPrime(20));`,
    question: "Why does this script freeze or hang indefinitely without producing output?",
  },
  {
    title: "Mutable Default Argument Trap",
    category: "LogicBug",
    lang: "Python",
    code: `def register_student(name, enrolled_courses=[]):
    # Bug: enrolled_courses default list is created ONCE at function definition!
    enrolled_courses.append(name)
    return enrolled_courses

batch_a = register_student("Karthik")
batch_b = register_student("Sneha")

print("Batch A:", batch_a)
print("Batch B:", batch_b) # Unexpectedly contains both Karthik and Sneha!`,
    question: "Why does Batch B contain names from Batch A? Explain this classic Python trap.",
  },
  {
    title: "Unresolved Promise (Async/Await)",
    category: "AsyncBug",
    lang: "JavaScript",
    code: `async function fetchStudentGrade(studentId) {
    return new Promise((resolve) => {
        setTimeout(() => resolve({ id: studentId, score: 95 }), 500);
    });
}

function displayReport(studentId) {
    // Bug: forgot await or .then()! studentData is a pending Promise object
    const studentData = fetchStudentGrade(studentId);
    console.log("Student Score: " + studentData.score); // undefined!
}

displayReport(101);`,
    question: "Why is studentData.score undefined even though the async function returns { score: 95 }?",
  },
  {
    title: "Integer Truncation Division",
    category: "ArithmeticBug",
    lang: "C++",
    code: `#include <iostream>

int main() {
    int mathMarks = 85;
    int maxMarks = 100;
    
    // Bug: integer / integer results in integer truncation (0)!
    double percentage = (mathMarks / maxMarks) * 100;
    
    std::cout << "Calculated Percentage: " << percentage << "%" << std::endl;
    return 0;
}`,
    question: "Why does this print 0% instead of 85%?",
  },
  {
    title: "SQL Missing GROUP BY in Aggregate",
    category: "SQLSyntax",
    lang: "SQL",
    code: `-- Target: Get average mark per department
SELECT 
    department_name,
    COUNT(student_id) AS total_students,
    AVG(final_grade) AS avg_grade
FROM student_records
-- Bug: Missing GROUP BY department_name!
WHERE semester = 'Fall 2026';`,
    question: "Why does the SQL engine return 'column department_name must appear in the GROUP BY clause'?",
  },
];

export const CodeLab: React.FC<CodeLabProps> = ({ profile }) => {
  const [language, setLanguage] = useState<string>("Python");
  const [mode, setMode] = useState<"debug" | "explain" | "tutorial">("debug");
  const [code, setCode] = useState<string>(BUG_PRESETS[0].code);
  const [question, setQuestion] = useState<string>(BUG_PRESETS[0].question);
  const [result, setResult] = useState<string | null>(null);
  const [fixedCode, setFixedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [diffView, setDiffView] = useState<"side-by-side" | "result">("result");
  const [appliedFix, setAppliedFix] = useState<boolean>(false);

  // Quick client-side syntax scan
  const checkBasicSyntax = () => {
    const issues: string[] = [];
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push(`Mismatched parentheses: ${openParens} '(' vs ${closeParens} ')'`);
    }

    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push(`Mismatched curly braces: ${openBraces} '{' vs ${closeBraces} '}'`);
    }

    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push(`Mismatched square brackets: ${openBrackets} '[' vs ${closeBrackets} ']'`);
    }

    if (language === "Python") {
      const lines = code.split("\n");
      lines.forEach((l, idx) => {
        if (/^\s*(if|for|while|def|class|else|elif|try|except|finally)\b.*[^:]$/.test(l.trim())) {
          if (!l.trim().endsWith(":") && !l.trim().endsWith("\\")) {
            issues.push(`Line ${idx + 1}: Missing colon ':' at end of statement: "${l.trim()}"`);
          }
        }
      });
    }

    return issues;
  };

  const syntaxIssues = checkBasicSyntax();

  const handleAnalyze = async () => {
    if ((!code.trim() && !question.trim()) || loading) return;

    setLoading(true);
    setError(null);
    setFixedCode(null);
    setAppliedFix(false);

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
      if (data.fixedCode) {
        setFixedCode(data.fixedCode);
      }
    } catch (err: any) {
      setError(err.message || "Failed to process code.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: BugPreset) => {
    setLanguage(preset.lang);
    setCode(preset.code);
    setQuestion(preset.question);
    setResult(null);
    setFixedCode(null);
    setAppliedFix(false);
    setDiffView("result");
  };

  const handleApplyFixToEditor = () => {
    if (!fixedCode) return;
    setCode(fixedCode);
    setAppliedFix(true);
    setTimeout(() => setAppliedFix(false), 3000);
  };

  const handleCopy = (textToCopy?: string) => {
    const text = textToCopy || result;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeLineCount = code.split("\n").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
          <Bug className="w-4 h-4 text-red-400" />
          <span>Interactive Code Debugger & Algorithm Explainer</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Locate Bugs, Understand Root Causes & Verify Fixes
        </h1>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Powered by Gemini. Get exact bug classifications, line-by-line diagnostics, side-by-side diff previews, and one-click fixes for {language}.
        </p>
      </div>

      {/* Main Workspace */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        {/* Top Controls: Mode & Language */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
          {/* Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode("debug")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                mode === "debug"
                  ? "bg-red-600/30 text-red-200 border border-red-500/50 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Debug & Find Bug</span>
            </button>

            <button
              onClick={() => setMode("explain")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                mode === "explain"
                  ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-sm"
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
                  ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/50 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Concept Tutorial</span>
            </button>
          </div>

          {/* Language Selector & Pre-Scan Indicator */}
          <div className="flex items-center gap-3">
            {syntaxIssues.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-800/60">
                <AlertTriangle className="w-3 h-3" />
                <span>{syntaxIssues.length} syntax alert{syntaxIssues.length > 1 ? "s" : ""}</span>
              </span>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
              >
                {PROGRAMMING_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Code Editor with Gutter */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Code Editor ({language})
              </label>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>{codeLineCount} lines</span>
              <span>·</span>
              <button
                onClick={() => setCode("")}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                Clear Editor
              </button>
            </div>
          </div>

          {/* Gutter + Textarea Container */}
          <div className="relative flex rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            {/* Line Number Gutter */}
            <div
              className="py-3 px-2.5 bg-slate-950/90 border-r border-slate-800/80 text-right font-mono text-xs text-slate-600 select-none leading-relaxed shrink-0 w-10 sm:w-12"
              aria-hidden="true"
            >
              {Array.from({ length: Math.max(codeLineCount, 6) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Input Area */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={Math.max(codeLineCount, 7)}
              placeholder={`Paste or write your ${language} code here...`}
              className="flex-1 p-3 bg-transparent font-mono text-xs sm:text-sm text-emerald-300 placeholder-slate-600 focus:outline-none leading-relaxed resize-y"
              spellCheck={false}
            />
          </div>

          {/* Pre-scan alerts if any */}
          {syntaxIssues.length > 0 && (
            <div className="mt-2 p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/40 text-amber-300/90 text-xs space-y-1">
              <span className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Quick Syntax Pre-Check:
              </span>
              {syntaxIssues.map((issue, idx) => (
                <p key={idx} className="pl-5 text-slate-300">
                  · {issue}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Error Message or Specific Question Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Error Message / Bug Description / Question
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="e.g. Why am I getting an IndexError? Or find why the loop never terminates"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Presets and Run Button */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-medium text-slate-400 shrink-0 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Presets:
            </span>
            {BUG_PRESETS.map((p, i) => (
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
                <span>Diagnosing Code...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Debugger</span>
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

      {/* Applied Fix confirmation alert */}
      {appliedFix && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>The corrected code has been applied directly to your code editor above!</span>
        </div>
      )}

      {/* Analysis & Debugging Output */}
      {result && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-300">
          {/* Output Header */}
          <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">
                  Debugging Analysis & Solution
                </h2>
              </div>

              {fixedCode && (
                <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setDiffView("result")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      diffView === "result"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Full Analysis
                  </button>
                  <button
                    onClick={() => setDiffView("side-by-side")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      diffView === "side-by-side"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Split className="w-3 h-3" />
                    <span>Side-by-Side Diff</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {fixedCode && (
                <button
                  onClick={handleApplyFixToEditor}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/50 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  title="Replace buggy code in editor with verified fixed code"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Fix to Editor</span>
                </button>
              )}

              <button
                onClick={() => handleCopy()}
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

          {/* Side-by-Side Diff View Mode */}
          {diffView === "side-by-side" && fixedCode ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950">
              {/* Original Code */}
              <div className="rounded-xl border border-red-900/60 bg-slate-900/80 overflow-hidden">
                <div className="px-4 py-2 bg-red-950/40 border-b border-red-900/60 text-xs font-semibold text-red-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Bug className="w-3.5 h-3.5 text-red-400" />
                    Original (Buggy) Code
                  </span>
                </div>
                <pre className="p-4 text-xs font-mono text-red-200/90 overflow-x-auto leading-relaxed max-h-96">
                  <code>{code}</code>
                </pre>
              </div>

              {/* Fixed Code */}
              <div className="rounded-xl border border-emerald-900/60 bg-slate-900/80 overflow-hidden">
                <div className="px-4 py-2 bg-emerald-950/40 border-b border-emerald-900/60 text-xs font-semibold text-emerald-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Corrected Code
                  </span>
                  <button
                    onClick={() => handleCopy(fixedCode)}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    Copy Fix
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed max-h-96">
                  <code>{fixedCode}</code>
                </pre>
              </div>
            </div>
          ) : (
            /* Full Markdown Output */
            <div className="p-6 sm:p-8">
              <MarkdownRenderer content={result} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
