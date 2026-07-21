"use node";

import { action, type ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
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

async function storeImage(
  ctx: ActionCtx,
  base64: string,
) {
  const uploadUrl: string = await ctx.runMutation(
    internal.ai.storage.generateUploadUrl,
    {},
  );
  const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: new Blob([bytes], { type: "image/png" }),
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `Could not store generated image (${uploadResponse.status})`,
    );
  }

  const { storageId } = (await uploadResponse.json()) as {
    storageId: Id<"_storage">;
  };
  const url: string | null = await ctx.runQuery(internal.ai.storage.getUrl, {
    storageId,
  });
  if (!url) throw new Error("Could not resolve generated image URL");
  return url;
}

export const generateImages = action({
  args: {
    prompt: v.string(),
    n: v.number(),
    quality: v.optional(v.string()),
    size: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ urls: string[] }> => {
    await requireUser(ctx);
    const openai = getOpenAI();

    const response = await openai.images.generate({
      model: "gpt-image-2",
      prompt: args.prompt,
      n: Math.min(args.n, 4),
      quality:
        args.quality === "hd" || args.quality === "high" ? "high" : "medium",
      size: args.size ?? "1024x1024",
    });

    const images = (response.data ?? [])
      .map((image) => image.b64_json)
      .filter((image): image is string => Boolean(image));
    const urls = await Promise.all(
      images.map((image) => storeImage(ctx, image)),
    );

    if (urls.length === 0) {
      throw new ConvexError({
        message: "OpenAI returned no image data",
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }

    return { urls };
  },
});

export const editImage = action({
  args: {
    imageUrl: v.string(),
    prompt: v.string(),
    size: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    await requireUser(ctx);
    const openai = getOpenAI();

    // Fetch the image and convert to a buffer
    const imageResponse = await fetch(args.imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageFile = new File([imageBuffer], "image.png", {
      type: "image/png",
    });

    const response = await openai.images.edit({
      model: "gpt-image-2",
      image: imageFile,
      prompt: args.prompt,
      size: args.size ?? "1024x1024",
    });

    const base64 = (response.data ?? [])[0]?.b64_json;
    if (!base64)
      throw new ConvexError({
        message: "No image returned",
        code: "EXTERNAL_SERVICE_ERROR",
      });
    const url = await storeImage(ctx, base64);

    return { url };
  },
});

export const composePrompt = action({
  args: {
    brandProfile: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    campaignInfo: v.optional(v.string()),
    campaignMemory: v.optional(v.string()),
    selectedProduct: v.optional(v.string()),
    platform: v.optional(v.string()),
    staffInstruction: v.string(),
    avoidList: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ fullPrompt: string }> => {
    await requireUser(ctx);
    const openai = getOpenAI();

    const systemContext = `You are a professional advertising prompt engineer for a premium creative agency.
You write precise, detailed prompts for AI image generation that maintain strict brand consistency.
Always output a single coherent image generation prompt, not instructions or commentary.`;

    const userMessage = `Create a detailed image generation prompt combining the following brand information:

BRAND PROFILE: ${args.brandProfile ?? "Not provided"}
TARGET AUDIENCE: ${args.targetAudience ?? "Not provided"}
CAMPAIGN INFO: ${args.campaignInfo ?? "Not provided"}
CAMPAIGN CREATIVE MEMORY: ${args.campaignMemory ?? "Not provided"}
SELECTED PRODUCT/SERVICE: ${args.selectedProduct ?? "Not provided"}
PLATFORM/FORMAT: ${args.platform ?? "Not specified"}
STAFF INSTRUCTION: ${args.staffInstruction}
AVOID: ${args.avoidList ?? "Nothing specified"}

Write a single detailed prompt (2-4 sentences) for AI image generation that:
- Reflects the brand visual style and personality
- Matches the campaign mood and visual direction
- Features the product/service naturally
- Is optimized for the platform format
- Avoids any listed negative elements
Output only the prompt text, nothing else.`;

    const model = "gpt-5-mini";
    const requestPayload = {
      model,
      messages: [
        { role: "system" as const, content: systemContext },
        { role: "user" as const, content: userMessage },
      ],
    };

    try {
      console.log("PROMPT COMPOSER REQUEST", {
        apiMethod: "chat.completions.create",
        model,
        hasMaxTokens: "max_tokens" in requestPayload,
        hasMaxCompletionTokens: "max_completion_tokens" in requestPayload,
        hasMaxOutputTokens: "max_output_tokens" in requestPayload,
      });

      const response =
        await openai.chat.completions.create(requestPayload);
      const composedPrompt =
        response.choices[0]?.message?.content ?? args.staffInstruction;

      console.log("PROMPT COMPOSER COMPLETED", {
        outputLength: composedPrompt.length,
      });

      return { fullPrompt: composedPrompt };
    } catch (error) {
      const openAIError = error as {
        status?: unknown;
        code?: unknown;
        type?: unknown;
        message?: unknown;
        param?: unknown;
      };

      console.error("PROMPT COMPOSER FAILED", {
        status: openAIError?.status,
        code: openAIError?.code,
        type: openAIError?.type,
        message: openAIError?.message,
        param: openAIError?.param,
      });

      throw new ConvexError({
        message:
          typeof openAIError?.message === "string"
            ? openAIError.message
            : "OpenAI prompt composer failed",
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }
  },
});
