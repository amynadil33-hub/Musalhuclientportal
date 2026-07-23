"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import OpenAI from "openai";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ConvexError({
      message: "OPENAI_API_KEY is not configured",
      code: "CONFIGURATION_ERROR",
    });
  }
  return new OpenAI({ apiKey });
}

async function requireUser(ctx: {
  auth: { getUserIdentity: () => Promise<unknown> };
}) {
  if (!(await ctx.auth.getUserIdentity())) {
    throw new ConvexError({
      message: "Unauthenticated",
      code: "UNAUTHENTICATED",
    });
  }
}

/**
 * Suggests structured Dhivehi advertising copy. The AI output is treated as a
 * DRAFT only — it must be reviewed and approved by staff before final export.
 * The model never returns an image, only logical-order Unicode Thaana text.
 */
export const suggestCopy = action({
  args: {
    englishBrief: v.string(),
    tone: v.optional(v.string()),
    industry: v.optional(v.string()),
    brandContext: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    headline: string;
    subheadline: string;
    offer: string;
    cta: string;
    caption: string;
  }> => {
    await requireUser(ctx);
    const openai = getOpenAI();

    const system = `You are a professional Dhivehi (Thaana) advertising copywriter for a Maldivian creative agency.
You write natural, correct, culturally appropriate Dhivehi in proper logical-order Unicode Thaana script.
Rules:
- Output ONLY valid Dhivehi Unicode text in the Dhivehi fields (never transliteration, never reversed characters).
- Keep numbers, prices, phone numbers and Latin brand names in their original left-to-right form.
- Never return an image or any description of an image. Return text only.
- Respond with a strict JSON object with keys: headline, subheadline, offer, cta, caption.`;

    const user = `Write short Dhivehi advertising copy for the following brief.
BRIEF (English): ${args.englishBrief}
TONE: ${args.tone ?? "professional"}
INDUSTRY: ${args.industry ?? "general"}
BRAND CONTEXT: ${args.brandContext ?? "none"}

Return JSON only:
{
  "headline": "short punchy Dhivehi headline",
  "subheadline": "supporting Dhivehi line",
  "offer": "the offer in Dhivehi (keep any price/number LTR)",
  "cta": "short Dhivehi call to action",
  "caption": "a longer Dhivehi social caption"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return {
        headline: String(parsed.headline ?? ""),
        subheadline: String(parsed.subheadline ?? ""),
        offer: String(parsed.offer ?? ""),
        cta: String(parsed.cta ?? ""),
        caption: String(parsed.caption ?? ""),
      };
    } catch (error) {
      const openAIError = error as { message?: unknown };
      throw new ConvexError({
        message:
          typeof openAIError?.message === "string"
            ? openAIError.message
            : "Dhivehi copy suggestion failed",
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }
  },
});
