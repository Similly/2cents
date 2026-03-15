import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function storeUpload(file: File) {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error("Ungültiger Dateityp.");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("Datei zu groß (max. 5 MB).");
  }

  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, {recursive: true});

  const extension = file.name.split(".").pop() || "bin";
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const targetPath = path.join(uploadDir, fileName);

  const bytes = await file.arrayBuffer();
  await writeFile(targetPath, Buffer.from(bytes));

  return {
    filename: fileName,
    path: `/uploads/${fileName}`,
    sizeBytes: file.size,
    mimeType: file.type,
  };
}
