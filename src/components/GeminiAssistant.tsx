import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Bot, User, Mic, Volume2, Loader2, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui-kit";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  audioUrl?: string;
  timestamp: string;
}

const ROLES = [
  {
    id: "director",
    name: "Creative Director",
    instruction:
      "You are CreateFlow AI's Creative Director. You specialize in viral YouTube video strategies, high-retention hooks, visual pacing, and audience psychology. Keep responses structured with headings and bullet points.",
  },
  {
    id: "scriptwriter",
    name: "Script Specialist",
    instruction:
      "You are a master YouTube scriptwriter. You write compelling, conversational voiceover copy with pattern interrupts, curiosity loops, and strong calls-to-action.",
  },
  {
    id: "editor",
    name: "Editing & Visuals",
    instruction:
      "You are a professional video editor and visual director. You advise on B-roll pacing, cut timing, dynamic captions, sound effects placement, and color grading.",
  },
];

const PROMPT_STARTERS = [
  "How can I hook viewers in the first 5 seconds?",
  "Suggest 5 cinematic B-roll ideas for an educational scene.",
  "Give me 3 viral title concepts for this topic.",
];

export function GeminiAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m0",
      role: "model",
      text: "Hello! I am your Gemini Studio Assistant. How can I help develop your script, visual pacing, or YouTube strategy today?",
      timestamp: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [model, setModel] = useState<"gemini-3.5-flash" | "gemini-3.1-flash-lite">(
    "gemini-3.5-flash",
  );
  const [selectedRole, setSelectedRole] = useState(ROLES[0]!);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  if (!open) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, text: m.text })),
          systemInstruction: selectedRole.instruction,
          model,
        }),
      });

      const data = await res.json();
      const modelMsg: Message = {
        id: `m-${Date.now()}`,
        role: "model",
        text: data.text || "I was unable to process that response.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "model",
          text: "Network error communicating with Gemini. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInteraction = async () => {
    const text = input.trim() || "What are the key elements of a high-retention YouTube intro?";
    setVoiceLoading(true);

    try {
      const res = await fetch("/api/gemini/voice-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play().catch(() => {});
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `u-${Date.now()}`,
          role: "user",
          text: `[Voice Query]: ${text}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        {
          id: `m-${Date.now()}`,
          role: "model",
          text: data.text || "Voice response received from gemini-3.8-live.",
          audioUrl: data.audioUrl,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setInput("");
    } catch (err) {
      console.error("Voice interaction error:", err);
    } finally {
      setVoiceLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl sm:w-[440px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">
              Gemini Studio Assistant
            </h3>
            <p className="text-[11px] text-muted-foreground">Multi-turn creator intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() =>
              setMessages([
                {
                  id: "m0",
                  role: "model",
                  text: "Chat cleared. What project are we focusing on next?",
                  timestamp: "Just now",
                },
              ])
            }
            aria-label="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Role & Model Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-surface/50 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5 text-primary" />
          <select
            className="rounded bg-card px-2 py-1 text-xs text-foreground focus:outline-hidden"
            value={selectedRole.id}
            onChange={(e) => {
              const r = ROLES.find((role) => role.id === e.target.value);
              if (r) setSelectedRole(r);
            }}
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-warning" />
          <select
            className="rounded bg-card px-2 py-1 text-xs text-foreground focus:outline-hidden"
            value={model}
            onChange={(e) =>
              setModel(e.target.value as "gemini-3.5-flash" | "gemini-3.1-flash-lite")
            }
          >
            <option value="gemini-3.5-flash">gemini-3.5-flash (Standard)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
          </select>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex gap-3 text-sm ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface border border-border text-foreground"
                }`}
              >
                {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
                  isUser
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border bg-surface text-foreground"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                  {m.text}
                </div>

                {m.audioUrl && (
                  <button
                    onClick={() => {
                      if (m.audioUrl) {
                        new Audio(m.audioUrl).play().catch(() => {});
                      }
                    }}
                    className="mt-2 flex items-center gap-1 rounded bg-black/20 px-2 py-1 text-[11px] font-medium transition hover:bg-black/30"
                  >
                    <Volume2 className="h-3 w-3" /> Replay Voice (Live API)
                  </button>
                )}

                <div
                  className={`mt-1 text-[10px] ${
                    isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span>Thinking with {model}…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts (if short chat) */}
      {messages.length <= 2 && (
        <div className="space-y-1.5 px-4 pb-2">
          <p className="text-[11px] font-medium text-muted-foreground">Suggested prompts:</p>
          <div className="flex flex-col gap-1">
            {PROMPT_STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="truncate rounded-md border border-border/80 bg-surface/80 px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-border bg-surface p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about script, hook, pacing…"
            disabled={loading || voiceLoading}
            className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
          />

          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={loading || voiceLoading}
            onClick={handleVoiceInteraction}
            title="Ask via Gemini Live Voice (gemini-3.8-live)"
          >
            {voiceLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          <Button type="submit" size="icon" variant="primary" disabled={!input.trim() || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
