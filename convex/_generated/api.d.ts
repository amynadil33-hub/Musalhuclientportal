/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_dhivehiCopy from "../ai/dhivehiCopy.js";
import type * as ai_imageGeneration from "../ai/imageGeneration.js";
import type * as ai_kling from "../ai/kling.js";
import type * as ai_providerHealth from "../ai/providerHealth.js";
import type * as ai_storage from "../ai/storage.js";
import type * as auth from "../auth.js";
import type * as brandAssets from "../brandAssets.js";
import type * as brandProfiles from "../brandProfiles.js";
import type * as campaigns from "../campaigns.js";
import type * as clients from "../clients.js";
import type * as dhivehiCompositions from "../dhivehiCompositions.js";
import type * as dhivehiExports from "../dhivehiExports.js";
import type * as dhivehiFonts from "../dhivehiFonts.js";
import type * as dhivehiPhrases from "../dhivehiPhrases.js";
import type * as http from "../http.js";
import type * as imageGenerations from "../imageGenerations.js";
import type * as products from "../products.js";
import type * as reels from "../reels.js";
import type * as settings from "../settings.js";
import type * as targetAudiences from "../targetAudiences.js";
import type * as users from "../users.js";
import type * as videoJobs from "../videoJobs.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/dhivehiCopy": typeof ai_dhivehiCopy;
  "ai/imageGeneration": typeof ai_imageGeneration;
  "ai/kling": typeof ai_kling;
  "ai/providerHealth": typeof ai_providerHealth;
  "ai/storage": typeof ai_storage;
  auth: typeof auth;
  brandAssets: typeof brandAssets;
  brandProfiles: typeof brandProfiles;
  campaigns: typeof campaigns;
  clients: typeof clients;
  dhivehiCompositions: typeof dhivehiCompositions;
  dhivehiExports: typeof dhivehiExports;
  dhivehiFonts: typeof dhivehiFonts;
  dhivehiPhrases: typeof dhivehiPhrases;
  http: typeof http;
  imageGenerations: typeof imageGenerations;
  products: typeof products;
  reels: typeof reels;
  settings: typeof settings;
  targetAudiences: typeof targetAudiences;
  users: typeof users;
  videoJobs: typeof videoJobs;
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

export declare const components: {};
