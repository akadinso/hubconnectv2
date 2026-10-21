const BUCKET = "listing-images";

// Turns a stored public URL back into the file's path inside the bucket
export function listingImagePath(url: string | null | undefined) {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1
    ? null
    : decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}