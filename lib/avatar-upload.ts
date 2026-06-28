import "server-only";

import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const AVATAR_BUCKET = "child-avatars";
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

async function ensureAvatarBucket() {
  const supabase = createSupabaseAdminClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(listError.message);
  }

  const existingBucket = buckets.find((bucket) => bucket.name === AVATAR_BUCKET);

  if (existingBucket) {
    return supabase;
  }

  const { error } = await supabase.storage.createBucket(AVATAR_BUCKET, {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    fileSizeLimit: MAX_AVATAR_SIZE_BYTES,
    public: true,
  });

  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw new Error(error.message);
  }

  return supabase;
}

export async function uploadChildAvatar({
  childProfileId,
  familyId,
  file,
}: {
  childProfileId: string;
  familyId: string;
  file: File | null;
}) {
  if (!file || file.size === 0) {
    return null;
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error("Avatar images must be 5MB or smaller.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Avatar uploads must be image files.");
  }

  const supabase = await ensureAvatarBucket();
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({
      fit: "inside",
      height: 768,
      width: 768,
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  const objectPath = `${familyId}/${childProfileId}/${randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(objectPath, outputBuffer, {
      cacheControl: "3600",
      contentType: "image/webp",
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);

  return publicUrl;
}

export { AVATAR_BUCKET, MAX_AVATAR_SIZE_BYTES };
