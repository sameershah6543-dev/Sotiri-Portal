"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

const TOOLTIP_WIDTH = 240;

export function InfoTip({ text }: { text: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  function show() {
    const rect = iconRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(
      Math.max(8, rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2),
      window.innerWidth - TOOLTIP_WIDTH - 8,
    );
    setPos({ top: rect.bottom + 6, left });
  }

  function hide() {
    setPos(null);
  }

  return (
    <span
      ref={iconRef}
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className="relative inline-flex cursor-help align-middle"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-muted" aria-hidden>
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 7.2v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
      </svg>
      {pos &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: TOOLTIP_WIDTH }}
            className="pointer-events-none z-50 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-normal normal-case leading-snug text-ink shadow-lg"
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
