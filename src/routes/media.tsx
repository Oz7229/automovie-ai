import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  Upload,
  Search,
  Sparkles,
  Video,
  Image as ImageIcon,
  Loader2,
  Film,
  Download,
  X,
  Play,
} from "lucide-react";
import { Badge, Button, inputCls, PageHeader } from "@/components/ui-kit";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/media")({
  head: () =>
    seo(
      "Media Library",
      "Generate images with gemini-nano-banana-2.1, create videos with Veo 3, and manage all visual assets.",
    ),
  component: Media,
});

interface MediaItem {
  id: string;
  kind: "AI images" | "AI video" | "Stock" | "Uploads";
  name: string;
  url?: string;
  hue?: number;
  aspect?: string;
  model?: string;
}

const defaultItems: MediaItem[] = [
  {
    id: "1",
    kind: "AI images",
    name: "Pothos water roots (16:9)",
    hue: 140,
    model: "gemini-nano-banana-2.1",
  },
  {
    id: "2",
    kind: "AI video",
    name: "Glass jar sunlight reveal (16:9)",
    hue: 200,
    model: "veo-3.1-fast-generate-preview",
  },
  {
    id: "3",
    kind: "AI video",
    name: "Water ripple slow-mo (9:16)",
    hue: 280,
    model: "veo-3.1-fast-generate-preview",
  },
  {
    id: "4",
    kind: "AI images",
    name: "Botanical apartment shelf",
    hue: 90,
    model: "gemini-nano-banana-2.1",
  },
  { id: "5", kind: "Stock", name: "Pexels clean water pouring", hue: 180 },
  { id: "6", kind: "Uploads", name: "Channel logo transparent", hue: 320 },
];

function Media() {
  const [tab, setTab] = useState("All");
  const [items, setItems] = useState<MediaItem[]>(defaultItems);
  const [search, setSearch] = useState("");

  // Modals state
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Image state
  const [imageEngine, setImageEngine] = useState<"nano-banana" | "qwen-image" | "flux">(
    "nano-banana",
  );
  const [imagePrompt, setImagePrompt] = useState(
    "Cinematic close-up of pothos roots in a clear glass jar with soft backlighting",
  );
  const [imageAspect, setImageAspect] = useState<"16:9" | "9:16" | "1:1" | "4:3" | "3:4">("16:9");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [imageNote, setImageNote] = useState<string | null>(null);

  // Veo state
  const [videoPrompt, setVideoPrompt] = useState(
    "Slow camera pan around lush green leaves glistening with water droplets in golden hour light",
  );
  const [videoAspect, setVideoAspect] = useState<"16:9" | "9:16">("16:9");
  const [videoMode, setVideoMode] = useState<"text" | "animate">("text");
  const [videoImageInput, setVideoImageInput] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoStatusMsg, setVideoStatusMsg] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoPhotoInputRef = useRef<HTMLInputElement | null>(null);

  // Image Generation & Editing handler (gemini-nano-banana-2.1)
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setImageLoading(true);
    setImageNote(null);
    try {
      const res = await fetch("/api/gemini/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio: imageAspect,
          referenceImageBase64: referenceImage || undefined,
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        setImageResult(data.imageUrl);
        const newItem: MediaItem = {
          id: `img-${Date.now()}`,
          kind: "AI images",
          name: imagePrompt.slice(0, 28) + ` (${imageAspect})`,
          url: data.imageUrl,
          model: "gemini-nano-banana-2.1",
        };
        setItems((prev) => [newItem, ...prev]);
        setImageNote("Rendered with gemini-nano-banana-2.1!");
      } else {
        setImageNote(data.error || "Generation request sent to gemini-nano-banana-2.1.");
      }
    } catch (err) {
      console.error("Image generation error:", err);
      setImageNote("Error communicating with Gemini image service.");
    } finally {
      setImageLoading(false);
    }
  };

  // Veo Video Generation & Photo Animation handler (veo-3.1-fast-generate-preview)
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() && !videoImageInput) return;
    setVideoLoading(true);
    setVideoStatusMsg("Submitting generation request to veo-3.1-fast-generate-preview…");
    setGeneratedVideoUrl(null);

    try {
      const res = await fetch("/api/gemini/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio: videoAspect,
          referenceImageBase64: videoMode === "animate" ? videoImageInput || undefined : undefined,
        }),
      });

      const data = await res.json();
      if (data.operationName) {
        setVideoStatusMsg("Veo video generation in progress… Polling operation status…");
        // Poll status
        const poll = async (attempts = 0): Promise<void> => {
          if (attempts > 12) {
            setVideoStatusMsg(
              "Generation queued with Veo 3. Video will appear in library when ready.",
            );
            setVideoLoading(false);
            return;
          }
          const sRes = await fetch("/api/gemini/video-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operationName: data.operationName }),
          });
          const sData = await sRes.json();
          if (sData.done && sData.downloadUri) {
            setGeneratedVideoUrl(sData.downloadUri);
            setVideoStatusMsg("Veo 3 generation completed!");
            setVideoLoading(false);
            const newItem: MediaItem = {
              id: `vid-${Date.now()}`,
              kind: "AI video",
              name: (videoPrompt || "Animated Photo").slice(0, 28) + ` (${videoAspect})`,
              url: sData.downloadUri,
              model: "veo-3.1-fast-generate-preview",
            };
            setItems((prev) => [newItem, ...prev]);
          } else {
            setVideoStatusMsg(`Veo 3 rendering frames… (step ${attempts + 1}/12)`);
            setTimeout(() => poll(attempts + 1), 5000);
          }
        };
        poll();
      } else {
        setVideoStatusMsg(data.error || "Generation request sent to Veo.");
        setVideoLoading(false);
      }
    } catch (err) {
      console.error("Video generation error:", err);
      setVideoStatusMsg("Connection error calling Veo 3.");
      setVideoLoading(false);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "refImage" | "animPhoto",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      if (target === "refImage") setReferenceImage(b64);
      if (target === "animPhoto") setVideoImageInput(b64);
    };
    reader.readAsDataURL(file);
  };

  const tabsList = ["All", "AI images", "AI video", "Stock", "Uploads"];
  const shown = items
    .filter((x) => tab === "All" || x.kind === tab)
    .filter((x) => !search || x.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Media Library"
        subtitle="AI visual assets generated with Gemini Nano-Banana 2.1 & Veo 3 Video"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowImageModal(true)}>
              <ImageIcon /> Create / Edit Image (Nano-Banana)
            </Button>
            <Button variant="primary" onClick={() => setShowVideoModal(true)}>
              <Film /> Veo 3 Video Generator
            </Button>
          </div>
        }
      />

      {/* Nano-Banana Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs">
          <div className="panel max-w-lg w-full space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-display text-base font-semibold">
                  Create & Edit Images (gemini-nano-banana-2.1)
                </h3>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowImageModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Image Generation Model
              </label>
              <select
                value={imageEngine}
                onChange={(e) => setImageEngine(e.target.value as typeof imageEngine)}
                className={inputCls + " mt-1"}
              >
                <option value="nano-banana">Gemini Nano-Banana 2.1 (gemini-nano-banana-2.1)</option>
                <option value="qwen-image">Qwen-Image-2.1 Quantized (abenzerps)</option>
                <option value="flux">Hugging Face FLUX.1 [schnell]</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Text Prompt / Edit Instructions
              </label>
              <textarea
                rows={3}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the image or specify what to add/change…"
                className={inputCls + " mt-1"}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Aspect Ratio</label>
                <select
                  value={imageAspect}
                  onChange={(e) => setImageAspect(e.target.value as typeof imageAspect)}
                  className={inputCls + " mt-1"}
                >
                  <option value="16:9">16:9 (YouTube Landscape)</option>
                  <option value="9:16">9:16 (Shorts / Reels)</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="4:3">4:3 (Classic)</option>
                  <option value="3:4">3:4 (Portrait)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Optional Photo (For Image Editing)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "refImage")}
                  className="hidden"
                />
                <Button
                  className="mt-1 w-full"
                  variant={referenceImage ? "primary" : "ghost"}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload /> {referenceImage ? "Image Loaded" : "Upload to Edit"}
                </Button>
              </div>
            </div>

            {referenceImage && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2 text-xs">
                <img
                  src={referenceImage}
                  alt="Reference"
                  className="h-10 w-10 rounded object-cover"
                />
                <span className="flex-1 truncate text-muted-foreground">
                  Attached image for editing
                </span>
                <button
                  onClick={() => setReferenceImage(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            )}

            {imageNote && (
              <p className="rounded-lg bg-surface p-2 text-xs text-muted-foreground">{imageNote}</p>
            )}

            {imageResult && (
              <div className="overflow-hidden rounded-lg border border-border">
                <img
                  src={imageResult}
                  alt="Generated"
                  className="aspect-video w-full object-cover"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowImageModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" disabled={imageLoading} onClick={handleGenerateImage}>
                {imageLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {imageLoading ? "Generating with Nano-Banana…" : "Generate Image"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Veo 3 Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs">
          <div className="panel max-w-lg w-full space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Film className="h-5 w-5 text-primary" />
                <h3 className="font-display text-base font-semibold">
                  Veo 3 Video Generator (veo-3.1-fast-generate-preview)
                </h3>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowVideoModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 rounded-lg bg-surface p-1 text-xs">
              <button
                className={`flex-1 rounded py-1.5 font-medium transition ${
                  videoMode === "text"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => setVideoMode("text")}
              >
                Generate Video from Text
              </button>
              <button
                className={`flex-1 rounded py-1.5 font-medium transition ${
                  videoMode === "animate"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => setVideoMode("animate")}
              >
                Animate Photo into Video
              </button>
            </div>

            {videoMode === "animate" && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Upload Starting Photo
                </label>
                <input
                  type="file"
                  ref={videoPhotoInputRef}
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "animPhoto")}
                  className="hidden"
                />
                <Button
                  className="mt-1 w-full"
                  variant={videoImageInput ? "primary" : "ghost"}
                  onClick={() => videoPhotoInputRef.current?.click()}
                >
                  <Upload /> {videoImageInput ? "Photo Attached" : "Select Photo to Animate"}
                </Button>
                {videoImageInput && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-surface p-2 text-xs">
                    <img
                      src={videoImageInput}
                      alt="Source"
                      className="h-10 w-10 rounded object-cover"
                    />
                    <span className="flex-1 truncate text-muted-foreground">
                      Photo ready for Veo motion synthesis
                    </span>
                    <button
                      onClick={() => setVideoImageInput(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                {videoMode === "animate" ? "Motion Prompt (Optional)" : "Video Prompt"}
              </label>
              <textarea
                rows={3}
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Describe cinematic camera movement, lighting, subject action…"
                className={inputCls + " mt-1"}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Aspect Ratio</label>
              <select
                value={videoAspect}
                onChange={(e) => setVideoAspect(e.target.value as "16:9" | "9:16")}
                className={inputCls + " mt-1"}
              >
                <option value="16:9">16:9 (Landscape - YouTube Longform)</option>
                <option value="9:16">9:16 (Portrait - YouTube Shorts)</option>
              </select>
            </div>

            {videoStatusMsg && (
              <p className="rounded-lg bg-surface p-2 text-xs text-muted-foreground">
                {videoStatusMsg}
              </p>
            )}

            {generatedVideoUrl && (
              <div className="overflow-hidden rounded-lg border border-border">
                <video src={generatedVideoUrl} controls autoPlay className="aspect-video w-full" />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowVideoModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" disabled={videoLoading} onClick={handleGenerateVideo}>
                {videoLoading ? <Loader2 className="animate-spin" /> : <Video />}
                {videoLoading ? "Synthesizing with Veo 3…" : "Generate Video"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabsList.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              tab === t
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
        <div className="relative ml-auto w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputCls + " pl-9"}
            placeholder="Search media assets…"
          />
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((x) => (
          <div key={x.id} className="panel group overflow-hidden">
            <div className="relative aspect-video overflow-hidden">
              {x.url ? (
                x.kind === "AI video" ? (
                  <video src={x.url} className="h-full w-full object-cover" />
                ) : (
                  <img src={x.url} alt={x.name} className="h-full w-full object-cover" />
                )
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center p-3 text-center"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.5 0.1 ${x.hue ?? 180}), oklch(0.22 0.04 ${(x.hue ?? 180) + 60}))`,
                  }}
                >
                  <span className="font-display text-xs font-semibold drop-shadow-sm">
                    {x.name}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-sm font-medium">{x.name}</span>
                <Badge tone="default">{x.kind}</Badge>
              </div>
              {x.model && (
                <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
                  {x.model}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
