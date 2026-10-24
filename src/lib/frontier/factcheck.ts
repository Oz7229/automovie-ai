// The fact-check, ported from Frontier 6.1 factcheck.py: the narration is cut into parts of about 550 words, every
// part is checked by its own web-searching model call (Claude Code, factCheckPrompt in assemble.ts), and each call
// returns only real problems with the exact words to replace. Fixes are applied by exact replacement; anything that
// cannot be found verbatim is reported, never guessed.

const PART_WORDS = 550;
// heading, clip and mood lines are not narration: they neither count, nor get checked, nor are ever rewritten
const MARK = /^\s*(#{1,3}\s*\S|\[\[\s*(clip|mood)\s*:)/i;

export interface FactIssue {
  quote: string;
  fix: string;
  kind: string;
  why: string;
  part: number;
  applied: boolean;
}

export interface FactCheckResult {
  script: string;
  issues: FactIssue[];
  parts: number;
  /** Parts whose check returned no usable answer; they are unchecked, not clean. */
  failedParts: number[];
}

/** The script in parts of about PART_WORDS spoken words, cut between paragraphs. */
export function splitParts(script: string): string[] {
  const paras = script
    .trim()
    .split(/\n\s*\n/)
    .filter((p) => p.trim());
  const parts: string[] = [];
  let cur: string[] = [];
  let n = 0;
  for (const p of paras) {
    const w = /^\s*(##|\[\[)/.test(p) ? 0 : p.split(/\s+/).filter(Boolean).length;
    if (cur.length && n + w > PART_WORDS && n >= PART_WORDS * 0.5) {
      parts.push(cur.join("\n\n"));
      cur = [];
      n = 0;
    }
    cur.push(p);
    n += w;
  }
  if (cur.length) parts.push(cur.join("\n\n"));
  return parts;
}

/** The first complete JSON array in a reply (web search likes to append source lists whose brackets must not
 * swallow the answer), or null when the reply holds none — a reply that echoes the prompt is no answer. */
export function parseIssues(
  text: string,
  prompt = "",
): { quote: string; fix: string; kind?: string; why?: string }[] | null {
  const probe = prompt
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("Return ONLY a JSON array"));
  if (probe && text.includes(probe.slice(0, 60))) return null;
  for (let i = text.indexOf("["); i !== -1; i = text.indexOf("[", i + 1)) {
    for (let j = text.indexOf("]", i); j !== -1; j = text.indexOf("]", j + 1)) {
      let got: unknown;
      try {
        got = JSON.parse(text.slice(i, j + 1));
      } catch {
        continue;
      }
      if (Array.isArray(got) && (!got.length || got.some((x) => x && typeof x === "object"))) {
        return got.filter(
          (x): x is { quote: string; fix: string; kind?: string; why?: string } =>
            x && typeof x === "object" && String(x.quote ?? "").trim() !== "" && "fix" in x,
        );
      }
      break;
    }
  }
  return null;
}

// a "fix" that talks to an editor instead of being narration ("Remove the quote…")
const EDITOR_TALK =
  /^\W*(remove|replace|delete|change|consider|rephrase|reword|rewrite|add|cut|drop|use|say|odstra\w*|nahra\w*|smaž\w*|vyma\w*|změ\w*|přepi\w*|usu\w*|zamie\w*|zmie\w*|popraw\w*|entfern\w*|ersetz\w*|supprim\w*|remplac\w*|elimin\w*|sustitu\w*)\b/i;

/** The part with q replaced by fx — only when q is on a narration line, appears once, the fix is narration and not
 * a rewrite of far more than it replaces; null otherwise. */
export function applyFix(part: string, q: string, fx: string): string | null {
  if (!q || q === fx || part.split(q).length !== 2 || fx.length > 3 * q.length + 200) return null;
  if (EDITOR_TALK.test(fx) && !EDITOR_TALK.test(q)) return null;
  if (part.split("\n").some((ln) => ln.includes(q) && MARK.test(ln))) return null;
  return part.replace(q, () => fx);
}

/** Apply every part's answer (null = that part was not checked) to the parts, by exact replacement. */
export function applyAnswers(
  parts: string[],
  answers: ReturnType<typeof parseIssues>[],
): FactCheckResult {
  const issues: FactIssue[] = [];
  const fixed = parts.map((part, k) => {
    let text = part;
    for (const it of answers[k] ?? []) {
      const quote = String(it.quote);
      const fix = String(it.fix ?? "");
      const after = applyFix(text, quote, fix);
      if (after !== null) text = after;
      issues.push({
        quote,
        fix,
        kind: String(it.kind ?? "error"),
        why: String(it.why ?? ""),
        part: k + 1,
        applied: after !== null,
      });
    }
    return text;
  });
  return {
    script: fixed.join("\n\n"),
    issues,
    parts: parts.length,
    failedParts: answers.flatMap((a, k) => (a === null ? [k + 1] : [])),
  };
}
