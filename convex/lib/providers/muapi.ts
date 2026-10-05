/**
 * MuAPI video generation client. Submit returns a request id; the result
 * arrives on our webhook, and `fetchResult` polls as a fallback. Request and
 * response shapes follow Open-AI-UGC and Open-Higgsfield-AI (see vendor/).
 */
const BASE = "https://api.muapi.ai/api/v1";

export type RenderState =
  | { state: "processing" }
  | { state: "completed"; outputUrl: string }
  | { state: "failed"; error: string };

export async function submitRender(
  args: {
    endpoint: string;
    prompt: string;
    aspectRatio: string;
    durationSec: number;
    webhookUrl: string;
    extraParams?: Record<string, string | number | boolean>;
  },
  opts: { apiKey: string; fetchImpl?: typeof fetch },
): Promise<{ requestId: string }> {
  const res = await (opts.fetchImpl ?? fetch)(`${BASE}/${args.endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": opts.apiKey },
    body: JSON.stringify({
      prompt: args.prompt,
      aspect_ratio: args.aspectRatio,
      duration: args.durationSec,
      webhook_url: args.webhookUrl,
      ...args.extraParams,
    }),
  });
  if (!res.ok) {
    throw new Error(`MuAPI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as { request_id?: string; id?: string };
  const requestId = data.request_id ?? data.id;
  if (!requestId) throw new Error("MuAPI returned no request id");
  return { requestId };
}

/** Interpret a MuAPI result payload (webhook body or poll response). */
export function parseRenderPayload(data: {
  status?: string;
  outputs?: string[];
  error?: string | null;
}): RenderState {
  const status = data.status?.toLowerCase();
  if (status === "failed" || status === "error" || (data.error && data.error !== "")) {
    return { state: "failed", error: data.error || "Generation failed" };
  }
  const outputUrl = data.outputs?.[0];
  if ((status === "completed" || status === "succeeded" || status === "success" || !status) && outputUrl) {
    return { state: "completed", outputUrl };
  }
  return { state: "processing" };
}

export async function fetchResult(
  requestId: string,
  opts: { apiKey: string; fetchImpl?: typeof fetch },
): Promise<RenderState> {
  const res = await (opts.fetchImpl ?? fetch)(`${BASE}/predictions/${encodeURIComponent(requestId)}/result`, {
    headers: { "x-api-key": opts.apiKey },
  });
  if (res.status >= 500) return { state: "processing" };
  if (!res.ok) {
    return { state: "failed", error: `MuAPI poll ${res.status}: ${(await res.text()).slice(0, 200)}` };
  }
  return parseRenderPayload(await res.json());
}
