import type { SupabaseClient } from "@supabase/supabase-js";

// Only accept paths inside the caller's own folder
export function cleanPhotoPaths(
  photos: string[] | undefined,
  userId: string,
): string[] | null {
  const list = (photos ?? []).slice(0, 4);
  const ok = list.every(
    (p) => typeof p === "string" && p.startsWith(`${userId}/`) && !p.includes(".."),
  );
  return ok ? list : null;
}

export function publicPhotoUrls(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[] | null | undefined,
) {
  return (paths ?? []).map(
    (p) => supabase.storage.from(bucket).getPublicUrl(p).data.publicUrl,
  );
}

// Private bucket: links that expire after an hour
export async function signedPhotoUrls(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[] | null | undefined,
) {
  if (!paths?.length) return [];
  const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, 3600);
  return (data ?? []).flatMap((d) => (d.signedUrl ? [d.signedUrl] : []));
}