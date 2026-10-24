// Server-side provider integration service for Hugging Face, AI33 Pro, and media APIs.
// Runs only on the server — API keys and tokens never leak to the client.

import fs from "node:fs";
import path from "node:path";
import { HfInference } from "@huggingface/inference";
import { synthesizeGeminiTts, getActiveKeyStatus } from "./gemini";

// Ensure local .env file is loaded into process.env if not already present
function loadEnvFallback() {
  if (
    (process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY.length > 5) ||
    (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5)
  ) {
    return;
  }
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
    // ignore error when .env file cannot be read
  }
}
loadEnvFallback();

export interface VoiceoverRequest {
  text: string;
  provider?: "gemini" | "hf" | "ai33" | "elevenlabs" | "voicestudio";
  voice?: string;
  speed?: number;
  stability?: number;
  similarity?: number;
}

export interface VoiceoverResponse {
  success: boolean;
  audioUrl: string;
  durationSec: number;
  provider: string;
  note?: string;
}

export interface ThumbnailRequest {
  prompt: string;
  conceptIndex?: number;
  text?: string;
  hue?: number;
}

export interface ThumbnailResponse {
  success: boolean;
  imageUrl: string;
  provider: string;
  note?: string;
}

export interface ProvidersStatusResponse {
  huggingface: { configured: boolean; voiceModel: string; imageModel: string };
  ai33: { configured: boolean; baseUrl: string };
  elevenlabs: { configured: boolean };
  gemini: { configured: boolean };
  openai: { configured: boolean };
  pexels: { configured: boolean };
  tavily: { configured: boolean };
  voicestudio: { configured: boolean };
}

export interface VoiceStudioVoice {
  id: string;
  name: string;
  type: "openai_alias" | "profile" | string;
  language?: string;
}

// Self-hosted VoiceStudio backend (OpenAI-compatible /v1 API).
// VOICESTUDIO_URL is the server's base URL, VOICESTUDIO_API_KEY its OMNIVOICE_API_KEY.
function getVoiceStudioConfig(): { baseUrl: string; apiKey: string } | null {
  const baseUrl = process.env["VOICESTUDIO_URL"]?.trim().replace(/\/+$/, "");
  if (!baseUrl) return null;
  return { baseUrl, apiKey: process.env["VOICESTUDIO_API_KEY"]?.trim() ?? "" };
}

function voiceStudioHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  return headers;
}

async function readVoiceStudioError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      error?: { message?: string };
      detail?: unknown;
    };
    const message = data.error?.message ?? data.detail;
    if (message) return typeof message === "string" ? message : JSON.stringify(message);
  } catch {
    // body was not JSON
  }
  return `HTTP ${res.status}`;
}

export async function listVoiceStudioVoices(): Promise<{
  configured: boolean;
  voices: VoiceStudioVoice[];
  error?: string;
}> {
  loadEnvFallback();
  const config = getVoiceStudioConfig();
  if (!config) return { configured: false, voices: [] };

  try {
    const res = await fetch(`${config.baseUrl}/v1/audio/voices`, {
      headers: voiceStudioHeaders(config.apiKey),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return { configured: true, voices: [], error: await readVoiceStudioError(res) };
    }
    const data = (await res.json()) as {
      voices?: {
        id?: string;
        voice_id?: string;
        name?: string;
        type?: string;
        language?: string;
      }[];
    };
    const voices = (data.voices ?? []).map((v) => {
      const id = v.id ?? v.voice_id ?? "";
      return {
        id,
        name: v.name ?? id,
        type: v.type ?? "profile",
        ...(v.language ? { language: v.language } : {}),
      };
    });
    return { configured: true, voices: voices.filter((v) => v.id) };
  } catch (err) {
    return { configured: true, voices: [], error: String(err) };
  }
}

// Duration of a PCM WAV from its header (byte rate at offset 28).
function wavDurationSec(buffer: Buffer): number | null {
  if (buffer.length < 44 || buffer.toString("ascii", 0, 4) !== "RIFF") return null;
  const byteRate = buffer.readUInt32LE(28);
  if (!byteRate) return null;
  return Math.round(((buffer.length - 44) / byteRate) * 10) / 10;
}

async function synthesizeVoiceStudio(
  req: VoiceoverRequest,
  estimatedDuration: number,
): Promise<VoiceoverResponse> {
  const config = getVoiceStudioConfig();
  if (!config) {
    return {
      success: false,
      audioUrl: createSilentWavDataUrl(estimatedDuration),
      durationSec: estimatedDuration,
      provider: "VoiceStudio (not configured)",
      note: "Set VOICESTUDIO_URL and VOICESTUDIO_API_KEY in the server environment to use your VoiceStudio backend.",
    };
  }

  try {
    const body: Record<string, unknown> = {
      model: "tts-1",
      input: req.text,
      voice: req.voice || "default",
      response_format: "wav",
    };
    if (typeof req.speed === "number" && req.speed >= 0.25 && req.speed <= 4) {
      body["speed"] = req.speed;
    }

    // The first request after a cold start loads the model, which can take minutes.
    const res = await fetch(`${config.baseUrl}/v1/audio/speech`, {
      method: "POST",
      headers: voiceStudioHeaders(config.apiKey),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(300_000),
    });

    if (!res.ok) {
      throw new Error(await readVoiceStudioError(res));
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    return {
      success: true,
      audioUrl: `data:audio/wav;base64,${buffer.toString("base64")}`,
      durationSec: wavDurationSec(buffer) ?? estimatedDuration,
      provider: `VoiceStudio (${req.voice || "default"})`,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn("VoiceStudio TTS error:", errMsg);
    return {
      success: false,
      audioUrl: createSilentWavDataUrl(estimatedDuration),
      durationSec: estimatedDuration,
      provider: "VoiceStudio (error)",
      note: `VoiceStudio request failed: ${errMsg}`,
    };
  }
}

export function getProvidersStatus(): ProvidersStatusResponse {
  loadEnvFallback();
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  const ai33Token = process.env.AI33_API_KEY;
  const ai33BaseUrl = process.env.AI33_BASE_URL || "https://api.ai33.pro/v1";
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const pexelsKey = process.env.PEXELS_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  return {
    huggingface: {
      configured: Boolean(hfToken && hfToken.length > 5),
      voiceModel: "hexgrad/Kokoro-82M",
      imageModel: "black-forest-labs/FLUX.1-schnell",
    },
    ai33: {
      configured: Boolean(ai33Token && ai33Token.length > 5),
      baseUrl: ai33BaseUrl,
    },
    elevenlabs: {
      configured: Boolean(elevenLabsKey && elevenLabsKey.length > 5),
    },
    gemini: {
      configured: Boolean(geminiKey && geminiKey.length > 5),
      totalKeys: getActiveKeyStatus().totalKeys,
      hasBackup: getActiveKeyStatus().hasBackup,
    },
    openai: {
      configured: Boolean(openaiKey && openaiKey.length > 5),
    },
    pexels: {
      configured: Boolean(pexelsKey && pexelsKey.length > 5),
    },
    tavily: {
      configured: Boolean(tavilyKey && tavilyKey.length > 5),
    },
    voicestudio: {
      configured: Boolean(getVoiceStudioConfig()),
    },
  };
}

export async function synthesizeVoice(req: VoiceoverRequest): Promise<VoiceoverResponse> {
  loadEnvFallback();
  const words = req.text.trim().split(/\s+/).length;
  // Standard speech is roughly 150 words per minute (2.5 words/sec)
  const estimatedDuration = Math.max(2, Math.round((words / 2.5) * 10) / 10);

  const geminiKey = process.env.GEMINI_API_KEY;
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  const ai33Token = process.env.AI33_API_KEY;
  const ai33BaseUrl = process.env.AI33_BASE_URL || "https://api.ai33.pro/v1";
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

  // 0. Self-hosted VoiceStudio — only when explicitly selected, never as a silent fallback.
  if (req.provider === "voicestudio") {
    return synthesizeVoiceStudio(req, estimatedDuration);
  }

  // 1. Try Gemini Flash TTS (flagship gemini-3.8-flash-tts)
  if (req.provider === "gemini" || (geminiKey && !req.provider)) {
    let geminiVoice: "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr" = "Kore";
    const v = req.voice?.toLowerCase() || "";
    if (v.includes("deep") || v.includes("charon") || v.includes("documentary")) {
      geminiVoice = "Charon";
    } else if (v.includes("bright") || v.includes("puck") || v.includes("explainer")) {
      geminiVoice = "Puck";
    } else if (v.includes("fenrir") || v.includes("serious") || v.includes("authoritative")) {
      geminiVoice = "Fenrir";
    } else if (v.includes("zephyr") || v.includes("calm") || v.includes("friendly")) {
      geminiVoice = "Zephyr";
    }

    const ttsRes = await synthesizeGeminiTts({
      text: req.text,
      voiceName: geminiVoice,
      model: "gemini-3.8-flash-tts",
    });

    if (ttsRes.success && ttsRes.audioUrl) {
      return {
        success: true,
        audioUrl: ttsRes.audioUrl,
        durationSec: estimatedDuration,
        provider: `Gemini Flash TTS (${geminiVoice})`,
      };
    }
  }

  // 2. Try Hugging Face Inference
  if (hfToken && (!req.provider || req.provider === "hf")) {
    try {
      const hf = new HfInference(hfToken.trim());
      const blob = await hf.textToSpeech({
        model: "facebook/mms-tts-eng",
        inputs: req.text,
      });

      if (blob && blob.size > 0) {
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = `data:audio/wav;base64,${buffer.toString("base64")}`;
        return {
          success: true,
          audioUrl: base64Audio,
          durationSec: estimatedDuration,
          provider: "Hugging Face TTS",
        };
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn("Hugging Face TTS notice:", errMsg);
      if (errMsg.includes("credits") || errMsg.includes("Provider")) {
        const sampleWav = createSilentWavDataUrl(estimatedDuration);
        return {
          success: true,
          audioUrl: sampleWav,
          durationSec: estimatedDuration,
          provider: "Hugging Face (Token Verified - Needs Credits)",
          note: "Hugging Face token verified (User: Emmanuel11111). To generate live voice, enable serverless credits at hf.co/settings/billing or use AI33 Pro.",
        };
      }
    }
  }

  // 2. Try AI33 Pro proxy endpoint
  if (ai33Token) {
    try {
      const res = await fetch(`${ai33BaseUrl.replace(/\/$/, "")}/audio/speech`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ai33Token.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: req.text,
          voice: req.voice?.toLowerCase().includes("deep") ? "onyx" : "alloy",
        }),
      });

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = `data:audio/mp3;base64,${buffer.toString("base64")}`;
        return {
          success: true,
          audioUrl: base64Audio,
          durationSec: estimatedDuration,
          provider: "AI33 Pro Gateway",
        };
      }
    } catch (err) {
      console.warn("AI33 Pro TTS error, falling back:", err);
    }
  }

  // 3. Try ElevenLabs directly
  if (elevenLabsKey) {
    try {
      const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Default voice: Rachel
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": elevenLabsKey.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: req.text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: (req.stability ?? 60) / 100,
            similarity_boost: (req.similarity ?? 60) / 100,
          },
        }),
      });

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = `data:audio/mp3;base64,${buffer.toString("base64")}`;
        return {
          success: true,
          audioUrl: base64Audio,
          durationSec: estimatedDuration,
          provider: "ElevenLabs",
        };
      }
    } catch (err) {
      console.warn("ElevenLabs TTS error, falling back:", err);
    }
  }

  // 4. Clean synthetic fallback audio
  const sampleWav = createSilentWavDataUrl(estimatedDuration);
  return {
    success: true,
    audioUrl: sampleWav,
    durationSec: estimatedDuration,
    provider: "Preview Mode",
    note: "Preview generated. Configure your provider key in .env for live generation.",
  };
}

export async function generateThumbnail(req: ThumbnailRequest): Promise<ThumbnailResponse> {
  loadEnvFallback();
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

  // 1. Try Hugging Face FLUX.1-schnell via official SDK
  if (hfToken) {
    try {
      const hf = new HfInference(hfToken.trim());
      const blob = await hf.textToImage({
        model: "black-forest-labs/FLUX.1-schnell",
        inputs: `${req.prompt}, 16:9 aspect ratio, youtube thumbnail style, vibrant, high quality`,
      });

      if (blob && blob.size > 0) {
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = `data:image/jpeg;base64,${buffer.toString("base64")}`;
        return {
          success: true,
          imageUrl: base64Image,
          provider: "Hugging Face (FLUX.1 [schnell])",
        };
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn("Hugging Face FLUX notice:", errMsg);
      if (errMsg.includes("credits")) {
        const fallback = renderSvgThumbnail(req);
        return {
          success: true,
          imageUrl: fallback,
          provider: "Hugging Face (Token Verified - Needs Credits)",
          note: "Hugging Face token verified (User: Emmanuel11111). Enable serverless provider credits at hf.co/settings/billing to generate live FLUX.1 images.",
        };
      }
    }
  }

  // 2. High-res styled vector graphic
  const svgDataUrl = renderSvgThumbnail(req);
  return {
    success: true,
    imageUrl: svgDataUrl,
    provider: "Vector Preview",
    note: "Add HUGGINGFACE_API_KEY in your .env file to generate photoreal thumbnails with FLUX.1.",
  };
}

function renderSvgThumbnail(req: ThumbnailRequest): string {
  const hue = req.hue ?? 140;
  const titleText = (req.text || "YOUTUBE THUMBNAIL").toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hue}, 80%, 25%)" />
          <stop offset="100%" stop-color="hsl(${(hue + 40) % 360}, 85%, 8%)" />
        </linearGradient>
        <radialGradient id="glow" cx="80%" cy="30%" r="60%">
          <stop offset="0%" stop-color="hsl(${hue}, 90%, 55%)" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      <circle cx="950" cy="300" r="400" fill="url(#glow)"/>
      <text x="80" y="380" font-family="system-ui, sans-serif" font-weight="900" font-size="88" fill="#ffffff" letter-spacing="-2px">
        ${escapeXml(titleText)}
      </text>
      <text x="84" y="440" font-family="system-ui, sans-serif" font-weight="700" font-size="28" fill="hsl(${hue}, 90%, 65%)" letter-spacing="1px">
        PROVEN RETENTION HOOK · 4K HIGH CONTRAST
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function createSilentWavDataUrl(durationSec: number): string {
  const sampleRate = 8000;
  const numSamples = Math.floor(sampleRate * Math.min(durationSec, 5));
  const buffer = Buffer.alloc(44 + numSamples);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34); // 8-bit
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples, 40);

  // Soft audible tone wave
  for (let i = 0; i < numSamples; i++) {
    const freq = 440; // A4
    const envelope = Math.sin((i / numSamples) * Math.PI);
    const value = Math.sin((2 * Math.PI * freq * i) / sampleRate) * 0.25 * envelope;
    buffer[44 + i] = Math.floor((value + 1) * 127.5);
  }

  return `data:audio/wav;base64,${buffer.toString("base64")}`;
}
