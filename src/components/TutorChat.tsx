import React, { useState, useRef, useEffect } from "react";
import { StudentProfile, ChatMessage } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  Send,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  User,
  Bot,
} from "lucide-react";

interface TutorChatProps {
  profile: StudentProfile;
  onActivityLogged?: (title: string, detail?: string) => void;
}

const SAMPLE_PROMPTS_BY_SUBJECT: Record<string, string[]> = {
  Physics: [
    "Why does light bend when entering water? Explain with Snell's law",
    "How does Lenz's law satisfy the conservation of energy?",
    "Explain Doppler effect with an ambulance sound example",
  ],
  Chemistry: [
    "Why is diamond hard but graphite soft although both are carbon?",
    "Explain Le Chatelier's principle with an everyday analogy",
    "What is hybridization in simple terms?",
  ],
  Biology: [
    "How does the kidney filter blood through nephrons?",
    "Explain the difference between DNA and RNA step by step",
    "How does the immune system remember past infections?",
  ],
  Mathematics: [
    "Why is the derivative of sin(x) equal to cos(x)?",
    "Explain Bayes' Theorem with a real-life medical test example",
    "How does mathematical induction work like falling dominoes?",
  ],
  "Computer Science & Coding": [
    "What is the difference between BFS and DFS with an example?",
    "Why does quicksort have O(n log n) average time complexity?",
    "Explain Object-Oriented Programming (OOP) using a car analogy",
  ],
  General: [
    "Explain how vaccines train our white blood cells",
    "Why does the sky turn orange-red during sunset?",
    "How does compounding interest build wealth over time?",
  ],
};

export const TutorChat: React.FC<TutorChatProps> = ({ profile, onActivityLogged }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome-1",
      role: "model",
      content: `Hello **${profile.name}**! 👋 I am **EduGenie**, your personal AI Learning Assistant.

I am configured for **${profile.grade}** focusing on **${profile.subject}** (${profile.language} mode).

Ask me any academic question, paste a problem you're trying to solve, or ask for simple analogies. I'll explain concepts step-by-step!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"direct" | "socratic">("direct");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          profile,
          mode,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const modelMessage: ChatMessage = {
        id: `gemini-${Date.now()}`,
        role: "model",
        content: data.text || "I was unable to construct a response. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, modelMessage]);
      if (onActivityLogged) {
        onActivityLogged(
          "Asked Academic Question",
          textToSend.slice(0, 50) + (textToSend.length > 50 ? "..." : "")
        );
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "model",
        content: `⚠️ **Notice:** ${err.message || "Failed to reach learning assistant"}. Please ensure your query is clear or check the server status.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string, msgId: string) => {
    if (!("speechSynthesis" in window)) return;

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "Code block omitted.")
      .replace(/[#*`_]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "model",
        content: `Chat session refreshed! What topic would you like to explore next?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const suggestedPrompts =
    SAMPLE_PROMPTS_BY_SUBJECT[profile.subject] || SAMPLE_PROMPTS_BY_SUBJECT["General"];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
      {/* Chat Sub-header */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="font-semibold text-white">{profile.name}</span>
          <span className="text-slate-600">/</span>
          <span className="text-indigo-400 font-medium">{profile.subject}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">{profile.language}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Socratic vs Direct Mode selector */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setMode("direct")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                mode === "direct"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Direct step-by-step complete answers"
            >
              Direct Answer
            </button>
            <button
              onClick={() => setMode("socratic")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                mode === "socratic"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Guides you with hints and questions to think on your own"
            >
              <HelpCircle className="w-3 h-3" />
              Socratic Guide
            </button>
          </div>

          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-[11px] cursor-pointer"
            title="Clear Chat History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 max-w-4xl ${
                isUser ? "ml-auto justify-end" : "mr-auto justify-start"
              }`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`flex flex-col space-y-1 ${
                  isUser ? "items-end max-w-[85%] sm:max-w-[75%]" : "items-start w-full"
                }`}
              >
                <div
                  className={`p-4 sm:p-5 rounded-2xl ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-br-none shadow-md"
                      : "bg-slate-800/80 border border-slate-700/70 text-slate-100 rounded-bl-none shadow-sm w-full"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                      {msg.content}
                    </p>
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}
                </div>

                {/* Metadata & Actions */}
                <div className="flex items-center gap-3 px-1 text-[11px] text-slate-400">
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <>
                      <span>·</span>
                      <button
                        onClick={() => handleSpeak(msg.content, msg.id)}
                        className="hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
                        title={speakingId === msg.id ? "Stop voice" : "Read answer aloud"}
                      >
                        {speakingId === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            <span className="text-amber-400">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                      <span>·</span>
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-indigo-300 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-2xl mr-auto">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
              </div>
              <span className="text-xs text-slate-400">
                Gemini is preparing your personalized explanation...
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested prompts footer if few messages */}
      {messages.length <= 2 && (
        <div className="px-5 py-2.5 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-medium text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Try asking:
          </span>
          {suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="text-xs text-slate-300 bg-slate-800/80 hover:bg-slate-700 px-3 py-1 rounded-full whitespace-nowrap border border-slate-700/80 transition-colors cursor-pointer shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${profile.subject}, request a simple example, or paste a question...`}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>
    </div>
  );
};
