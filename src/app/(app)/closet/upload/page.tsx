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

    const formData = new FormData();
    accepted.forEach((f) => formData.append("files", f));

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Upload failed" }));
        newFiles.forEach((nf) =>
          setFiles((prev) =>
            prev.map((f) =>
              f.id === nf.id ? { ...f, status: "error", error: err.error ?? "Upload failed" } : f
            )
          )
        );
        return;
      }

      const results = await response.json();

      // Update each file's status based on results
      results.forEach((result: { name: string; status: string; error?: string; item?: { category?: string } }) => {
        const match = newFiles.find((nf) => nf.name === result.name);
        if (match) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === match.id
                ? {
                    ...f,
                    status: result.status as UploadStatus,
                    category: result.item?.category,
                    error: result.error,
                  }
                : f
            )
          );
        }
      });

      // If no match by name (e.g. all named image.jpg), mark all as done
      if (results.length > 0 && results.every((r: { status: string }) => r.status === "done")) {
        newFiles.forEach((nf) =>
          setFiles((prev) =>
            prev.map((f) => (f.id === nf.id && f.status === "uploading" ? { ...f, status: "done" } : f))
          )
        );
      }
    } catch {
      newFiles.forEach((nf) =>
        setFiles((prev) =>
          prev.map((f) => (f.id === nf.id ? { ...f, status: "error", error: "Network error" } : f))
        )
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
        <h1 className="text-2xl font-semibold text-[#2B2622]">Add your wardrobe</h1>
        <p className="text-[#8A817A] mt-1 text-sm leading-relaxed">
          Take photos or upload from your camera roll — one item per photo works best.
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

      {/* Loading state */}
      {uploading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#C97B5A] border-t-transparent animate-spin" />
          <p className="text-[#8A817A] text-sm">Saving your photos…</p>
        </div>
      )}

      {/* Progress list */}
      {files.length > 0 && !uploading && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-[#8A817A] uppercase tracking-wide mb-3">
            Done
          </p>
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
