import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { Badge, Button, buttonVariants, Field, inputCls } from "@/components/ui-kit";
import { scenes as initial, fmt } from "@/lib/sample-data";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scripts")({
  head: () => seo("Script Editor", "Scene-by-scene script editor with AI rewrite actions."),
  component: Scripts,
});

const actions = ["Rewrite", "Shorten", "Expand", "Improve Hook", "More Conversational", "More Dramatic", "Simplify", "Fact Check", "Continue", "Change Tone", "Generate Visuals", "Generate Scene"];

function Scripts() {
  const [list, setList] = useState(initial);
  const [sel, setSel] = useState(0);
  const s = list[sel]!;
  const update = (k: keyof typeof initial[number], v: string) => setList(list.map((x, i) => (i === sel ? { ...x, [k]: v } : x)));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Script</h1>
          <p className="text-sm text-muted-foreground">Template: Listicle · Skill: Garden YouTube Skill · ~{Math.round(list.reduce((a, b) => a + b.duration, 0) / 60)} min</p>
        </div>
        <Link to="/editor" className={buttonVariants({ variant: "primary" })}>Approve & convert to scenes</Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-[220px_1fr_280px]">
        <div className="panel max-h-[70vh] space-y-1 overflow-y-auto p-2 scrollbar-thin">
          {list.map((x, i) => (
            <button key={x.id} onClick={() => setSel(i)} className={cn("w-full rounded-lg px-3 py-2 text-left", i === sel ? "bg-accent" : "hover:bg-accent/50")}>
              <p className="font-mono text-[10px] text-muted-foreground">SCENE {String(x.number).padStart(2, "0")} · {fmt(x.start)}</p>
              <p className="truncate text-sm font-medium">{x.title}</p>
            </button>
          ))}
        </div>
        <div className="panel space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm text-primary">SCENE {String(s.number).padStart(2, "0")}</h2>
            <Badge>{fmt(s.start)} – {fmt(s.start + s.duration)}</Badge>
          </div>
          <Field label="Narration"><textarea rows={5} className={inputCls + " text-base leading-relaxed"} value={s.narration} onChange={(e) => update("narration", e.target.value)} /></Field>
          <Field label="Visual"><textarea rows={2} className={inputCls} value={s.visual} onChange={(e) => update("visual", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="On-screen text"><input className={inputCls} value={s.onScreen} onChange={(e) => update("onScreen", e.target.value)} /></Field>
            <Field label="B-roll"><input className={inputCls} value={s.broll} onChange={(e) => update("broll", e.target.value)} /></Field>
            <Field label="Music"><input className={inputCls} value={s.music} onChange={(e) => update("music", e.target.value)} /></Field>
            <Field label="Sound effects"><input className={inputCls} value={s.sfx} onChange={(e) => update("sfx", e.target.value)} /></Field>
          </div>
        </div>
        <div className="panel p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> AI assistant</p>
          <div className="flex flex-wrap gap-1.5">{actions.map((a) => <Button key={a} size="sm" variant="outline"><Wand2 className="!size-3" />{a}</Button>)}</div>
          <textarea rows={3} className={inputCls + " mt-4"} placeholder="Ask the Script Agent to change this scene…" />
          <Button variant="primary" size="sm" className="mt-2 w-full">Apply</Button>
        </div>
      </div>
    </div>
  );
}
