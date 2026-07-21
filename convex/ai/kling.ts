"use node";

import { action, type ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { ConvexError, v } from "convex/values";

type KlingTask = {
  task_id?: string;
  task_status?: string;
  task_status_msg?: string;
  task_result?: { videos?: Array<{ url?: string }> };
};

type KlingResponse = {
  code?: number;
  message?: string;
  task_id?: string;
  status?: string;
  video_url?: string;
  output?: { url?: string };
  data?: KlingTask;
};

function getConfig() {
  const apiKey = process.env.KLING_API_KEY;
  if (!apiKey) {
    throw new ConvexError({
      message: "KLING_API_KEY is not configured",
      code: "CONFIGURATION_ERROR",
    });
  }
  return {
    apiKey,
    baseUrl: (
      process.env.KLING_API_BASE_URL ?? "https://api.klingai.com"
    ).replace(/\/$/, ""),
    model: process.env.KLING_VIDEO_MODEL ?? "kling-v2-6",
  };
}

async function requireUser(ctx: ActionCtx) {
  if (!(await ctx.auth.getUserIdentity())) {
    throw new ConvexError({
      message: "Unauthenticated",
      code: "UNAUTHENTICATED",
    });
  }
}

async function klingRequest(path: string, init?: RequestInit) {
  const { apiKey, baseUrl } = getConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const text = await response.text();
  let body: KlingResponse;
  try {
    body = JSON.parse(text) as KlingResponse;
  } catch {
    throw new Error(`Kling returned ${response.status}: ${text.slice(0, 300)}`);
  }

  if (!response.ok || (body.code !== undefined && body.code !== 0)) {
    throw new Error(
      `Kling returned ${response.status}: ${body.message ?? text.slice(0, 300)}`,
    );
  }
  return body;
}

function taskFrom(body: KlingResponse): KlingTask {
  return (
    body.data ?? {
      task_id: body.task_id,
      task_status: body.status,
    }
  );
}

function taskStatus(body: KlingResponse) {
  const task = taskFrom(body);
  return (task.task_status ?? body.status ?? "processing").toLowerCase();
}

function taskOutputUrl(body: KlingResponse) {
  const task = taskFrom(body);
  return (
    task.task_result?.videos?.[0]?.url ??
    body.output?.url ??
    body.video_url ??
    null
  );
}

async function persistVideo(
  ctx: ActionCtx,
  sourceUrl: string,
): Promise<{ url: string; storageId: Id<"_storage"> }> {
  const source = await fetch(sourceUrl);
  if (!source.ok) {
    throw new Error(`Could not download Kling video (${source.status})`);
  }
  const contentType = source.headers.get("content-type") ?? "video/mp4";
  const uploadUrl: string = await ctx.runMutation(
    internal.ai.storage.generateUploadUrl,
    {},
  );
  const upload = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: await source.blob(),
  });
  if (!upload.ok) {
    throw new Error(`Could not store Kling video (${upload.status})`);
  }
  const { storageId } = (await upload.json()) as {
    storageId: Id<"_storage">;
  };
  const url: string | null = await ctx.runQuery(internal.ai.storage.getUrl, {
    storageId,
  });
  if (!url) throw new Error("Could not resolve stored video URL");
  return { url, storageId };
}

export const generateVideo = action({
  args: {
    imageUrl: v.string(),
    prompt: v.string(),
    duration: v.number(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    taskId: string;
    outputUrl: string;
    storageId: Id<"_storage">;
  }> => {
    await requireUser(ctx);
    const { model } = getConfig();
    const duration = args.duration <= 5 ? "5" : "10";
    const created = await klingRequest("/v1/videos/image2video", {
      method: "POST",
      body: JSON.stringify({
        model_name: model,
        image: args.imageUrl,
        prompt: args.prompt,
        mode: "std",
        duration,
      }),
    });
    const taskId = taskFrom(created).task_id ?? created.task_id;
    if (!taskId) throw new Error("Kling did not return a task ID");

    for (let attempt = 0; attempt < 96; attempt += 1) {
      if (attempt > 0)
        await new Promise((resolve) => setTimeout(resolve, 5000));
      const result = await klingRequest(`/v1/videos/image2video/${taskId}`);
      const status = taskStatus(result);
      if (["succeed", "succeeded", "completed", "complete"].includes(status)) {
        const outputUrl = taskOutputUrl(result);
        if (!outputUrl) throw new Error("Kling completed without a video URL");
        const stored = await persistVideo(ctx, outputUrl);
        return { taskId, outputUrl: stored.url, storageId: stored.storageId };
      }
      if (["failed", "error", "cancelled", "canceled"].includes(status)) {
        throw new Error(
          taskFrom(result).task_status_msg ?? `Kling generation ${status}`,
        );
      }
    }

    throw new Error("Kling generation timed out after 8 minutes");
  },
});
