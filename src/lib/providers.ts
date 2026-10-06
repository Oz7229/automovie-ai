// Provider abstraction layer. Each capability has an interface; concrete
// providers are registered server-side and selected per user/agent.
// API keys live only in server env — never in the browser.

export type Capability = "research" | "llm" | "voice" | "image" | "video" | "stock" | "render" | "storage" | "payments" | "analytics" | "mcp";

export interface ProviderMeta {
  id: string;
  name: string;
  capability: Capability;
  description: string;
  connected: boolean;
}

export interface ResearchProvider {
  search(query: string, opts?: { region?: string; limit?: number }): Promise<{ title: string; url: string; snippet: string; publishedAt?: string }[]>;
  fetchPage?(url: string): Promise<{ url: string; content: string }>;
}
export interface VoiceProvider {
  listVoices(): Promise<{ id: string; name: string; accent?: string }[]>;
  synthesize(text: string, settings: { voiceId: string; stability: number; similarity: number; style: number; speed: number }): Promise<{ audioUrl: string; durationSec: number }>;
}
export interface ImageProvider {
  generate(prompt: string, opts?: { aspect?: string }): Promise<{ url: string }>;
}
export interface VideoProvider {
  createJob(prompt: string, opts?: { durationSec?: number; aspect?: string }): Promise<{ jobId: string }>;
  getJob(jobId: string): Promise<{ status: "queued" | "running" | "done" | "failed"; url?: string }>;
}
export interface StockProvider {
  search(query: string, kind: "video" | "image"): Promise<{ id: string; previewUrl: string; downloadUrl: string }[]>;
}
export interface RenderProvider {
  submit(timelineJson: unknown, opts: { resolution: "1080p" | "4k" }): Promise<{ renderJobId: string }>;
}

export const PROVIDERS: ProviderMeta[] = [
  { id: "tavily", name: "Tavily", capability: "research", description: "AI-native web search", connected: true },
  { id: "serpapi", name: "SerpAPI", capability: "research", description: "Google results API", connected: false },
  { id: "firecrawl", name: "Firecrawl", capability: "research", description: "Crawl & extract pages", connected: false },
  { id: "perplexity", name: "Perplexity", capability: "research", description: "Answer engine with citations", connected: false },
  { id: "lovable-ai", name: "Lovable AI", capability: "llm", description: "Built-in model gateway", connected: true },
  { id: "anthropic", name: "Anthropic", capability: "llm", description: "Claude models", connected: false },
  { id: "elevenlabs", name: "ElevenLabs", capability: "voice", description: "Studio-grade narration", connected: false },
  { id: "openai-tts", name: "OpenAI Voice", capability: "voice", description: "Text to speech", connected: false },
  { id: "nano-banana", name: "Gemini / Nano Banana", capability: "image", description: "Image generation & edit", connected: true },
  { id: "flux", name: "Flux", capability: "image", description: "Photoreal images", connected: false },
  { id: "ideogram", name: "Ideogram", capability: "image", description: "Images with text", connected: false },
  { id: "veo", name: "Google Veo", capability: "video", description: "AI video clips", connected: false },
  { id: "runway", name: "Runway", capability: "video", description: "Gen video", connected: false },
  { id: "kling", name: "Kling", capability: "video", description: "AI video clips", connected: false },
  { id: "luma", name: "Luma", capability: "video", description: "Dream Machine", connected: false },
  { id: "pexels", name: "Pexels", capability: "stock", description: "Free stock video & images", connected: true },
  { id: "pixabay", name: "Pixabay", capability: "stock", description: "Free stock media", connected: false },
  { id: "unsplash", name: "Unsplash", capability: "stock", description: "Stock photography", connected: false },
  { id: "remotion", name: "Remotion", capability: "render", description: "React-based rendering", connected: false },
  { id: "ffmpeg", name: "FFmpeg Worker", capability: "render", description: "Server render workers", connected: false },
  { id: "stripe", name: "Stripe", capability: "payments", description: "Subscriptions", connected: false },
  { id: "posthog", name: "PostHog", capability: "analytics", description: "Product analytics", connected: false },
  { id: "mcp-custom", name: "Custom MCP server", capability: "mcp", description: "Connect any MCP tool server", connected: false },
];
