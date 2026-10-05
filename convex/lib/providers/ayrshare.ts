/**
 * Ayrshare client: one API for publishing to TikTok, Instagram, YouTube and
 * Facebook, plus per-post analytics. Each of our users gets their own Ayrshare
 * user profile (Business plan feature), identified by a profile key, and links
 * their social accounts to it through Ayrshare's hosted linking page.
 *
 * Request/response shapes follow https://www.ayrshare.com/docs. Analytics
 * field names differ per network, so `normalizeAnalytics` reads every known
 * alias defensively.
 */
const BASE = "https://api.ayrshare.com/api";

type Opts = { apiKey: string; fetchImpl?: typeof fetch };

async function call<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown; profileKey?: string },
  opts: Opts,
): Promise<T> {
  const res = await (opts.fetchImpl ?? fetch)(`${BASE}${path}`, {
    method: init.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
      ...(init.profileKey ? { "Profile-Key": init.profileKey } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }
  if (!res.ok || (data as { status?: string })?.status === "error") {
    const msg = (data as { message?: string })?.message ?? text;
    throw new Error(`Ayrshare ${path} ${res.status}: ${String(msg).slice(0, 300)}`);
  }
  return data as T;
}

export async function createProfile(title: string, opts: Opts): Promise<{ profileKey: string }> {
  const data = await call<{ profileKey?: string }>("/profiles", { method: "POST", body: { title } }, opts);
  if (!data.profileKey) throw new Error("Ayrshare returned no profile key");
  return { profileKey: data.profileKey };
}

/** One-time URL where the user links their social accounts to their profile. */
export async function createLinkUrl(
  args: { profileKey: string; domain: string; privateKey: string; redirect?: string },
  opts: Opts,
): Promise<string> {
  const data = await call<{ url?: string }>(
    "/profiles/generateJWT",
    {
      method: "POST",
      body: {
        domain: args.domain,
        privateKey: args.privateKey,
        profileKey: args.profileKey,
        ...(args.redirect ? { redirect: args.redirect } : {}),
      },
    },
    opts,
  );
  if (!data.url) throw new Error("Ayrshare returned no linking URL");
  return data.url;
}

export type LinkedAccount = { platform: string; handle?: string };

export async function getLinkedAccounts(profileKey: string, opts: Opts): Promise<LinkedAccount[]> {
  const data = await call<{
    activeSocialAccounts?: string[];
    displayNames?: { platform?: string; username?: string; displayName?: string }[];
  }>("/user", { method: "GET", profileKey }, opts);
  return (data.activeSocialAccounts ?? []).map((platform) => {
    const d = data.displayNames?.find((n) => n.platform === platform);
    return { platform, handle: d?.username ?? d?.displayName };
  });
}

export type PublishResult = {
  providerPostId: string;
  perPlatform: { platform: string; ok: boolean; externalId?: string; url?: string; error?: string }[];
};

export async function publishVideo(
  args: {
    profileKey: string;
    platforms: string[];
    caption: string;
    videoUrl: string;
    title: string;
  },
  opts: Opts,
): Promise<PublishResult> {
  const data = await call<{
    id?: string;
    postIds?: { platform?: string; id?: string; postUrl?: string; status?: string }[];
    errors?: { platform?: string; message?: string }[];
  }>(
    "/post",
    {
      method: "POST",
      profileKey: args.profileKey,
      body: {
        post: args.caption,
        platforms: args.platforms,
        mediaUrls: [args.videoUrl],
        isVideo: true,
        youTubeOptions: { title: args.title.slice(0, 100), visibility: "public", shorts: true },
        instagramOptions: { reels: true, shareReelsFeed: true },
      },
    },
    opts,
  );
  if (!data.id) throw new Error("Ayrshare returned no post id");
  return {
    providerPostId: data.id,
    perPlatform: args.platforms.map((platform) => {
      const ok = data.postIds?.find((p) => p.platform === platform && p.status !== "error");
      const err = data.errors?.find((e) => e.platform === platform);
      return ok
        ? { platform, ok: true, externalId: ok.id, url: ok.postUrl }
        : { platform, ok: false, error: err?.message ?? "Not published" };
    }),
  };
}

export type PostMetrics = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
  avgWatchTimeSec?: number;
  completionRate?: number;
};

const num = (...vals: unknown[]): number | undefined => {
  for (const v of vals) {
    const n = typeof v === "string" ? Number(v) : v;
    if (typeof n === "number" && Number.isFinite(n)) return n;
  }
  return undefined;
};

export function normalizeAnalytics(a: Record<string, unknown> | undefined): PostMetrics | undefined {
  if (!a) return undefined;
  const completion = num(a.fullVideoWatchedRate, a.completionRate);
  return {
    views: num(a.videoViews, a.views, a.plays, a.viewCount, a.impressions) ?? 0,
    likes: num(a.likes, a.likeCount, a.reactions) ?? 0,
    comments: num(a.comments, a.commentsCount, a.commentCount) ?? 0,
    shares: num(a.shares, a.sharesCount, a.shareCount) ?? 0,
    saves: num(a.saved, a.savedCount, a.saves),
    avgWatchTimeSec: num(a.averageTimeWatched, a.averageViewDuration, a.avgTimeWatched),
    completionRate: completion === undefined ? undefined : completion > 1 ? completion / 100 : completion,
  };
}

export async function getPostAnalytics(
  args: { profileKey: string; providerPostId: string; platforms: string[] },
  opts: Opts,
): Promise<Record<string, PostMetrics>> {
  const data = await call<Record<string, { analytics?: Record<string, unknown> } | undefined>>(
    "/analytics/post",
    { method: "POST", profileKey: args.profileKey, body: { id: args.providerPostId, platforms: args.platforms } },
    opts,
  );
  const out: Record<string, PostMetrics> = {};
  for (const p of args.platforms) {
    const m = normalizeAnalytics(data[p]?.analytics);
    if (m) out[p] = m;
  }
  return out;
}
