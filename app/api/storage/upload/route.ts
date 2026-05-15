import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/storage/upload
 * Accepts multipart/form-data with a `file` field.
 * If OG_PRIVATE_KEY is set, uploads to 0G Storage via og-storage-utils.
 * Otherwise returns a deterministic dev-mode hash based on file content.
 */
export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  const ogPrivateKey = process.env.OG_PRIVATE_KEY;

  if (!ogPrivateKey) {
    // Dev / stub mode — return deterministic mock hash from first 32 bytes of content
    const mockHash =
      "0x" +
      Array.from(bytes.slice(0, 32))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .padEnd(64, "0");

    return Response.json({
      rootHash: mockHash,
      txHash: mockHash,
      mock: true,
      note: "Set OG_PRIVATE_KEY env var and install @0gfoundation/0g-storage-ts-sdk for real uploads",
    });
  }

  // Real 0G upload — requires:
  //   npm install @0gfoundation/0g-storage-ts-sdk ethers
  // then add to og-storage-utils or inline here.
  try {
    // Dynamic import to avoid breaking builds where SDK is not installed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storage = await import("../../../../og-storage-utils/src/storage" as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const configMod = await import("../../../../og-storage-utils/src/config" as any);
    const config = configMod.getConfig();
    const result = await storage.uploadData(bytes, config);
    return Response.json({ rootHash: result.rootHash, txHash: result.txHash });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: "0G upload failed", detail: message },
      { status: 500 },
    );
  }
}
