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
// Runs client-side on the compressed original image before upload.
// Clothing fills most of the photo; plain floors/walls are achromatic and
// are separated out before the dominant-hue search, so they don't bias results.

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

// HSL-space nearest-color match.
// Dark navy (r=15,g=25,b=50) vs black (r=20,g=20,b=20):
//   — in weighted RGB they look almost identical (dist ≈ 40)
//   — in HSL navy has hue 222° while black has S=0, making them far apart
// This metric correctly labels any shade of navy as "navy" regardless of shadow depth.
function nearestColorName(r: number, g: number, b: number): string {
  const [h1, s1, l1] = rgbToHsl(r, g, b);
  let best = CLOTHING_COLORS[0];
  let bestDist = Infinity;
  for (const c of CLOTHING_COLORS) {
    const [h2, s2, l2] = rgbToHsl(c.r, c.g, c.b);
    const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2)) / 180;
    const ds = Math.abs(s1 - s2);
    const dl = Math.abs(l1 - l2);
    const satMean = (s1 + s2) / 2;
    const dist = satMean * dh + 0.5 * ds + 0.3 * dl;
    if (dist < bestDist) { bestDist = dist; best = c; }
  }
  return best.name;
}

// Separate chromatic (has hue, RGB spread > 15) from achromatic pixels.
// Threshold 15 — low enough to capture dark navy (spread ≈ 16–60), high enough to
// exclude true greys (spread ≈ 0–8) and near-white floors (spread ≈ 0).
function detectDominantColor(data: Uint8ClampedArray, width: number, height: number): string {
  const chromHist = new Map<string, { count: number; r: number; g: number; b: number }>();
  let achrR = 0, achrG = 0, achrB = 0, achrN = 0;

  for (let i = 0; i < width * height * 4; i += 16) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;

    const spread = Math.max(r, g, b) - Math.min(r, g, b);

    if (spread < 15) {
      achrR += r; achrG += g; achrB += b; achrN++;
    } else {
      const key = `${r >> 4},${g >> 4},${b >> 4}`;
      const e = chromHist.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      e.count++; e.r += r; e.g += g; e.b += b;
      chromHist.set(key, e);
    }
  }

  const totalChrom = [...chromHist.values()].reduce((s, e) => s + e.count, 0);
  const total = totalChrom + achrN;
  if (total === 0) return "";

  if (totalChrom > total * 0.15) {
    let maxCount = 0, dr = 0, dg = 0, db = 0;
    for (const e of chromHist.values()) {
      if (e.count > maxCount) {
        maxCount = e.count;
        dr = e.r / e.count; dg = e.g / e.count; db = e.b / e.count;
      }
    }
    return nearestColorName(dr, dg, db);
  }

  if (achrN === 0) return "";
  return nearestColorName(achrR / achrN, achrG / achrN, achrB / achrN);
}

// ── Image prep: compress to JPEG + detect dominant color in one canvas pass ──
function prepareImage(
  file: File,
  maxDim = 1200,
  quality = 0.88
): Promise<{ compressed: File; color: string }> {
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

      const imageData = ctx.getImageData(0, 0, w, h);
      const color = detectDominantColor(imageData.data, w, h);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve({ compressed: file, color }); return; }
          resolve({
            compressed: new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }),
            color,
          });
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ compressed: file, color: "" }); };
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
      status: "uploading" as UploadStatus,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    setUploading(true);
    setAllDone(false);

    // Compress + detect color (single canvas pass per file)
    const prepared: { compressed: File; color: string }[] = [];
    for (const f of accepted) {
      prepared.push(await prepareImage(f));
    }

    const nameToId = new Map<string, string>();
    prepared.forEach(({ compressed }, i) => nameToId.set(compressed.name, newFiles[i].id));

    const formData = new FormData();
    prepared.forEach(({ compressed }) => formData.append("files", compressed));
    // Send detected colors as ordered fallback array for the server
    formData.append("colorHints", JSON.stringify(prepared.map((p) => p.color)));

    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Upload failed — please try again" }));
        newFiles.forEach((nf) =>
          updateStatus(nf.id, { status: "error", error: err.error ?? "Upload failed" })
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

      // Fallback: mark any still-uploading as done
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
              Uploading…
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
