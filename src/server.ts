import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  synthesizeVoice,
  generateThumbnail,
  getProvidersStatus,
  listVoiceStudioVoices,
} from "./lib/api-service";
import {
  runGeminiChat,
  runMapsResearch,
  generateOrEditImage,
  startVeoVideoGeneration,
  pollVeoOperation,
  runGeminiVoiceTurn,
} from "./lib/gemini";
import { activeLlm } from "./lib/llm";
import { runDoctor, runFactCheck, writeOutline, writeScript } from "./lib/frontier/pipeline";

// The Frontier script pipeline: one route per step, each a JSON body in and a JSON result out.
type FrontierBody = {
  title: string;
  minutes: number;
  outline: string;
  script: string;
  sources?: string;
};
const FRONTIER_ROUTES: Record<
  string,
  { needs: (keyof FrontierBody)[]; run: (body: FrontierBody) => Promise<object> }
> = {
  "/api/frontier/outline": { needs: ["title", "minutes"], run: writeOutline },
  "/api/frontier/script": { needs: ["title", "minutes", "outline"], run: writeScript },
  "/api/frontier/doctor": { needs: ["title", "minutes", "script"], run: runDoctor },
  "/api/frontier/factcheck": { needs: ["title", "script"], run: runFactCheck },
};

function readFrontierBody(raw: unknown, needs: (keyof FrontierBody)[]): FrontierBody {
  const b = (raw ?? {}) as Partial<FrontierBody>;
  for (const key of needs) {
    const v = b[key];
    const ok =
      key === "minutes"
        ? typeof v === "number" && v > 0 && v <= 60
        : typeof v === "string" && v.trim();
    if (!ok) throw new Error(`Missing or invalid "${key}".`);
  }
  return b as FrontierBody;
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    if (url.pathname === "/api/status" && request.method === "GET") {
      const status = getProvidersStatus();
      return Response.json({ ...status, writer: activeLlm() });
    }

    const frontierStep = FRONTIER_ROUTES[url.pathname];
    if (frontierStep && request.method === "POST") {
      try {
        const body = readFrontierBody(await request.json(), frontierStep.needs);
        return Response.json({ success: true, ...(await frontierStep.run(body)) });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return Response.json({ success: false, error: message }, { status: 400 });
      }
    }

    if (url.pathname === "/api/voice" && request.method === "POST") {
      try {
        const body = (await request.json()) as Parameters<typeof synthesizeVoice>[0];
        const result = await synthesizeVoice(body);
        return Response.json(result);
      } catch (err) {
        return Response.json({ success: false, error: String(err) }, { status: 400 });
      }
    }

    if (url.pathname === "/api/voicestudio/voices" && request.method === "GET") {
      const result = await listVoiceStudioVoices();
      return Response.json(result);
    }

    if (url.pathname === "/api/thumbnails" && request.method === "POST") {
      try {
        const body = (await request.json()) as Parameters<typeof generateThumbnail>[0];
        const result = await generateThumbnail(body);
        return Response.json(result);
      } catch (err) {
        return Response.json({ success: false, error: String(err) }, { status: 400 });
      }
    }

    if (url.pathname === "/api/gemini/chat" && request.method === "POST") {
      try {
        const body = (await request.json()) as Parameters<typeof runGeminiChat>[0];
        const result = await runGeminiChat(body);
        return Response.json(result);
      } catch (err) {
        return Response.json({ success: false, error: String(err) }, { status: 400 });
      }
    }

    if (url.pathname === "/api/gemini/maps-research" && request.method === "POST") {
      try {
        const body = (await request.json()) as { prompt: string };
        const result = await runMapsResearch(body.prompt);
        return Response.json(result);
      } catch (err) {
        return Response.json({ success: false, error: String(err) }, { status: 400 });
      }
    }

    if (url.pathname === "/api/gemini/image" && request.method === "POST") {
      try {
        const body = (await request.json()) as Parameters<typeof generateOrEditImage>[0];
        const result = await generateOrEditImage(body);
        return Response.json(result);
      } catch (err) {
        return Response.json({ success: false, error: String(err) }, { status: 400 });
      }
    }

    if (url.pathname === "/api/gemini/video" && request.method === "POST") {
      try {
        const body = (await request.json()) as Parameters<typeof startVeoVideoGeneration>[0];
        const result = await startVeoVideoGeneration(body);
        return Response.json(result);
      } catch (err) {
        return Response.json({ success: false, error: String(err) }, { status: 400 });
      }
    }

    if (url.pathname === "/api/gemini/video-status" && request.method === "POST") {
      try {
        const body = (await request.json()) as { operationName: string };
        const result = await pollVeoOperation(body.operationName);
        return Response.json(result);
      } catch (err) {
        return Response.json({ success: false, error: String(err) }, { status: 400 });
      }
    }

    if (url.pathname === "/api/gemini/voice-turn" && request.method === "POST") {
      try {
        const body = (await request.json()) as { message: string };
        const result = await runGeminiVoiceTurn(body.message);
        return Response.json(result);
      } catch (err) {
        return Response.json({ success: false, error: String(err) }, { status: 400 });
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
