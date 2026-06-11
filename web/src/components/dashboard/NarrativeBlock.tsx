"use client";

import { useSyncExternalStore } from "react";

// Phase 11: editable narrative block backed by localStorage. Each block is
// keyed by `reportKey` + section id so opening the same quarter's report
// later restores the operator's saved draft. Print mode hides the textarea
// chrome and renders the content as plain paragraphs.

const PREFIX = "nkabom.narrative:";
const EVENT = "nkabom-narrative-changed";

function storageKey(reportKey: string, id: string) {
  return `${PREFIX}${reportKey}:${id}`;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

function getServerSnapshot(): string {
  return "";
}

function makeGetSnapshot(reportKey: string, id: string) {
  return function getSnapshot(): string {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem(storageKey(reportKey, id)) ?? "";
    } catch {
      return "";
    }
  };
}

export function NarrativeBlock({
  reportKey,
  id,
  placeholder,
  defaultValue,
  rows = 5,
}: {
  reportKey: string;
  id: string;
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
}) {
  // Subscribe so cross-tab edits propagate. The snapshot is the stored
  // string itself; React only re-renders when the value changes.
  const stored = useSyncExternalStore(
    subscribe,
    makeGetSnapshot(reportKey, id),
    getServerSnapshot,
  );
  const value = stored || defaultValue || "";

  function handleChange(next: string) {
    if (typeof window === "undefined") return;
    try {
      if (next.trim() === "") {
        window.localStorage.removeItem(storageKey(reportKey, id));
      } else {
        window.localStorage.setItem(storageKey(reportKey, id), next);
      }
      window.dispatchEvent(new Event(EVENT));
    } catch {
      // localStorage unavailable; silently ignore
    }
  }

  return (
    <div className="narrative-block">
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed focus:border-[#2563a8] focus:outline-none focus:ring-2 focus:ring-[#2563a8]/20 print:hidden"
      />
      <div className="hidden whitespace-pre-line text-sm leading-relaxed text-slate-800 print:block">
        {value || (
          <em className="text-slate-400">
            {placeholder ?? "[Narrative not provided]"}
          </em>
        )}
      </div>
    </div>
  );
}
