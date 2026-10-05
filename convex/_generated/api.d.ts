/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as autopilot from "../autopilot.js";
import type * as billing from "../billing.js";
import type * as catalog from "../catalog.js";
import type * as channels from "../channels.js";
import type * as crons from "../crons.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_credits from "../lib/credits.js";
import type * as lib_models from "../lib/models.js";
import type * as lib_providers_ayrshare from "../lib/providers/ayrshare.js";
import type * as lib_providers_muapi from "../lib/providers/muapi.js";
import type * as lib_providers_openai from "../lib/providers/openai.js";
import type * as lib_r2 from "../lib/r2.js";
import type * as lib_schedule from "../lib/schedule.js";
import type * as lib_stripe from "../lib/stripe.js";
import type * as lib_styles from "../lib/styles.js";
import type * as metrics from "../metrics.js";
import type * as pipeline from "../pipeline.js";
import type * as posting from "../posting.js";
import type * as storage from "../storage.js";
import type * as users from "../users.js";
import type * as videos from "../videos.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  autopilot: typeof autopilot;
  billing: typeof billing;
  catalog: typeof catalog;
  channels: typeof channels;
  crons: typeof crons;
  files: typeof files;
  http: typeof http;
  "lib/access": typeof lib_access;
  "lib/credits": typeof lib_credits;
  "lib/models": typeof lib_models;
  "lib/providers/ayrshare": typeof lib_providers_ayrshare;
  "lib/providers/muapi": typeof lib_providers_muapi;
  "lib/providers/openai": typeof lib_providers_openai;
  "lib/r2": typeof lib_r2;
  "lib/schedule": typeof lib_schedule;
  "lib/stripe": typeof lib_stripe;
  "lib/styles": typeof lib_styles;
  metrics: typeof metrics;
  pipeline: typeof pipeline;
  posting: typeof posting;
  storage: typeof storage;
  users: typeof users;
  videos: typeof videos;
  webhooks: typeof webhooks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
};
