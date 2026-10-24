// Server-side Gemini service using the official @google/genai SDK.
// User-Agent is set to 'aistudio-build' for telemetry.
// Supports multi-key pools & automatic failover across primary & backup keys.

import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";

// Ensure local .env file is loaded into process.env if not already present
function loadEnvFallback() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5) return;
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [key, ...rest] = trimmed.split("=");
        if (key && rest.length) {
          const val = rest
            .join("=")
            .trim()
            .replace(/^["']|["']$/g, "");
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  } catch {
    // ignore
  }
}
loadEnvFallback();

/**
 * Collects all configured Gemini API keys (primary, backup, or comma-separated list).
 */
export function getAvailableGeminiKeys(): string[] {
  loadEnvFallback();
  const keys: string[] = [];

  if (process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY.trim());
  }
  if (process.env.GEMINI_API_KEY_BACKUP) {
    keys.push(process.env.GEMINI_API_KEY_BACKUP.trim());
  }
  if (process.env.GEMINI_API_KEYS) {
    const list = process.env.GEMINI_API_KEYS.split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 5);
    keys.push(...list);
  }

  // Deduplicate while preserving order
  return Array.from(new Set(keys.filter((k) => k.length > 5)));
}

let activeKeyIndex = 0;

export function getActiveKeyStatus() {
  const keys = getAvailableGeminiKeys();
  return {
    totalKeys: keys.length,
    activeKeyNumber: keys.length > 0 ? (activeKeyIndex % keys.length) + 1 : 0,
    hasBackup: keys.length > 1,
  };
}

/**
 * Executes a Gemini action with automatic failover to backup keys on quota exhaustion or error.
 */
async function executeWithFailover<T>(
  action: (client: GoogleGenAI, key: string, keyNumber: number) => Promise<T>,
): Promise<T> {
  const keys = getAvailableGeminiKeys();
  if (keys.length === 0) {
    throw new Error("No GEMINI_API_KEY found in server environment.");
  }

  let lastError: unknown;
  const startIndex = activeKeyIndex % keys.length;

  for (let i = 0; i < keys.length; i++) {
    const idx = (startIndex + i) % keys.length;
    const key = keys[idx]!;
    const client = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    try {
      const result = await action(client, key, idx + 1);
      activeKeyIndex = idx; // lock on working key
      return result;
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Gemini API call on key #${idx + 1} failed: ${msg}.`);
      if (keys.length > 1 && i < keys.length - 1) {
        console.warn(`Switching to backup Gemini API key (#${((idx + 1) % keys.length) + 1})…`);
      }
    }
  }

  throw lastError;
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  systemInstruction?: string;
  model?: "gemini-3.5-flash" | "gemini-3.1-flash-lite";
}

/**
 * Multi-turn Gemini chatbot with custom system instruction, model selection, and automatic failover.
 */
export async function runGeminiChat(opts: ChatOptions) {
  const model = opts.model || "gemini-3.5-flash";

  const contents = opts.messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  const systemInstruction =
    opts.systemInstruction ||
    "You are CreateFlow AI's Creative Director & YouTube Studio Assistant. You specialize in viral faceless YouTube production: title hooks, retention pacing, research outlines, B-roll suggestions, voiceover direction, and thumbnail compositions. Keep advice punchy, actionable, and structured.";

  try {
    return await executeWithFailover(async (ai, _, keyNum) => {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
        },
      });

      return {
        success: true,
        text: response.text || "No response received.",
        model,
        activeKey: `Key #${keyNum}`,
      };
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Gemini chat failover exhausted:", msg);
    return {
      success: false,
      text: `Error calling Gemini (${model}): ${msg}`,
      error: msg,
    };
  }
}

/**
 * One-shot text generation with automatic failover; `search` grounds the answer in Google Search.
 * Throws when no key works, so callers can report the real error.
 */
export async function generateGeminiText(opts: {
  prompt: string;
  systemInstruction?: string;
  search?: boolean;
}): Promise<string> {
  return executeWithFailover(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: opts.prompt,
      config: {
        ...(opts.systemInstruction ? { systemInstruction: opts.systemInstruction } : {}),
        ...(opts.search ? { tools: [{ googleSearch: {} }] } : {}),
      },
    });
    return response.text || "";
  });
}

/**
 * Research with Google Maps Grounding using gemini-3.5-flash with automatic failover.
 */
export async function runMapsResearch(prompt: string) {
  const model = "gemini-3.5-flash";

  try {
    return await executeWithFailover(async (ai, _, keyNum) => {
      const response = await ai.models.generateContent({
        model,
        contents: `Provide accurate location details, history, highlights, and visual filming recommendations for YouTube video creators about: ${prompt}`,
        config: {
          tools: [{ googleMaps: {} }],
          systemInstruction:
            "You are a location scout and research assistant for documentary and travel YouTube creators. Use Google Maps data to verify places, geographical context, and visitor highlights.",
        },
      });

      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

      return {
        success: true,
        text: response.text || "",
        groundingMetadata,
        model,
        activeKey: `Key #${keyNum}`,
      };
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Maps grounding failover exhausted:", msg);
    return {
      success: false,
      text: `Could not retrieve Google Maps data: ${msg}`,
      error: msg,
    };
  }
}

/**
 * Create or edit images with gemini-nano-banana-2.1 with automatic failover.
 */
export async function generateOrEditImage(opts: {
  prompt: string;
  referenceImageBase64?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
}) {
  const model = "gemini-nano-banana-2.1";

  try {
    return await executeWithFailover(async (ai) => {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> =
        [];

      if (opts.referenceImageBase64) {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: opts.referenceImageBase64.replace(/^data:image\/\w+;base64,/, ""),
          },
        });
      }

      parts.push({ text: opts.prompt });

      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: opts.aspectRatio || "16:9",
            imageSize: "1K",
          },
        },
      });

      let imageUrl: string | undefined;
      let descriptionText: string | undefined;

      const candidateParts = response.candidates?.[0]?.content?.parts || [];
      for (const part of candidateParts) {
        if (part.inlineData?.data) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          descriptionText = part.text;
        }
      }

      return {
        success: Boolean(imageUrl),
        imageUrl,
        text: descriptionText,
        model,
      };
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Nano Banana failover exhausted:", msg);
    return {
      success: false,
      error: msg,
      note: "Requires Gemini paid model tier or active API key.",
    };
  }
}

/**
 * Text-to-Video and Image-to-Video generation using Veo (veo-3.1-fast-generate-preview) with automatic failover.
 */
export async function startVeoVideoGeneration(opts: {
  prompt: string;
  referenceImageBase64?: string;
  aspectRatio?: "16:9" | "9:16";
}) {
  const model = "veo-3.1-fast-generate-preview";

  try {
    return await executeWithFailover(async (ai) => {
      const config = {
        numberOfVideos: 1,
        aspectRatio: opts.aspectRatio || "16:9",
      };

      let operation;
      if (opts.referenceImageBase64) {
        operation = await ai.models.generateVideos({
          model,
          prompt: opts.prompt,
          image: {
            imageBytes: opts.referenceImageBase64.replace(/^data:image\/\w+;base64,/, ""),
            mimeType: "image/png",
          },
          config,
        });
      } else {
        operation = await ai.models.generateVideos({
          model,
          prompt: opts.prompt,
          config,
        });
      }

      return {
        success: true,
        operationName: operation.name,
        model,
      };
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Veo video generation failover exhausted:", msg);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Poll status of a Veo video generation operation with automatic failover.
 */
export async function pollVeoOperation(operationName: string) {
  try {
    return await executeWithFailover(async (ai) => {
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      return {
        success: true,
        done: Boolean(updated.done),
        downloadUri: updated.response?.generatedVideos?.[0]?.video?.uri,
      };
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Flagship Gemini Text-to-Speech (gemini-3.8-flash-tts and gemini-3.8-flash-lite-tts) with automatic failover.
 */
export async function synthesizeGeminiTts(opts: {
  text: string;
  voiceName?: "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr";
  style?: string;
  model?: "gemini-3.8-flash-tts" | "gemini-3.8-flash-lite-tts";
}) {
  const model = opts.model || "gemini-3.8-flash-tts";
  const voiceName = opts.voiceName || "Kore";

  try {
    return await executeWithFailover(async (ai, _, keyNum) => {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: opts.text,
                speechMetadata: {
                  style: opts.style || "Warm, clear documentary voiceover narrator",
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return {
          success: true,
          audioUrl: `data:audio/wav;base64,${base64Audio}`,
          provider: `Gemini Flash TTS (${model}) [Key #${keyNum}]`,
          voice: voiceName,
        };
      }
      return { success: false, error: "No audio stream returned." };
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Gemini TTS failover exhausted:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Voice conversation turn using Gemini audio / Live API model gemini-3.8-live with automatic failover.
 */
export async function runGeminiVoiceTurn(userMessage: string) {
  try {
    return await executeWithFailover(async (ai, _, keyNum) => {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-live",
        contents: userMessage,
        config: {
          responseModalities: ["AUDIO"],
          systemInstruction:
            "You are the voice assistant for CreateFlow AI. Respond in a friendly, conversational manner suitable for podcast and YouTube video creators.",
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      const textPart = response.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;

      return {
        success: Boolean(base64Audio || textPart),
        audioUrl: base64Audio ? `data:audio/wav;base64,${base64Audio}` : undefined,
        text: textPart || "Voice response processed.",
        model: "gemini-3.8-live",
        activeKey: `Key #${keyNum}`,
      };
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Live API audio turn failover exhausted:", msg);
    return {
      success: false,
      error: msg,
    };
  }
}
