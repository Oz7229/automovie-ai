import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, Search } from "lucide-react";
import { Badge, Button, inputCls, PageHeader } from "@/components/ui-kit";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/media")({
  head: () => seo("Media Library", "Generated images, AI clips, stock media and audio for every project."),
  component: Media,
});

const tabs = ["All", "AI images", "AI video", "Stock", "Audio", "Uploads"];
const items = Array.from({ length: 16 }).map((_, i) => ({
  id: i, kind: tabs[1 + (i % 5)], name: ["Pothos jar", "Bamboo desk", "Root diagram", "Shelf vines", "VO scene 3", "Upload logo"][i % 6], hue: (i * 47) % 360,
}));

function Media() {
  const [tab, setTab] = useState("All");
  const shown = items.filter((x) => tab === "All" || x.kind === tab);
  return (
    <>
      <PageHeader title="Media Library" subtitle="All assets generated or found for your projects" actions={<Button variant="primary"><Upload /> Upload</Button>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={cn("rounded-lg px-3 py-1.5 text-sm", tab === t ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>{t}</button>)}
        <div className="relative ml-auto w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input className={inputCls + " pl-9"} placeholder="Search stock (Pexels)…" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((x) => (
          <div key={x.id} className="panel overflow-hidden">
            <div className="aspect-video" style={{ background: `linear-gradient(135deg, oklch(0.5 0.1 ${x.hue}), oklch(0.22 0.04 ${x.hue + 60}))` }} />
            <div className="flex items-center justify-between p-3"><span className="truncate text-sm">{x.name}</span><Badge>{x.kind}</Badge></div>
          </div>
        ))}
      </div>
    </>
  );
}
