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

// Try background removal with a 20-second timeout; fall back to original on any failure
async function removeBackgroundSafe(file: File): Promise<File> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(file), 20_000);

    import("@imgly/background-removal")
      .then(({ removeBackground }) => removeBackground(file))
      .then((blob) => {
        clearTimeout(timer);
        // Use .png extension since background-removed output is always PNG
        const pngName = file.name.replace(/\.[^.]+$/, ".png");
        resolve(new File([blob], pngName, { type: "image/png" }));
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(file);
      });
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
      status: "processing" as UploadStatus,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    setUploading(true);
    setAllDone(false);

    // Remove background from each file sequentially (20s timeout per image)
    const processedFiles: File[] = [];
    for (let i = 0; i < accepted.length; i++) {
      const original = accepted[i];
      const nf = newFiles[i];
      const processed = await removeBackgroundSafe(original);
      processedFiles.push(processed);
      updateStatus(nf.id, { status: "uploading" });
    }

    // Build a map from processed filename → original UploadFile id for result matching
    const nameToId = new Map<string, string>();
    processedFiles.forEach((pf, i) => nameToId.set(pf.name, newFiles[i].id));

    // Upload all processed files in one request
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

      // Mark any still-uploading files as done (fallback for missing results)
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
        <h1 className="font-serif text-[1.85rem] italic leading-tight text-[#2B2622]">Add your wardrobe</h1>
        <p className="text-[#8A817A] mt-1 text-sm leading-relaxed">
          Take photos or upload from your camera roll — one item per photo works best.
          Backgrounds are removed automatically.
        </p>
      </div>

      {/* Drop zone */}
      {!uploading && !allDone && (
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-[24px] p-10 cursor-pointer transition-colors ${
            isDragActive ? "border-[#C97B5A] bg-[#C97B5A]/5" : "border-[#ECE6DF] bg-white"
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-14 h-14 rounded-full bg-[#FBF7F2] flex items-center justify-center">
            <ImagePlus size={26} className="text-[#C97B5A]" />
          </div>
          <div className="text-center">
            <p className="font-medium text-[#2B2622]">
              {isDragActive ? "Drop photos here" : "Add clothing photos"}
            </p>
            <p className="text-sm text-[#8A817A] mt-0.5">Tap to select or take a photo</p>
          </div>
        </div>
      )}

      {/* Progress list */}
      {files.length > 0 && (
        <div className="mt-6">
          {uploading && (
            <p className="text-xs font-semibold text-[#8A817A] uppercase tracking-wide mb-3">
              Processing…
            </p>
          )}
          {!uploading && allDone && (
            <p className="text-xs font-semibold text-[#8A817A] uppercase tracking-wide mb-3">
              Done
            </p>
          )}
          <UploadProgress files={files} />
        </div>
      )}

      {/* Finish buttons */}
      {allDone && (
        <div className="mt-8 flex flex-col gap-3">
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <button className="w-full py-3 rounded-full border border-[#ECE6DF] text-sm font-medium text-[#2B2622]">
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
