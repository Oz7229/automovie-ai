import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RefreshCw, Download, Pencil, Sparkles, Loader2 } from "lucide-react";
import { Button, PageHeader } from "@/components/ui-kit";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/thumbnails")({
  head: () =>
    seo("Thumbnails", "AI thumbnail concepts with composition, emotion and text direction."),
  component: Thumbs,
});

interface Concept {
  text: string;
  emotion: string;
  comp: string;
  color: string;
  hue: number;
}

const initialConcepts: Concept[] = [
  {
    text: "NO SOIL?!",
    emotion: "Shock",
    comp: "Huge glass jar right, roots glowing; text left",
    color: "Lime on charcoal",
    hue: 130,
  },
  {
    text: "20 PLANTS",
    emotion: "Curiosity",
    comp: "Grid of jars, one circled in red",
    color: "Teal + white",
    hue: 190,
  },
  {
    text: "NEVER DIES",
    emotion: "Intrigue",
    comp: "Single pothos vine, dramatic side light",
    color: "Warm gold",
    hue: 70,
  },
  {
    text: "WATER ONLY",
    emotion: "Calm wonder",
    comp: "Overhead windowsill, minimal text",
    color: "Soft blue",
    hue: 230,
  },
];

function Thumbs() {
  const [images, setImages] = useState<Record<number, string>>({});
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [hfConfigured, setHfConfigured] = useState(false);

  const [provider, setProvider] = useState<"nano-banana" | "hf">("nano-banana");

  useEffect(() => {
    fetch("/api/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.huggingface?.configured) {
          setHfConfigured(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleGenerate = async (concept: Concept, index: number) => {
    setLoadingIndex(index);
    try {
      if (provider === "nano-banana") {
        const res = await fetch("/api/gemini/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `${concept.comp}, high contrast, bold youtube thumbnail text "${concept.text}"`,
            aspectRatio: "16:9",
          }),
        });
        const data = await res.json();
        if (data.imageUrl) {
          setImages((prev) => ({ ...prev, [index]: data.imageUrl }));
          setStatusNote(`Generated concept ${index + 1} with gemini-nano-banana-2.1`);
          setLoadingIndex(null);
          return;
        }
      }

      // Fallback or HF FLUX.1
      const res = await fetch("/api/thumbnails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: concept.comp,
          conceptIndex: index,
          text: concept.text,
          hue: concept.hue,
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        setImages((prev) => ({ ...prev, [index]: data.imageUrl }));
        if (data.note) {
          setStatusNote(data.note);
        } else {
          setStatusNote(`Generated concept ${index + 1} with ${data.provider}`);
        }
      }
    } catch (err) {
      console.error("Thumbnail generation error:", err);
    } finally {
      setLoadingIndex(null);
    }
  };

  const handleGenerateAll = async () => {
    setGeneratingAll(true);
    setStatusNote("Generating all 4 thumbnail concepts...");
    for (let i = 0; i < initialConcepts.length; i++) {
      const c = initialConcepts[i]!;
      await handleGenerate(c, i);
    }
    setGeneratingAll(false);
    setStatusNote("All 4 concepts rendered!");
  };

  return (
    <>
      <PageHeader
        title="Thumbnails"
        subtitle={`Provider: ${
          provider === "nano-banana"
            ? "Gemini Nano-Banana 2.1 (gemini-nano-banana-2.1)"
            : hfConfigured
              ? "Hugging Face (FLUX.1 [schnell] active)"
              : "Hugging Face (FLUX.1 preview mode)"
        }`}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as "nano-banana" | "hf")}
              className="rounded-lg border border-input bg-surface px-3 py-1.5 text-xs font-medium text-foreground focus:outline-hidden"
            >
              <option value="nano-banana">Gemini Nano-Banana 2.1</option>
              <option value="hf">Hugging Face FLUX.1</option>
            </select>
            <Button variant="primary" disabled={generatingAll} onClick={handleGenerateAll}>
              {generatingAll ? (
                <>
                  <Loader2 className="animate-spin" /> Rendering concepts...
                </>
              ) : (
                "Generate 4 concepts"
              )}
            </Button>
          </div>
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

      <div className="grid gap-4 md:grid-cols-2">
        {initialConcepts.map((c, i) => {
          const isBusy = loadingIndex === i;
          const imgUrl = images[i];

          return (
            <div key={c.text} className="panel overflow-hidden">
              <div className="relative aspect-video overflow-hidden bg-surface">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={c.text}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center p-6"
                    style={{
                      background: `linear-gradient(120deg, oklch(0.55 0.15 ${c.hue}), oklch(0.18 0.03 ${c.hue}))`,
                    }}
                  >
                    <span className="font-display text-4xl font-extrabold tracking-tight drop-shadow-md">
                      {c.text}
                    </span>
                  </div>
                )}

                {isBusy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-xs">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>

              <div className="space-y-1 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Concept {i + 1}</p>
                  <span className="text-xs font-medium text-muted-foreground">
                    {imgUrl?.startsWith("data:image/jpeg")
                      ? "FLUX.1 Photoreal"
                      : "High Contrast Vector"}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  <b className="text-foreground">Composition:</b> {c.comp}
                </p>
                <p className="text-muted-foreground">
                  <b className="text-foreground">Emotion:</b> {c.emotion} ·{" "}
                  <b className="text-foreground">Color:</b> {c.color}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    disabled={isBusy || generatingAll}
                    onClick={() => handleGenerate(c, i)}
                  >
                    <RefreshCw className={isBusy ? "animate-spin" : ""} /> Regenerate
                  </Button>
                  <Button size="sm">
                    <Pencil /> Edit
                  </Button>
                  <Button
                    size="sm"
                    disabled={!imgUrl}
                    onClick={() => {
                      if (imgUrl) {
                        const a = document.createElement("a");
                        a.href = imgUrl;
                        a.download = `thumbnail-concept-${i + 1}.png`;
                        a.click();
                      }
                    }}
                  >
                    <Download /> Download
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
