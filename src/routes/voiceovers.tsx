import { createFileRoute } from "@tanstack/react-router";
import { Play, RefreshCw, Download, Scissors, Replace } from "lucide-react";
import { Badge, Button, Field, inputCls, PageHeader, Section } from "@/components/ui-kit";
import { scenes, fmt } from "@/lib/sample-data";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/voiceovers")({
  head: () => seo("Voiceovers", "Generate narration for the whole script or single scenes."),
  component: Voice,
});

function Wave({ seed }: { seed: number }) {
  return (
    <div className="flex h-10 flex-1 items-center gap-[2px]">
      {Array.from({ length: 70 }).map((_, i) => (
        <span key={i} className="w-1 rounded-full bg-track-voice/70" style={{ height: `${20 + Math.abs(Math.sin(i * 0.7 + seed) * 80)}%` }} />
      ))}
    </div>
  );
}

const sliders = ["Stability", "Similarity", "Style", "Speed"];

function Voice() {
  return (
    <>
      <PageHeader title="Voiceovers" subtitle="Provider: ElevenLabs (not connected — previews only)" actions={<Button variant="primary">Generate entire script</Button>} />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Section title="Voice settings">
          <div className="space-y-4">
            <Field label="Voice"><select className={inputCls}><option>Warm Narrator</option><option>Documentary Deep</option><option>Bright Explainer</option></select></Field>
            <Field label="Language"><select className={inputCls}><option>English</option><option>Spanish</option></select></Field>
            <Field label="Accent"><select className={inputCls}><option>American</option><option>British</option></select></Field>
            <Field label="Emotion"><select className={inputCls}><option>Calm</option><option>Excited</option><option>Serious</option></select></Field>
            {sliders.map((s) => <Field key={s} label={s}><input type="range" className="w-full accent-primary" defaultValue={60} /></Field>)}
            <Button className="w-full"><Play /> Preview voice</Button>
          </div>
        </Section>
        <div className="space-y-3">
          {scenes.map((s, i) => (
            <div key={s.id} className="panel p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-mono text-xs text-primary">SCENE {String(s.number).padStart(2, "0")}</span>
                <span className="text-sm font-medium">{s.title}</span>
                <Badge tone={i < 4 ? "success" : "info"} className="ml-auto">{i < 4 ? "Completed" : "Processing…"}</Badge>
              </div>
              <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{s.narration}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="icon" variant="primary" aria-label="Play"><Play /></Button>
                <Wave seed={i} />
                <span className="font-mono text-xs text-muted-foreground">{fmt(s.duration)}</span>
                <div className="flex gap-1">
                  {[RefreshCw, Scissors, Replace, Download].map((I, k) => <Button key={k} size="icon" variant="ghost"><I /></Button>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
