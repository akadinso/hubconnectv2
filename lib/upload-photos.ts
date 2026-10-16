import { createClient } from "@/lib/supabase/client";

export const MAX_PHOTOS = 4;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type Bucket = "review-photos" | "report-photos";

export function validatePhoto(file: File): string | null {
  if (!(file.type in EXT)) return "Only JPG, PNG or WebP images are allowed.";
  if (file.size > MAX_PHOTO_BYTES) return "Each photo must be under 5MB.";
  return null;
}

export async function uploadPhotos(
  bucket: Bucket,
  files: File[],
): Promise<{ paths: string[] } | { error: string }> {
  if (files.length === 0) return { paths: [] };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const paths: string[] = [];

  for (const file of files) {
    const path = `${user.id}/${crypto.randomUUID()}.${EXT[file.type]}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type });

    if (error) {
      if (paths.length) await supabase.storage.from(bucket).remove(paths);
      return { error: error.message };
    }
    paths.push(path);
  }

  return { paths };
}

// Used to clean up if saving the report or review fails after the upload
export async function removePhotos(bucket: Bucket, paths: string[]) {
  if (paths.length === 0) return;
  await createClient().storage.from(bucket).remove(paths);
}