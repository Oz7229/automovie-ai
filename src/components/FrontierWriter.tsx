import { useEffect, useState } from "react";
import { BookOpenCheck, Loader2, PenLine, ShieldCheck, Stethoscope, Undo2 } from "lucide-react";
import { Badge, Button, Field, inputCls, Section } from "@/components/ui-kit";

type Step = "outline" | "script" | "doctor" | "factcheck";

interface DoctorRun {
  kept: boolean;
  script: string;
  band: [number, number];
  skipped?: string;
  draft: { total: number | null; notes: Record<string, string>; plan: string } | null;
  attempts: { ok: boolean; reasons: string[]; words?: [number, number]; error?: string }[];
}

interface FactCheckRun {
  script: string;
  parts: number;
  failedParts: number[];
  issues: { quote: string; fix: string; kind: string; why: string; applied: boolean }[];
}

const WORDS_PER_MINUTE = 140;
const countWords = (s: string) =>
  s
    .split("\n")
    .filter((l) => !/^\s*(##\s|\[\[)/.test(l))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

async function callStep<T>(step: Step, body: object): Promise<T> {
  const res = await fetch(`/api/frontier/${step}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { success: boolean; error?: string };
  if (!data.success) throw new Error(data.error ?? `The ${step} step failed.`);
  return data;
}

const STEP_LABEL: Record<Step, string> = {
  outline: "Planning the story…",
  script: "Writing the narration…",
  doctor: "Script doctor: scoring and rewriting…",
  factcheck: "Fact-checking every part on the web…",
};

/** Frontier's documentary writer: outline → script → script doctor → fact-check. */
export function FrontierWriter() {
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(8);
  const [sources, setSources] = useState("");
  const [outline, setOutline] = useState("");
  const [script, setScript] = useState("");
  const [previous, setPrevious] = useState<string | null>(null);
  const [busy, setBusy] = useState<Step | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<DoctorRun | null>(null);
  const [check, setCheck] = useState<FactCheckRun | null>(null);
  const [writer, setWriter] = useState<{ provider: string; model: string } | null | undefined>(
    undefined,
  );

  useEffect(() => {
    fetch("/api/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setWriter(d?.writer ?? null))
      .catch(() => setWriter(null));
  }, []);

  const run = async (step: Step, fn: () => Promise<void>) => {
    setBusy(step);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const replaceScript = (next: string) => {
    if (next !== script) setPrevious(script);
    setScript(next);
  };

  const writeAll = () =>
    run("outline", async () => {
      setDoctor(null);
      setCheck(null);
      const o = await callStep<{ outline: string }>("outline", { title, minutes, sources });
      setOutline(o.outline);
      setBusy("script");
      const s = await callStep<{ script: string }>("script", {
        title,
        minutes,
        outline: o.outline,
        sources,
      });
      replaceScript(s.script);
    });

  const runDoctor = () =>
    run("doctor", async () => {
      const d = await callStep<DoctorRun>("doctor", { title, minutes, script, outline, sources });
      setDoctor(d);
      if (d.kept) replaceScript(d.script);
    });

  const runCheck = () =>
    run("factcheck", async () => {
      const c = await callStep<FactCheckRun>("factcheck", { title, script });
      setCheck(c);
      replaceScript(c.script);
    });

  const words = countWords(script);
  const target = Math.round(minutes * WORDS_PER_MINUTE);
  const lastAttempt = doctor?.attempts[doctor.attempts.length - 1];

  return (
    <Section
      title="Frontier documentary writer"
      className="mb-6"
      action={
        writer === undefined ? null : writer ? (
          <Badge tone="success">
            {writer.provider === "claude" ? "Claude" : "Gemini"} · {writer.model}
          </Badge>
        ) : (
          <Badge tone="warning">No writing model — set ANTHROPIC_API_KEY</Badge>
        )
      }
    >
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <Field label="Video title">
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="How the Concorde lost its future"
            />
          </Field>
          <Field label={`Length: ${minutes} min (~${target} spoken words)`}>
            <input
              type="range"
              min={2}
              max={20}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </Field>
          <Field label="Sources (optional — notes, links, facts the script must follow)">
            <textarea
              rows={4}
              className={inputCls}
              value={sources}
              onChange={(e) => setSources(e.target.value)}
            />
          </Field>
          <div className="grid gap-2">
            <Button variant="primary" disabled={!title.trim() || busy !== null} onClick={writeAll}>
              <PenLine /> Write script
            </Button>
            <Button disabled={!script.trim() || busy !== null} onClick={runDoctor}>
              <Stethoscope /> Run script doctor
            </Button>
            <Button disabled={!script.trim() || busy !== null} onClick={runCheck}>
              <ShieldCheck /> Fact-check
            </Button>
            {previous !== null && (
              <Button
                variant="ghost"
                size="sm"
                disabled={busy !== null}
                onClick={() => {
                  setScript(previous);
                  setPrevious(null);
                }}
              >
                <Undo2 /> Undo last change to the script
              </Button>
            )}
          </div>
          {busy && (
            <p className="flex items-center gap-2 text-xs text-primary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {STEP_LABEL[busy]} This can take a
              few minutes.
            </p>
          )}
          {error && (
            <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{error}</p>
          )}
        </div>

        <div className="space-y-3">
          {outline && (
            <details className="rounded-lg border border-border p-3 text-sm">
              <summary className="cursor-pointer font-medium">Story plan (outline)</summary>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-muted-foreground">
                {outline}
              </pre>
            </details>
          )}
          <Field label={`Narration · ${words} words${script ? ` (target ${target})` : ""}`}>
            <textarea
              rows={16}
              className={inputCls + " leading-relaxed"}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Write a script from a title, or paste your own narration to run the doctor and the fact-check on it."
            />
          </Field>

          {doctor && (
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="mb-2 flex items-center gap-2 font-medium">
                <Stethoscope className="h-4 w-4 text-primary" /> Script doctor
                {doctor.skipped ? (
                  <Badge tone="warning">Skipped</Badge>
                ) : doctor.kept ? (
                  <Badge tone="success">Rewrite kept</Badge>
                ) : (
                  <Badge tone="info">Draft kept</Badge>
                )}
                {doctor.draft?.total != null && <Badge>Draft scored {doctor.draft.total}/30</Badge>}
              </p>
              {doctor.skipped && <p className="text-xs text-muted-foreground">{doctor.skipped}</p>}
              {doctor.kept && lastAttempt?.words && (
                <p className="text-xs text-muted-foreground">
                  {lastAttempt.words[0]} → {lastAttempt.words[1]} words (band {doctor.band[0]}–
                  {doctor.band[1]}). The guard found no added facts, names, numbers or invented
                  details.
                </p>
              )}
              {!doctor.kept && !doctor.skipped && lastAttempt && (
                <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                  {(lastAttempt.error ? [lastAttempt.error] : lastAttempt.reasons).map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
              {doctor.draft && Object.keys(doctor.draft.notes).length > 0 && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    What the doctor found
                  </summary>
                  <ul className="mt-1 space-y-1">
                    {Object.entries(doctor.draft.notes).map(([id, note]) => (
                      <li key={id}>
                        <span className="font-mono text-primary">{id}</span> {note}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {check && (
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="mb-2 flex flex-wrap items-center gap-2 font-medium">
                <BookOpenCheck className="h-4 w-4 text-primary" /> Fact-check
                <Badge tone={check.issues.length ? "warning" : "success"}>
                  {check.issues.length} issue{check.issues.length === 1 ? "" : "s"} in {check.parts}{" "}
                  part
                  {check.parts === 1 ? "" : "s"}
                </Badge>
                {check.failedParts.length > 0 && (
                  <Badge tone="danger">Part {check.failedParts.join(", ")} not checked</Badge>
                )}
              </p>
              <ul className="space-y-2 text-xs">
                {check.issues.map((it, i) => (
                  <li key={i} className="rounded-md bg-muted/40 p-2">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge tone={it.applied ? "success" : "warning"}>
                        {it.applied ? "Fixed" : "Not applied"}
                      </Badge>
                      <Badge>{it.kind}</Badge>
                    </div>
                    <p>
                      <span className="text-destructive line-through">{it.quote}</span>
                      {" → "}
                      <span className="text-success">{it.fix || "(removed)"}</span>
                    </p>
                    {it.why && <p className="mt-1 text-muted-foreground">{it.why}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
