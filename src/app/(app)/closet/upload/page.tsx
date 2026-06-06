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

    // Remove background from each file sequentially
    const processedFiles: File[] = [];
    for (let i = 0; i < accepted.length; i++) {
      const original = accepted[i];
      const nf = newFiles[i];
      try {
        const { removeBackground } = await import("@imgly/background-removal");
        const blob = await removeBackground(original);
        // Keep original filename so the API can match results back
        processedFiles.push(new File([blob], original.name, { type: "image/png" }));
      } catch {
        // Fall back to original image if removal fails
        processedFiles.push(original);
      }
      updateStatus(nf.id, { status: "uploading" });
    }

    // Upload all processed files in one request
    const formData = new FormData();
    processedFiles.forEach((f) => formData.append("files", f));

    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Upload failed" }));
        newFiles.forEach((nf) =>
          updateStatus(nf.id, { status: "error", error: err.error ?? "Upload failed" })
        );
        return;
      }

      const results = await response.json();

      results.forEach((result: { name: string; status: string; error?: string; item?: { category?: string } }) => {
        const match = newFiles.find((nf) => nf.name === result.name);
        if (match) {
          updateStatus(match.id, {
            status: result.status as UploadStatus,
            category: result.item?.category,
            error: result.error,
          });
        }
      });

      // Mark any still-uploading files as done
      if (results.length > 0 && results.every((r: { status: string }) => r.status === "done")) {
        newFiles.forEach((nf) =>
          setFiles((prev) =>
            prev.map((f) => (f.id === nf.id && f.status === "uploading" ? { ...f, status: "done" } : f))
          )
        );
      }
    } catch {
      newFiles.forEach((nf) =>
        updateStatus(nf.id, { status: "error", error: "Network error" })
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
