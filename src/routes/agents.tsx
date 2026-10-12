import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Button, PageHeader, Section } from "@/components/ui-kit";
import { agents as initial, skills } from "@/lib/sample-data";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agents")({
  head: () =>
    seo("AI Agents", "Manage production agents, their models, tools and reusable skills."),
  component: Agents,
});

function Agents() {
  const [list, setList] = useState(initial);
  return (
    <>
      <PageHeader title="AI Agents" subtitle="14 specialists that run your production pipeline" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((a) => (
          <div key={a.id} className="panel p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
              <button
                aria-label="Toggle"
                onClick={() =>
                  setList(list.map((x) => (x.id === a.id ? { ...x, enabled: !x.enabled } : x)))
                }
                className={cn(
                  "h-5 w-9 rounded-full p-0.5 transition",
                  a.enabled ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "block h-4 w-4 rounded-full bg-foreground transition",
                    a.enabled && "translate-x-4",
                  )}
                />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone="info">{a.model}</Badge>
              {a.tools.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
              {a.skills.map((s) => (
                <Badge key={s} tone="primary">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Section
        title="Skills"
        className="mt-8"
        action={
          <Button size="sm" variant="primary">
            <Plus /> Create skill
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          {skills.map((k) => (
            <div key={k.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{k.name}</p>
                <div className="flex">
                  {[Pencil, Copy, Trash2].map((I, i) => (
                    <Button key={i} size="icon" variant="ghost">
                      <I />
                    </Button>
                  ))}
                </div>
              </div>
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                {k.rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {k.agents.map((a) => (
                  <Badge key={a} tone="primary">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
