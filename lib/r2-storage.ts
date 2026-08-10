export interface R2StorageResult {
  key: string;
  url: string;
  size: number;
  etag: string;
  uploadedAt: string;
}

export async function uploadDiagnosticAssetToR2(
  file: File,
  encounterId: string,
  envBucket?: R2Bucket
): Promise<R2StorageResult> {
  const timestamp = Date.now();
  const fileExt = file.name.endsWith(".png") ? "png" : "jpg";
  const key = `encounters/${encounterId}/diagnostics/${timestamp}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
  const uploadedAt = new Date().toISOString();

  // Calculate SHA-256 checksum
  const buffer = await file.arrayBuffer();
  const digestBytes = await crypto.subtle.digest("SHA-256", buffer);
  const etag = Array.from(new Uint8Array(digestBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (envBucket) {
    await envBucket.put(key, buffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        encounterId,
        checksum: etag,
        originalFilename: file.name,
      },
    });
    return {
      key,
      url: `/api/sync/binary?key=${encodeURIComponent(key)}`,
      size: file.size,
      etag,
      uploadedAt,
    };
  }

  // Fallback for local development/testing without live Cloudflare R2 binding
  return {
    key,
    url: `data:${file.type};base64,${Buffer.from(buffer).toString("base64")}`,
    size: file.size,
    etag,
    uploadedAt,
  };
}
