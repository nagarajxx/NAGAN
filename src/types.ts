export type EducationLevel =
  | "Middle School (Grades 6-8)"
  | "High School (Grades 9-10)"
  | "Senior High School (Grades 11-12)"
  | "College / Undergraduate"
  | "Competitive Exams (JEE / NEET / GATE / UPSC)";

export type SubjectArea =
  | "Physics"
  | "Chemistry"
  | "Biology"
  | "Mathematics"
  | "Computer Science & Coding"
  | "Social Studies & History"
  | "Commerce & Economics"
  | "English & Literature"
  | "General Science";

export type LanguagePreference = "English" | "Tamil" | "Tanglish";

export type LearningPace = "Beginner" | "Intermediate" | "Advanced";

export interface StudentProfile {
  name: string;
  grade: EducationLevel;
  subject: SubjectArea;
  language: LanguagePreference;
  level: LearningPace;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  conceptTag?: string;
}

export type ActiveTab =
  | "chat"
  | "explain"
  | "notes"
  | "exam"
  | "quiz"
  | "code"
  | "planner"
  | "hints";
