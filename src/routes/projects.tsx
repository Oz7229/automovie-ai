import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { buttonVariants, Badge, PageHeader, Progress } from "@/components/ui-kit";
import { ProjectThumb } from "@/components/ProjectThumb";
import { projects, statusTone } from "@/lib/sample-data";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/projects")({
  head: () => seo("Projects", "All your video projects and their production status."),
  component: Projects,
});

function Projects() {
  return (
    <>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} projects across 3 channels`}
        actions={
          <Link to="/new" className={buttonVariants({ variant: "primary" })}>
            <Plus /> New Video
          </Link>
        }
      />
      <div className="panel divide-y divide-border">
        {projects.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="w-36">
              <ProjectThumb hue={p.hue} label="" duration={p.duration} />
            </div>
            <div className="min-w-48 flex-1">
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                {p.channel} · edited {p.lastEdited}
              </p>
            </div>
            <Badge tone={statusTone[p.status]}>{p.status.replace(/_/g, " ")}</Badge>
            <div className="flex w-40 items-center gap-2">
              <Progress value={p.progress} />
              <span className="font-mono text-xs">{p.progress}%</span>
            </div>
            <Link to="/editor" className={buttonVariants({ size: "sm" })}>
              Open
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
