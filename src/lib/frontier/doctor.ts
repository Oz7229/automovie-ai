// The script doctor's deterministic side, ported from Frontier 6.1 scriptdoctor.py (SCRIPT CRAFT v3).
// lint() measures a narration, guard() decides whether a rewrite is safe to keep (no added fact, number, name,
// risky line or invented texture; inside the length band; fewer lint failures), and the prompt helpers fill
// DOC_DOCTOR. English is the reference language; the Czech/Polish/German word lists are kept where Frontier had them.

import { DOC_DOCTOR, DOCTOR_CHECKLIST } from "./prompts";

const MARKER_RE = /^\s*(##\s|\[\[)/;
const PAUSE_RE = /\[\[\s*hold\b|\[pause\]|<#[\d.]+#>/gi;
const TURN_OPENERS = new RegExp(
  "^(but|then|so|now|and then|yet|still|instead|meanwhile|while|within|that night|the next|by \\w+|after|" +
    "that same|the same (?:year|day|night|month)|\\w+ (?:days?|weeks?|months?|years?|decades?) (?:later|earlier)|" +
    "(?:days|weeks|months|years|decades) (?:later|earlier)|in \\d{4}|in (?:nineteen|twenty|two thousand)|" +
    "it'?s (?:\\d{4}|nineteen|twenty|two thousand)|on (?:january|february|march|april|may|june|july|august|" +
    "september|october|november|december)|(?:january|february|march|april|may|june|july|august|september|" +
    "october|november|december) \\w+|" +
    "before|at around|on the|in the (spring|summer|autumn|fall|winter|morning|evening|night)|today|" +
    "ale|pak|a pak|a tak|proto|teď|v tu chvíli|mezitím|zatímco|druhý den|o \\w+ později|dnes|" +
    "potem|więc|teraz|tymczasem|dziś|aber|dann|also|jetzt|inzwischen|während|heute)\\b",
  "i",
);
const GAP_SRC =
  "\\b(doesn't|does not|don't|do not|didn't|did not) (know|realise|realize|suspect|see)\\b|\\bhas no idea\\b|" +
  "\\bhave no idea\\b|\\b(?:faintest|slightest) idea\\b|\\bunaware\\b|" +
  "\\b(?:none of them|nobody|no one|no-one)(?: yet| here| on board| in the room)? (?:knows?|realises|realizes|suspects?)\\b|" +
  "\\b(?:not|never|without) (?:realising|realizing|knowing|suspecting)\\b|\\bhas no way of knowing\\b|" +
  "\\bnikdo(?: zatím)? (?:netuší|neví)\\b|\\bnikt(?: jeszcze)? nie wie\\b|\\bniemand (?:ahnt|weiß|weiss)\\b|\\bnetuší\\b|\\bnemá(?: ani)? tušení\\b|\\bnie wie\\b|\\bnie ma pojęcia\\b|" +
  "\\bahnt nicht\\b|\\bahnen nicht\\b|\\bkeine ahnung\\b";
const GAP_RE = new RegExp(GAP_SRC, "i");
const LITTLE_DID_SRC = "little did (he|she|they|we|anyone)|netušil\\p{L}*,? co (ho|ji|je) čeká";
// Lines a fact-check most often throws out: superlatives and absolutes, words pinned on an outlet, a thought in a
// head, "still today" claims. Reported to the doctor as RISK lines to check, never a lint failure.
const RISK_SRC =
  "\\b(?:largest|biggest|first|only|worst|best|greatest|most \\w+)\\b[^.]{0,60}\\bever\\b|\\bin (?:all of )?history\\b|" +
  "\\bnot (?:one|a single)\\b|\\bevery (?:paper|newspaper|headline|outlet|network|reporter|station)\\b|" +
  "\\b(?:Bloomberg|Reuters|the (?:New York |Wall Street |Financial )?(?:Times|Journal|Post)|CNN|BBC|AP|the press|" +
  "headlines?|prosecutors|officials)\\b[^.]{0,40}\\b(?:calls?|called|says|said|writes|wrote|reads?|describes?|" +
  "described)\\b|" +
  "\\b(?:knows?|doesn't know|does not know|didn't know|did not know) (?:if|whether)\\b|" +
  "\\b(?:wonders|wondered|hopes|hoped|thinks|thought|realizes|realises|realized|realised|is sure|was sure)\\b|" +
  "\\bstill (?:stands|standing|preserved|open|there|hangs|reads)\\b|\\bto this day\\b|\\bpreserved\\b|" +
  "\\bdodnes\\b|\\bnikdy předtím\\b|\\bdo dziś\\b|\\bbis heute\\b";
const RISK_RE = new RegExp(RISK_SRC, "i");

const BLOCKLIST = [
  "shocking",
  "horrific",
  "tragic",
  "tragically",
  "devastating",
  "chilling",
  "heartbreaking",
  "terrifying",
  "incredible",
  "unbelievable",
  "evil",
  "monster",
  "sadly",
  "gruesome",
  "unimaginable",
  "ironically",
  "the irony",
  "of all places",
  "fate had other plans",
  "as luck would have it",
  "fate intervenes",
  "all hell breaks loose",
  "never again",
  "šokující",
  "otřesný",
  "otřesná",
  "otřesné",
  "tragický",
  "tragická",
  "tragické",
  "děsivý",
  "děsivá",
  "děsivé",
  "neuvěřitelný",
  "neuvěřitelná",
  "neuvěřitelné",
  "srdcervoucí",
  "zrůda",
  "ďábelský",
  "hrůzný",
  "hrůzná",
  "nepředstavitelný",
  "bestiální",
  "ironií osudu",
  "ironicky",
  "szokujący",
  "tragiczny",
  "przerażający",
  "niewiarygodny",
  "potwór",
  "jak na ironię",
  "schockierend",
  "tragisch",
  "erschreckend",
  "unglaublich",
  "ironischerweise",
];
const DEVICE_RE =
  /here'?s the (contradiction|twist|thing|catch|kicker)|\bthe twist\?|but that's not all|in this video|welcome back|have you ever wondered|this is the story of/gi;
const LABEL_RE = /(?:^|(?<=[.!?…]\s))([\p{Lu}][\p{L}\p{N}_'’-]{1,}(?: [\p{L}\p{N}_'’-]+)?):\s/gmu;
const NAME_LABEL_OK = /^(his|her|their) name$|^jmenuje se$|^jeho jméno$/i;

const EN_NUM = (
  "two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen " +
  "eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million billion " +
  "dozen dozens hundreds thousands millions billions half third fourth fifth sixth seventh eighth ninth " +
  "tenth eleventh twelfth thirteenth fourteenth fifteenth sixteenth seventeenth eighteenth nineteenth " +
  "twentieth thirtieth"
).split(" ");
const NUM_WORD_SRC =
  "(" +
  EN_NUM.join("|") +
  "|dv(?:a|e|ou|ema)|tr(?:i|ech|em|emi)|ctyr(?:i|ech|em|mi)?|(?:pet|sest|sedm|osm|" +
  "devet|deset|deviti|peti|sesti|sedmi|osmi|deseti)|(?:jede|dva|tri|ctr|pat|sest|sedm|osm|devate)nact(?:i)?|" +
  "(?:dvacet|tricet|ctyricet|padesat|sedesat|sedmdesat|osmdesat|devadesat)(?:i)?|sto|sta|ste|" +
  "tisic(?:e|u|i|ich|um)?|milion(?:u|y|ech|em)?|miliard(?:a|y|u|ach)?|dwa|dwie|trzy|cztery|piec|szesc|siedem|" +
  "osiem|dziewiec|dziesiec|dwadziescia|trzydziesci|tysiac\\w*|tysiecy|zwei|drei|vier|funf|sechs|sieben|acht|" +
  "neun|zehn|zwolf|zwanzig|dreissig|hundert|tausend|millionen|milliarden?|dutzend)";
const NUM_WORD_FULL = new RegExp(`^${NUM_WORD_SRC}$`, "i");
const NUM_WORD_RE = new RegExp(`\\b${NUM_WORD_SRC}\\b`, "i");
const DIGIT_RE = /\d(?:[\d,.\u00a0\u202f]*\d)?/;
const EN_PRESENT =
  /\b(is|are|has|have|does|do|isn't|aren't|hasn't|haven't|doesn't|don't|can|can't|will|won't)\b/gi;
const EN_PAST = /\b(was|were|had|did|wasn't|weren't|hadn't|didn't|could|couldn't|would)\b/gi;

const isYear = (k: NumKey) =>
  typeof k === "number" && Number.isInteger(k) && k >= 1600 && k <= 2100;

/** Lowercase without diacritics (compares across inflection and spelling). */
export function fold(s: string): string {
  return (s || "")
    .normalize("NFKD")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .replace(/ß/g, "ss")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/** The narration as it is heard: marker lines ("## …", "[[…]]") taken out. */
export function spoken(script: string): string {
  return (script || "")
    .split(/\r?\n/)
    .filter((ln) => !MARKER_RE.test(ln))
    .join("\n");
}

export function sentences(text: string): string[] {
  const flat = spoken(text).split(/\s+/).filter(Boolean).join(" ");
  return flat
    .split(/(?<=[.!?…])\s+(?=["'“„(]?[\p{Lu}0-9])/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function paragraphs(script: string): string[] {
  return spoken(script)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const countWords = (s: string) => s.split(/\s+/).filter(Boolean).length;

// ── numbers: a phrase counts once ("eight hundred twenty-eight" is one number) ────────────────────────────────
type NumKey = number | string;

const EN_UNITS: Record<string, number> = Object.fromEntries(
  "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen"
    .split(" ")
    .map((w, i) => [w, i]),
);
const EN_TENS: Record<string, number> = Object.fromEntries(
  "_ _ twenty thirty forty fifty sixty seventy eighty ninety"
    .split(" ")
    .map((w, i) => [w, 10 * i] as const)
    .filter(([, v]) => v > 10),
);
const EN_ORD: Record<string, number> = {
  ...Object.fromEntries(
    "third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth thirteenth fourteenth fifteenth sixteenth seventeenth eighteenth nineteenth"
      .split(" ")
      .map((w, i) => [w, i + 3]),
  ),
  twentieth: 20,
  thirtieth: 30,
};
const EN_SCALE: Record<string, number> = {
  hundred: 100,
  thousand: 1000,
  million: 1e6,
  billion: 1e9,
  dozen: 12,
};
const EN_WORDS = new Set([
  ...Object.keys(EN_UNITS),
  ...Object.keys(EN_TENS),
  ...Object.keys(EN_ORD),
  ...Object.keys(EN_SCALE),
  "point",
  "and",
]);

/** '1,200' -> 1200, '1.4' -> 1.4, '1.200.000' -> 1200000, '1,4' -> 1.4 (decimal comma). */
function digitValue(d: string): number | null {
  d = d.replace(/[\u00a0\u202f]/g, "");
  if (/^\d{1,3}([,.]\d{3})+$/.test(d)) return Number(d.replace(/[,.]/g, ""));
  return /^\d+([.,]\d+)?$/.test(d) ? Number(d.replace(",", ".")) : null;
}

/** The value of an English number phrase ('nineteen seventy-nine' -> 1979, 'one point four million' -> 1400000). */
function enRunValue(run: string[]): number {
  let total = 0;
  let cur = 0;
  let dec = "";
  let inDec = false;
  const decimals = () => (dec ? Number("0." + dec) : 0);
  for (const w of run) {
    const dv = /^\d/.test(w) ? digitValue(w) : null;
    if (w === "point") {
      inDec = true;
    } else if (inDec && w in EN_UNITS && EN_UNITS[w]! < 10) {
      dec += String(EN_UNITS[w]);
    } else if (w in EN_SCALE) {
      const base = (cur || 1) + decimals();
      dec = "";
      inDec = false;
      if (EN_SCALE[w] === 100) cur = base * 100;
      else {
        total += base * EN_SCALE[w]!;
        cur = 0;
      }
    } else {
      const v = dv ?? EN_UNITS[w] ?? EN_TENS[w] ?? EN_ORD[w];
      if (v === undefined || v === null) continue;
      if (cur && v >= 10 && cur % 100 >= 10 && cur < 100)
        cur = cur * 100 + v; // year form: nineteen | seventy
      else cur += v;
    }
  }
  return total + cur + decimals();
}

/** Every number phrase as [key, before]: key = its value (English words, digits) or the folded phrase; before =
 * the two folded words in front of it (where a hedge such as 'around' sits). */
function numberRuns(text: string): [NumKey, string][] {
  const t = spoken(text).replace(/(?<=\d)[\u00a0\u202f](?=\d{3})/g, "");
  const toks =
    fold(t)
      .replace(/-/g, " ")
      .match(/\d(?:[\d,.\u00a0\u202f]*\d)?|\p{L}+|[^\p{L}\p{N}_\s]/gu) || [];
  const out: [NumKey, string][] = [];
  const run: string[] = [];
  let start = 0;
  const isAlnum = (s: string) => /^[\p{L}\p{N}]/u.test(s);
  const flush = () => {
    const core = run.filter((w) => w !== "and" && w !== "point" && w !== "one");
    if (run.length && (core.length || run.some((x) => /^\d/.test(x)))) {
      while (run.length && (run[run.length - 1] === "and" || run[run.length - 1] === "point"))
        run.pop();
      const before = toks
        .slice(Math.max(0, start - 2), start)
        .filter(isAlnum)
        .join(" ");
      if (run.every((x) => /^\d/.test(x) || EN_WORDS.has(x))) {
        out.push([Math.round(enRunValue(run) * 1000) / 1000, before]);
      } else {
        out.push([run.join(" "), before]);
      }
    }
    run.length = 0;
  };
  toks.forEach((tok, i) => {
    if (!isAlnum(tok)) {
      flush();
    } else if (/^\d/.test(tok) || EN_WORDS.has(tok) || NUM_WORD_FULL.test(tok)) {
      if (/^\d/.test(tok) && run.length && /^\d/.test(run[run.length - 1]!)) flush(); // "1942 3" are two numbers
      if (tok === "and" && !run.length) return;
      if (!run.length) start = i;
      run.push(tok);
    } else {
      flush();
    }
  });
  flush();
  return out;
}

function numberValues(text: string): [Set<number>, Set<string>] {
  const runs = numberRuns(text);
  return [
    new Set(runs.map(([k]) => k).filter((k): k is number => typeof k === "number")),
    new Set(runs.map(([k]) => k).filter((k): k is string => typeof k === "string")),
  ];
}

// ── lint ──────────────────────────────────────────────────────────────────────────────────────────────────────
export interface Lint {
  words: number;
  sentences: number;
  mean_len: number;
  median_len: number;
  max_len: number;
  share_le10: number;
  numbers: number;
  numbers_per_100: number;
  labels: string[];
  questions: string[];
  exclamations: number;
  turn_share: number;
  but_adjacent: number;
  short_runs: string[];
  gap_lines: string[];
  little_did: number;
  blocklist: string[];
  devices: string[];
  pause_markers: number;
  present_share: number | null;
  markers: string[];
  risk_lines: string[];
}

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

/** What a script can count on a finished narration. Free, deterministic (present-tense share: English only). */
export function lint(script: string): Lint {
  const sp = spoken(script);
  const sents = sentences(sp);
  const lens = sents.length ? sents.map(countWords) : [0];
  const words = lens.reduce((a, b) => a + b, 0);
  const folded = fold(sp);
  const nums = numberRuns(sp).filter(([k]) => !isYear(k)).length;
  const labels = [...sp.matchAll(LABEL_RE)]
    .map((m) => m[1]!)
    .filter((x) => !NAME_LABEL_OK.test(x.trim()));
  const shortRuns: string[] = [];
  let run = 0;
  sents.forEach((s, i) => {
    run = lens[i]! <= 5 ? run + 1 : 0;
    if (run === 3) shortRuns.push(s);
  });
  const buts = sents.map((s) => /^(but|ale|aber|ale przecież)\b/i.test(s));
  const pres = (sp.match(EN_PRESENT) || []).length;
  const past = (sp.match(EN_PAST) || []).length;
  const english = (sp.match(/\b(the|and|of|to)\b/gi) || []).length > words * 0.05;
  const sorted = [...lens].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  const ends = (s: string, ch: string) => s.replace(/["'”“)]+$/, "").endsWith(ch);
  return {
    words,
    sentences: sents.length,
    mean_len: round(words / lens.length, 1),
    median_len: median,
    max_len: Math.max(...lens),
    share_le10: round(lens.filter((n) => n <= 10).length / Math.max(1, sents.length), 2),
    numbers: nums,
    numbers_per_100: round((nums * 100) / Math.max(1, words), 1),
    labels,
    questions: sents.filter((s) => ends(s, "?")),
    exclamations: sents.filter((s) => ends(s, "!")).length,
    turn_share: round(
      sents.filter((s) => TURN_OPENERS.test(s)).length / Math.max(1, sents.length),
      2,
    ),
    but_adjacent: buts.slice(1).filter((b, i) => b && buts[i]).length,
    short_runs: shortRuns,
    gap_lines: sents.filter((s) => GAP_RE.test(s)),
    little_did: (sp.match(new RegExp(LITTLE_DID_SRC, "giu")) || []).length,
    blocklist: [
      ...new Set(
        BLOCKLIST.filter((w) =>
          new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRe(fold(w))}(?![\\p{L}\\p{N}_])`, "u").test(
            folded,
          ),
        ),
      ),
    ].sort(),
    devices: [...sp.matchAll(DEVICE_RE)].map((m) => m[0]),
    pause_markers: ((script || "").match(PAUSE_RE) || []).length,
    present_share: english && pres + past >= 5 ? round(pres / Math.max(1, pres + past), 2) : null,
    markers: (script || "")
      .split(/\r?\n/)
      .filter((ln) => MARKER_RE.test(ln))
      .map((ln) => ln.trim()),
    risk_lines: sents.filter((s) => RISK_RE.test(s) || GAP_RE.test(s)),
  };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The lint checks a script fails, as [check id, short reason]. The guard compares these lists. */
export function lintFailures(m: Lint): [string, string][] {
  const out: [string, string][] = [];
  if (m.numbers_per_100 > 5) out.push(["D10", `${m.numbers_per_100} numbers per 100 words (≤ 5)`]);
  if (m.labels.length)
    out.push([
      "D10",
      "label notes: " +
        m.labels
          .slice(0, 4)
          .map((x) => `"${x}:"`)
          .join(", "),
    ]);
  if (m.questions.length)
    out.push(["D4", `${m.questions.length} question(s): "${m.questions[0]!.slice(0, 60)}"`]);
  if (m.exclamations) out.push(["D12", `${m.exclamations} exclamation mark(s)`]);
  if (m.turn_share < 0.1)
    out.push([
      "D5",
      `${Math.floor(m.turn_share * 100)} % of sentences open with a turn or time word (≥ 10 %)`,
    ]);
  if (m.but_adjacent) out.push(["D5", `"But" twice in a row ${m.but_adjacent}×`]);
  if (m.short_runs.length)
    out.push(["D12", `three short lines in a row at "${m.short_runs[0]!.slice(0, 40)}"`]);
  if (m.little_did || m.blocklist.length || m.devices.length)
    out.push([
      "D13",
      "blocklist: " +
        [...m.blocklist, ...m.devices, ...(m.little_did ? ["little did…"] : [])].join(", "),
    ]);
  if (!(m.mean_len >= 8.5 && m.mean_len <= 13.5))
    out.push(["D12", `mean sentence ${m.mean_len} words (9.5–12.5)`]);
  if (m.max_len > 30) out.push(["D12", `a sentence of ${m.max_len} words (≤ 30)`]);
  if (m.present_share !== null && m.present_share < 0.6)
    out.push([
      "D12",
      `present tense ~${Math.floor(m.present_share * 100)} % of auxiliaries (≥ 80 % in the story)`,
    ]);
  if (m.pause_markers)
    out.push(["D15", `${m.pause_markers} pause/hold marker(s) the voice would read`]);
  return out;
}

/** The doctor's length band in spoken words: ±10 % for a film of 3 minutes or less, ±12 % beyond. */
export function band(minutes: number, targetWords: number): [number, number] {
  const tol = minutes <= 3 ? 0.1 : 0.12;
  return [Math.floor(targetWords * (1 - tol)), Math.floor(targetWords * (1 + tol))];
}

/** band(), with its floor raised to 97 % of the draft (of the target, when the draft is longer): the doctor
 * tightens, it never takes back the minutes the script was written to fill. */
export function keepBand(minutes: number, targetWords: number, draftWords = 0): [number, number] {
  const [lo, hi] = band(minutes, targetWords);
  if (!draftWords) return [lo, hi];
  const floor = Math.floor(Math.min(draftWords, targetWords) * 0.97);
  return [Math.max(lo, Math.min(floor, hi - 1)), hi];
}

export function lintReport(m: Lint, lo = 0, hi = 0): string {
  const lines = [
    `spoken words: ${m.words}` + (hi ? ` (band ${lo}–${hi})` : ""),
    `sentences: ${m.sentences}, mean ${m.mean_len} words, median ${m.median_len}, ` +
      `${Math.floor(m.share_le10 * 100)} % of 10 words or fewer, longest ${m.max_len}`,
    `numbers per 100 words: ${m.numbers_per_100} (target ≤ 5)`,
    `sentences opening with a turn or time word: ${Math.floor(m.turn_share * 100)} % (target ≥ 10 %)`,
    `knowledge-gap lines: ${m.gap_lines.length} (only where the texts record who knew what)`,
  ];
  if (m.present_share !== null)
    lines.push(
      `present-tense share of auxiliaries: ${Math.floor(m.present_share * 100)} % (target ≥ 80 % in the story)`,
    );
  const fails = lintFailures(m);
  lines.push(
    ...(fails.length ? fails.map(([cid, why]) => `FAILS ${cid}: ${why}`) : ["no lint failures"]),
  );
  lines.push(
    ...m.risk_lines
      .slice(0, 8)
      .map((x) => `RISK (cut or hedge unless the texts hold it): "${x.slice(0, 140)}"`),
  );
  return lines.map((x) => "- " + x).join("\n");
}

// ── guard helpers ─────────────────────────────────────────────────────────────────────────────────────────────
const HEDGE_RE = new RegExp(
  "(?:^|\\s)(around|roughly|about|nearly|almost|approximately|some|over|more than|at least|up to|" +
    "an estimated|close to|under|fewer than|less than|kolem|asi|zhruba|priblizne|temer|skoro|" +
    "vice nez|pres|okolo|prawie|ponad|blisko|etwa|rund|fast|knapp|uber|mehr als)$",
);

/** A number for a human or a model to read: 20000000000 -> '20,000,000,000', a year as a year. */
function fmt(k: NumKey): string {
  if (typeof k === "string") return k;
  if (Number.isInteger(k)) return k >= 1000 && k <= 2100 ? String(k) : k.toLocaleString("en-US");
  return String(k);
}

/** Numbers the draft hedged ('roughly twenty billion') that the rewrite states flat. */
function hedgedDropped(draft: string, next: string): string[] {
  const hedged = new Set(
    numberRuns(draft)
      .filter(([, b]) => HEDGE_RE.test(b))
      .map(([k]) => k),
  );
  const flat = new Set(
    numberRuns(next)
      .filter(([, b]) => !HEDGE_RE.test(b))
      .map(([k]) => k),
  );
  const still = new Set(
    numberRuns(next)
      .filter(([, b]) => HEDGE_RE.test(b))
      .map(([k]) => k),
  );
  return [...hedged]
    .filter((k) => flat.has(k) && !still.has(k))
    .map(fmt)
    .sort();
}

const REL_TIME_SRC =
  "\\b(?:that|the) same (?:year|month|week|day|night|morning|evening|spring|summer|autumn|winter)\\b|" +
  "\\b(?:a|one|two|three|four|five|six|seven|eight|nine|ten|\\d+) (?:days?|weeks?|months?|years?|decades?) " +
  "(?:later|earlier|before|after)\\b|\\bthe (?:next|following) (?:day|morning|week|month|year)\\b|" +
  "\\bthe (?:day|week|year) (?:before|after)\\b|\\b(?:tehoz|stejneho) (?:roku|dne|mesice)\\b|" +
  "\\bo (?:rok|den|tyden|mesic) (?:pozdeji|drive)\\b|\\bw tym samym roku\\b|\\bim selben jahr\\b";

/** Relative times the rewrite wrote that neither the draft nor the plan holds ('that same year' for a date). */
function relativeTimesAdded(draft: string, next: string, refs = ""): string[] {
  const all = (t: string) =>
    [...fold(spoken(t)).matchAll(new RegExp(REL_TIME_SRC, "gi"))].map((m) => m[0]);
  const known = new Set(all((draft || "") + "\n" + (refs || "")));
  return [...new Set(all(next))].filter((x) => !known.has(x)).sort();
}

const CONTENT_STOP = new Set(
  `about above across after again against almost along already also although always among another anyone anything
around away back became because become becomes been before began begin begins behind being below beside besides
between beyond both brings brought came cannot comes could does doing done down during each either else enough even
ever every everyone everything except from further gets give given gives goes going gone have having here hers
herself himself into itself just keep keeps kept know knows knew known last later least less like made make makes
many might more most much must near never next none nothing once only onto other others ours over own past perhaps
quite rather really said same says seem seems shall should since some someone something soon still such take takes
taken than that their theirs them themselves then there these they thing things this those though through thus till
together took toward towards under until upon very want wants were what whatever when where whether which while who
whom whose will with within without would year years yet your first second third fourth fifth time times week weeks
month months today tonight whole ones`.split(/\s+/),
);
const EN_NUM_SET = new Set(EN_NUM);
const WORD_TOKEN = /\p{L}[\p{L}\p{N}_'’-]*/gu;
const stripQuotes = (w: string) => w.replace(/^['’-]+|['’-]+$/g, "");

function contentWords(s: string): string[] {
  return (s.match(WORD_TOKEN) || [])
    .map((t) => stripQuotes(fold(t)))
    .filter((w) => w.length >= 4 && !CONTENT_STOP.has(w) && !EN_NUM_SET.has(w));
}

function wordPool(text: string): Set<string> {
  return new Set((spoken(text || "").match(WORD_TOKEN) || []).map((t) => stripQuotes(fold(t))));
}

/** Known when a pool word shares its first five letters (door ~ doors, build ~ building). */
function wordKnown(w: string, pool: Set<string>): boolean {
  if (pool.has(w)) return true;
  const p = w.slice(0, Math.max(4, Math.min(5, w.length - 1)));
  for (const r of pool) if (r.length >= 4 && r.startsWith(p)) return true;
  return false;
}

/** Sentences at least half of whose content words (and at least two) no pool text holds — the shape of invented
 * texture ("Boxes by the door.", "A man in white steps forward."). */
function unsupportedSentences(
  text: string,
  pool: Set<string>,
  minNew = 2,
  share = 0.5,
): [string, string[]][] {
  const out: [string, string[]][] = [];
  for (const s of sentences(text)) {
    const c = contentWords(s);
    const fresh = c.filter((w) => !wordKnown(w, pool));
    if (fresh.length >= minNew && fresh.length >= share * Math.max(1, c.length))
      out.push([s, fresh]);
  }
  return out;
}

const TEXTURE_SRC =
  "\\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|rain(?:s|ing|y)?|snow(?:s|ing)?|" +
  "fog(?:gy)?|drizzle|storm(?:y)?|thunder|overcast|sunset|sunrise|dusk|dawn|moonlight|" +
  "pondělí|úterý|středa|čtvrtek|pátek|sobota|neděle|déšť|prší|sníh|mlha|soumrak|svítání)\\b";

/** Weekdays and weather in `text` that the reference texts never mention — the commonest invented texture. */
function textureWordsUnsourced(text: string, refs = ""): string[] {
  const all = (t: string) =>
    [...spoken(t || "").matchAll(new RegExp(TEXTURE_SRC, "gi"))].map((m) => fold(m[0]));
  const known = new Set(all(refs));
  return [...new Set(all(text))].filter((x) => !known.has(x)).sort();
}

/** RISK or knowledge-gap phrases in the rewrite that the draft does not contain. */
function riskAdded(draft: string, next: string): [string, string][] {
  const d = fold(spoken(draft));
  const out: [string, string][] = [];
  for (const s of sentences(next)) {
    for (const re of [
      new RegExp(RISK_SRC, "gi"),
      new RegExp(GAP_SRC, "gi"),
      new RegExp(LITTLE_DID_SRC, "giu"),
    ]) {
      for (const m of s.matchAll(re)) if (!d.includes(fold(m[0]))) out.push([s, m[0]]);
    }
  }
  return out;
}

/** [values, phrases, names]: names = capitalised words that are not the first word of a sentence. */
function facts(text: string): [Set<number>, Set<string>, Set<string>] {
  const [values, phrases] = numberValues(text);
  const names = new Set<string>();
  for (const s of sentences(spoken(text))) {
    for (const tok of (s.match(/[\p{L}\p{N}_'’-]+/gu) || []).slice(1)) {
      const isCap = /^\p{Lu}/u.test(tok) && tok.length > 1;
      const isAcr = tok === tok.toUpperCase() && /^\p{L}+$/u.test(tok) && tok.length >= 2;
      if (isCap || isAcr) names.add(fold(stripQuotes(tok)));
    }
  }
  return [values, phrases, names];
}

/** A name counts as known when a pool word shares its stem (inflection: Praha ~ Praze). */
function known(tok: string, pool: Set<string>): boolean {
  if (pool.has(tok)) return true;
  for (const r of pool) {
    const k = Math.max(3, Math.min(tok.length, r.length) - 2);
    if (tok.length >= k && r.length >= k && tok.slice(0, k) === r.slice(0, k)) return true;
  }
  return false;
}

export interface GuardResult {
  ok: boolean;
  reasons: string[];
  words: [number, number];
  lintFailures: [number, number];
  addedNumbers: string[];
  addedNames: string[];
}

/** Is the doctored script safe to keep? It must add no number and no name absent from the draft + plan + sources,
 * keep every marker line, land inside the length band (or closer to it than the draft), and fail FEWER lint
 * checks than the draft, with no hedge dropped, no relative time, risky line or invented texture added. */
export function guard(
  draft: string,
  next: string,
  refs = "",
  lo = 0,
  hi = 0,
  nameSlack = 0,
): GuardResult {
  const reasons: string[] = [];
  refs = (refs || "")
    .replace(/^[\s*#>_-]*beat\s+\d+\s*/gim, "") // "Beat 3." is not a fact
    .replace(/\(\s*\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2}\s*\)/g, ""); // nor "(2:00–3:00)"
  const poolText = (draft || "") + "\n" + refs;
  const [vOld, pOld, namesOld] = facts(poolText);
  const poolWords = new Set((spoken(poolText).match(/[\p{L}\p{N}_'’-]+/gu) || []).map(fold));
  const [vNew, pNew, namesNew] = facts(next);
  const addedNums = [
    ...[...vNew].filter((v) => !vOld.has(v)).map(fmt),
    ...[...pNew].filter((p) => !pOld.has(p) && !known(p, pOld)),
  ].sort();
  const pool = new Set([...namesOld, ...poolWords]);
  const addedNames = [...namesNew].filter((x) => !known(x, pool)).sort();
  if (addedNums.length) reasons.push("added numbers: " + addedNums.slice(0, 8).join(", "));
  if (addedNames.length > nameSlack)
    reasons.push("added names: " + addedNames.slice(0, 8).join(", "));
  const unhedged = hedgedDropped(draft, next);
  if (unhedged.length)
    reasons.push(
      "a hedge was dropped (the draft said 'around'/'roughly'): " + unhedged.slice(0, 6).join(", "),
    );
  const rel = relativeTimesAdded(draft, next, refs);
  if (rel.length)
    reasons.push(
      "a relative time no text gives (keep the date): " +
        rel
          .slice(0, 6)
          .map((x) => `"${x}"`)
          .join(", "),
    );
  const risky = riskAdded(draft, next);
  if (risky.length)
    reasons.push(
      "added a risky line the draft did not have (a superlative or absolute, words pinned on an " +
        "outlet or official, a thought or knowledge put in a head, a 'still today' claim) — take it out: " +
        risky
          .slice(0, 4)
          .map(([s, p]) => `"${p}" in "${s.slice(0, 90)}"`)
          .join("; "),
    );
  const texture = unsupportedSentences(next, new Set([...wordPool(draft), ...wordPool(refs)]));
  const texWords = textureWordsUnsourced(next, (draft || "") + "\n" + refs);
  if (texWords.length)
    reasons.push(
      "added a weekday or the weather that no text gives — take it out: " +
        texWords.slice(0, 6).join(", "),
    );
  if (texture.length)
    reasons.push(
      "added a sentence whose words no text holds (an invented detail) — take it out: " +
        texture
          .slice(0, 4)
          .map(([s, n]) => `"${s.slice(0, 90)}" (new: ${n.slice(0, 4).join(", ")})`)
          .join("; "),
    );
  const mOld = lint(draft);
  const mNew = lint(next);
  if (mNew.markers.join("\n") !== mOld.markers.join("\n"))
    reasons.push(`marker lines changed (${mOld.markers.length} -> ${mNew.markers.length})`);
  const wOld = mOld.words;
  const wNew = mNew.words;
  if (hi && !(lo <= wNew && wNew <= hi)) {
    const midBand = (lo + hi) / 2;
    if ((lo <= wOld && wOld <= hi) || Math.abs(wNew - midBand) >= Math.abs(wOld - midBand))
      reasons.push(`${wNew} spoken words, outside the band ${lo}–${hi} (draft ${wOld})`);
  }
  const fOld = lintFailures(mOld);
  const fNew = lintFailures(mNew);
  if (fNew.length > fOld.length || (fOld.length && fNew.length >= fOld.length))
    reasons.push(
      `lint failures ${fOld.length} -> ${fNew.length} (must fall): ` +
        fNew
          .slice(0, 5)
          .map(([, w]) => w)
          .join("; "),
    );
  for (const key of ["questions", "labels", "blocklist", "devices"] as const) {
    if (mNew[key].length > mOld[key].length) reasons.push(`more ${key} than the draft`);
  }
  if (mNew.little_did > mOld.little_did || mNew.pause_markers > mOld.pause_markers)
    reasons.push("a banned phrase or a pause marker was added");
  if (mNew.numbers_per_100 > Math.max(5, mOld.numbers_per_100 + 0.5))
    reasons.push(`numbers per 100 words rose to ${mNew.numbers_per_100}`);
  return {
    ok: !reasons.length,
    reasons,
    words: [wOld, wNew],
    lintFailures: [fOld.length, fNew.length],
    addedNumbers: addedNums,
    addedNames,
  };
}

// ── the doctor's prompt ───────────────────────────────────────────────────────────────────────────────────────
const HEDGE_SPAN_RE = new RegExp(
  "\\b(around|roughly|about|nearly|almost|approximately|more than|at least|up to|an estimated|close to|" +
    "fewer than|less than|some|over|kolem|asi|zhruba|přibližně|téměř|skoro|více než|přes|okolo|około|prawie|" +
    "ponad|blisko|etwa|rund|fast|knapp|über|mehr als)\\s+([^.,;:!?\\n]{1,60}?)(?=[.,;:!?\\n]|$)",
  "gi",
);

/** The draft's hedged figures as written ('around one point four million dollars'), for the doctor to keep. */
function hedgedPhrases(script: string): string[] {
  const out: string[] = [];
  for (const m of spoken(script).matchAll(HEDGE_SPAN_RE)) {
    const rest = m[2]!.split(/\s+/).filter(Boolean);
    const numlike = (w: string) =>
      /^\d/.test(w) || EN_WORDS.has(fold(w).replace(/^-+|-+$/g, "")) || NUM_WORD_FULL.test(fold(w));
    if (rest.slice(0, 2).some(numlike)) out.push([m[1], ...rest.slice(0, 6)].join(" "));
  }
  return [...new Set(out)];
}

const CALENDAR = new Set(
  "monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december".split(
    " ",
  ),
);
const PICTURE_NOTE_RE =
  /\b(?:the picture|picture holds|camera|on screen|on-screen|we see|shot of|the frame|holds on|close-up|close on|cut to|b-roll)\b/i;

/** Draft sentences for the doctor's truth sweep: those whose words neither the plan nor the sources hold, and those
 * built from the plan's picture notes (a guess for the editor, never a source). */
function honestyLines(script: string, outline = "", sources = ""): string[] {
  const out: string[] = [];
  const refsPool = wordPool((outline || "") + "\n" + (sources || ""));
  for (const [s] of unsupportedSentences(script, refsPool)) {
    out.push(
      `NOT IN THE PLAN OR SOURCES: "${s.slice(0, 140)}" — cut it if it is description; keep it only if it is ` +
        `a checkable fact (a name, date, number or event) the fact-checker will verify`,
    );
  }
  const oSents = sentences(outline || "");
  const pic = oSents.filter((x) => PICTURE_NOTE_RE.test(x));
  const plainRefs =
    oSents.filter((x) => !PICTURE_NOTE_RE.test(x)).join("\n") + "\n" + (sources || "");
  for (const w of textureWordsUnsourced(script, plainRefs)) {
    out.push(
      `"${w}" — a weekday or the weather that no source gives (a plan picture note is not a source): cut it`,
    );
  }
  if (pic.length) {
    const restPool = wordPool(plainRefs);
    const picOnly = new Set(
      pic.flatMap((x) => contentWords(x)).filter((w) => !wordKnown(w, restPool)),
    );
    for (const s of sentences(script)) {
      const c = contentWords(s);
      const hit = c.filter((w) => picOnly.has(w));
      const names = (s.match(/[\p{L}\p{N}_'’-]+/gu) || [])
        .slice(1)
        .filter((t) => /^\p{Lu}/u.test(t) && !CALENDAR.has(fold(t)));
      if (
        hit.length >= 2 &&
        hit.length >= 0.6 * c.length &&
        names.length <= 1 &&
        !DIGIT_RE.test(s) &&
        !NUM_WORD_RE.test(fold(s))
      ) {
        out.push(
          `FROM A PICTURE NOTE OF THE PLAN, NOT A SOURCE: "${s.slice(0, 140)}" (${hit.slice(0, 4).join(", ")}) — ` +
            `cut the description, keep only what a real photo, film or document shows`,
        );
      }
    }
  }
  return [...new Set(out)].slice(0, 10);
}

/** DOC_DOCTOR filled in. */
export function doctorPrompt(opts: {
  title: string;
  minutes: number;
  script: string;
  outline?: string;
  sources?: string;
  lo: number;
  hi: number;
}): string {
  const { title, minutes, script, outline = "", sources = "", lo, hi } = opts;
  const length = `${minutes} minute` + (minutes === 1 ? "" : "s");
  const lintBlock =
    lintReport(lint(script), lo, hi) +
    hedgedPhrases(script)
      .map((h) => `\n- hedged figure, keep the hedge in every version: "${h}"`)
      .join("") +
    honestyLines(script, outline, sources)
      .map((x) => `\n- ${x}`)
      .join("");
  return DOC_DOCTOR.replace("[INSERT TITLE HERE]", title || "")
    .replace("[INSERT TARGET LENGTH]", length)
    .replace("[INSERT WORD BAND HERE]", `${lo}–${hi}`)
    .replace("[INSERT CHECKLIST HERE]", DOCTOR_CHECKLIST)
    .replace("[INSERT LINT HERE]", lintBlock)
    .replace("[INSERT OUTLINE HERE]", (outline || "(none)").slice(0, 12000))
    .replace("[INSERT SOURCES HERE]", (sources || "(none)").slice(0, 20000))
    .replace("[INSERT SCRIPT HERE]", script);
}

/** The one retry after the guard rejects a rewrite: the machine's reasons, fix exactly those. */
export function retryPrompt(
  firstPrompt: string,
  rejectedScript: string,
  reasons: string[],
): string {
  return (
    firstPrompt +
    "\n\nYOUR FIRST REWRITE (below) WAS REJECTED BY THE MACHINE CHECK FOR:\n" +
    reasons.map((r) => `- ${r}`).join("\n") +
    "\nFix exactly these points in it — put back the dates, hedges, names and numbers the texts give, remove " +
    "what they do not — and change nothing else. Answer in the same shape (SCORES of the DRAFT, PLAN, " +
    "SCRIPT, AFTER, END).\n\nYOUR REJECTED REWRITE:\n" +
    (rejectedScript || "")
  );
}

export interface DoctorAnswer {
  scores: Record<string, number>;
  notes: Record<string, string>;
  na: string[];
  total: number | null;
  after: Record<string, number>;
  afterTotal: number | null;
  plan: string;
  script: string | null;
}

/** The doctor's answer, read tolerantly (a model may drop a delimiter or wrap the script in a fence). */
export function parseDoctor(text: string): DoctorAnswer {
  const t = (text || "").replace(/\r\n/g, "\n");
  const parts: Record<string, string> = {};
  const marks = [...t.matchAll(/^\s*={2,}\s*(SCORES|PLAN|SCRIPT|AFTER|END)\s*={2,}\s*$/gim)];
  marks.forEach((mk, i) => {
    const end = i + 1 < marks.length ? marks[i + 1]!.index! : t.length;
    const key = mk[1]!.toUpperCase();
    if (!(key in parts)) parts[key] = t.slice(mk.index! + mk[0].length, end).trim();
  });
  const scores: Record<string, number> = {};
  const notes: Record<string, string> = {};
  const na: string[] = [];
  for (const ln of (parts["SCORES"] || "").split("\n")) {
    const mm = ln.match(/^\s*\**\s*(D\d{1,2})\b\**\s*[:\-–]?\s*([0-2]|n\/?a)\b\s*\|?\s*(.*)$/i);
    if (!mm) continue;
    const cid = mm[1]!.toUpperCase();
    const val = mm[2]!.toLowerCase();
    scores[cid] = val.startsWith("n") ? 2 : Number(val); // n/a = the facts are missing: left alone
    if (val.startsWith("n")) na.push(cid);
    if (mm[3]!.trim()) notes[cid] = mm[3]!.trim();
  }
  let script = parts["SCRIPT"] || null;
  if (script)
    script = script
      .trim()
      .replace(/^```[\w-]*\n|\n```$/g, "")
      .trim();
  const after: Record<string, number> = {};
  for (const m of (parts["AFTER"] || "").matchAll(/\b(D\d{1,2})\s*[:=]?\s*([0-2]|n\/?a)\b/gi)) {
    after[m[1]!.toUpperCase()] = m[2]!.toLowerCase().startsWith("n") ? 2 : Number(m[2]);
  }
  const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
  return {
    scores,
    notes,
    na,
    total: Object.keys(scores).length >= 10 ? sum(scores) : null,
    after,
    afterTotal: Object.keys(after).length >= 10 ? sum(after) : null,
    plan: parts["PLAN"] || "",
    script: script || null,
  };
}

const SIGNOFF_RE =
  /subscribe|thanks for watching|see you|next time|in the comments|watch next|odebírej|odběr|subskryb|abonnier/i;

/** The draft's short sign-off paragraph, if the rewrite lost it. */
export function restoreSignoff(draft: string, next: string): string {
  const paras = (draft || "")
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const last = paras[paras.length - 1];
  if (
    last &&
    countWords(last) <= 30 &&
    SIGNOFF_RE.test(last) &&
    !fold(next).includes(fold(last).slice(0, 40))
  ) {
    return next.trimEnd() + "\n\n" + last;
  }
  return next;
}

/** The retry names the length gap in words. */
export function lengthHint(words: [number, number], lo: number, hi: number): string {
  const wNew = words[1];
  if (lo <= wNew && wNew <= hi) return "";
  if (wNew < lo) {
    const need = lo - wNew + Math.max(20, Math.floor((hi - lo) / 4));
    return (
      `\nLENGTH: your rewrite has ${wNew} spoken words; the band is ${lo}–${hi}. Put back about ${need} words: ` +
      `restore the draft's own sentences and details you cut (the scenes, the named people, the dated ` +
      `steps) — from the draft only, never a new fact. Count before you answer.`
    );
  }
  const need = wNew - hi + Math.max(20, Math.floor((hi - lo) / 4));
  return (
    `\nLENGTH: your rewrite has ${wNew} spoken words; the band is ${lo}–${hi}. Cut about ${need} words: ` +
    `summary lines and repeats first, never a fact the story needs. Count before you answer.`
  );
}

export function wordCount(script: string): number {
  return countWords(spoken(script));
}
