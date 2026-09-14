import { getSupabase } from "./browser";

const bucket = "wiki-assets";
const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);
const maxBytes = 10 * 1024 * 1024;

export function validateWikiImage(file: File) {
  if (!allowedTypes.has(file.type)) throw new Error("PNG、JPEG、WebP、GIF、SVGのみアップロードできます。");
  if (file.size > maxBytes) throw new Error("画像は10MB以下にしてください。");
}

export async function uploadWikiImage(file: File) {
  validateWikiImage(file);
  const extension = ({
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  } as Record<string, string>)[file.type];
  const path = `wiki/${crypto.randomUUID()}.${extension}`;
  const { error } = await getSupabase().storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = getSupabase().storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl };
}
