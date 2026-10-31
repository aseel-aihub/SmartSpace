/* ============================================================================
   colorAnalysis.js — Real client-side room photo analysis.

   HONEST SCOPE NOTE: this performs genuine pixel analysis (colour-histogram
   dominant-colour extraction + HSL statistics) directly on the uploaded photo
   using the Canvas API. It is a lightweight heuristic, not a trained deep-
   learning model — consistent with the GP1 report's scoping (Section 1.6/2.4):
   a full CNN-based style classifier is future GP2/production work; this
   prototype demonstrates the same input→output contract (photo in, palette +
   style label out) with a technique that runs entirely in the browser.
   ========================================================================= */


/**
 * Analyze an <img> element already loaded into the DOM.
 * Returns { palette: [hex,...], avgHue, avgSat, avgLight, styleLabel, styleTag, warmth }
 */
function analyzeRoomImage(imgEl) {
  const SAMPLE = 120; // downscale for speed; colour statistics don't need full resolution
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(imgEl, 0, 0, SAMPLE, SAMPLE);

  let pixels;
  try {
    pixels = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
  } catch (err) {
    // Canvas is "tainted" (rare for local file: blobs, but guard anyway).
    return null;
  }

  // ---- 1. Colour-histogram dominant-colour extraction ----
  // Quantize each channel to 8 buckets (0,32,64,...224) -> up to 512 bins.
  // This is the standard lightweight alternative to k-means for in-browser use.
  const buckets = new Map();
  let rSum = 0, gSum = 0, bSum = 0, n = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
    if (a < 200) continue; // skip transparent pixels
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
    rSum += r; gSum += g; bSum += b; n++;
  }

  if (n === 0) return null;

  const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
  const palette = sorted.slice(0, 5).map(([key]) => {
    const [r, g, b] = key.split(",").map(Number);
    return rgbToHex(r, g, b);
  });

  // ---- 2. HSL statistics across the whole sampled image ----
  const avgR = rSum / n, avgG = gSum / n, avgB = bSum / n;
  const { h, s, l } = rgbToHsl(avgR, avgG, avgB);

  // Average saturation/lightness computed per-pixel (more meaningful than the
  // HSL of the averaged colour alone, which tends to desaturate toward grey).
  let satSum = 0, lightSum = 0, count = 0;
  for (let i = 0; i < pixels.length; i += 16) { // stride-sample for speed
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const hsl = rgbToHsl(r, g, b);
    satSum += hsl.s; lightSum += hsl.l; count++;
  }
  const avgSat = satSum / count;
  const avgLight = lightSum / count;

  // ---- 3. Heuristic style classification (mapped to the survey styles) ----
  const warm = (h >= 0 && h <= 55) || h >= 300; // reds/oranges/yellows/magentas
  const cool = h > 150 && h < 260;               // blues/cyans

  let styleTag;
  if (avgSat < 22 && avgLight > 55)                 styleTag = "minimalist";
  else if (avgSat >= 35 && warm)                    styleTag = "gulf";
  else if (avgSat >= 22 && avgLight < 55 && warm)   styleTag = "classic";
  else                                              styleTag = "modern";
  const styleLabel = STYLES[styleTag];

  return {
    palette,
    avgHue: Math.round(h),
    avgSat: Math.round(avgSat),
    avgLight: Math.round(avgLight),
    styleTag,
    styleLabel,
    warmth: warm ? "warm" : (cool ? "cool" : "neutral"),
  };
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

/** Distance between two style-tag colours in a rough perceptual sense (Lab-lite via HSL). */
function colorDistance(hexA, hexB) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function hexToRgb(hex) {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.substring(0, 2), 16),
    g: parseInt(v.substring(2, 4), 16),
    b: parseInt(v.substring(4, 6), 16),
  };
}
