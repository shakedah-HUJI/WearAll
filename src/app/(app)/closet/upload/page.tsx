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

// ── Named color palette for clothing ─────────────────────────────────────────
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

function nearestColorName(r: number, g: number, b: number): string {
  let best = CLOTHING_COLORS[0];
  let bestDist = Infinity;
  for (const c of CLOTHING_COLORS) {
    const dr = r - c.r, dg = g - c.g, db = b - c.b;
    // Perceptually weighted: green most sensitive, blue least
    const dist = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
    if (dist < bestDist) { bestDist = dist; best = c; }
  }
  return best.name;
}

// Finds the dominant color of visible (non-transparent, non-shadow, non-highlight) pixels
function detectDominantColor(data: Uint8ClampedArray, width: number, height: number): string {
  const hist = new Map<string, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < width * height * 4; i += 16) { // every 4th pixel
    if (data[i + 3] < 128) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r < 30 && g < 30 && b < 30) continue;   // skip deep shadows
    if (r > 225 && g > 225 && b > 225) continue; // skip blown highlights

    // Quantize to 5 bits per channel (32 levels)
    const key = `${r >> 3},${g >> 3},${b >> 3}`;
    const e = hist.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    e.count++; e.r += r; e.g += g; e.b += b;
    hist.set(key, e);
  }

  if (hist.size === 0) return "";

  let maxCount = 0, dr = 128, dg = 128, db = 128;
  for (const e of hist.values()) {
    if (e.count > maxCount) {
      maxCount = e.count;
      dr = e.r / e.count;
      dg = e.g / e.count;
      db = e.b / e.count;
    }
  }

  return nearestColorName(dr, dg, db);
}

// Expands the alpha mask outward by `radius` px (separable max-filter) to recover clipped edges
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

  // Vertical pass, write directly back into pixel data
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

// Composites the BG-removed blob on canvas, dilates edges, detects dominant color
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
      // Detect color from clean foreground pixels before dilation
      const color = detectDominantColor(imageData.data, w, h);
      // Expand mask by 4px to recover any clipped edges (shoe soles, sleeves, etc.)
      dilateAlphaInPlace(imageData.data, w, h, 4);
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

// Compress to white-background JPEG (transparent areas → white)
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
    let removeBackground: ((img: File) => Promise<Blob>) | null = null;
    try {
      const mod = await import("@imgly/background-removal");
      removeBackground = (img: File) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mod.removeBackground as any)(img, { output: { format: "image/png", quality: 1 } }) as Promise<Blob>;
    } catch {
      // Library failed to load — proceed without BG removal
    }

    // Step 1: BG removal + edge dilation + color detection (per file)
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

    // Map filename → UploadFile id for matching server response
    const nameToId = new Map<string, string>();
    compressed.forEach((f, i) => nameToId.set(f.name, newFiles[i].id));

    const formData = new FormData();
    compressed.forEach((f) => formData.append("files", f));
    // Pass client-detected colors (ordered by file index) as fallback for the AI tagger
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
