"use client";

import * as React from "react";
import { useRef } from "react";

export interface FileUploadProps {
  label?: string;
  hint?: string;
  fileTypes?: string;
  /** Camera-first capture attribute for mobile (e.g. "environment"). */
  capture?: "user" | "environment";
  accept?: string;
  onFile?: (file: File) => void;
}

/** Camera-first upload zone (mobile takes a photo; desktop drags a file). */
export function FileUpload({
  label = "Add your document",
  hint = "Take a photo or choose a file",
  fileTypes = "PDF, JPG or PNG",
  capture,
  accept = "application/pdf,image/jpeg,image/png",
  onFile,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className="fe-label">{label}</span>
      <button type="button" className="fe-upload" onClick={() => inputRef.current?.click()}>
        <span className="fe-icon" style={{ fontSize: 34, color: "var(--neutral-500)" }} aria-hidden="true">
          photo_camera
        </span>
        <span style={{ font: "var(--text-body)", fontWeight: 600, color: "var(--ink-900)" }}>{hint}</span>
        <span style={{ font: "var(--text-caption)", color: "var(--text-secondary)" }}>
          {fileTypes} · up to 10 MB
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture={capture}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && onFile) onFile(f);
        }}
      />
    </div>
  );
}
