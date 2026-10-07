import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, Download, Pencil } from "lucide-react";
import { Button, PageHeader } from "@/components/ui-kit";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/thumbnails")({
  head: () => seo("Thumbnails", "AI thumbnail concepts with composition, emotion and text direction."),
  component: Thumbs,
});

const concepts = [
  { text: "NO SOIL?!", emotion: "Shock", comp: "Huge glass jar right, roots glowing; text left", color: "Lime on charcoal", hue: 130 },
  { text: "20 PLANTS", emotion: "Curiosity", comp: "Grid of jars, one circled in red", color: "Teal + white", hue: 190 },
  { text: "NEVER DIES", emotion: "Intrigue", comp: "Single pothos vine, dramatic side light", color: "Warm gold", hue: 70 },
  { text: "WATER ONLY", emotion: "Calm wonder", comp: "Overhead windowsill, minimal text", color: "Soft blue", hue: 230 },
];

function Thumbs() {
  return (
    <>
      <PageHeader title="Thumbnails" subtitle="Concepts from topic, title, script and audience" actions={<Button variant="primary">Generate 4 concepts</Button>} />
      <div className="grid gap-4 md:grid-cols-2">
        {concepts.map((c, i) => (
          <div key={c.text} className="panel overflow-hidden">
            <div className="relative aspect-video" style={{ background: `linear-gradient(120deg, oklch(0.55 0.15 ${c.hue}), oklch(0.18 0.03 ${c.hue}))` }}>
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-display text-4xl font-bold">{c.text}</span>
            </div>
            <div className="space-y-1 p-4 text-sm">
              <p className="font-semibold">Concept {i + 1}</p>
              <p className="text-muted-foreground"><b className="text-foreground">Composition:</b> {c.comp}</p>
              <p className="text-muted-foreground"><b className="text-foreground">Emotion:</b> {c.emotion} · <b className="text-foreground">Color:</b> {c.color}</p>
              <div className="flex gap-2 pt-2"><Button size="sm"><RefreshCw /> Regenerate</Button><Button size="sm"><Pencil /> Edit</Button><Button size="sm"><Download /> Download</Button></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
