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

// Resize + compress to JPEG — keeps uploads fast and small
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
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
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

    // Compress each photo before uploading
    const processedFiles: File[] = [];
    for (let i = 0; i < accepted.length; i++) {
      processedFiles.push(await compressImage(accepted[i]));
    }

    // Map processed filename → UploadFile id for result matching
    const nameToId = new Map<string, string>();
    processedFiles.forEach((pf, i) => nameToId.set(pf.name, newFiles[i].id));

    const formData = new FormData();
    processedFiles.forEach((f) => formData.append("files", f));

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
