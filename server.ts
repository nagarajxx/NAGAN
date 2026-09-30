import express, { Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Google Gemini API on server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const DEFAULT_MODEL = "gemini-3.8-flash";

// Helper to safely parse JSON from Gemini responses that might contain markdown fences
function parseJsonSafely(text?: string, fallback: any = []): any {
  if (!text) return fallback;
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/) || cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (inner) {
        console.warn("Failed inner regex JSON parse:", inner);
      }
    }
    console.warn("Failed to parse JSON safely, returning fallback:", e);
    return fallback;
  }
}
function getPersonalizedSystemPrompt(profile?: {
  grade?: string;
  subject?: string;
  level?: string;
  language?: string;
}) {
  const grade = profile?.grade || "High School (Grades 9-12)";
  const subject = profile?.subject || "General / Multi-disciplinary";
  const level = profile?.level || "Beginner to Intermediate";
  const language = profile?.language || "English";

  let languageInstruction = "Explain clearly in simple, natural English.";
  if (language === "Tamil") {
    languageInstruction =
      "Provide explanations primarily in pure and clear Tamil (தமிழ்). Technical terms may include English equivalents in brackets where helpful for clarity.";
  } else if (language === "Tanglish") {
    languageInstruction =
      "Provide explanations in Tanglish (colloquial Tamil written in English alphabet script, common among South Indian students, e.g., 'Idhula simple-ah purinjikanum na...'). Keep it friendly, engaging, and clear!";
  }

  return `You are the Google Gemini Powered Learning Assistant—a dedicated, encouraging, world-class educator and tutor.
Your core mission is to make learning simple, personalized, interactive, and accessible to every student.

Student Learning Context:
- Target Education Level: ${grade}
- Current Subject Focus: ${subject}
- Learning Pace/Level: ${level}
- Language Preference: ${language} (${languageInstruction})

Pedagogical Principles:
1. Clarity & Simplicity: Explain difficult concepts using simple words, intuitive analogies, and real-world examples.
2. Structure: Use clear markdown headings (##, ###), bullet points, and highlight key terms with bold text.
3. Exam & Understanding Focus: Emphasize 'Why' and 'How' rather than pure rote memorization.
4. Active Encouragement: Maintain a warm, patient, and inspiring tone.
5. Accuracy: Never hallucinate facts. If something has nuances or depends on syllabus, clearly specify.
6. When code is involved, format it cleanly in markdown code blocks with clear commentary.`;
}

// 1. Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// 2. Chat / Interactive Q&A
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { message, history, profile, mode } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    const systemPrompt = getPersonalizedSystemPrompt(profile);
    const chatModeInstruction =
      mode === "socratic"
        ? "\nMode: Socratic Teacher. Guide the student by asking a gentle guiding question or giving a slight hint rather than directly revealing the entire answer immediately. Encourage them to think."
        : "\nMode: Direct & Clear Tutor. Provide a comprehensive, step-by-step answer with examples and a summary.";

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const turn of history.slice(-8)) {
        contents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.content }],
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt + chatModeInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text || "No response generated." });
  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    res.status(500).json({
      error: err.message || "Failed to generate tutor response.",
    });
  }
});

// 3. Simple Concept Explanations
app.post("/api/explain", async (req: Request, res: Response) => {
  try {
    const { topic, profile, detailLevel } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required." });
    }

    const systemPrompt = getPersonalizedSystemPrompt(profile);
    const prompt = `Explain the following topic for a student: "${topic}".
Desired depth: ${detailLevel || "standard"}

Structure your response cleanly using these sections:
1. **Core Idea in 30 Seconds** (A crystal-clear definition using simple words)
2. **Everyday Analogy** (An intuitive comparison to daily life objects or experiences)
3. **How It Works (Step-by-Step)** (Numbered steps or mechanisms)
4. **Real-World Practical Example** (Where we see or use this in real life)
5. **Common Mistakes / Misconceptions** (What students often get wrong)
6. **Key Takeaway** (One memorable sentence to remember for exams)`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.6,
      },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Error in /api/explain:", err);
    res.status(500).json({ error: err.message || "Failed to explain topic." });
  }
});

// 4. Study Notes Generator
app.post("/api/notes", async (req: Request, res: Response) => {
  try {
    const { topic, format, profile } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required." });
    }

    const systemPrompt = getPersonalizedSystemPrompt(profile);
    const prompt = `Generate comprehensive revision study notes for: "${topic}".
Format preference: ${format || "bullet-points and cheat sheet"}

Please structure the notes as follows:
# 📚 Study Revision Notes: ${topic}
## 1. High-Yield Summary
## 2. Key Definitions & Terminology
## 3. Important Formulas, Laws & Principles (if applicable)
## 4. Core Concepts & Mechanisms (Bullet points)
## 5. Quick Memory Mnemonics & Tricks
## 6. Last-Minute Exam Checklist (5 rapid-fire points)`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.5,
      },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Error in /api/notes:", err);
    res.status(500).json({ error: err.message || "Failed to generate notes." });
  }
});

// 5. Exam Preparation: 2-Mark, 5-Mark, 10-Mark Generator
app.post("/api/exam-prep", async (req: Request, res: Response) => {
  try {
    const { topic, markType, profile } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required." });
    }

    const systemPrompt = getPersonalizedSystemPrompt(profile);
    let promptInstruction = "";

    if (markType === "2-mark") {
      promptInstruction = `Generate three typical 2-Mark Exam Questions and Model Answers for: "${topic}".
Each 2-mark answer must be crisp, 2 to 3 sentences maximum, containing the exact definition and 2 bullet points or formula to secure full 2 marks.`;
    } else if (markType === "5-mark") {
      promptInstruction = `Generate two typical 5-Mark Exam Questions and Model Answers for: "${topic}".
Each 5-mark answer must have:
- Clear heading
- Definition / Concept statement
- 4 to 5 structured points with subheadings
- Diagram / Flowchart suggestion (describe how the student should sketch it)
- Example or formula
- Expected mark breakdown (e.g., Definition: 1m, Points: 3m, Diagram/Example: 1m)`;
    } else if (markType === "10-mark") {
      promptInstruction = `Generate an in-depth 10-Mark / Essay Exam Question and Model Answer for: "${topic}".
The 10-mark answer must follow the optimal university/board exam presentation pattern:
- **Title & Question**
- **Examiner's Marking Scheme** (Distribution of 10 marks)
- **1. Introduction** (Context and clear thesis/definition)
- **2. Core Working / Classification / Theoretical Framework**
- **3. Detailed Points with Subheadings** (In-depth analysis)
- **4. Flowchart / Schematic Representation** (Step-by-step ASCII or descriptive diagram)
- **5. Practical Application / Case Example**
- **6. Advantages & Limitations** (or Comparison table)
- **7. Conclusion & Summary**`;
    } else {
      promptInstruction = `Generate a complete Exam Question Bank for: "${topic}" containing:
1. **2-Mark Questions (Short Answers):** 2 questions with concise high-scoring answers.
2. **5-Mark Questions (Medium Answers):** 1 question with structured headings, points, and diagram suggestion.
3. **10-Mark Question (Long Essay Answer):** 1 comprehensive question with full answer structure, mark distribution, and presentation advice.`;
    }

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: promptInstruction,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.5,
      },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Error in /api/exam-prep:", err);
    res.status(500).json({ error: err.message || "Failed to generate exam prep." });
  }
});

// 6. Interactive Quiz Generator (MCQs with JSON response)
app.post("/api/quiz", async (req: Request, res: Response) => {
  try {
    const { topic, count = 5, difficulty = "Medium", profile } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required." });
    }

    const systemPrompt = getPersonalizedSystemPrompt(profile);
    const prompt = `Create an interactive multiple-choice quiz on "${topic}".
Number of questions: ${count}.
Difficulty level: ${difficulty}.
Ensure each question tests conceptual understanding rather than trivial trivia.
Provide 4 plausible choices for each question, mark the correct 0-indexed choice, and provide a clear explanation for the correct answer as well as why distractors are wrong.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of quiz questions",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER, description: "Question index starting from 1" },
              question: { type: Type.STRING, description: "The question text" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of 4 multiple choice options",
              },
              correctIndex: {
                type: Type.INTEGER,
                description: "0-based index of the correct option (0 to 3)",
              },
              explanation: {
                type: Type.STRING,
                description: "Detailed explanation of why the answer is correct",
              },
              conceptTag: {
                type: Type.STRING,
                description: "Short concept or topic tag tested",
              },
            },
            required: ["id", "question", "options", "correctIndex", "explanation"],
          },
        },
        temperature: 0.5,
      },
    });

    const parsed = parseJsonSafely(response.text, []);
    res.json({ questions: parsed });
  } catch (err: any) {
    console.error("Error in /api/quiz:", err);
    res.status(500).json({ error: err.message || "Failed to generate quiz." });
  }
});

// 7. Programming Support & Code Debugger
app.post("/api/code-helper", async (req: Request, res: Response) => {
  try {
    const { language = "Python", code, question, mode, profile } = req.body;
    const systemPrompt = getPersonalizedSystemPrompt(profile);

    let prompt = "";
    if (mode === "debug") {
      prompt = `Act as a senior computer science tutor and code debugger.
Programming Language: ${language}
Code to Debug:
\`\`\`${language.toLowerCase()}
${code || ""}
\`\`\`
Issue or student's question: "${question || "Find any errors or logic bugs in this code"}"

Please structure your response with:
1. **Bug Identification & Classification**:
   - Error Type: (e.g. Syntax Error / IndexError / ZeroDivisionError / Infinite Loop / Logic Bug)
   - Problematic Line Number(s): (e.g. Line 5)
   - Root Cause: (Clear explanation in simple terms)
2. **Corrected Code**:
Provide the complete working replacement code inside a single standard markdown code block:
\`\`\`${language.toLowerCase()}
# corrected code here
\`\`\`
3. **Step-by-Step Fix Explanation**: Exactly what was changed and why.
4. **Dry-Run Trace Table**: Step-by-step variable values for a sample test input.
5. **Key Prevention Tip**: How to avoid this common trap in the future.
6. **Complexity Analysis**: Time and Space complexity.`;
    } else if (mode === "explain") {
      prompt = `Explain the following ${language} code or concept step-by-step for a student:
\`\`\`${language.toLowerCase()}
${code || ""}
\`\`\`
Focus Topic / Question: "${question || "Explain how this code works line by line"}"

Break down:
1. **High-Level Purpose** (What problem this solves)
2. **Line-by-Line Breakdown**
3. **Memory / Variable Trace Table** (Trace with a small sample input)
4. **Beginner-Friendly Practice Challenge**`;
    } else {
      // General coding assistance
      prompt = `Help student learn programming in ${language}.
Topic / Request: "${question}"
Code snippet (if provided):
\`\`\`${language.toLowerCase()}
${code || ""}
\`\`\`
Provide a crystal-clear tutorial with practical code examples, comments, and output preview.`;
    }

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      },
    });

    const fullText = response.text || "";

    // Extract the corrected code snippet if in debug mode
    let fixedCode: string | null = null;
    if (mode === "debug") {
      const codeMatches = fullText.match(/```(?:[a-zA-Z0-9_-]*)\n([\s\S]*?)```/g);
      if (codeMatches && codeMatches.length > 0) {
        // Find the code block that represents the corrected code
        for (const match of codeMatches) {
          const stripped = match.replace(/```(?:[a-zA-Z0-9_-]*)\n/, "").replace(/```$/, "").trim();
          if (stripped && stripped.length > 10) {
            fixedCode = stripped;
            break;
          }
        }
      }
    }

    res.json({
      text: fullText,
      fixedCode,
      language,
    });
  } catch (err: any) {
    console.error("Error in /api/code-helper:", err);
    res.status(500).json({ error: err.message || "Failed to process code request." });
  }
});

// 8. Study Planner Generator
app.post("/api/study-plan", async (req: Request, res: Response) => {
  try {
    const { subjects, examDate, hoursPerDay, goal, profile } = req.body;
    const systemPrompt = getPersonalizedSystemPrompt(profile);

    const prompt = `Create a realistic, scientifically structured study plan for a student.
Target Goal: ${goal || "Exam revision and strong conceptual clarity"}
Subjects / Topics to Cover: ${subjects || "Mathematics, Physics, Chemistry"}
Available Study Time: ${hoursPerDay || 3} hours per day
Exam or Target Deadline: ${examDate || "In 2 weeks"}

Please generate:
1. **Daily Routine & Session Breakdown** (Incorporating Pomodoro: 45 min focus + 10 min break + active recall)
2. **Weekly Milestone Timetable** (Day 1 to Day 7 structured schedule)
3. **Spaced Repetition & Revision Schedule** (When to review Day 1 topics)
4. **Study Strategy & Mindset Tips** (Preventing burnout, effective note taking)
5. **Daily Checklist Template** for tracking progress`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.6,
      },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Error in /api/study-plan:", err);
    res.status(500).json({ error: err.message || "Failed to generate study plan." });
  }
});

// 9. Interactive Socratic Hints
app.post("/api/interactive-hint", async (req: Request, res: Response) => {
  try {
    const { problem, hintLevel = 1, profile } = req.body;
    if (!problem) {
      return res.status(400).json({ error: "Problem is required." });
    }

    const systemPrompt = getPersonalizedSystemPrompt(profile);
    const hintInstructions: Record<number, string> = {
      1: "Provide Hint 1: A gentle conceptual nudge or guiding question. DO NOT reveal the formula or calculations yet. Help them identify what the question is asking and what principle applies.",
      2: "Provide Hint 2: Point out the specific relevant formula, law, or strategic starting equation without doing the numerical substitution or full calculation.",
      3: "Provide Hint 3: Walk through the first half of the solution step-by-step, setting up the calculation or logic, leaving only the final calculation or conclusion for the student to complete.",
      4: "Provide the Full Complete Solution: Clear step-by-step working from start to finish with the final verified answer and explanation.",
    };

    const instruction =
      hintInstructions[hintLevel] || hintInstructions[1];
    const prompt = `Student is working on this problem:
"${problem}"

Requested Guidance Level: Hint ${hintLevel} of 4.
${instruction}

Keep your answer supportive, concise, and focused on building student confidence.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
      },
    });

    res.json({ hint: response.text, level: hintLevel });
  } catch (err: any) {
    console.error("Error in /api/interactive-hint:", err);
    res.status(500).json({ error: err.message || "Failed to generate hint." });
  }
});

// Serve frontend: Vite middlewares in dev, static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Learning Assistant server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
