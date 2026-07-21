"use node";

import OpenAI from "openai";
import { action } from "../_generated/server";
import { ConvexError } from "convex/values";

function safeMessage(value: unknown) {
  if (value instanceof Error) return value.message.slice(0, 300);
  return String(value).slice(0, 300);
}

export const checkProviders = action({
  args: {},
  handler: async (ctx) => {
    if (!(await ctx.auth.getUserIdentity())) {
      throw new ConvexError({
        message: "Unauthenticated",
        code: "UNAUTHENTICATED",
      });
    }
    const openAIKey = process.env.OPENAI_API_KEY;
    const klingKey = process.env.KLING_API_KEY;
    const klingBaseUrl = (
      process.env.KLING_API_BASE_URL ?? "https://api.klingai.com"
    ).replace(/\/$/, "");

    let openai: { ok: boolean; message: string };
    if (!openAIKey) {
      openai = { ok: false, message: "OPENAI_API_KEY is not configured" };
    } else {
      try {
        const client = new OpenAI({ apiKey: openAIKey });
        const [imageModel, textModel] = await Promise.all([
          client.models.retrieve("gpt-image-2"),
          client.models.retrieve("gpt-5-mini"),
        ]);
        openai = {
          ok: true,
          message: `Connected; ${imageModel.id} and ${textModel.id} are available`,
        };
      } catch (error) {
        openai = { ok: false, message: safeMessage(error) };
      }
    }

    let kling: { ok: boolean; status?: number; message: string };
    if (!klingKey) {
      kling = { ok: false, message: "KLING_API_KEY is not configured" };
    } else {
      try {
        const response = await fetch(
          `${klingBaseUrl}/v1/videos/image2video?pageNum=1&pageSize=1`,
          { headers: { Authorization: `Bearer ${klingKey}` } },
        );
        const body = (await response.text()).slice(0, 500);
        kling = {
          ok: response.ok,
          status: response.status,
          message: response.ok ? "Connected to Kling API" : body,
        };
      } catch (error) {
        kling = { ok: false, message: safeMessage(error) };
      }
    }

    return { openai, kling, klingBaseUrl };
  },
});
