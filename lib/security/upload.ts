/**
 * Upload validation (P16 security pass): type whitelist + size cap + the AV
 * hook every stored file passes through. The scanner is a pass-through until a
 * provider is wired (launch checklist item) — the HOOK exists so wiring one is
 * a one-function change, not a refactor.
 */

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_DOC_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB decoded

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export interface ValidatedUpload {
  buffer: Buffer;
  contentType: string;
}

/** Validate a data-URL upload (camera evidence). Throws on anything off. */
export function validateDataUrlUpload(dataUrl: string, kind: "image" | "document" = "image"): ValidatedUpload {
  const m = dataUrl.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!m) throw new UploadValidationError("That file didn't come through properly — try taking the photo again.");
  const contentType = m[1].toLowerCase();
  const allowed = kind === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;
  if (!allowed.has(contentType)) {
    throw new UploadValidationError("That file type isn't supported here — use a photo (JPG or PNG).");
  }
  const buffer = Buffer.from(m[2], "base64");
  if (buffer.length === 0) throw new UploadValidationError("The file came through empty — try again.");
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError("That file is too large — photos are plenty at normal quality.");
  }
  // Magic-byte sanity: the declared type must match the bytes.
  const magicOk =
    (contentType === "image/jpeg" && buffer[0] === 0xff && buffer[1] === 0xd8) ||
    (contentType === "image/png" && buffer[0] === 0x89 && buffer[1] === 0x50) ||
    (contentType === "image/webp" && buffer.slice(8, 12).toString("ascii") === "WEBP") ||
    (contentType === "application/pdf" && buffer.slice(0, 4).toString("ascii") === "%PDF");
  if (!magicOk) throw new UploadValidationError("That file doesn't look like what it says it is — try again.");
  return { buffer, contentType };
}

/**
 * AV scan hook. Pass-through until a provider is configured (AV_SCAN_URL) —
 * the launch checklist tracks wiring it. Fails CLOSED when a provider is set
 * but unreachable.
 */
export async function scanUpload(upload: ValidatedUpload): Promise<ValidatedUpload> {
  const scanUrl = process.env.AV_SCAN_URL;
  if (!scanUrl) return upload; // no provider configured — hook is in place
  const res = await fetch(scanUrl, {
    method: "POST",
    headers: { "Content-Type": upload.contentType },
    body: new Uint8Array(upload.buffer),
  });
  if (!res.ok) throw new UploadValidationError("The file couldn't be checked just now — try again in a moment.");
  const verdict = (await res.json()) as { clean?: boolean };
  if (!verdict.clean) throw new UploadValidationError("That file failed our safety check and wasn't stored.");
  return upload;
}
