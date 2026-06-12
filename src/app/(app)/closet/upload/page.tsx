"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import UploadProgress, {
  UploadFile,
  UploadStatus,
} from "@/components/items/UploadProgress";
import Button from "@/components/ui/Button";

// ── Color detection ───────────────────────────────────────────────────────────

const CLOTHING_COLORS = [
  { name: "black",      r: 20,  g: 20,  b: 20  },
  { name: "white",      r: 245, g: 245, b: 245 },
  { name: "off white",  r: 235, g: 228, b: 215 },
  { name: "cream",      r: 250, g: 240, b: 210 },
  { name: "ivory",      r: 250, g: 245, b: 225 },
  { name: "light grey", r: 200, g: 200, b: 200 },
  { name: "grey",       r: 130, g: 130, b: 130 },
  { name: "dark grey",  r: 70,  g: 70,  b: 70  },
  { name: "navy",       r: 27,  g: 45,  b: 85  },
  { name: "blue",       r: 50,  g: 100, b: 190 },
  { name: "light blue", r: 140, g: 185, b: 230 },
  { name: "denim",      r: 75,  g: 110, b: 150 },
  { name: "sky blue",   r: 100, g: 170, b: 220 },
  { name: "teal",       r: 0,   g: 130, b: 130 },
  { name: "red",        r: 190, g: 30,  b: 30  },
  { name: "burgundy",   r: 120, g: 20,  b: 35  },
  { name: "pink",       r: 240, g: 140, b: 160 },
  { name: "blush",      r: 225, g: 190, b: 185 },
  { name: "purple",     r: 110, g: 40,  b: 140 },
  { name: "lavender",   r: 175, g: 155, b: 210 },
  { name: "green",      r: 40,  g: 140, b: 60  },
  { name: "dark green", r: 20,  g: 80,  b: 40  },
  { name: "olive",      r: 100, g: 110, b: 40  },
  { name: "sage",       r: 135, g: 160, b: 120 },
  { name: "khaki",      r: 185, g: 175, b: 130 },
  { name: "yellow",     r: 250, g: 220, b: 30  },
  { name: "mustard",    r: 195, g: 155, b: 50  },
  { name: "orange",     r: 230, g: 110, b: 30  },
  { name: "coral",      r: 240, g: 100, b: 80  },
  { name: "peach",      r: 240, g: 190, b: 155 },
  { name: "rust",       r: 170, g: 70,  b: 30  },
  { name: "brown",      r: 130, g: 70,  b: 30  },
  { name: "tan",        r: 205, g: 175, b: 140 },
  { name: "camel",      r: 190, g: 150, b: 100 },
  { name: "beige",      r: 235, g: 215, b: 180 },
  { name: "sand",       r: 220, g: 200, b: 155 },
];

// Convert RGB (0-255) to HSL (h: 0-360, s: 0-1, l: 0-1)
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn)      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else                 h = ((rn - gn) / d + 4) / 6;
  return [h * 360, s, l];
}

// HSL-aware nearest color match.
// Key insight: dark navy (r=15,g=25,b=50) and black (r=20,g=20,b=20) look almost
// identical in weighted-RGB space but have very different HSL hues — this metric
// correctly ranks navy pixels nearest to "navy" regardless of luminance.
function nearestColorName(r: number, g: number, b: number): string {
  const [h1, s1, l1] = rgbToHsl(r, g, b);
  let best = CLOTHING_COLORS[0];
  let bestDist = Infinity;
  for (const c of CLOTHING_COLORS) {
    const [h2, s2, l2] = rgbToHsl(c.r, c.g, c.b);
    const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2)) / 180; // 0-1
    const ds = Math.abs(s1 - s2);
    const dl = Math.abs(l1 - l2);
    // Hue matters most (weighted by average saturation), then saturation, then lightness
    const satMean = (s1 + s2) / 2;
    const dist = satMean * dh + 0.5 * ds + 0.3 * dl;
    if (dist < bestDist) { bestDist = dist; best = c; }
  }
  return best.name;
}

// Separate chromatic (has hue) from achromatic (grey/black/white) pixels.
// Find the dominant chromatic color; fall back to achromatic if the item has no real hue.
function detectDominantColor(data: Uint8ClampedArray, width: number, height: number): string {
  const chromHist = new Map<string, { count: number; r: number; g: number; b: number }>();
  let achrR = 0, achrG = 0, achrB = 0, achrN = 0;

  for (let i = 0; i < width * height * 4; i += 16) { // sample every 4th pixel
    if (data[i + 3] < 128) continue; // skip transparent

    const r = data[i], g = data[i + 1], b = data[i + 2];
    // RGB "saturation" = spread between channels — zero for greys, high for vivid colors
    const chromaSat = Math.max(r, g, b) - Math.min(r, g, b);

    if (chromaSat < 20) {
      // Achromatic (grey/black/white/off-white)
      achrR += r; achrG += g; achrB += b; achrN++;
    } else {
      // Chromatic — bucket by 4-bit quantized RGB
      const key = `${r >> 4},${g >> 4},${b >> 4}`;
      const e = chromHist.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      e.count++; e.r += r; e.g += g; e.b += b;
      chromHist.set(key, e);
    }
  }

  const totalChrom = [...chromHist.values()].reduce((s, e) => s + e.count, 0);
  const total = totalChrom + achrN;
  if (total === 0) return "";

  // If >15% of visible pixels have hue, use chromatic analysis
  if (totalChrom > total * 0.15) {
    let maxCount = 0, dr = 0, dg = 0, db = 0;
    for (const e of chromHist.values()) {
      if (e.count > maxCount) {
        maxCount = e.count;
        dr = e.r / e.count;
        dg = e.g / e.count;
        db = e.b / e.count;
      }
    }
    return nearestColorName(dr, dg, db);
  }

  // Achromatic item (solid black/white/grey)
  if (achrN === 0) return "";
  return nearestColorName(achrR / achrN, achrG / achrN, achrB / achrN);
}

// ── Alpha dilation — fixes clipped edges from BG removal ─────────────────────
// Expands the foreground mask outward by `radius` px via a fast separable max-filter.
// 8px handles even aggressive model clipping without introducing visible halos.
function dilateAlphaInPlace(data: Uint8ClampedArray, width: number, height: number, radius: number): void {
  const alpha = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) alpha[i] = data[i * 4 + 3];

  // Horizontal pass
  const pass1 = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let max = 0;
      const x0 = Math.max(0, x - radius), x1 = Math.min(width - 1, x + radius);
      for (let nx = x0; nx <= x1; nx++) {
        const v = alpha[y * width + nx];
        if (v > max) max = v;
      }
      pass1[y * width + x] = max;
    }
  }

  // Vertical pass — write directly into pixel alpha channel
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - radius), y1 = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x++) {
      let max = 0;
      for (let ny = y0; ny <= y1; ny++) {
        const v = pass1[ny * width + x];
        if (v > max) max = v;
      }
      data[(y * width + x) * 4 + 3] = max;
    }
  }
}

// ── Composite: dilation + color detect on BG-removed image ───────────────────
function processRemovedBg(blob: Blob, originalName: string): Promise<{ file: File; color: string }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth, h = img.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, w, h);

      // Detect color BEFORE dilation — clean foreground pixels only
      const color = detectDominantColor(imageData.data, w, h);
      // Expand mask 8px to recover any clipped edges (soles, cuffs, etc.)
      dilateAlphaInPlace(imageData.data, w, h, 8);
      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((b) => {
        const base = originalName.replace(/\.[^.]+$/, "");
        resolve({ file: new File([b ?? blob], `${base}.png`, { type: "image/png" }), color });
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ file: new File([blob], originalName, { type: "image/png" }), color: "" });
    };
    img.src = url;
  });
}

// ── Compress to white-background JPEG ────────────────────────────────────────
async function compressImage(file: File, maxDim = 1200, quality = 0.88): Promise<File> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const updateStatus = (id: string, patch: Partial<UploadFile>) =>
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return;

    const newFiles: UploadFile[] = accepted.map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      status: "processing" as UploadStatus,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    setUploading(true);
    setAllDone(false);

    // Load BG removal library (dynamic import keeps initial bundle small)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let removeBackground: ((img: File) => Promise<Blob>) | null = null;
    try {
      const mod = await import("@imgly/background-removal");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      removeBackground = (img: File) => (mod.removeBackground as any)(img, {
        output: { format: "image/png", quality: 1 },
      }) as Promise<Blob>;
    } catch {
      // Library failed to load — upload originals
    }

    // Step 1: BG removal + 8px edge dilation + HSL color detection (per file)
    const processedRaw: File[] = [];
    const detectedColors: string[] = [];

    for (let i = 0; i < accepted.length; i++) {
      try {
        if (removeBackground) {
          const blob = await removeBackground(accepted[i]);
          const { file, color } = await processRemovedBg(blob, accepted[i].name);
          processedRaw.push(file);
          detectedColors.push(color);
        } else {
          processedRaw.push(accepted[i]);
          detectedColors.push("");
        }
      } catch {
        processedRaw.push(accepted[i]);
        detectedColors.push("");
      }
      updateStatus(newFiles[i].id, { status: "uploading" });
    }

    // Step 2: Compress to white-bg JPEG
    const compressed: File[] = [];
    for (const f of processedRaw) compressed.push(await compressImage(f));

    const nameToId = new Map<string, string>();
    compressed.forEach((f, i) => nameToId.set(f.name, newFiles[i].id));

    const formData = new FormData();
    compressed.forEach((f) => formData.append("files", f));
    formData.append("colorHints", JSON.stringify(detectedColors));

    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Upload failed — please try again" }));
        newFiles.forEach((nf) =>
          updateStatus(nf.id, { status: "error", error: err.error ?? "Upload failed — please try again" })
        );
        return;
      }

      const results = await response.json();

      results.forEach((result: { name: string; status: string; error?: string; item?: { category?: string } }) => {
        const id = nameToId.get(result.name);
        if (id) {
          updateStatus(id, {
            status: result.status as UploadStatus,
            category: result.item?.category,
            error: result.error,
          });
        }
      });

      newFiles.forEach((nf) =>
        setFiles((prev) =>
          prev.map((f) => (f.id === nf.id && f.status === "uploading" ? { ...f, status: "done" } : f))
        )
      );
    } catch {
      newFiles.forEach((nf) =>
        updateStatus(nf.id, { status: "error", error: "Network error — please try again" })
      );
    } finally {
      setUploading(false);
      setAllDone(true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
    disabled: uploading,
  });

  return (
    <div className="flex flex-col min-h-screen px-5 pt-14 pb-8">
      <div className="mb-8">
        <h1 className="font-sans font-bold text-[1.85rem] leading-tight text-[#111111]">Add your wardrobe</h1>
        <p className="text-[#6B7280] mt-1 text-sm leading-relaxed">
          One item per photo works best. The AI will automatically tag the category, colour, and style.
        </p>
      </div>

      {!uploading && !allDone && (
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-[24px] p-10 cursor-pointer transition-colors ${
            isDragActive ? "border-[#111111] bg-[#111111]/5" : "border-[#E5E7EB] bg-white"
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-14 h-14 rounded-full bg-[#F9FAFB] flex items-center justify-center">
            <ImagePlus size={26} className="text-[#111111]" />
          </div>
          <div className="text-center">
            <p className="font-medium text-[#111111]">
              {isDragActive ? "Drop photos here" : "Add clothing photos"}
            </p>
            <p className="text-sm text-[#6B7280] mt-0.5">Tap to select or take a photo</p>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6">
          {uploading && (
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
              Processing…
            </p>
          )}
          {!uploading && allDone && (
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
              Done
            </p>
          )}
          <UploadProgress files={files} />
        </div>
      )}

      {allDone && (
        <div className="mt-8 flex flex-col gap-3">
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <button className="w-full py-3 rounded-full border border-[#E5E7EB] text-sm font-medium text-[#111111]">
              Add more items
            </button>
          </div>
          <Button size="lg" onClick={() => router.push("/closet")}>
            View my closet
          </Button>
        </div>
      )}
    </div>
  );
}
