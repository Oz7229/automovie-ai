import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2, ExternalLink, RefreshCw, MapPin, Sparkles, Compass } from "lucide-react";
import { Badge, Button, buttonVariants, inputCls, PageHeader, Section } from "@/components/ui-kit";
import { PROVIDERS } from "@/lib/providers";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/research")({
  head: () =>
    seo(
      "Research Agent",
      "Live web research with Google Maps grounding, cross-checked facts and cited sources.",
    ),
  component: Research,
});

const steps = [
  "Searching Google Maps & Web…",
  "Analyzing authoritative sources…",
  "Verifying coordinates & place data…",
  "Extracting creator insights & B-roll angles…",
  "Building verified research dossier…",
];

const initialSources = [
  { n: 1, title: "NASA Clean Air Study (1989)", domain: "ntrs.nasa.gov", trust: "High" },
  {
    n: 2,
    title: "Growing Houseplants in Water — Extension Service",
    domain: "extension.umn.edu",
    trust: "High",
  },
  {
    n: 3,
    title: "Hydroponic propagation of Epipremnum aureum",
    domain: "journals.ashs.org",
    trust: "High",
  },
  { n: 4, title: "Which plants grow in water? A guide", domain: "thespruce.com", trust: "Medium" },
];

const initialFacts = [
  { t: "Pothos cuttings typically root in 7–14 days in water.", s: [2, 3] },
  { t: "Lucky bamboo is a Dracaena (D. sanderiana), not true bamboo.", s: [2, 4] },
  { t: "Water should be refreshed every 1–2 weeks to prevent bacterial growth.", s: [2] },
  {
    t: "Many popular air-purifying claims come from a 1989 sealed-chamber study and don't translate directly to homes.",
    s: [1],
  },
];

function Research() {
  const [stage, setStage] = useState(steps.length);
  const [activeTab, setActiveTab] = useState<"standard" | "maps">("standard");
  const [mapsQuery, setMapsQuery] = useState("Top 5 Botanical Gardens in Kyoto for B-Roll");
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsResult, setMapsResult] = useState<{
    text?: string;
    model?: string;
    groundingMetadata?: unknown;
  } | null>(null);

  useEffect(() => {
    if (stage >= steps.length) return;
    const t = setTimeout(() => setStage((s) => s + 1), 700);
    return () => clearTimeout(t);
  }, [stage]);

  const done = stage >= steps.length;

  const handleRunMapsResearch = async () => {
    if (!mapsQuery.trim()) return;
    setMapsLoading(true);
    try {
      const res = await fetch("/api/gemini/maps-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: mapsQuery }),
      });
      const data = await res.json();
      setMapsResult(data);
    } catch (err) {
      console.error("Maps research failed:", err);
    } finally {
      setMapsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Research Agent"
        subtitle="20 Indoor Plants That Thrive in Water"
        actions={
          <>
            <select
              className={inputCls + " w-52"}
              onChange={(e) => {
                if (e.target.value === "maps") setActiveTab("maps");
                else setActiveTab("standard");
              }}
              value={activeTab === "maps" ? "maps" : "standard"}
            >
              <option value="standard">Web Search (Tavily / Engine)</option>
              <option value="maps">Google Maps Grounding (gemini-3.5-flash)</option>
              {PROVIDERS.filter((p) => p.capability === "research").map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Button onClick={() => setStage(0)}>
              <RefreshCw /> Re-run
            </Button>
            <Link to="/scripts" className={buttonVariants({ variant: "primary" })}>
              Approve & write script
            </Link>
          </>
        }
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("standard")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "standard"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-surface hover:text-foreground"
          }`}
        >
          General Dossier
        </button>
        <button
          onClick={() => setActiveTab("maps")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "maps"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-surface hover:text-foreground"
          }`}
        >
          <MapPin className="h-4 w-4" /> Google Maps Grounding
          <span className="rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-mono">
            gemini-3.5-flash
          </span>
        </button>
      </div>

      {activeTab === "maps" ? (
        <div className="space-y-6">
          <div className="panel space-y-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Compass className="h-5 w-5 text-primary" /> Location & Venue Scout with Google
                  Maps
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Grounded on live Google Maps data using <code>gemini-3.5-flash</code> with the{" "}
                  <code>googleMaps</code> tool. Pinpoints real places, verified facts, operating
                  hours, and creator filming tips.
                </p>
              </div>
              <Badge tone="primary">Live Maps Grounding</Badge>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={mapsQuery}
                onChange={(e) => setMapsQuery(e.target.value)}
                placeholder="Search any destination, landmark, or filming venue…"
                className={inputCls + " flex-1"}
              />
              <Button
                variant="primary"
                disabled={mapsLoading || !mapsQuery.trim()}
                onClick={handleRunMapsResearch}
              >
                {mapsLoading ? <Loader2 className="animate-spin" /> : <MapPin />}
                {mapsLoading ? "Grounding with Maps…" : "Research via Google Maps"}
              </Button>
            </div>
          </div>

          {mapsResult && (
            <div className="panel space-y-4 p-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Verified Location Intelligence</span>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  Model: {mapsResult.model}
                </span>
              </div>

              <div className="prose prose-invert max-w-none text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {mapsResult.text}
              </div>

              <div className="mt-4 flex gap-2 pt-2 border-t border-border">
                <Button
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(mapsResult.text || "")}
                >
                  Copy into Script Outline
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <Section title="Research progress">
              <ul className="space-y-3">
                {steps.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    {i < stage ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : i === stage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-border" />
                    )}
                    <span className={i <= stage ? "" : "text-muted-foreground"}>{s}</span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Your instructions">
              <textarea
                rows={4}
                className={inputCls}
                placeholder="e.g. Prioritize pet-safe plants, cite university sources…"
                defaultValue="Verify plant root growth time, soil-free nutrient requirements, and check popular myths."
              />
              <Button size="sm" className="mt-2 w-full">
                Add to research
              </Button>
            </Section>
          </div>

          {!done ? (
            <div className="panel grid min-h-80 place-items-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <Section title="Research summary">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Dozens of common houseplants can live long-term in water. The strongest candidates
                  are tropical vining and rosette species. Key creator risks: overstated
                  air-purifying claims and pet-toxicity omissions.
                </p>
              </Section>
              <Section title="Key facts">
                <ul className="space-y-2">
                  {initialFacts.map((f) => (
                    <li key={f.t} className="flex gap-3 rounded-lg bg-surface p-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="flex-1">{f.t}</span>
                      {f.s.map((n) => (
                        <Badge key={n} tone="info">
                          [{n}]
                        </Badge>
                      ))}
                    </li>
                  ))}
                </ul>
              </Section>
              <div className="grid gap-4 md:grid-cols-2">
                <Section title="Story angles">
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>"The plants that refuse to die"</li>
                    <li>Soil-free apartment jungle on a budget</li>
                    <li>Myth-busting the NASA air study</li>
                  </ul>
                </Section>
                <Section title="Things to avoid">
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>Claiming plants meaningfully purify room air</li>
                    <li>Recommending toxic plants without pet warnings</li>
                    <li>Outdated 2015 "top lists" without verification</li>
                  </ul>
                </Section>
              </div>
              <Section title="Sources">
                <ul className="divide-y divide-border">
                  {initialSources.map((s) => (
                    <li key={s.n} className="flex items-center gap-3 py-2.5 text-sm">
                      <span className="font-mono text-xs text-muted-foreground">[{s.n}]</span>
                      <span className="flex-1">
                        {s.title}
                        <span className="ml-2 text-xs text-muted-foreground">{s.domain}</span>
                      </span>
                      <Badge tone={s.trust === "High" ? "success" : "warning"}>{s.trust}</Badge>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
          )}
        </div>
      )}
    </>
  );
}
