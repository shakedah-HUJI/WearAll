import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadStatus = "processing" | "uploading" | "tagging" | "done" | "error";

export interface UploadFile {
  id: string;
  name: string;
  status: UploadStatus;
  category?: string;
  color?: string;
  error?: string;
}

interface UploadProgressProps {
  files: UploadFile[];
}

const statusLabel: Record<UploadStatus, string> = {
  processing: "Removing background…",
  uploading: "Uploading…",
  tagging: "Analyzing outfit…",
  done: "Added to closet",
  error: "Failed",
};

export default function UploadProgress({ files }: UploadProgressProps) {
  return (
    <div className="flex flex-col gap-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 bg-white rounded-[14px] px-4 py-3 shadow-sm"
        >
          <StatusIcon status={file.status} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#111111] truncate">{file.name}</p>
            <p
              className={cn(
                "text-xs",
                file.status === "error" ? "text-red-500" : "text-[#6B7280]"
              )}
            >
              {file.status === "error"
                ? file.error ?? "Something went wrong"
                : statusLabel[file.status]}
            </p>
          </div>
          {file.status === "done" && file.category && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F9FAFB] text-[#6B7280] capitalize shrink-0">
              {file.category}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: UploadStatus }) {
  if (status === "done") return <CheckCircle2 size={18} className="text-[#A7B0A0] shrink-0" />;
  if (status === "error") return <XCircle size={18} className="text-red-400 shrink-0" />;
  return <Loader2 size={18} className="text-[#1B2A4A] animate-spin shrink-0" />;
}
