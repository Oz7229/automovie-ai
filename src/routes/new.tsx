import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Lightbulb,
  ClipboardPaste,
  Upload,
  Youtube,
  LayoutTemplate,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button, buttonVariants, Field, inputCls, PageHeader } from "@/components/ui-kit";
import { channels } from "@/lib/sample-data";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/new")({
  head: () =>
    seo(
      "Create New Video",
      "Start a new faceless video from a topic, script, YouTube URL or template.",
    ),
  component: Wizard,
});

const methods = [
  {
    id: "topic",
    label: "Start from a Topic",
    desc: "AI researches and writes everything",
    icon: Lightbulb,
  },
  { id: "paste", label: "Paste a Script", desc: "Skip straight to scenes", icon: ClipboardPaste },
  { id: "upload", label: "Upload a Script", desc: ".txt, .docx or .md", icon: Upload },
  {
    id: "youtube",
    label: "Create from YouTube URL",
    desc: "Analyze and remix a reference",
    icon: Youtube,
  },
  { id: "template", label: "Start from Template", desc: "Proven formats", icon: LayoutTemplate },
];

function Wizard() {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState("topic");
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Create new video" subtitle={`Step ${step} of 3`} />
      <div className="mb-6 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full",
              s <= step ? "bg-gradient-primary" : "bg-muted",
            )}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {methods.map(({ id, label, desc, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMethod(id)}
              className={cn(
                "panel flex items-start gap-4 p-5 text-left transition",
                method === id ? "shadow-glow" : "hover:bg-elevated",
              )}
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="panel grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Video topic">
              <input className={inputCls} defaultValue="20 Indoor Plants That Thrive in Water" />
            </Field>
          </div>
          <Field label="Channel profile">
            <select className={inputCls}>
              {channels.map((c) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Target audience">
            <input className={inputCls} defaultValue="Beginner plant owners" />
          </Field>
          <Field label="Desired length">
            <select className={inputCls} defaultValue="20 minutes">
              {["5 minutes", "10 minutes", "15 minutes", "20 minutes", "30 minutes"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label="Tone">
            <input className={inputCls} defaultValue="Educational + conversational" />
          </Field>
          <Field label="Content style">
            <input className={inputCls} defaultValue="Faceless documentary / YouTube educational" />
          </Field>
          <Field label="Language">
            <input className={inputCls} defaultValue="English" />
          </Field>
          <Field label="Country / region">
            <input className={inputCls} defaultValue="United States" />
          </Field>
          <Field label="Keywords (optional)">
            <input className={inputCls} placeholder="water plants, hydroponic houseplants" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Competitor videos (optional)">
              <input className={inputCls} placeholder="https://youtube.com/watch?v=…" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Extra instructions (optional)">
              <textarea
                rows={3}
                className={inputCls}
                placeholder="Focus on low-light plants, avoid pet-toxic species…"
              />
            </Field>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="panel bg-hero p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 text-2xl font-semibold">Ready to start production</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            The Research Agent will search the web, cross-check facts and build a cited report for
            your approval.
          </p>
          <Link
            to="/research"
            className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-6")}
          >
            Start research
          </Link>
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" disabled={step === 1} onClick={() => setStep(step - 1)}>
          <ArrowLeft /> Back
        </Button>
        {step < 3 && (
          <Button variant="primary" onClick={() => setStep(step + 1)}>
            Continue <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}
