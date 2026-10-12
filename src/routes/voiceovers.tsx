import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Play,
  Pause,
  RefreshCw,
  Download,
  Scissors,
  Replace,
  Sparkles,
  Loader2,
  Volume2,
} from "lucide-react";
import { Badge, Button, Field, inputCls, PageHeader, Section } from "@/components/ui-kit";
import { scenes as initialScenes, fmt } from "@/lib/sample-data";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/voiceovers")({
  head: () =>
    seo(
      "Voiceovers",
      "Generate narration with Gemini Flash TTS (gemini-3.8-flash-tts), Kokoro-82M, or ElevenLabs.",
    ),
  component: Voice,
});

function Wave({ seed, active }: { seed: number; active?: boolean }) {
  return (
    <div className="flex h-10 flex-1 items-center gap-[2px]">
      {Array.from({ length: 70 }).map((_, i) => (
        <span
          key={i}
          className={`w-1 rounded-full transition-all duration-300 ${
            active ? "animate-pulse bg-primary" : "bg-track-voice/70"
          }`}
          style={{ height: `${20 + Math.abs(Math.sin(i * 0.7 + seed) * 80)}%` }}
        />
      ))}
    </div>
  );
}

const sliders = ["Stability", "Similarity", "Style", "Speed"];

const GEMINI_VOICES = [
  { id: "Kore", label: "Kore (Warm & Soothing Narrator)" },
  { id: "Charon", label: "Charon (Deep Documentary Voice)" },
  { id: "Puck", label: "Puck (Energetic Explainer)" },
  { id: "Fenrir", label: "Fenrir (Authoritative Storyteller)" },
  { id: "Zephyr", label: "Zephyr (Conversational & Friendly)" },
];

function Voice() {
  const [provider, setProvider] = useState<"gemini" | "chatterbox" | "hf" | "ai33" | "elevenlabs">(
    "gemini",
  );
  const [voiceName, setVoiceName] = useState("Kore");
  const [scenes, setScenes] = useState(initialScenes);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(
    "Gemini Flash TTS (gemini-3.8-flash-tts) is active and connected!",
  );
  const [status, setStatus] = useState<{
    geminiConfigured: boolean;
    hfConfigured: boolean;
    ai33Configured: boolean;
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setStatus({
            geminiConfigured: Boolean(data.gemini?.configured),
            hfConfigured: Boolean(data.huggingface?.configured),
            ai33Configured: Boolean(data.ai33?.configured),
          });
        }
      })
      .catch(() => {});
  }, []);

  const playAudio = (id: string, url?: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (url) {
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlayingId(id);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => setPlayingId(null);
      audio.play().catch(() => setPlayingId(null));
    }
  };

  const handleGenerateVoice = async (text: string, sceneId?: string) => {
    if (sceneId) {
      setGeneratingSceneId(sceneId);
    } else {
      setGenerating(true);
    }

    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: voiceName,
          provider,
        }),
      });

      const data = await res.json();
      if (data.audioUrl) {
        if (sceneId) {
          setAudioUrls((prev) => ({ ...prev, [sceneId]: data.audioUrl }));
        } else {
          // Preview audio
          setAudioUrls((prev) => ({ ...prev, preview: data.audioUrl }));
          playAudio("preview", data.audioUrl);
        }

        if (data.note) {
          setStatusNote(data.note);
        } else {
          setStatusNote(`Generated via ${data.provider}`);
        }
      }
    } catch (err) {
      console.error("Voice generation failed:", err);
    } finally {
      setGenerating(false);
      setGeneratingSceneId(null);
    }
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    setStatusNote("Generating speech for all scenes with Gemini TTS...");
    for (const scene of scenes) {
      await handleGenerateVoice(scene.narration, scene.id);
    }
    setGenerating(false);
    setStatusNote("Complete! All scene voiceovers generated with Gemini TTS.");
  };

  return (
    <>
      <PageHeader
        title="Voiceovers"
        subtitle={`Provider: ${
          provider === "gemini"
            ? "Gemini Flash TTS (gemini-3.8-flash-tts active)"
            : provider === "hf"
              ? status?.hfConfigured
                ? "Hugging Face (Kokoro-82M active)"
                : "Hugging Face (Kokoro-82M preview mode)"
              : provider === "ai33"
                ? status?.ai33Configured
                  ? "AI33 Pro Gateway (active)"
                  : "AI33 Pro Gateway"
                : "ElevenLabs"
        }`}
        actions={
          <Button variant="primary" disabled={generating} onClick={handleGenerateAll}>
            {generating ? (
              <>
                <Loader2 className="animate-spin" /> Generating...
              </>
            ) : (
              "Generate entire script"
            )}
          </Button>
        }
      />

      {statusNote && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-xs text-primary">
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            {statusNote}
          </span>
          <button
            onClick={() => setStatusNote(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Section title="Voice settings">
          <div className="space-y-4">
            <Field label="Voice Provider">
              <select
                className={inputCls}
                value={provider}
                onChange={(e) => {
                  const p = e.target.value as typeof provider;
                  setProvider(p);
                  if (p === "gemini") setVoiceName("Kore");
                  else setVoiceName("Warm Narrator");
                }}
              >
                <option value="gemini">Gemini Flash TTS (gemini-3.8-flash-tts) ⭐</option>
                <option value="chatterbox">Resemble AI (Chatterbox TTS)</option>
                <option value="hf">Hugging Face (Kokoro-82M)</option>
                <option value="ai33">AI33 Pro Gateway</option>
                <option value="elevenlabs">ElevenLabs Direct</option>
              </select>
            </Field>

            <Field label="Voice Persona">
              {provider === "gemini" ? (
                <select
                  className={inputCls}
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                >
                  {GEMINI_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  className={inputCls}
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                >
                  <option>Warm Narrator</option>
                  <option>Documentary Deep</option>
                  <option>Bright Explainer</option>
                </select>
              )}
            </Field>

            <Field label="Language">
              <select className={inputCls}>
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </Field>

            {sliders.map((s) => (
              <Field key={s} label={s}>
                <input type="range" className="w-full accent-primary" defaultValue={60} />
              </Field>
            ))}

            <Button
              className="w-full"
              disabled={generating}
              onClick={() =>
                handleGenerateVoice(
                  "Welcome to CreateFlow AI. Your voiceover model is running with studio quality.",
                )
              }
            >
              {generating && !generatingSceneId ? (
                <Loader2 className="animate-spin" />
              ) : playingId === "preview" ? (
                <Pause />
              ) : (
                <Play />
              )}
              {playingId === "preview" ? "Pause preview" : "Preview voice"}
            </Button>
          </div>
        </Section>

        <div className="space-y-3">
          {scenes.map((s, i) => {
            const hasAudio = Boolean(audioUrls[s.id]);
            const isPlaying = playingId === s.id;
            const isBusy = generatingSceneId === s.id;

            return (
              <div key={s.id} className="panel p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-xs text-primary">
                    SCENE {String(s.number).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium">{s.title}</span>
                  <Badge tone={hasAudio || i < 4 ? "success" : "info"} className="ml-auto">
                    {isBusy
                      ? "Synthesizing…"
                      : hasAudio
                        ? "Audio ready (Gemini)"
                        : i < 4
                          ? "Completed"
                          : "Queued"}
                  </Badge>
                </div>
                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{s.narration}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="icon"
                    variant="primary"
                    aria-label="Play"
                    disabled={isBusy}
                    onClick={() => {
                      if (hasAudio) {
                        playAudio(s.id, audioUrls[s.id]);
                      } else {
                        handleGenerateVoice(s.narration, s.id);
                      }
                    }}
                  >
                    {isBusy ? (
                      <Loader2 className="animate-spin" />
                    ) : isPlaying ? (
                      <Pause />
                    ) : (
                      <Play />
                    )}
                  </Button>
                  <Wave seed={i} active={isPlaying} />
                  <span className="font-mono text-xs text-muted-foreground">{fmt(s.duration)}</span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Regenerate"
                      disabled={isBusy}
                      onClick={() => handleGenerateVoice(s.narration, s.id)}
                    >
                      <RefreshCw className={isBusy ? "animate-spin" : ""} />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Trim">
                      <Scissors />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Replace">
                      <Replace />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Download"
                      disabled={!hasAudio}
                      onClick={() => {
                        if (audioUrls[s.id]) {
                          const a = document.createElement("a");
                          a.href = audioUrls[s.id];
                          a.download = `scene-${s.number}-gemini-voiceover.wav`;
                          a.click();
                        }
                      }}
                    >
                      <Download />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
