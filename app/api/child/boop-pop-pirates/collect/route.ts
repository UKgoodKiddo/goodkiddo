import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isBoopPopPiratesCollectibleId,
  type BoopPopPiratesCollectibleId,
} from "@/lib/boop-pop-pirates";
import { persistBoopPopPiratesCollectible } from "@/lib/boop-pop-pirates-server";

const collectSchema = z.object({
  collectibleId: z.string().refine(isBoopPopPiratesCollectibleId, {
    message: "Unknown collectible id.",
  }),
});

export async function POST(request: Request) {
  const parsed = collectSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
      },
      { status: 400 },
    );
  }

  try {
    const result = await persistBoopPopPiratesCollectible(
      parsed.data.collectibleId as BoopPopPiratesCollectibleId,
    );

    return NextResponse.json({
      alreadyCollected: result.alreadyCollected,
      collectibleId: parsed.data.collectibleId,
      ok: true,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
      },
      { status: 500 },
    );
  }
}
