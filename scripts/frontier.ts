#!/usr/bin/env bun
// Frontier's documentary pipeline for Claude Code (/frontier-script). Claude Code — signed in with your Claude
// subscription — is the writer; this tool fills Frontier's prompts and runs the deterministic steps: the script
// doctor's guard, applying fact-check fixes, and saving the finished script to content/scripts/ for the site.
//
//   bun scripts/frontier.ts start --title "…" --minutes 8 [--sources notes.md]   → outline.prompt.md
//   bun scripts/frontier.ts script <slug>        outline.md → script.prompt.md
//   bun scripts/frontier.ts doctor <slug>        draft.md   → doctor.prompt.md
//   bun scripts/frontier.ts guard <slug>         doctor.answer.md → script.md, or doctor.prompt.md for the retry
//   bun scripts/frontier.ts factcheck <slug>     script.md  → factcheck/part-N.prompt.md
//   bun scripts/frontier.ts apply <slug>         factcheck/part-N.answer.md → content/scripts/<slug>.md
//   bun scripts/frontier.ts lint <file>          the doctor's measurements of any narration
//
// Work files live in .frontier/<slug>/ (git-ignored).

import fs from "node:fs";
import path from "node:path";
import {
  cleanScript,
  DOCTOR_MAX_WORDS,
  factCheckPrompt,
  outlinePrompt,
  scriptPrompt,
  targetWords,
} from "../src/lib/frontier/assemble.ts";
import {
  doctorPrompt,
  guard,
  keepBand,
  lengthHint,
  lint,
  lintReport,
  parseDoctor,
  restoreSignoff,
  retryPrompt,
  wordCount,
} from "../src/lib/frontier/doctor.ts";
import { applyAnswers, parseIssues, splitParts } from "../src/lib/frontier/factcheck.ts";

const ROOT = path.resolve(import.meta.dir, "..");
const WORK = path.join(ROOT, ".frontier");
const OUT = path.join(ROOT, "content", "scripts");

interface Meta {
  title: string;
  minutes: number;
  slug: string;
  sources: string;
  doctorAttempts: number;
  doctor?: {
    kept: boolean;
    total: number | null;
    reasons: string[];
    words?: [number, number];
    skipped?: string;
  };
}

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function slugify(title: string): string {
  return (
    title
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "script"
  );
}

const dirOf = (slug: string) => path.join(WORK, slug);
const rel = (p: string) => path.relative(ROOT, p).replaceAll("\\", "/");

function readMeta(slug?: string): Meta {
  if (!slug) fail("Give the script's slug (the folder name under .frontier/).");
  const file = path.join(dirOf(slug), "meta.json");
  if (!fs.existsSync(file)) fail(`No pipeline named "${slug}" — run start first.`);
  return JSON.parse(fs.readFileSync(file, "utf8")) as Meta;
}

function writeMeta(meta: Meta) {
  fs.writeFileSync(path.join(dirOf(meta.slug), "meta.json"), JSON.stringify(meta, null, 2));
}

function need(meta: Meta, name: string): string {
  const file = path.join(dirOf(meta.slug), name);
  if (!fs.existsSync(file)) fail(`${rel(file)} is missing — write it first.`);
  const text = fs.readFileSync(file, "utf8").trim();
  if (!text) fail(`${rel(file)} is empty.`);
  return text;
}

function put(meta: Meta, name: string, text: string): string {
  const file = path.join(dirOf(meta.slug), name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text.endsWith("\n") ? text : text + "\n");
  return rel(file);
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
  case "start": {
    const title = flag(args, "title")?.trim();
    const minutes = Number(flag(args, "minutes") ?? 8);
    if (!title) fail('Usage: start --title "…" --minutes 8 [--sources notes.md]');
    if (!(minutes > 0 && minutes <= 60)) fail("--minutes must be between 1 and 60.");
    const sourcesFile = flag(args, "sources");
    const sources = sourcesFile ? fs.readFileSync(path.resolve(sourcesFile), "utf8") : "";
    const meta: Meta = { title, minutes, slug: slugify(title), sources, doctorAttempts: 0 };
    fs.rmSync(dirOf(meta.slug), { recursive: true, force: true });
    fs.mkdirSync(dirOf(meta.slug), { recursive: true });
    writeMeta(meta);
    console.log(`slug: ${meta.slug}`);
    console.log(`target: ${minutes} min ≈ ${targetWords(minutes)} spoken words`);
    console.log(
      `next: answer ${put(meta, "outline.prompt.md", outlinePrompt(title, minutes, sources))}`,
    );
    console.log(
      `      and write the story plan to ${rel(path.join(dirOf(meta.slug), "outline.md"))}`,
    );
    break;
  }

  case "script": {
    const meta = readMeta(args[0]);
    const outline = need(meta, "outline.md");
    const prompt = put(
      meta,
      "script.prompt.md",
      scriptPrompt(meta.title, meta.minutes, outline, meta.sources),
    );
    console.log(`next: answer ${prompt}`);
    console.log(
      `      and write ONLY the narration to ${rel(path.join(dirOf(meta.slug), "draft.md"))}`,
    );
    break;
  }

  case "doctor": {
    const meta = readMeta(args[0]);
    const draft = cleanScript(need(meta, "draft.md"));
    const words = wordCount(draft);
    meta.doctorAttempts = 0;
    if (words > DOCTOR_MAX_WORDS) {
      meta.doctor = {
        kept: false,
        total: null,
        reasons: [],
        skipped: `${words} words is over ${DOCTOR_MAX_WORDS}`,
      };
      writeMeta(meta);
      put(meta, "script.md", draft);
      console.log(
        `doctor skipped: ${meta.doctor.skipped}. script.md = the draft. next: factcheck ${meta.slug}`,
      );
      break;
    }
    const [lo, hi] = keepBand(meta.minutes, targetWords(meta.minutes), words);
    const prompt = doctorPrompt({
      title: meta.title,
      minutes: meta.minutes,
      script: draft,
      outline: fs.existsSync(path.join(dirOf(meta.slug), "outline.md"))
        ? need(meta, "outline.md")
        : "",
      sources: meta.sources,
      lo,
      hi,
    });
    put(meta, "doctor.first.prompt.md", prompt);
    writeMeta(meta);
    console.log(`draft: ${words} words, band ${lo}–${hi}`);
    console.log(`next: answer ${put(meta, "doctor.prompt.md", prompt)}`);
    console.log(
      `      in EXACTLY its answer shape, to ${rel(path.join(dirOf(meta.slug), "doctor.answer.md"))}`,
    );
    break;
  }

  case "guard": {
    const meta = readMeta(args[0]);
    const draft = cleanScript(need(meta, "draft.md"));
    const answer = parseDoctor(need(meta, "doctor.answer.md"));
    const outline = fs.existsSync(path.join(dirOf(meta.slug), "outline.md"))
      ? need(meta, "outline.md")
      : "";
    const [lo, hi] = keepBand(meta.minutes, targetWords(meta.minutes), wordCount(draft));
    meta.doctorAttempts += 1;
    if (!answer.script)
      fail("doctor.answer.md has no === SCRIPT === block — answer in the prompt's shape.");
    const next = restoreSignoff(draft, cleanScript(answer.script));
    const g = guard(draft, next, outline + "\n" + meta.sources, lo, hi);
    const total = meta.doctor?.total ?? answer.total;
    if (g.ok) {
      meta.doctor = { kept: true, total, reasons: [], words: g.words };
      put(meta, "script.md", next);
      console.log(
        `✓ rewrite kept: ${g.words[0]} → ${g.words[1]} words, lint ${g.lintFailures[0]} → ${g.lintFailures[1]} failures`,
      );
    } else if (meta.doctorAttempts < 2) {
      const first = need(meta, "doctor.first.prompt.md");
      put(
        meta,
        "doctor.prompt.md",
        retryPrompt(first, answer.script, g.reasons) + lengthHint(g.words, lo, hi),
      );
      meta.doctor = { kept: false, total, reasons: g.reasons, words: g.words };
      writeMeta(meta);
      console.log("✗ the guard rejected the rewrite:");
      for (const r of g.reasons) console.log(`  - ${r}`);
      console.log(
        `next: answer the retry in ${rel(path.join(dirOf(meta.slug), "doctor.prompt.md"))}, overwrite doctor.answer.md, run guard again`,
      );
      process.exit(2);
    } else {
      meta.doctor = { kept: false, total, reasons: g.reasons, words: g.words };
      put(meta, "script.md", draft);
      console.log("✗ rejected twice — the draft stays (as Frontier does):");
      for (const r of g.reasons) console.log(`  - ${r}`);
    }
    writeMeta(meta);
    console.log(`next: factcheck ${meta.slug}`);
    break;
  }

  case "factcheck": {
    const meta = readMeta(args[0]);
    const parts = splitParts(need(meta, "script.md"));
    fs.rmSync(path.join(dirOf(meta.slug), "factcheck"), { recursive: true, force: true });
    parts.forEach((part, k) => {
      put(
        meta,
        `factcheck/part-${k + 1}.prompt.md`,
        factCheckPrompt(meta.title, k + 1, parts.length, part),
      );
    });
    console.log(
      `${parts.length} part(s). For each factcheck/part-N.prompt.md: search the web as it says, then write`,
    );
    console.log(
      `ONLY its JSON array to factcheck/part-N.answer.md in ${rel(dirOf(meta.slug))}/. next: apply ${meta.slug}`,
    );
    break;
  }

  case "apply": {
    const meta = readMeta(args[0]);
    const parts = splitParts(need(meta, "script.md"));
    const answers = parts.map((_, k) => {
      const file = path.join(dirOf(meta.slug), `factcheck/part-${k + 1}.answer.md`);
      return fs.existsSync(file) ? parseIssues(fs.readFileSync(file, "utf8")) : null;
    });
    const result = applyAnswers(parts, answers);
    const final = result.script;
    const m = lint(final);
    const doc = meta.doctor;
    const lines = [
      "---",
      `title: ${JSON.stringify(meta.title)}`,
      `minutes: ${meta.minutes}`,
      `words: ${m.words}`,
      `created: ${new Date().toISOString()}`,
      `doctor: ${doc?.skipped ? "skipped" : doc?.kept ? "rewrite kept" : "draft kept"}`,
      `doctorScore: ${doc?.total ?? "null"}`,
      `factcheckIssues: ${result.issues.length}`,
      `factcheckApplied: ${result.issues.filter((i) => i.applied).length}`,
      `uncheckedParts: [${result.failedParts.join(", ")}]`,
      "---",
      "",
      final,
      "",
    ];
    if (result.issues.length) {
      lines.push("<!-- fact-check report", "");
      for (const it of result.issues) {
        lines.push(
          `- [${it.applied ? "fixed" : "NOT APPLIED"}] (${it.kind}) "${it.quote}" → "${it.fix}" — ${it.why}`,
        );
      }
      lines.push("-->", "");
    }
    fs.mkdirSync(OUT, { recursive: true });
    const outFile = path.join(OUT, `${meta.slug}.md`);
    fs.writeFileSync(outFile, lines.join("\n"));
    console.log(
      `fact-check: ${result.issues.length} issue(s), ${result.issues.filter((i) => i.applied).length} applied`,
    );
    for (const it of result.issues.filter((i) => !i.applied))
      console.log(`  not applied: "${it.quote}" → "${it.fix}"`);
    if (result.failedParts.length)
      console.log(`  ⚠ part(s) ${result.failedParts.join(", ")} have no usable answer: unchecked`);
    console.log(`✓ saved ${rel(outFile)} (${m.words} words)`);
    break;
  }

  case "lint": {
    const file = args[0] ?? fail("Usage: lint <file>");
    console.log(lintReport(lint(fs.readFileSync(path.resolve(file), "utf8"))));
    break;
  }

  default:
    console.log(
      fs
        .readFileSync(import.meta.path, "utf8")
        .split("\n")
        .slice(1, 15)
        .join("\n"),
    );
}
