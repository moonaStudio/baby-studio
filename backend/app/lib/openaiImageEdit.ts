import sharp from "sharp";

const OPENAI_EDITS_URL = "https://api.openai.com/v1/images/edits";

/** `gpt-image-1.5` (default) or `gpt-image-1` — set `OPENAI_IMAGE_EDIT_MODEL` to override. */
function resolveEditModel(): string {
  return process.env.OPENAI_IMAGE_EDIT_MODEL?.trim() || "gpt-image-1.5";
}

const OPENAI_FACE_EDIT_PROMPT =
  "Keep the first image exactly the same. Use the second image only as the face reference. " +
  "The second image is the user's original photo (full frame, not tightly cropped); use it for identity, expression, and skin tone. " +
  "Replace only the baby face inside the transparent mask area with the face from the second image. " +
  "Preserve the body, pose, clothes, background, props, colors, and lighting from the first image. " +
  "Do not modify anything outside the masked face area. " +
  "Ensure the replaced face matches the original baby head size and body proportions. " +
  "Make the result photorealistic, seamless, and natural. " +
  "Ensure the face is slightly smaller and positioned naturally within the baby's head, matching the original body proportions.";

type FaceSlotRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Face reference for edits API: relaxed crop from selfie (not full frame) for API size limits.
 */
async function buildSelfieFaceReference(selfieBuffer: Buffer): Promise<Buffer> {
  const normalized = sharp(selfieBuffer).rotate();
  const meta = await normalized.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) {
    throw new Error("Invalid selfie dimensions");
  }

  const cropW = Math.round(Math.min(w, h) * 0.75);
  const cropH = Math.round(Math.min(w, h) * 0.85);
  const left = clamp(Math.round((w - cropW) / 2), 0, Math.max(0, w - cropW));
  const top = clamp(Math.round(h * 0.1), 0, Math.max(0, h - cropH));

  return normalized
    .extract({ left, top, width: cropW, height: cropH })
    .png()
    .toBuffer();
}

/**
 * PNG mask, same pixel size as the theme base.
 * Fully transparent pixels = editable region (baby face). Opaque elsewhere.
 */
async function buildFaceMaskPng(
  canvasWidth: number,
  canvasHeight: number,
  faceSlot: FaceSlotRect
): Promise<Buffer> {
  const slotW = Math.round(canvasWidth * faceSlot.width);
  const slotH = Math.round(canvasHeight * faceSlot.height);
  const slotLeft = Math.round(canvasWidth * faceSlot.x - slotW / 2);
  const slotTop = Math.round(canvasHeight * faceSlot.y - slotH / 2);
  const cx = slotLeft + slotW / 2;
  const cy = slotTop + slotH / 2 + slotH * 0.05;
  // Slightly shrink edit region so generated face better matches body proportions.
  const rx = Math.max(8, (slotW / 2) * 0.82);
  const ry = Math.max(8, (slotH / 2) * 0.82);

  const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
  <defs>
    <mask id="hole">
      <rect width="100%" height="100%" fill="white"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="black"/>
    </mask>
  </defs>
  <rect width="100%" height="100%" fill="white" mask="url(#hole)"/>
</svg>`;

  return sharp(Buffer.from(maskSvg)).ensureAlpha().png().toBuffer();
}

/**
 * OpenAI `POST /v1/images/edits` with GPT Image models:
 * - `image[]`: first = theme/base, second = selfie (face reference)
 * - `mask`: same dimensions as first image; transparent = edit region
 * - `input_fidelity`: high
 */
export async function refineImageWithOpenAiEdits(options: {
  apiKey: string;
  /** Theme / studio template (first image). */
  themeBaseBuffer: Buffer;
  /** User upload / selfie (second image, face reference only). */
  selfieBuffer: Buffer;
  faceSlot: FaceSlotRect;
  model?: string;
  variant?: string;
}): Promise<Buffer> {
  const { apiKey, themeBaseBuffer, selfieBuffer, faceSlot, variant } = options;
  const model = options.model?.trim() || resolveEditModel();

  const baseMeta = await sharp(themeBaseBuffer).metadata();
  const w = baseMeta.width ?? 0;
  const h = baseMeta.height ?? 0;
  if (!w || !h) {
    throw new Error("Invalid theme base image dimensions");
  }

  const themePng = await sharp(themeBaseBuffer).png().toBuffer();
  const selfiePng = await buildSelfieFaceReference(selfieBuffer);

  const maskPng = await buildFaceMaskPng(w, h, faceSlot);
  const maskMeta = await sharp(maskPng).metadata();
  if (maskMeta.width !== w || maskMeta.height !== h) {
    throw new Error(`Mask size ${maskMeta.width}x${maskMeta.height} must match base ${w}x${h}`);
  }

  const prompt = [
    OPENAI_FACE_EDIT_PROMPT,
    variant?.trim() ? `Variant note: ${variant.trim()}.` : ""
  ]
    .filter(Boolean)
    .join(" ");

  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("input_fidelity", "high");
  form.append("quality", "high");
  form.append("output_format", "jpeg");
  form.append("n", "1");
  form.append("size", "auto");

  form.append("image[]", new File([new Uint8Array(themePng)], "theme.png", { type: "image/png" }));
  form.append("image[]", new File([new Uint8Array(selfiePng)], "selfie.png", { type: "image/png" }));
  form.append("mask", new File([new Uint8Array(maskPng)], "mask.png", { type: "image/png" }));

  const resp = await fetch(OPENAI_EDITS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  });

  const raw = await resp.text();
  if (!resp.ok) {
    throw new Error(`OpenAI images/edits failed (${resp.status}): ${raw.slice(0, 1200)}`);
  }

  let parsed: { data?: Array<{ b64_json?: string; url?: string }> };
  try {
    parsed = JSON.parse(raw) as { data?: Array<{ b64_json?: string; url?: string }> };
  } catch {
    throw new Error("OpenAI images/edits returned non-JSON body");
  }

  const first = parsed.data?.[0];
  if (first?.b64_json) {
    const buf = Buffer.from(first.b64_json, "base64");
    if (!buf.length) throw new Error("OpenAI returned empty b64 image");
    return buf;
  }
  if (first?.url) {
    const img = await fetch(first.url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!img.ok) {
      const fb = await fetch(first.url);
      if (!fb.ok) throw new Error(`OpenAI output URL fetch failed (${img.status})`);
      return Buffer.from(await fb.arrayBuffer());
    }
    const buf = Buffer.from(await img.arrayBuffer());
    if (!buf.length) throw new Error("OpenAI output image is empty");
    return buf;
  }

  throw new Error("OpenAI images/edits returned no image data");
}
