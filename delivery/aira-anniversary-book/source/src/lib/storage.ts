import { useCallback, useEffect, useState } from 'react';

export function readSaved<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`aira:${key}`);
    return raw === null ? fallback : JSON.parse(raw) as T;
  } catch { return fallback; }
}

export function useSaved<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() => readSaved(key, typeof initial === 'function' ? (initial as () => T)() : initial));
  useEffect(() => {
    try { localStorage.setItem(`aira:${key}`, JSON.stringify(value)); }
    catch { /* Reading remains available when browser storage is full or disabled. */ }
  }, [key, value]);
  return [value, setValue] as const;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const shuffle = <T,>(items: T[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export function useFocusTrap(open: boolean, onClose: () => void) {
  const escape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
    if (event.key !== 'Tab') return;
    const modal = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!modal) return;
    const items = Array.from(modal.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea, select, [tabindex="0"]')).filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', escape);
    const timer = setTimeout(() => document.querySelector<HTMLElement>('[role="dialog"] button')?.focus(), 50);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = oldOverflow;
      document.removeEventListener('keydown', escape);
      previous?.focus();
    };
  }, [open, escape]);
}