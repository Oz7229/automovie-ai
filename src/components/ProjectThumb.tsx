import { Play } from "lucide-react";

// Gradient placeholder thumbnail derived from the project's hue.
export function ProjectThumb({ hue, label, duration }: { hue: number; label: string; duration?: string }) {
  return (
    <div
      className="relative aspect-video overflow-hidden rounded-lg"
      style={{ background: `linear-gradient(135deg, oklch(0.45 0.12 ${hue}), oklch(0.2 0.05 ${hue + 40}))` }}
    >
      <span className="absolute bottom-2 left-3 right-12 line-clamp-2 font-display text-sm font-bold uppercase leading-tight text-foreground drop-shadow">{label}</span>
      {duration && <span className="absolute bottom-2 right-2 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[10px]">{duration}</span>}
      <Play className="absolute right-3 top-3 h-4 w-4 text-foreground/70" />
    </div>
  );
}
