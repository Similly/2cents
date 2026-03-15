import {readFile} from "node:fs/promises";
import path from "node:path";
import {NextResponse} from "next/server";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function getUploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
}

export async function GET(_req: Request, {params}: {params: Promise<{filename: string}>}) {
  const {filename: rawFilename} = await params;
  const filename = decodeURIComponent(rawFilename || "");

  if (!filename || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json({error: "Invalid filename"}, {status: 400});
  }

  const uploadDir = getUploadDir();
  const filePath = path.join(uploadDir, filename);

  try {
    const bytes = await readFile(filePath);
    const extension = path.extname(filename).toLowerCase();
    const contentType = MIME_BY_EXTENSION[extension] || "application/octet-stream";

    return new NextResponse(bytes, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType,
      },
      status: 200,
    });
  } catch {
    return NextResponse.json({error: "Not found"}, {status: 404});
  }
}

