import {NextResponse} from "next/server";
import {auth} from "@/auth";
import {prisma} from "@/lib/prisma";
import {storeUpload} from "@/lib/uploads";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({error: "No file uploaded"}, {status: 400});
  }

  try {
    const upload = await storeUpload(file);
    const asset = await prisma.mediaAsset.create({
      data: {
        filename: upload.filename,
        path: upload.path,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes,
      },
    });

    return NextResponse.json({asset});
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : "Upload failed"},
      {status: 400}
    );
  }
}
