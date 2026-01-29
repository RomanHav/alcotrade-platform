export function extractCloudinaryPublicId(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const path = u.pathname;

    // Match both image and video formats
    const re =
      /\/upload(?:\/[^/]+)*\/v\d+\/(.+?)(?:\.(?:jpg|jpeg|png|gif|webp|svg|heic|heif|tif|tiff|bmp|ico|mp4|webm|mov|avi|mkv|flv|wmv|m4v))$/i;
    const m = path.match(re);
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    const re =
      /\/upload(?:\/[^/]+)*\/v\d+\/(.+?)(?:\.(?:jpg|jpeg|png|gif|webp|svg|heic|heif|tif|tiff|bmp|ico|mp4|webm|mov|avi|mkv|flv|wmv|m4v))$/i;
    const m = String(url).match(re);
    return m ? decodeURIComponent(m[1]) : null;
  }
}
