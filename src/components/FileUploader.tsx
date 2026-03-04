"use client";

import { useCallback, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE } from "@/lib/constants";

interface FileUploaderProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

export default function FileUploader({
  selectedFile,
  onFileSelect,
  onRemove,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return "Unsupported file type. Please upload a PDF, DOCX, or TXT file.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File is too large. Maximum size is 10MB.";
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (selectedFile) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{selectedFile.name}</p>
              <p className="text-sm text-slate-500">
                {formatSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
        }`}
      >
        <Upload
          className={`mb-3 h-8 w-8 ${isDragging ? "text-blue-500" : "text-slate-400"}`}
        />
        <p className="text-sm font-medium text-slate-700">
          Drag and drop your file here, or{" "}
          <span className="text-blue-600">browse</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          PDF, DOCX, or TXT up to 10MB
        </p>
        <input
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={handleInputChange}
        />
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
