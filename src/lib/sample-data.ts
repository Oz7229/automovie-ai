// Sample data for the studio shell. Mirrors the planned database schema
// (projects → scenes → tracks → clips) so it can be swapped for real data.

export type ProjectStatus =
  | "IDEA" | "RESEARCHING" | "RESEARCH_COMPLETE" | "SCRIPTING" | "SCRIPT_REVIEW" | "VOICEOVER"
  | "VISUALS" | "EDITING" | "QUALITY_CHECK" | "READY_TO_EXPORT" | "EXPORTING" | "COMPLETED";

export type StageStatus = "Not Started" | "In Progress" | "Completed" | "Needs Review";

export const STAGES = ["Research", "Script", "Voiceover", "Visuals", "Editing", "Thumbnail", "SEO", "Export"] as const;

export interface Project {
  id: string;
  name: string;
  channel: string;
  status: ProjectStatus;
  progress: number;
  lastEdited: string;
  duration: string;
  hue: number;
  stages: StageStatus[];
}

export const projects: Project[] = [
  { id: "p1", name: "20 Indoor Plants That Thrive in Water", channel: "Green Hours", status: "EDITING", progress: 68, lastEdited: "12 min ago", duration: "20:14", hue: 140, stages: ["Completed", "Completed", "Completed", "Completed", "In Progress", "Not Started", "Not Started", "Not Started"] },
  { id: "p2", name: "The Collapse of the Bronze Age", channel: "Deep Archive", status: "SCRIPT_REVIEW", progress: 32, lastEdited: "2 h ago", duration: "28:40", hue: 35, stages: ["Completed", "Needs Review", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started"] },
  { id: "p3", name: "Why Japan Has No Trash Cans", channel: "Curious Atlas", status: "COMPLETED", progress: 100, lastEdited: "Yesterday", duration: "12:05", hue: 0, stages: ["Completed", "Completed", "Completed", "Completed", "Completed", "Completed", "Completed", "Completed"] },
  { id: "p4", name: "10 AI Tools Replacing Freelancers", channel: "Tech Signal", status: "RESEARCHING", progress: 12, lastEdited: "3 days ago", duration: "15:00", hue: 220, stages: ["In Progress", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started"] },
  { id: "p5", name: "The Deepest Hole Ever Dug", channel: "Curious Atlas", status: "QUALITY_CHECK", progress: 88, lastEdited: "4 days ago", duration: "17:32", hue: 280, stages: ["Completed", "Completed", "Completed", "Completed", "Completed", "Completed", "In Progress", "Not Started"] },
];

export const statusTone: Record<ProjectStatus, "default" | "primary" | "success" | "warning" | "info"> = {
  IDEA: "default", RESEARCHING: "info", RESEARCH_COMPLETE: "info", SCRIPTING: "primary", SCRIPT_REVIEW: "warning",
  VOICEOVER: "primary", VISUALS: "primary", EDITING: "primary", QUALITY_CHECK: "warning", READY_TO_EXPORT: "success",
  EXPORTING: "info", COMPLETED: "success",
};

export interface Scene {
  id: string;
  number: number;
  title: string;
  start: number;
  duration: number;
  narration: string;
  visual: string;
  visualType: string;
  onScreen: string;
  broll: string;
  music: string;
  sfx: string;
}

export const scenes: Scene[] = [
  { id: "s1", number: 1, title: "Hook", start: 0, duration: 18, narration: "Imagine a houseplant that never needs soil, never needs repotting, and almost never dies. It sounds impossible — but twenty of them are hiding in plain sight.", visual: "Slow cinematic push-in on a glass jar of pothos cuttings on a sunlit windowsill, roots glowing in the light.", visualType: "AI video", onScreen: "NO SOIL. EVER.", broll: "Water being poured into a glass vase", music: "Low cinematic ambient", sfx: "Soft water pour" },
  { id: "s2", number: 2, title: "Why water works", start: 18, duration: 24, narration: "Hydroponic growing isn't new. Gardeners in ancient Babylon used water channels to feed plants. Today, science explains why many tropical plants adapt so well.", visual: "Animated diagram of roots absorbing oxygen and nutrients from water.", visualType: "Motion graphic", onScreen: "HYDROPONICS 101", broll: "Macro of root hairs", music: "Curious pluck", sfx: "Whoosh" },
  { id: "s3", number: 3, title: "#20 Pothos", start: 42, duration: 32, narration: "Number twenty: the golden pothos. It's the plant almost everyone starts with — and for good reason. Snip below a node, drop it in water, and within two weeks you'll see roots.", visual: "Close-up of healthy pothos roots growing inside a clear glass jar.", visualType: "Stock video", onScreen: "#20 GOLDEN POTHOS", broll: "Hands snipping a vine", music: "Light acoustic", sfx: "Scissors snip" },
  { id: "s4", number: 4, title: "#19 Lucky Bamboo", start: 74, duration: 28, narration: "Lucky bamboo isn't actually bamboo at all. It's a dracaena — and it can live in water for years with nothing but a few pebbles.", visual: "Lucky bamboo stalks in a ceramic dish of pebbles on a desk.", visualType: "AI image", onScreen: "NOT ACTUALLY BAMBOO", broll: "Office desk with bamboo", music: "Light acoustic", sfx: "Notification ding" },
  { id: "s5", number: 5, title: "#18 Philodendron", start: 102, duration: 30, narration: "The heartleaf philodendron grows faster in water than most people expect. Change the water weekly and it will reward you with long, trailing vines.", visual: "Time-lapse of a philodendron vine growing along a shelf.", visualType: "AI video", onScreen: "#18 HEARTLEAF PHILODENDRON", broll: "Bookshelf with trailing vines", music: "Light acoustic", sfx: "Pop" },
];

export interface Clip { id: string; track: TrackId; start: number; duration: number; label: string }
export type TrackId = "video" | "broll" | "voice" | "music" | "sfx" | "text" | "captions";

export const tracks: { id: TrackId; label: string }[] = [
  { id: "video", label: "Video" }, { id: "broll", label: "B-roll" }, { id: "voice", label: "Voiceover" },
  { id: "music", label: "Music" }, { id: "sfx", label: "SFX" }, { id: "text", label: "Text" }, { id: "captions", label: "Captions" },
];

export const initialClips: Clip[] = [
  ...scenes.map((s) => ({ id: `v-${s.id}`, track: "video" as const, start: s.start, duration: s.duration, label: `S${s.number} ${s.visualType}` })),
  ...scenes.map((s) => ({ id: `vo-${s.id}`, track: "voice" as const, start: s.start + 0.5, duration: s.duration - 1, label: `VO ${s.number}` })),
  ...scenes.map((s) => ({ id: `t-${s.id}`, track: "text" as const, start: s.start + 2, duration: 4, label: s.onScreen })),
  ...scenes.map((s) => ({ id: `c-${s.id}`, track: "captions" as const, start: s.start + 0.5, duration: s.duration - 1, label: "Captions" })),
  { id: "b1", track: "broll", start: 8, duration: 8, label: "Water pour" },
  { id: "b2", track: "broll", start: 50, duration: 10, label: "Snipping vine" },
  { id: "b3", track: "broll", start: 110, duration: 12, label: "Shelf vines" },
  { id: "m1", track: "music", start: 0, duration: 42, label: "Cinematic ambient" },
  { id: "m2", track: "music", start: 42, duration: 90, label: "Light acoustic" },
  { id: "x1", track: "sfx", start: 1, duration: 2, label: "Pour" },
  { id: "x2", track: "sfx", start: 18, duration: 1.5, label: "Whoosh" },
  { id: "x3", track: "sfx", start: 52, duration: 1, label: "Snip" },
  { id: "x4", track: "sfx", start: 76, duration: 1, label: "Ding" },
];

export const agents = [
  { id: "research", name: "Research Agent", desc: "Searches the web, cross-checks claims, builds cited reports.", model: "openai/gpt-6-astra", tools: ["Web search", "Page fetch"], skills: ["Fact-first research"], enabled: true },
  { id: "script", name: "Script Agent", desc: "Writes hooks, sections, transitions and CTAs from research.", model: "openai/gpt-6-astra", tools: ["Research report"], skills: ["Garden YouTube Skill"], enabled: true },
  { id: "voice", name: "Voice Agent", desc: "Generates narration per scene and attaches audio.", model: "ElevenLabs", tools: ["TTS"], skills: [], enabled: true },
  { id: "visual", name: "Visual Director", desc: "Decides visual type per scene and writes prompts.", model: "openai/gpt-6-astra", tools: ["Scene reader"], skills: ["Cinematic prompts"], enabled: true },
  { id: "image", name: "Image Agent", desc: "Generates scene images.", model: "Nano Banana", tools: ["Image gen"], skills: [], enabled: true },
  { id: "video", name: "Video Agent", desc: "Generates AI clips from visual prompts.", model: "Veo", tools: ["Video gen"], skills: [], enabled: false },
  { id: "stock", name: "Stock Media Agent", desc: "Finds matching stock video and images.", model: "Pexels", tools: ["Stock search"], skills: [], enabled: true },
  { id: "caption", name: "Caption Agent", desc: "Word-timed captions from voiceover.", model: "openai/gpt-transcribe", tools: ["Transcribe"], skills: [], enabled: true },
  { id: "music", name: "Music Agent", desc: "Suggests music by mood and energy, ducks under narration.", model: "openai/gpt-6-astra", tools: ["Music library"], skills: [], enabled: true },
  { id: "sfx", name: "Sound Effect Agent", desc: "Places SFX where they lift retention.", model: "openai/gpt-6-astra", tools: ["SFX library"], skills: [], enabled: true },
  { id: "thumb", name: "Thumbnail Agent", desc: "Creates high-CTR thumbnail concepts.", model: "Nano Banana", tools: ["Image gen"], skills: ["Bold thumbnails"], enabled: true },
  { id: "seo", name: "SEO Agent", desc: "Titles, descriptions, tags, chapters.", model: "openai/gpt-6-astra", tools: ["Keyword data"], skills: [], enabled: true },
  { id: "repurpose", name: "Repurposing Agent", desc: "Shorts, Reels, TikTok and social posts.", model: "openai/gpt-6-astra", tools: [], skills: [], enabled: true },
  { id: "qc", name: "Quality Control Agent", desc: "Scores the video and flags issues before export.", model: "openai/gpt-6-astra", tools: ["Timeline reader"], skills: [], enabled: true },
];

export const skills = [
  { id: "k1", name: "Garden YouTube Skill", agents: ["Script Agent", "SEO Agent"], rules: ["Use conversational language.", "Create strong hooks.", "Use curiosity loops.", "Use short sentences.", "Do not invent facts.", "Use American English."] },
  { id: "k2", name: "Fact-first research", agents: ["Research Agent"], rules: ["Prefer primary sources.", "Cross-check every statistic with 2 sources.", "Flag anything older than 3 years."] },
  { id: "k3", name: "Cinematic prompts", agents: ["Visual Director"], rules: ["Describe lens and lighting.", "Avoid text in images.", "16:9 composition."] },
  { id: "k4", name: "Bold thumbnails", agents: ["Thumbnail Agent"], rules: ["Max 3 words.", "One focal subject.", "High contrast colors."] },
];

export const channels = [
  { id: "c1", name: "Green Hours", niche: "Indoor gardening", audience: "Beginner plant owners", country: "US", language: "English", voice: "Warm Narrator", colors: [140, 90], length: "15–20 min" },
  { id: "c2", name: "Deep Archive", niche: "Ancient history", audience: "History buffs 25–45", country: "UK", language: "English", voice: "Documentary Deep", colors: [35, 15], length: "25–35 min" },
  { id: "c3", name: "Curious Atlas", niche: "Geography & culture", audience: "General curious viewers", country: "US", language: "English", voice: "Bright Explainer", colors: [0, 280], length: "10–18 min" },
];

export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
