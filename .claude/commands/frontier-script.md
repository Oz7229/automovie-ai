---
description: Write a documentary script with Frontier's pipeline (outline → script → script doctor → fact-check)
argument-hint: "<video title>" [minutes] [path/to/sources.md]
---

Write a documentary YouTube script for CreateFlow AI with Frontier 6.1's pipeline. You are the writer: answer each
prompt yourself. `scripts/frontier.ts` fills Frontier's prompts and runs the deterministic checks — never edit its
output files to get around a check.

Arguments: $ARGUMENTS (the title, then optionally the length in minutes — default 8 — and a sources file).

Run every command from the repository root. Work files are in `.frontier/<slug>/`.

1. **Start.** `bun scripts/frontier.ts start --title "<title>" --minutes <minutes> [--sources <file>]`. Note the slug.
2. **Outline.** Read `outline.prompt.md` and follow it exactly. Write only the story plan to `outline.md`.
   Use only facts you are certain of. Search the web with WebSearch to confirm names, dates and numbers before
   you plan them.
3. **Script.** `bun scripts/frontier.ts script <slug>`, then answer `script.prompt.md`. Write only the narration
   (no headings, notes or preamble) to `draft.md`.
4. **Script doctor.** `bun scripts/frontier.ts doctor <slug>`, then answer `doctor.prompt.md` in exactly its
   `=== SCORES === … === END ===` shape and write the whole answer to `doctor.answer.md`.
   Then `bun scripts/frontier.ts guard <slug>`.
   - Exit code 2 means the guard rejected the rewrite: answer the new `doctor.prompt.md` (the retry), overwrite
     `doctor.answer.md`, and run `guard` once more. After a second rejection the draft stays; that is expected.
5. **Fact-check.** `bun scripts/frontier.ts factcheck <slug>`. For every `factcheck/part-N.prompt.md`, check each
   factual statement with WebSearch (and WebFetch for the pages you need), then write ONLY the JSON array the prompt
   asks for to `factcheck/part-N.answer.md` (`[]` when nothing is wrong). Never skip a part. If there are several
   parts, you may check them in parallel subagents, giving each one its part prompt.
6. **Save.** `bun scripts/frontier.ts apply <slug>`. It applies the fixes by exact replacement and saves
   `content/scripts/<slug>.md`, which the site's Scripts page lists.
7. **Report** in a few lines: the title and words, the doctor's draft score and whether the rewrite was kept (with
   the guard's reasons if not), the fact-check issues and any not applied, and the saved file path. Do not commit
   or push unless asked.
