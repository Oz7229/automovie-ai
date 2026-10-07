import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge, Button, Field, inputCls, PageHeader } from "@/components/ui-kit";
import { PROVIDERS, type Capability } from "@/lib/providers";
import { channels } from "@/lib/sample-data";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => seo("Settings", "Integrations, channel profiles, writing style and account settings."),
  component: Settings,
});

const tabs = ["Integrations", "Channels", "Writing Style", "Account"] as const;
const caps: Capability[] = ["research", "llm", "voice", "image", "video", "stock", "render", "payments", "analytics", "mcp"];

function Settings() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Integrations");
  return (
    <>
      <PageHeader title="Settings" />
      <div className="mb-6 flex gap-1 border-b border-border">
        {tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={cn("border-b-2 px-4 py-2 text-sm", tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground")}>{t}</button>)}
      </div>

      {tab === "Integrations" && (
        <div className="space-y-6">
          {caps.map((c) => (
            <div key={c}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c === "llm" ? "Language models" : c === "mcp" ? "MCP tools" : c}</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {PROVIDERS.filter((p) => p.capability === c).map((p) => (
                  <div key={p.id} className="panel flex items-center gap-3 p-4">
                    <div className="flex-1"><p className="font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{p.description}</p></div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge tone={p.connected ? "success" : "default"}>{p.connected ? "Connected" : "Not connected"}</Badge>
                      <div className="flex gap-1"><Button size="sm" variant="ghost">Test</Button><Button size="sm">Configure</Button></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "Channels" && (
        <div className="grid gap-3 md:grid-cols-3">
          {channels.map((c) => (
            <div key={c.id} className="panel p-4">
              <div className="flex gap-1.5">{c.colors.map((h) => <span key={h} className="h-4 w-4 rounded-full" style={{ background: `oklch(0.65 0.15 ${h})` }} />)}</div>
              <p className="mt-3 font-semibold">{c.name}</p>
              <p className="text-sm text-muted-foreground">{c.niche} · {c.audience}</p>
              <p className="mt-2 text-xs text-muted-foreground">{c.language} · {c.country} · {c.voice} · {c.length}</p>
            </div>
          ))}
          <button className="panel grid min-h-36 place-items-center text-sm text-muted-foreground hover:text-foreground"><span className="flex items-center gap-2"><Plus className="h-4 w-4" /> New channel</span></button>
        </div>
      )}

      {tab === "Writing Style" && (
        <div className="panel grid max-w-3xl gap-4 p-6 md:grid-cols-2">
          {["Sentence length", "Vocabulary", "Tone", "Humor level", "Storytelling style", "Hook style", "CTA style", "Intro style", "Outro style"].map((f) => <Field key={f} label={f}><input className={inputCls} /></Field>)}
          <Field label="Words to use"><input className={inputCls} /></Field>
          <div className="md:col-span-2"><Field label="Words to avoid"><textarea rows={2} className={inputCls} /></Field></div>
          <Button variant="primary" className="md:col-span-2">Save as Writing Skill</Button>
        </div>
      )}

      {tab === "Account" && (
        <div className="panel max-w-lg space-y-4 p-6">
          <Field label="Name"><input className={inputCls} defaultValue="Ade" /></Field>
          <Field label="Email"><input className={inputCls} defaultValue="you@example.com" /></Field>
          <p className="text-xs text-muted-foreground">Sign-in and saved projects arrive in the next phase.</p>
        </div>
      )}
    </>
  );
}
