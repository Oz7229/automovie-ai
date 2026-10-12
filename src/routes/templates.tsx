import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/templates")({
  head: () => seo("Templates", "Proven script and video formats for faceless YouTube channels."),
  component: Templates,
});

const list = [
  "Educational",
  "Documentary",
  "Top 10",
  "Listicle",
  "Explainer",
  "Storytelling",
  "News",
  "Commentary",
  "Tutorial",
  "Product Review",
  "Case Study",
];

function Templates() {
  return (
    <>
      <PageHeader title="Templates" subtitle="Start a video from a proven structure" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {list.map((t, i) => (
          <Link key={t} to="/new" className="panel overflow-hidden transition hover:shadow-glow">
            <div
              className="aspect-video"
              style={{
                background: `linear-gradient(135deg, oklch(0.45 0.1 ${i * 33}), oklch(0.2 0.03 ${i * 33 + 60}))`,
              }}
            />
            <div className="p-3">
              <p className="font-semibold">{t}</p>
              <p className="text-xs text-muted-foreground">Hook · Sections · CTA</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
