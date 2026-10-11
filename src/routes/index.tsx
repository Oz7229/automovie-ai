import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, FolderKanban, Clapperboard, CheckCircle2, Timer, Mic, HardDrive } from "lucide-react";
import { buttonVariants, Badge, Progress, Section } from "@/components/ui-kit";
import { ProjectThumb } from "@/components/ProjectThumb";
import { projects, STAGES, statusTone, type StageStatus } from "@/lib/sample-data";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => seo("Dashboard", "Your faceless YouTube production dashboard: projects, pipeline and usage."),
  component: Dashboard,
});

const stats = [
  { label: "Projects", value: "24", icon: FolderKanban },
  { label: "In production", value: "4", icon: Clapperboard },
  { label: "Completed videos", value: "19", icon: CheckCircle2 },
  { label: "Generated minutes", value: "412", icon: Timer },
  { label: "Voiceover minutes", value: "286", icon: Mic },
  { label: "Storage used", value: "38.2 GB", icon: HardDrive },
];

export const stageTone: Record<StageStatus, "default" | "info" | "success" | "warning"> = {
  "Not Started": "default", "In Progress": "info", Completed: "success", "Needs Review": "warning",
};

function Dashboard() {
  const active = projects[0]!;
  return (
    <div className="space-y-8">
      <div className="panel relative overflow-hidden bg-hero p-6 md:p-8">
        <p className="text-sm text-muted-foreground">Welcome back, Ade</p>
        <h1 className="mt-1 text-3xl font-semibold md:text-4xl">Create your next video</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">From topic to export — research, script, voice, visuals and edit in one studio.</p>
        <Link to="/new" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-6")}><Plus /> New Video</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="panel p-4">
            <Icon className="h-4 w-4 text-primary" />
            <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <Section title={`Production pipeline · ${active.name}`} action={<Badge tone="primary">{active.status}</Badge>}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {STAGES.map((s, i) => (
            <div key={s} className="rounded-lg border border-border bg-surface p-3">
              <p className="font-mono text-[10px] text-muted-foreground">0{i + 1}</p>
              <p className="text-sm font-semibold">{s}</p>
              <Badge tone={stageTone[active.stages[i]]} className="mt-2">{active.stages[i]}</Badge>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Recent projects" action={<Link to="/projects" className="text-sm text-primary">View all</Link>}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-surface p-3">
              <ProjectThumb hue={p.hue} label={p.name} duration={p.duration} />
              <div className="mt-3 flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-snug">{p.name}</p>
                <Badge tone={statusTone[p.status]}>{p.status.replace(/_/g, " ")}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Progress value={p.progress} />
                <span className="font-mono text-xs text-muted-foreground">{p.progress}%</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Edited {p.lastEdited}</span>
                <Link to="/editor" className={buttonVariants({ size: "sm" })}>Continue editing</Link>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
