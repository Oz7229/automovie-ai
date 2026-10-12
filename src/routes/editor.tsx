import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Undo2,
  Redo2,
  Play,
  Pause,
  Download,
  Scissors,
  Trash2,
  Images,
  Film,
  Type,
  Music,
  Sparkles,
  Wand2,
  Shapes,
  Loader2,
  Check,
} from "lucide-react";
import { Button, Field, inputCls } from "@/components/ui-kit";
import { initialClips, tracks, scenes, fmt, type Clip, type TrackId } from "@/lib/sample-data";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/editor")({
  head: () =>
    seo(
      "Video Editor",
      "Timeline video editor with tracks for video, b-roll, voice, music, SFX, text and captions.",
    ),
  component: Editor,
});

const PX = 8; // pixels per second
const TOTAL = 140;
const trackColor: Record<TrackId, string> = {
  video: "bg-track-video",
  broll: "bg-track-broll",
  voice: "bg-track-voice",
  music: "bg-track-music",
  sfx: "bg-track-sfx",
  text: "bg-track-text",
  captions: "bg-track-caption",
};
const panels = [
  { id: "Media", i: Images },
  { id: "Scenes", i: Film },
  { id: "Text", i: Type },
  { id: "Audio", i: Music },
  { id: "Transitions", i: Wand2 },
  { id: "Effects", i: Sparkles },
  { id: "Elements", i: Shapes },
];
const renderSteps = [
  "Preparing project",
  "Processing voiceover",
  "Rendering scenes",
  "Adding captions",
  "Adding music",
  "Rendering final video",
  "Finalizing",
];

function Editor() {
  const [clips, setClips] = useState<Clip[]>(initialClips);
  const [history, setHistory] = useState<Clip[][]>([]);
  const [future, setFuture] = useState<Clip[][]>([]);
  const [selId, setSelId] = useState<string | null>("v-s1");
  const [panel, setPanel] = useState("Scenes");
  const [playhead, setPlayhead] = useState(10);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState<number | null>(null);
  const sel = clips.find((c) => c.id === selId);
  const scene =
    scenes.find((s) => playhead >= s.start && playhead < s.start + s.duration) ?? scenes[0]!;

  const commit = (next: Clip[]) => {
    setHistory([...history, clips]);
    setFuture([]);
    setClips(next);
  };
  const undo = () => {
    if (!history.length) return;
    setFuture([clips, ...future]);
    setClips(history[history.length - 1]!);
    setHistory(history.slice(0, -1));
  };
  const redo = () => {
    if (!future.length) return;
    setHistory([...history, clips]);
    setClips(future[0]!);
    setFuture(future.slice(1));
  };
  const split = () => {
    if (!sel || playhead <= sel.start || playhead >= sel.start + sel.duration) return;
    const a = { ...sel, duration: playhead - sel.start };
    const b = {
      ...sel,
      id: sel.id + "-b" + Date.now(),
      start: playhead,
      duration: sel.start + sel.duration - playhead,
    };
    commit(clips.flatMap((c) => (c.id === sel.id ? [a, b] : [c])));
  };
  const del = () => {
    if (sel) {
      commit(clips.filter((c) => c.id !== sel.id));
      setSelId(null);
    }
  };
  const patch = (p: Partial<Clip>) =>
    sel && commit(clips.map((c) => (c.id === sel.id ? { ...c, ...p } : c)));

  const startDrag = (e: React.PointerEvent, c: Clip, mode: "move" | "trim") => {
    e.stopPropagation();
    setSelId(c.id);
    const x0 = e.clientX;
    const base = clips;
    const move = (ev: PointerEvent) => {
      const d = (ev.clientX - x0) / PX;
      setClips(
        base.map((k) =>
          k.id !== c.id
            ? k
            : mode === "move"
              ? { ...k, start: Math.max(0, +(c.start + d).toFixed(1)) }
              : { ...k, duration: Math.max(0.5, +(c.duration + d).toFixed(1)) },
        ),
      );
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setHistory((h) => [...h, base]);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const runExport = () => {
    setExporting(0);
    renderSteps.forEach((_, i) => setTimeout(() => setExporting(i + 1), (i + 1) * 700));
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <p className="mr-auto truncate font-display font-semibold">
          20 Indoor Plants That Thrive in Water
        </p>
        <Button size="icon" variant="ghost" onClick={undo} aria-label="Undo">
          <Undo2 />
        </Button>
        <Button size="icon" variant="ghost" onClick={redo} aria-label="Redo">
          <Redo2 />
        </Button>
        <Button size="sm" onClick={() => setPlaying(!playing)}>
          {playing ? <Pause /> : <Play />} Preview
        </Button>
        <Button size="sm" variant="primary" onClick={runExport}>
          <Download /> Export
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="hidden w-14 flex-col items-center gap-1 border-r border-border bg-surface py-2 md:flex">
          {panels.map(({ id, i: I }) => (
            <button
              key={id}
              onClick={() => setPanel(id)}
              title={id}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-lg",
                panel === id
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <I className="h-4 w-4" />
            </button>
          ))}
        </div>
        <div className="hidden w-60 overflow-y-auto border-r border-border p-3 scrollbar-thin lg:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {panel}
          </p>
          {panel === "Scenes" ? (
            scenes.map((s) => (
              <button
                key={s.id}
                onClick={() => setPlayhead(s.start)}
                className={cn(
                  "mb-2 w-full rounded-lg border border-border p-2.5 text-left",
                  scene.id === s.id ? "bg-accent" : "bg-surface",
                )}
              >
                <p className="font-mono text-[10px] text-primary">
                  S{s.number} · {fmt(s.start)}
                </p>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.visualType}</p>
              </button>
            ))
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-video rounded-md"
                  style={{ background: `oklch(0.4 0.08 ${i * 45})` }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center justify-center bg-background p-4">
          <div
            className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-lg border border-border"
            style={{
              background: `linear-gradient(135deg, oklch(0.42 0.1 ${140 + scene.number * 20}), oklch(0.18 0.03 200))`,
            }}
          >
            <p className="absolute left-6 top-6 font-display text-2xl font-bold md:text-4xl">
              {scene.onScreen}
            </p>
            <p className="absolute bottom-6 left-1/2 w-4/5 -translate-x-1/2 rounded bg-background/70 px-3 py-1.5 text-center text-sm font-semibold">
              {scene.narration.split(" ").slice(0, 9).join(" ")}…
            </p>
          </div>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {fmt(playhead)} / {fmt(TOTAL)}
          </p>
        </div>

        <div className="hidden w-64 overflow-y-auto border-l border-border p-4 xl:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Inspector
          </p>
          {sel ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold">{sel.label}</p>
              <p className="text-xs text-muted-foreground">Track: {sel.track}</p>
              <Field label="Start (s)">
                <input
                  type="number"
                  className={inputCls}
                  value={sel.start}
                  onChange={(e) => patch({ start: +e.target.value })}
                />
              </Field>
              <Field label="Duration (s)">
                <input
                  type="number"
                  className={inputCls}
                  value={sel.duration}
                  onChange={(e) => patch({ duration: +e.target.value })}
                />
              </Field>
              {["Volume", "Opacity", "Scale"].map((l) => (
                <Field key={l} label={l}>
                  <input type="range" defaultValue={80} className="w-full accent-primary" />
                </Field>
              ))}
              <Field label="Transition in">
                <select className={inputCls}>
                  <option>None</option>
                  <option>Crossfade</option>
                  <option>Whip pan</option>
                </select>
              </Field>
              <div className="flex gap-2">
                <Button size="sm" onClick={split}>
                  <Scissors /> Split
                </Button>
                <Button size="sm" onClick={del}>
                  <Trash2 /> Delete
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a clip on the timeline.</p>
          )}
        </div>
      </div>

      <div className="h-72 shrink-0 overflow-auto border-t border-border bg-surface scrollbar-thin">
        <div className="relative" style={{ width: TOTAL * PX + 96 }}>
          <div
            className="sticky top-0 z-10 flex h-6 border-b border-border bg-surface pl-24"
            onClick={(e) =>
              setPlayhead(
                Math.max(0, (e.clientX - e.currentTarget.getBoundingClientRect().left - 96) / PX),
              )
            }
          >
            {Array.from({ length: TOTAL / 10 + 1 }).map((_, i) => (
              <span
                key={i}
                className="absolute font-mono text-[10px] text-muted-foreground"
                style={{ left: 96 + i * 10 * PX }}
              >
                {fmt(i * 10)}
              </span>
            ))}
          </div>
          {tracks.map((t) => (
            <div key={t.id} className="flex h-9 border-b border-border">
              <div className="sticky left-0 z-10 flex w-24 shrink-0 items-center border-r border-border bg-surface px-3 text-xs text-muted-foreground">
                {t.label}
              </div>
              <div className="relative flex-1">
                {clips
                  .filter((c) => c.track === t.id)
                  .map((c) => (
                    <div
                      key={c.id}
                      onPointerDown={(e) => startDrag(e, c, "move")}
                      className={cn(
                        "absolute top-1 bottom-1 cursor-grab touch-none overflow-hidden rounded-md px-2 text-[11px] font-semibold leading-7 text-primary-foreground",
                        trackColor[t.id],
                        selId === c.id && "ring-2 ring-foreground",
                      )}
                      style={{ left: c.start * PX, width: c.duration * PX }}
                    >
                      <span className="truncate">{c.label}</span>
                      <span
                        onPointerDown={(e) => startDrag(e, c, "trim")}
                        className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize bg-background/30"
                      />
                    </div>
                  ))}
              </div>
            </div>
          ))}
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary"
            style={{ left: 96 + playhead * PX }}
          />
        </div>
      </div>

      {exporting !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4">
          <div className="panel w-full max-w-md p-6">
            <h2 className="text-lg font-semibold">Export video</h2>
            <ul className="mt-4 space-y-2">
              {renderSteps.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  {i < exporting ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : i === exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-border" />
                  )}
                  {s}
                </li>
              ))}
            </ul>
            {exporting >= renderSteps.length && (
              <div className="mt-5 flex gap-2">
                <Button variant="primary" className="flex-1">
                  Download 1080p
                </Button>
                <Button className="flex-1">Download 4K</Button>
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Rendering runs on server workers once a render provider is connected. This is a
              preview.
            </p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setExporting(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
