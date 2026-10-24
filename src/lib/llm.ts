// Server-side writing model for the Frontier script pipeline. Claude (Anthropic API) when ANTHROPIC_API_KEY is
// set — the model Frontier itself writes with — else Gemini. API keys stay on the server.

import Anthropic from "@anthropic-ai/sdk";
import { generateGeminiText, getAvailableGeminiKeys } from "./gemini";

export type LlmProviderId = "claude" | "gemini";

export interface LlmRequest {
  prompt: string;
  system?: string;
  /** Let the model search the web (Claude web search / Gemini Google Search grounding). */
  webSearch?: boolean;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
}

export interface LlmResult {
  text: string;
  provider: LlmProviderId;
  model: string;
}

function anthropicKey(): string | undefined {
  const key = process.env["ANTHROPIC_API_KEY"]?.trim();
  return key && key.length > 5 ? key : undefined;
}

export function activeLlm(): { provider: LlmProviderId; model: string } | null {
  if (anthropicKey()) return { provider: "claude", model: claudeModel() };
  if (getAvailableGeminiKeys().length) return { provider: "gemini", model: "gemini-3.5-flash" };
  return null;
}

function claudeModel(): string {
  return process.env["ANTHROPIC_MODEL"]?.trim() || "claude-opus-5-5";
}

let client: Anthropic | null = null;

async function runClaude(req: LlmRequest): Promise<LlmResult> {
  client ??= new Anthropic({ apiKey: anthropicKey() });
  const model = claudeModel();
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: req.prompt }];
  const texts: string[] = [];

  // A web-search turn can pause (stop_reason "pause_turn"); hand the paused turn back to let it finish.
  for (let turn = 0; turn < 6; turn++) {
    const response = await client.beta.messages
      .stream({
        model,
        max_tokens: 64000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default", // a policy decline is re-run on Anthropic's recommended fallback model
        output_config: { effort: req.effort ?? "high" },
        ...(req.system ? { system: req.system } : {}),
        ...(req.webSearch
          ? { tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }] }
          : {}),
        messages,
      })
      .finalMessage();

    if (response.stop_reason === "refusal") {
      throw new Error(
        `Claude declined this request (${response.stop_details?.category ?? "no category"}).`,
      );
    }
    for (const block of response.content) {
      if (block.type === "text") texts.push(block.text);
    }
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }
    if (response.stop_reason === "max_tokens") {
      throw new Error("Claude's answer was cut off at the output limit.");
    }
    break;
  }
  return { text: texts.join(""), provider: "claude", model };
}

/** One model call. Throws with a readable message when no provider is configured or the call fails. */
export async function generateText(req: LlmRequest): Promise<LlmResult> {
  const active = activeLlm();
  if (!active) {
    throw new Error(
      "No writing model configured. Set ANTHROPIC_API_KEY (or GEMINI_API_KEY) on the server.",
    );
  }
  if (active.provider === "claude") return runClaude(req);
  const text = await generateGeminiText({
    prompt: req.prompt,
    ...(req.system ? { systemInstruction: req.system } : {}),
    search: Boolean(req.webSearch),
  });
  return { text, provider: "gemini", model: active.model };
}
