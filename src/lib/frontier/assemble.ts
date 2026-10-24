// Prompt assembly for Frontier's documentary pipeline, the way Frontier does it: the channel's own prompt, then
// the retention craft, then the documentary craft. No dependencies, so the Claude Code CLI and the site share it.

import {
  DOC_CRAFT_OUTLINE,
  DOC_CRAFT_SCRIPT,
  DOCUMENTARY_OUTLINE,
  DOCUMENTARY_SCRIPT,
  FACTCHECK_PROMPT,
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

export function outlinePrompt(title: string, minutes: number, sources?: string): string {
  return (
    DOCUMENTARY_OUTLINE.replace("[INSERT TITLE HERE]", title).replace(
      /\[INSERT LENGTH[^\]]*\]/,
      `${minutes} minutes`,
    ) +
    SCRIPT_CRAFT_OUTLINE +
    DOC_CRAFT_OUTLINE +
    sourcesBlock(sources)
  );
}

export function scriptPrompt(
  title: string,
  minutes: number,
  outline: string,
  sources?: string,
): string {
  return (
    DOCUMENTARY_SCRIPT.replace("[INSERT OUTLINE HERE]", outline) +
    `\n\nTITLE: ${title}\nTARGET LENGTH: ${minutes} minutes, about ${targetWords(minutes)} spoken words.` +
    SCRIPT_CRAFT_SCRIPT +
    DOC_CRAFT_SCRIPT +
    sourcesBlock(sources)
  );
}

export function factCheckPrompt(
  title: string,
  n: number,
  of: number,
  part: string,
  language = "English",
): string {
  return FACTCHECK_PROMPT.replace("[INSERT TITLE HERE]", title)
    .replaceAll("[INSERT LANGUAGE HERE]", language)
    .replaceAll("[INSERT N HERE]", String(n))
    .replace("[INSERT OF HERE]", String(of))
    .replace("[INSERT PART HERE]", part);
}

/** Strip a code fence the model may wrap the narration in. */
export function cleanScript(text: string): string {
  return text
    .trim()
    .replace(/^```[\w-]*\n|\n```$/g, "")
    .trim();
}
