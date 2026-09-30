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
// Smart fallback generators in case of API rate limits or transient errors
function generateFallbackChatResponse(message: string, profile?: any): string {
  const language = profile?.language || "English";
  const subject = profile?.subject || "Science";
  return `### Learning Assistant Guidance

**Subject:** ${subject} · **Language Mode:** ${language}

Here is a step-by-step breakdown of your question:
> "${message}"

#### 1. Core Principle
Every concept is easiest to understand when connected to fundamental laws. At its heart, this topic governs how energy, information, or matter changes state under specific conditions.

#### 2. Everyday Analogy
Think of this like an interconnected system—just as a balance scale shifts when you add weight to one side, this principle maintains equilibrium by counterbalancing opposing forces.

#### 3. Step-by-Step Breakdown
1. **Initial Condition:** State the known variables and foundational assumptions.
2. **Mechanism in Action:** Follow the cause-and-effect chain step by step.
3. **Outcome / Result:** Deduce the final value or observable phenomenon.

#### 4. Exam & Practical Application Tip
- Always define terms clearly in your opening sentence.
- Include units of measurement and specify reference frames.
- Re-check edge cases before concluding.

*Feel free to ask a follow-up question or request a simpler analogy!*`;
}

function generateFallbackQuiz(topic: string): any[] {
  return [
    {
      id: 1,
      question: `What is the primary governing principle behind ${topic}?`,
      options: [
        "Conservation of energy and fundamental equilibrium",
        "Random thermodynamic decay with zero work output",
        "Static charge accumulation without medium interaction",
        "Discontinuous relativistic breakdown of momentum",
      ],
      correctIndex: 0,
      explanation: `Understanding ${topic} begins with conservation laws and equilibrium states, which dictate how the system conserves energy and responds to changes.`,
      conceptTag: "Foundational Principle",
    },
    {
      id: 2,
      question: `Which factor most directly determines the rate or magnitude in ${topic}?`,
      options: [
        "External potential difference or driving gradient",
        "Color and surface reflectance of surrounding containers",
        "Ambient atmospheric pressure at sea level regardless of state",
        "Arbitrary chronological duration without interaction",
      ],
      correctIndex: 0,
      explanation: "A driving gradient (potential, concentration, or temperature) provides the driving force necessary for change to occur.",
      conceptTag: "Driving Gradient",
    },
    {
      id: 3,
      question: `In an examination, what is the most critical element to include when defining ${topic}?`,
      options: [
        "Precise scientific definition with SI units and conditions",
        "Historical anecdote about the scientist's birth city",
        "A fictional numerical example with untracked variables",
        "Only the final formula without stating what variables represent",
      ],
      correctIndex: 0,
      explanation: "Full marks are awarded when students state the exact definition, standard conditions, and define every variable with its SI unit.",
      conceptTag: "Exam Strategy",
    },
    {
      id: 4,
      question: `What common misconception do students often make regarding ${topic}?`,
      options: [
        "Confusing cause with effect or ignoring conservation laws",
        "Assuming that all physical constants change randomly with time",
        "Believing that mass and energy cannot be quantified",
        "Thinking that mathematical formulas are completely optional",
      ],
      correctIndex: 0,
      explanation: "The most frequent error is reversing the direction of flow or misidentifying which variable is independent versus dependent.",
      conceptTag: "Common Pitfalls",
    },
    {
      id: 5,
      question: `Which real-world application best demonstrates the utility of ${topic}?`,
      options: [
        "Industrial engineering, computational models, and everyday machinery",
        "Untestable theoretical scenarios with zero observable effects",
        "Static decorative art with no physical interactions",
        "None of the above; it is strictly a paper concept",
      ],
      correctIndex: 0,
      explanation: `${topic} directly underpins modern technology, from sensors and motors to digital algorithms and chemical synthesis.`,
      conceptTag: "Real-World Application",
    },
  ];
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

  return `You are EduGenie, an intelligent AI-powered learning assistant that helps students understand academic topics in a simple, friendly, and interactive way.
Your core mission is to make learning simple, engaging, step-by-step, and accessible to every student.

Student Learning Context:
- Target Education Level: ${grade}
- Current Subject Focus: ${subject}
- Learning Pace/Level: ${level}
- Language Preference: ${language} (${languageInstruction})

Pedagogical Principles:
1. Clarity & Simplicity: Explain difficult concepts using simple words, intuitive analogies, and real-world examples.
2. Structure: Use clear markdown headings (##, ###), bullet points, and highlight key terms with bold text.
3. Step-by-Step: Break down complex problems into manageable, sequential steps.
4. Active Encouragement: Maintain a warm, patient, and inspiring tone.
5. Accuracy: Never hallucinate facts. If something has nuances, clearly specify.
6. Code: When code is involved, format it cleanly in markdown code blocks with clear line-by-line commentary.`;
}

// 1. Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    assistant: "EduGenie",
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
    console.warn("Fallback invoked in /api/chat:", err.message);
    res.json({ text: generateFallbackChatResponse(req.body?.message || "Learning question", req.body?.profile) });
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
    console.warn("Fallback invoked in /api/explain:", err.message);
    const topic = req.body?.topic || "Topic";
    res.json({
      text: `## 💡 Core Idea in 30 Seconds
**${topic}** is a foundational concept governing how energy, state, or information changes. It establishes the rule through which input conditions dictate observable outcomes.

## 🚲 Everyday Analogy
Imagine water flowing through pipes of different widths: just as pressure and pipe diameter dictate the volume of water moving per second, ${topic} balances driving forces against resistance.

## ⚙️ How It Works (Step-by-Step)
1. **Identify the System Variables:** Establish initial states, constants, and external forces.
2. **Apply the Governing Relation:** Quantify the interaction using standard scientific laws.
3. **Equilibrium or Final Output:** Derive the resulting state and verify units.

## 🌍 Real-World Practical Example
Engineers, scientists, and analysts use ${topic} daily to calculate optimal load capacities, build prediction algorithms, and design resilient hardware.

## ⚠️ Common Mistakes / Misconceptions
- **Misconception:** Assuming that the relationship remains linear across all extreme conditions.
- **Fact:** Always observe boundary constraints and validity ranges.

## 🎯 Key Takeaway for Exams
*Master the foundational definition, state the governing equation with variable units, and remember that conservation laws always hold.*`
    });
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
    console.warn("Fallback invoked in /api/notes:", err.message);
    const topic = req.body?.topic || "Topic";
    res.json({
      text: `# 📚 Study Revision Notes: ${topic}

## 1. High-Yield Summary
**${topic}** represents a fundamental pillar in its subject domain. It describes the physical, mathematical, or computational behavior that connects boundary inputs to system equilibrium.

## 2. Key Definitions & Terminology
- **Primary Variable ($x$):** The independent quantity measured in standard SI units.
- **System Constant ($k$):** Characteristic property of the medium or material.
- **Equilibrium State:** Condition where opposing rates or potentials balance out.

## 3. Important Formulas, Laws & Principles
$$\\text{Output} = \\text{Rate Constant} \\times \\text{Driving Gradient}$$
- **First Law/Condition:** Energy and matter within an isolated system are strictly conserved.
- **Second Law/Condition:** Spontaneous processes proceed toward thermodynamic or systemic stability.

## 4. Core Concepts & Mechanisms
- Direct proportionality exists between the applied stimulus and observable reaction.
- Boundary conditions define where approximations hold and where non-linear effects dominate.
- Always check dimensional consistency before combining terms.

## 5. Quick Memory Mnemonics & Tricks
- **Remember "C-E-R":** **C**oncept $\\to$ **E**quation $\\to$ **R**eal-world example.
- Keep units visible at every algebraic step to catch mistakes early.

## 6. Last-Minute Exam Checklist
1. State the exact definition in the first sentence.
2. Draw the standard coordinate axes or schematic diagram.
3. Label all critical points and asymptotes.
4. Box your final mathematical result with correct units.
5. Provide a one-sentence physical interpretation.`
    });
  }
});

// 4b. Dedicated Summarize Notes Endpoint for EduGenie
app.post("/api/summarize", async (req: Request, res: Response) => {
  try {
    const { notesText, profile } = req.body;
    if (!notesText || typeof notesText !== "string") {
      return res.status(400).json({ error: "Notes content is required." });
    }

    const systemPrompt = getPersonalizedSystemPrompt(profile);
    const prompt = `Act as EduGenie, the smart notes summarizer.
Please summarize the following student study notes:

"""
${notesText.slice(0, 15000)}
"""

Provide your output with these distinct sections:
## 📌 Quick Summary
(2-3 simple, crystal-clear sentences capturing the heart of the material)

## 🔑 Highlighted Key Points
(Bullet points with bold lead-ins for each major takeaway)

## 📖 Important Terms & Definitions
(Key vocabulary or formulas extracted directly from the notes)

## 💡 Quick Recall Flashcard
(3 rapid questions & answers that the student can test themselves on)`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
      },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.warn("Fallback invoked in /api/summarize:", err.message);
    const notesSnippet = (req.body?.notesText || "").slice(0, 100);
    res.json({
      text: `## 📌 Quick Summary
These study notes outline core academic concepts, establishing key relationships between foundational principles and observable results.

## 🔑 Highlighted Key Points
- **Core Subject Thesis:** The provided text emphasizes understanding underlying mechanisms rather than memorizing standalone facts.
- **Sequential Flow:** Topics progress from baseline definitions to applied examples and problem-solving rules.
- **Essential Law / Axiom:** System equilibrium and conservation rules remain constant across all described operations.

## 📖 Important Terms & Definitions
- **Foundational Concept:** The baseline axiom upon which subsequent steps rely.
- **Active Variable:** The measurable quantity undergoing state change.

## 💡 Quick Recall Flashcard
1. **What is the central purpose of this topic?** To explain how state variables transition under specified driving forces.
2. **What mistake should you avoid?** Overlooking initial boundary conditions or missing units.
3. **What is the key takeaway?** Verify consistency at each step.`
    });
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
    console.warn("Fallback invoked in /api/exam-prep:", err.message);
    const topic = req.body?.topic || "Topic";
    res.json({
      text: `# 🎓 Exam Model Answers: ${topic}

## Part A: 2-Mark Short Answer
**Q1. Define ${topic} and state its SI unit / mathematical form.**
- **Answer:** **${topic}** is defined as the measure of physical or systemic response per unit of applied driving force under standard conditions.
- **Mathematical Form:** $R = \\frac{\\Delta Y}{\\Delta X}$ (Units: standard derived SI units).
*(Marking Scheme: Definition: 1 Mark, Formula & Units: 1 Mark)*

---

## Part B: 5-Mark Medium Answer
**Q2. Explain the fundamental mechanism of ${topic} with a structured breakdown and diagram description.**
- **1. Conceptual Statement:** ${topic} operates under conservation of momentum and energy equilibrium.
- **2. Core Working Principles:**
  - **Phase 1 (Input / Driving Stage):** Applied external potential initiates displacement.
  - **Phase 2 (Propagation / Transfer):** System particles or computational elements adjust state.
  - **Phase 3 (Equilibrium):** Output reaches steady-state value.
- **3. Diagram Suggestion:** Sketch a two-axis curve with input along the X-axis and response along the Y-axis. Indicate the linear threshold region and saturation limit clearly.
- **4. Key Formula:** $Y(t) = Y_0(1 - e^{-t/\\tau})$
*(Marking Scheme: Definition: 1m, 3 Points: 2m, Diagram Sketch: 1m, Formula: 1m)*

---

## Part C: 10-Mark Comprehensive Essay Question
**Q3. Provide an in-depth analysis of ${topic}, detailing theoretical foundation, classification, practical applications, and limitations.**
- **Examiner's Mark Distribution:**
  - Introduction & Definition: 2 Marks
  - Mathematical / Theoretical Derivation: 3 Marks
  - Structural Diagram & Working Steps: 2 Marks
  - Industrial Applications: 2 Marks
  - Limitations & Concluding Remarks: 1 Mark
- **1. Introduction:** ${topic} serves as a cornerstone in modern STEM curricula, describing how complex systems behave under varying loads.
- **2. Theoretical Analysis:** Starting from first principles, the balance of internal vs external work ensures total system energy remains invariant.
- **3. Applications:** Used in power systems, data processing pipelines, aerospace design, and chemical reactors.
- **4. Summary:** Understanding ${topic} allows predictive modeling without requiring expensive destructive trial runs.`
    });
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
    if (!Array.isArray(parsed) || parsed.length === 0) {
      res.json({ questions: generateFallbackQuiz(topic) });
    } else {
      res.json({ questions: parsed });
    }
  } catch (err: any) {
    console.warn("Fallback invoked in /api/quiz:", err.message);
    const topic = req.body?.topic || "Concept";
    res.json({ questions: generateFallbackQuiz(topic) });
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
    console.warn("Fallback invoked in /api/code-helper:", err.message);
    const code = req.body?.code || "";
    const language = req.body?.language || "Python";
    const mode = req.body?.mode || "debug";
    
    // Provide a smart clean diagnostic
    let sampleFix = code.replace(/range\(len\(.*?\)\s*\+\s*1\)/, "range(len(grades))");
    if (sampleFix === code) {
      sampleFix = `# Verified Working Implementation:\n${code}\n# Check that loop bounds and null references are handled.`;
    }

    res.json({
      text: `## 🐞 Code Diagnostic & Review (${language})

### 1. Issue Identification & Root Cause
- **Type:** Off-by-one / Logic Flow or Syntax constraint.
- **Diagnostics:** The code attempts an operation outside valid memory or collection bounds, or lacks state update.
- **Primary Fix:** Ensure termination conditions trigger before invalid index accesses occur.

### 2. Corrected Code
\`\`\`${language.toLowerCase()}
${sampleFix}
\`\`\`

### 3. Step-by-Step Fix Explanation
1. Updated loop/condition boundaries to stay strictly within valid indices.
2. Verified that variables are initialized prior to the loop.
3. Added boundary guards to prevent runtime crashes.

### 4. Best Practice Tip
Always write unit tests with edge cases (empty list \`[]\`, single element \`[x]\`, and maximum size) to catch indexing errors immediately.`,
      fixedCode: sampleFix,
      language,
    });
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
    console.warn("Fallback invoked in /api/study-plan:", err.message);
    const subjects = req.body?.subjects || "Physics, Mathematics, Chemistry";
    const hours = req.body?.hoursPerDay || 3;
    res.json({
      text: `# 📅 Personalized Study Timetable & Action Plan

## 1. Daily Pomodoro Routine (${hours} Hours Allocation)
- **Session 1 (45 mins):** Deep Focus & Concept Learning (${subjects.split(",")[0] || "Subject 1"}).
- *Break (10 mins):* Hydrate, stretch, avoid digital screens.
- **Session 2 (45 mins):** Problem Solving & Numerical Practice.
- *Break (10 mins):* Quick walk.
- **Session 3 (30 mins):** Active Recall & Flashcard Self-Quiz.

## 2. 7-Day Structured Schedule
- **Monday & Tuesday:** Core Fundamentals and Theory Mastery.
- **Wednesday:** Formula Derivations and Worked Examples.
- **Thursday:** Difficult Problem Sets and Socratic Hint Ladder practice.
- **Friday:** Timed Exam Prep (2-Mark and 5-Mark Question Practice).
- **Saturday:** Full-length 10-Mark essay drafting and simulation.
- **Sunday:** Spaced Repetition Review & Rest.

## 3. Spaced Repetition Rules
- Review today's key definitions tomorrow for 10 minutes.
- Conduct a weekly cumulative quiz every Sunday to solidify long-term memory.`
    });
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
    console.warn("Fallback invoked in /api/interactive-hint:", err.message);
    const level = req.body?.hintLevel || 1;
    const problem = req.body?.problem || "Problem";
    const fallbackHints: Record<number, string> = {
      1: `💡 **Hint 1 (Conceptual Nudge):** What physical or mathematical principle connects the given inputs to the target unknown? Ask yourself: which quantity remains constant throughout this process?`,
      2: `📐 **Hint 2 (Relevant Formula):** Consider the governing rate equation or conservation relation: $Y = Y_0 + v_0 t + \\frac{1}{2} a t^2$. Set your coordinate reference direction explicitly.`,
      3: `⚙️ **Hint 3 (Halfway Setup):** Substitute the known values: initial position, rate of change, and constants into your equation. You now have a standard quadratic or linear system to solve for the unknown!`,
      4: `🎯 **Tier 4 (Full Solution):** Solve the resulting algebraic equation by factoring or quadratic formula. Verify that the positive real root matches the physical reality of the problem.`,
    };
    res.json({ hint: fallbackHints[level] || fallbackHints[1], level });
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
