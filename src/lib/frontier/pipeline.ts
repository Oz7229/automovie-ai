// Frontier's documentary script pipeline for automovie: outline → script → script doctor → fact-check, each step a
// separate call so a long run never sits in one request. Prompts are assembled the way Frontier does it: the
// channel's own prompt, then the retention craft, then the documentary craft.

import { generateText } from "../llm";
import {
  doctorPrompt,
  guard,
  keepBand,
  lengthHint,
  parseDoctor,
  restoreSignoff,
  retryPrompt,
  wordCount,
  type DoctorAnswer,
} from "./doctor";
import { factCheck, type FactCheckResult } from "./factcheck";
import {
  DOC_CRAFT_OUTLINE,
  DOC_CRAFT_SCRIPT,
  DOCUMENTARY_OUTLINE,
  DOCUMENTARY_SCRIPT,
  SCRIPT_CRAFT_OUTLINE,
  SCRIPT_CRAFT_SCRIPT,
} from "./prompts";

/** Spoken words per minute for length targets (Frontier's engine default). */
export const WORDS_PER_MINUTE = 140;
/** Frontier does not doctor longer drafts (DOCTOR_MAX_WORDS). */
export const DOCTOR_MAX_WORDS = 3000;

export const targetWords = (minutes: number) => Math.round(minutes * WORDS_PER_MINUTE);

function sourcesBlock(sources?: string): string {
  return sources?.trim()
    ? `\n\nTHE SOURCES (use them; never contradict them):\n${sources.trim().slice(0, 20000)}`
    : "";
}

/** Strip a code fence or a preamble line the model may wrap the narration in. */
function cleanScript(text: string): string {
  return text
    .trim()
    .replace(/^```[\w-]*\n|\n```$/g, "")
    .trim();
}

export async function writeOutline(opts: { title: string; minutes: number; sources?: string }) {
  const prompt =
    DOCUMENTARY_OUTLINE.replace("[INSERT TITLE HERE]", opts.title).replace(
      /\[INSERT LENGTH[^\]]*\]/,
      `${opts.minutes} minutes`,
    ) +
    SCRIPT_CRAFT_OUTLINE +
    DOC_CRAFT_OUTLINE +
    sourcesBlock(opts.sources);
  const res = await generateText({ prompt, effort: "high" });
  return { outline: res.text.trim(), provider: res.provider, model: res.model };
}

export async function writeScript(opts: {
  title: string;
  minutes: number;
  outline: string;
  sources?: string;
}) {
  const words = targetWords(opts.minutes);
  const prompt =
    DOCUMENTARY_SCRIPT.replace("[INSERT OUTLINE HERE]", opts.outline) +
    `\n\nTITLE: ${opts.title}\nTARGET LENGTH: ${opts.minutes} minutes, about ${words} spoken words.` +
    SCRIPT_CRAFT_SCRIPT +
    DOC_CRAFT_SCRIPT +
    sourcesBlock(opts.sources);
  const res = await generateText({ prompt, effort: "high" });
  const script = cleanScript(res.text);
  return { script, words: wordCount(script), provider: res.provider, model: res.model };
}

export interface DoctorAttempt {
  ok: boolean;
  reasons: string[];
  words?: [number, number];
  lintFailures?: [number, number];
  error?: string;
}

export interface DoctorRun {
  script: string;
  kept: boolean;
  band: [number, number];
  draft: DoctorAnswer | null;
  attempts: DoctorAttempt[];
  skipped?: string;
}

/** One doctor call, the guard, one retry with the guard's reasons, else the draft unchanged. */
export async function runDoctor(opts: {
  title: string;
  minutes: number;
  script: string;
  outline?: string;
  sources?: string;
}): Promise<DoctorRun> {
  const { title, minutes, script, outline = "", sources = "" } = opts;
  const draftWords = wordCount(script);
  const [lo, hi] = keepBand(minutes, targetWords(minutes), draftWords);
  const run: DoctorRun = { script, kept: false, band: [lo, hi], draft: null, attempts: [] };
  if (draftWords > DOCTOR_MAX_WORDS) {
    run.skipped = `${draftWords} words is over the doctor's limit (${DOCTOR_MAX_WORDS})`;
    return run;
  }
  const ask = doctorPrompt({ title, minutes, script, outline, sources, lo, hi });
  const refs = outline + "\n" + sources;
  let prompt = ask;
  for (let attempt = 1; attempt <= 2; attempt++) {
    let raw: string;
    try {
      raw = (await generateText({ prompt, effort: "high" })).text;
    } catch (err) {
      run.attempts.push({
        ok: false,
        reasons: [],
        error: err instanceof Error ? err.message : String(err),
      });
      break;
    }
    const answer = parseDoctor(raw);
    if (attempt === 1) run.draft = answer;
    if (!answer.script) {
      run.attempts.push({ ok: false, reasons: [], error: "no === SCRIPT === block in the answer" });
      break;
    }
    const next = restoreSignoff(script, cleanScript(answer.script));
    const g = guard(script, next, refs, lo, hi);
    run.attempts.push({
      ok: g.ok,
      reasons: g.reasons,
      words: g.words,
      lintFailures: g.lintFailures,
    });
    if (g.ok) {
      run.script = next;
      run.kept = true;
      break;
    }
    prompt = retryPrompt(ask, answer.script, g.reasons) + lengthHint(g.words, lo, hi);
  }
  return run;
}

export async function runFactCheck(opts: {
  title: string;
  script: string;
}): Promise<FactCheckResult> {
  return factCheck(opts.title, opts.script, async (prompt) => {
    return (await generateText({ prompt, webSearch: true, effort: "medium" })).text;
  });
}
