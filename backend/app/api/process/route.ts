import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { refineImageWithOpenAiEdits } from "../../lib/openaiImageEdit";
import {
  applyGenderToFaceSlotTemplate,
  readThemeBackground,
  resolveFaceSlotTemplate,
  type FaceSlotTemplate
} from "../../lib/faceSlotTemplate";

export type ProcessProviderId = "openai-edit";

type ProcessSuccessJson = {
  success: true;
  provider: ProcessProviderId;
  resultImageDataUrl: string;
  resultImageUrl?: string;
  error?: undefined;
  fallbackReason?: string;
  processingTimeMs: number;
  usedFaceSlot: boolean;
  themeSlug: string;
  gender?: string;
  variant?: string;
  /** @deprecated use resultImageDataUrl */
  resultUrl: string;
  /** @deprecated use processingTimeMs */
  processingTime: number;
};

type ProcessErrorJson = {
  success: false;
  provider: ProcessProviderId;
  resultImageDataUrl?: string;
  resultImageUrl?: string;
  error: string;
  processingTimeMs: number;
  usedFaceSlot: boolean;
  themeSlug: string;
  gender?: string;
  variant?: string;
  resultUrl?: string;
  processingTime?: number;
  /** @deprecated same as error */
  message?: string;
  fallbackToOriginal?: boolean;
};

function decodeImageDataUrl(dataUrl: string): Buffer {
  const trimmed = dataUrl.trim();
  const comma = trimmed.indexOf(",");
  if (comma <= 0) throw new Error("Invalid imageDataUrl: missing comma");
  const header = trimmed.slice(0, comma);
  if (!/^data:image\/\w+;base64$/i.test(header)) {
    throw new Error("Invalid imageDataUrl: expected data:image/*;base64");
  }
  const b64 = trimmed.slice(comma + 1).replace(/\s/g, "");
  return Buffer.from(b64, "base64");
}

function normalizeProvider(value: unknown): ProcessProviderId {
  const s = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (s === "openai-edit" || s === "openai") return "openai-edit";
  return "openai-edit";
}

type Template = {
  slug: string;
  backgroundUrl: string;
  babyPosition: { x: number; y: number; width: number; height: number };
  shadowOffset: { x: number; y: number };
  shadowBlur: number;
  shadowOpacity: number;
  colorProfile: "warm" | "cool" | "neutral";
  rotation?: number;
  brightness?: number;
  saturation?: number;
};

const DEFAULT_TEMPLATE: Template = {
  slug: "teddy-bear-classic",
  backgroundUrl: "https://cdn.example.com/themes/teddy-bear-classic.jpg",
  babyPosition: { x: 0.5, y: 0.62, width: 0.5, height: 0.6 },
  shadowOffset: { x: 12, y: 20 },
  shadowBlur: 18,
  shadowOpacity: 0.3,
  colorProfile: "warm",
  brightness: 1,
  saturation: 1
};

type Matrix3x3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

function tintMatrix(profile: Template["colorProfile"]): Matrix3x3 {
  if (profile === "warm") {
    return [
      [1.05, 0, 0],
      [0, 1, 0],
      [0, 0, 0.95]
    ];
  }
  if (profile === "cool") {
    return [
      [0.95, 0, 0],
      [0, 1, 0],
      [0, 0, 1.05]
    ];
  }
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];
}

async function buildShadowLayer(
  cutoutPng: Buffer,
  width: number,
  height: number,
  template: Template
): Promise<Buffer> {
  const alpha = await sharp(cutoutPng).ensureAlpha().extractChannel("alpha").toBuffer();
  const opacity = Math.round(255 * template.shadowOpacity);
  return sharp(alpha)
    .threshold(10)
    .linear(opacity / 255, 0)
    .blur(template.shadowBlur)
    .resize(width, height, { fit: "contain" })
    .png()
    .toBuffer();
}

async function runComposite(
  sourceBuffer: Buffer,
  template: Template
): Promise<{ output: Buffer; width: number; height: number }> {
  let backgroundBuffer: Buffer;
  try {
    const backgroundResp = await fetch(template.backgroundUrl);
    if (!backgroundResp.ok) throw new Error("Background load failed");
    backgroundBuffer = Buffer.from(await backgroundResp.arrayBuffer());
    if (!backgroundBuffer.length) throw new Error("Background image is empty");
  } catch {
    // Temporary fallback while theme assets are still mocked URLs.
    const fallbackColor =
      template.colorProfile === "warm"
        ? { r: 248, g: 238, b: 224, alpha: 1 }
        : template.colorProfile === "cool"
          ? { r: 226, g: 236, b: 246, alpha: 1 }
          : { r: 240, g: 240, b: 240, alpha: 1 };
    backgroundBuffer = await sharp({
      create: {
        width: 1536,
        height: 1024,
        channels: 4,
        background: fallbackColor
      }
    })
      .jpeg({ quality: 95 })
      .toBuffer();
  }

  const bgMeta = await sharp(backgroundBuffer).metadata();
  const canvasWidth = bgMeta.width ?? 2048;
  const canvasHeight = bgMeta.height ?? 2048;

  const cutout = await sharp(sourceBuffer).png().toBuffer();
  const targetWidth = Math.round(canvasWidth * template.babyPosition.width);
  const targetHeight = Math.round(canvasHeight * template.babyPosition.height);

  const coloredCutout = await sharp(cutout)
    .resize(targetWidth, targetHeight, { fit: "contain" })
    .modulate({
      brightness: template.brightness ?? 1,
      saturation: template.saturation ?? 1
    })
    .recomb(tintMatrix(template.colorProfile))
    .rotate(template.rotation ?? 0, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const left = Math.round(canvasWidth * template.babyPosition.x - targetWidth / 2);
  const top = Math.round(canvasHeight * template.babyPosition.y - targetHeight / 2);

  const shadow = await buildShadowLayer(coloredCutout, targetWidth, targetHeight, template);

  const output = await sharp(backgroundBuffer)
    .composite([
      {
        input: shadow,
        left: left + template.shadowOffset.x,
        top: top + template.shadowOffset.y,
        blend: "multiply"
      },
      { input: coloredCutout, left, top, blend: "over" }
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  return { output, width: canvasWidth, height: canvasHeight };
}

async function extractFacePortrait(sourceBuffer: Buffer): Promise<Buffer> {
  const meta = await sharp(sourceBuffer).metadata();
  const srcW = meta.width ?? 0;
  const srcH = meta.height ?? 0;
  if (!srcW || !srcH) throw new Error("Invalid source image dimensions");

  // Large upper-centered square so more of the user's original framing is kept (local fallback path).
  const side = Math.max(96, Math.round(Math.min(srcW, srcH) * 0.9));
  const left = Math.max(0, Math.round((srcW - side) / 2));
  const top = Math.max(0, Math.round((srcH - side) * 0.06));
  const boundedTop = Math.min(top, Math.max(0, srcH - side));

  return sharp(sourceBuffer)
    .extract({ left, top: boundedTop, width: side, height: side })
    .modulate({ brightness: 1.02, saturation: 1.02 })
    .png()
    .toBuffer();
}

async function makeFeatheredFace(
  faceBuffer: Buffer,
  width: number,
  height: number,
  feather: number
): Promise<Buffer> {
  const featherPx = Math.max(2, Math.round(Math.min(width, height) * feather));
  const maskSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="fade" cx="50%" cy="44%" r="58%">
        <stop offset="${Math.max(0, 0.72 - feather)}" stop-color="white" stop-opacity="1"/>
        <stop offset="100%" stop-color="white" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="black"/>
    <ellipse cx="${Math.round(width / 2)}" cy="${Math.round(height * 0.5)}" rx="${Math.round(width * 0.48)}" ry="${Math.round(height * 0.48)}" fill="url(#fade)"/>
  </svg>`;

  const resizedFace = await sharp(faceBuffer).resize(width, height, { fit: "cover" }).png().toBuffer();

  return sharp(resizedFace)
    .composite([{ input: Buffer.from(maskSvg), blend: "dest-in" }])
    .blur(Math.max(0, featherPx * 0.05))
    .png()
    .toBuffer();
}

/** Local feather composite fallback with heuristic face crop only. */
async function buildFaceSlotLocalComposite(
  sourceBuffer: Buffer,
  template: FaceSlotTemplate
): Promise<{ output: Buffer; width: number; height: number }> {
  const backgroundBuffer = await readThemeBackground(template);
  const bgMeta = await sharp(backgroundBuffer).metadata();
  const canvasWidth = bgMeta.width ?? 1536;
  const canvasHeight = bgMeta.height ?? 1024;

  const faceRaw = await extractFacePortrait(sourceBuffer);
  const slotW = Math.round(canvasWidth * template.faceSlot.width);
  const slotH = Math.round(canvasHeight * template.faceSlot.height);
  const slotLeft = Math.round(canvasWidth * template.faceSlot.x - slotW / 2);
  const slotTop = Math.round(canvasHeight * template.faceSlot.y - slotH / 2);

  const faceLayer = await makeFeatheredFace(faceRaw, slotW, slotH, template.faceSlot.feather);
  const output = await sharp(backgroundBuffer)
    .composite([{ input: faceLayer, left: slotLeft, top: slotTop, blend: "over" }])
    .jpeg({ quality: 92 })
    .toBuffer();

  return { output, width: canvasWidth, height: canvasHeight };
}

async function runFaceSlotProcessing(
  sourceBuffer: Buffer,
  template: FaceSlotTemplate,
  _provider: ProcessProviderId,
  opts: { variant?: string }
): Promise<{
  output: Buffer;
  width: number;
  height: number;
  fallbackReason?: string;
}> {
  const themeBuffer = await readThemeBackground(template);
  const themeMeta = await sharp(themeBuffer).metadata();
  const tw = themeMeta.width ?? 1536;
  const th = themeMeta.height ?? 1024;

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (!openaiKey) {
    const local = await buildFaceSlotLocalComposite(sourceBuffer, template);
    return { ...local, fallbackReason: "openai-edit_skipped: OPENAI_API_KEY missing" };
  }
  try {
    const refined = await refineImageWithOpenAiEdits({
      apiKey: openaiKey,
      themeBaseBuffer: themeBuffer,
      selfieBuffer: sourceBuffer,
      faceSlot: template.faceSlot,
      variant: opts.variant
    });
    const output = await sharp(refined)
      .resize(tw, th, {
        fit: "contain",
        position: "centre",
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({ quality: 92 })
      .toBuffer();
    return { output, width: tw, height: th };
  } catch (err) {
    console.error("OPENAI_IMAGE_EDIT_FAILED_FALLBACK_TO_LOCAL", err);
    const local = await buildFaceSlotLocalComposite(sourceBuffer, template);
    const msg = err instanceof Error ? err.message : String(err);
    return { ...local, fallbackReason: `openai-edit_failed: ${msg}` };
  }
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  let requestedProvider: ProcessProviderId = "openai-edit";
  let themeSlugForLog = "";
  let genderForLog: string | undefined;
  let variantForLog: string | undefined;

  try {
    const body = await req.json();
    const {
      imageUrl,
      imageDataUrl,
      themeSlug,
      provider: providerRaw,
      gender,
      variant
    } = body as {
      imageUrl?: string;
      imageDataUrl?: string;
      themeSlug?: string;
      provider?: string;
      gender?: string;
      variant?: string;
    };

    themeSlugForLog = themeSlug ?? "";
    genderForLog = gender;
    variantForLog = variant;
    requestedProvider = normalizeProvider(providerRaw);

    const faceSlotResolved = themeSlug ? await resolveFaceSlotTemplate(themeSlug) : undefined;
    const usedFaceSlotEarly = !!faceSlotResolved;

    if (!themeSlug) {
      const err: ProcessErrorJson = {
        success: false,
        provider: requestedProvider,
        error: "Missing themeSlug",
        message: "Missing themeSlug",
        processingTimeMs: Date.now() - startedAt,
        usedFaceSlot: false,
        themeSlug: themeSlugForLog || "(missing)"
      };
      return NextResponse.json(err, { status: 400 });
    }

    const hasDataUrl = typeof imageDataUrl === "string" && imageDataUrl.length > 64;
    const hasUrl = typeof imageUrl === "string" && imageUrl.length > 0;
    if (!hasDataUrl && !hasUrl) {
      const err: ProcessErrorJson = {
        success: false,
        provider: requestedProvider,
        error: "Missing imageUrl or imageDataUrl",
        message: "Missing imageUrl or imageDataUrl",
        processingTimeMs: Date.now() - startedAt,
        usedFaceSlot: false,
        themeSlug: themeSlugForLog || "(missing)"
      };
      return NextResponse.json(err, { status: 400 });
    }

    let sourceBuffer: Buffer;
    if (hasDataUrl) {
      try {
        sourceBuffer = decodeImageDataUrl(imageDataUrl!);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const err: ProcessErrorJson = {
          success: false,
          provider: requestedProvider,
          error: "Invalid imageDataUrl",
          message: msg,
          processingTimeMs: Date.now() - startedAt,
          usedFaceSlot: usedFaceSlotEarly,
          themeSlug
        };
        return NextResponse.json(err, { status: 400 });
      }
    } else {
      const imageResp = await fetch(imageUrl!);
      if (!imageResp.ok) {
        const err: ProcessErrorJson = {
          success: false,
          provider: requestedProvider,
          error: "Unable to fetch source image",
          message: "Unable to fetch source image",
          processingTimeMs: Date.now() - startedAt,
          usedFaceSlot: usedFaceSlotEarly,
          themeSlug
        };
        return NextResponse.json(err, { status: 400 });
      }
      sourceBuffer = Buffer.from(await imageResp.arrayBuffer());
    }
    if (!sourceBuffer.length) {
      const err: ProcessErrorJson = {
        success: false,
        provider: requestedProvider,
        error: "Source image buffer is empty. Please choose another image.",
        message: "Source image buffer is empty. Please choose another image.",
        processingTimeMs: Date.now() - startedAt,
        usedFaceSlot: usedFaceSlotEarly,
        themeSlug
      };
      return NextResponse.json(err, { status: 400 });
    }

    const sourceMeta = await sharp(sourceBuffer).metadata();
    if (!sourceMeta.width || !sourceMeta.height) {
      const err: ProcessErrorJson = {
        success: false,
        provider: requestedProvider,
        error: "Face not detected / invalid image",
        message: "Face not detected / invalid image",
        processingTimeMs: Date.now() - startedAt,
        usedFaceSlot: usedFaceSlotEarly,
        themeSlug
      };
      return NextResponse.json(err, { status: 422 });
    }

    const faceSlotTemplate = faceSlotResolved
      ? applyGenderToFaceSlotTemplate(faceSlotResolved, gender)
      : undefined;
    const usedFaceSlot = !!faceSlotTemplate;

    let output: Buffer;
    let fallbackReason: string | undefined;

    if (faceSlotTemplate) {
      const r = await runFaceSlotProcessing(sourceBuffer, faceSlotTemplate, requestedProvider, {
        variant
      });
      output = r.output;
      fallbackReason = r.fallbackReason;
    } else {
      const composite = await runComposite(sourceBuffer, {
        ...DEFAULT_TEMPLATE,
        slug: themeSlug
      });
      output = composite.output;
      fallbackReason = undefined;
    }

    const processingTimeMs = Date.now() - startedAt;
    const resultImageDataUrl = `data:image/jpeg;base64,${output.toString("base64")}`;

    console.log(
      JSON.stringify({
        tag: "PROCESS_AB",
        themeSlug,
        provider: requestedProvider,
        usedFaceSlot,
        gender: gender ?? null,
        variant: variant ?? null,
        durationMs: processingTimeMs,
        fallbackReason: fallbackReason ?? null
      })
    );

    const successBody: ProcessSuccessJson = {
      success: true,
      provider: requestedProvider,
      resultImageDataUrl,
      processingTimeMs,
      usedFaceSlot,
      themeSlug,
      gender,
      variant,
      fallbackReason,
      resultUrl: resultImageDataUrl,
      processingTime: processingTimeMs
    };

    return NextResponse.json(successBody);
  } catch (error: any) {
    const processingTimeMs = Date.now() - startedAt;
    const msg =
      error?.message ?? "Processing failed. Returning original image is recommended.";
    console.error("PROCESS_API_ERROR", error);
    console.log(
      JSON.stringify({
        tag: "PROCESS_AB_ERROR",
        themeSlug: themeSlugForLog,
        provider: requestedProvider,
        gender: genderForLog ?? null,
        variant: variantForLog ?? null,
        usedFaceSlot: false,
        durationMs: processingTimeMs,
        error: msg
      })
    );

    const errBody: ProcessErrorJson = {
      success: false,
      provider: requestedProvider,
      error: msg,
      message: msg,
      processingTimeMs,
      usedFaceSlot: false,
      themeSlug: themeSlugForLog,
      gender: genderForLog,
      variant: variantForLog,
      resultUrl: "",
      processingTime: processingTimeMs,
      fallbackToOriginal: true
    };
    return NextResponse.json(errBody, { status: 500 });
  }
}
