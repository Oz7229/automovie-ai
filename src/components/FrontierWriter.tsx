import { useMemo, useState } from "react";
import { BookOpenCheck, Check, Copy, FileText, Stethoscope, Terminal } from "lucide-react";
import { Badge, Button, Section } from "@/components/ui-kit";
import { lint, lintFailures } from "@/lib/frontier/doctor";
import { cn } from "@/lib/utils";

// Scripts written in Claude Code with /frontier-script (your Claude subscription), saved to content/scripts/.
const FILES = import.meta.glob("/content/scripts/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

interface SavedScript {
  slug: string;
  title: string;
  minutes: number;
  created: string;
  doctor: string;
  doctorScore: number | null;
  issues: number;
  applied: number;
  unchecked: string;
  narration: string;
  report: string[];
}

function parse(path: string, raw: string): SavedScript {
  const text = raw.replace(/\r\n/g, "\n");
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  const meta: Record<string, string> = {};
  for (const line of (fm?.[1] ?? "").split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const body = fm ? text.slice(fm[0].length) : text;
  const reportMatch = body.match(/<!-- fact-check report\n([\s\S]*?)-->/);
  const slug = path.split("/").pop()!.replace(/\.md$/, "");
  let title = slug;
  try {
    title = meta["title"] ? (JSON.parse(meta["title"]) as string) : slug;
  } catch {
    title = meta["title"] ?? slug;
  }
  return {
    slug,
    title,
    minutes: Number(meta["minutes"] ?? 0),
    created: meta["created"] ?? "",
    doctor: meta["doctor"] ?? "",
    doctorScore:
      meta["doctorScore"] && meta["doctorScore"] !== "null" ? Number(meta["doctorScore"]) : null,
    issues: Number(meta["factcheckIssues"] ?? 0),
    applied: Number(meta["factcheckApplied"] ?? 0),
    unchecked: (meta["uncheckedParts"] ?? "[]").replace(/[[\]\s]/g, ""),
    narration: body.replace(/<!-- fact-check report[\s\S]*?-->/, "").trim(),
    report: (reportMatch?.[1] ?? "")
      .split("\n")
      .map((l) => l.replace(/^-\s*/, "").trim())
      .filter(Boolean),
  };
}

/** Frontier's documentary scripts, written in Claude Code and listed here. */
export function FrontierWriter() {
  const scripts = useMemo(
    () =>
      Object.entries(FILES)
        .map(([p, raw]) => parse(p, raw))
        .sort((a, b) => b.created.localeCompare(a.created)),
    [],
  );
  const [sel, setSel] = useState(0);
  const [copied, setCopied] = useState(false);
  const s = scripts[sel];
  const m = useMemo(() => (s ? lint(s.narration) : null), [s]);

  return (
    <Section
      title="Frontier documentary scripts"
      className="mb-6"
      action={<Badge tone="primary">Written with Claude Code</Badge>}
    >
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Scripts are written in Claude Code, signed in with your own Claude subscription — no API
          key on the site. In this repository run{" "}
          <code className="rounded bg-muted px-1 font-mono text-foreground">
            /frontier-script "Your title" 8
          </code>
          : Claude plans, writes, runs Frontier's script doctor and fact-checks on the web, then
          saves the script to <code className="font-mono">content/scripts/</code>. Push it and it
          appears here.
        </p>
      </div>

      {!s ? (
        <p className="text-sm text-muted-foreground">No scripts yet.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="max-h-[60vh] space-y-1 overflow-y-auto scrollbar-thin">
            {scripts.map((x, i) => (
              <button
                key={x.slug}
                onClick={() => {
                  setSel(i);
                  setCopied(false);
                }}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left",
                  i === sel ? "bg-accent" : "hover:bg-accent/50",
                )}
              >
                <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                  {x.title}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {x.minutes} min · {x.created.slice(0, 10)}
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="mr-auto text-base font-semibold">{s.title}</h3>
              <Badge>
                {m?.words} words · {s.minutes} min
              </Badge>
              <Badge tone={s.doctor === "rewrite kept" ? "success" : "info"}>
                <Stethoscope className="h-3 w-3" /> {s.doctor || "no doctor"}
                {s.doctorScore !== null ? ` · draft ${s.doctorScore}/30` : ""}
              </Badge>
              <Badge tone={s.issues === s.applied ? "success" : "warning"}>
                <BookOpenCheck className="h-3 w-3" /> {s.applied}/{s.issues} fixes applied
              </Badge>
              {s.unchecked && <Badge tone="danger">Part {s.unchecked} unchecked</Badge>}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(s.narration).then(() => setCopied(true));
                }}
              >
                {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy narration"}
              </Button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-border p-4 text-sm leading-relaxed scrollbar-thin">
              {s.narration}
            </div>
            {m && lintFailures(m).length > 0 && (
              <p className="text-xs text-muted-foreground">
                Doctor's measurements still flag:{" "}
                {lintFailures(m)
                  .map(([, why]) => why)
                  .join("; ")}
              </p>
            )}
            {s.report.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                  Fact-check report
                </summary>
                <ul className="mt-1 space-y-1">
                  {s.report.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
