"use client";

import { useState } from "react";

export function CopyButton({ value, label = "复制链接" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className="button" onClick={copy} aria-live="polite">
      {copied ? "已复制" : label}
    </button>
  );
}
