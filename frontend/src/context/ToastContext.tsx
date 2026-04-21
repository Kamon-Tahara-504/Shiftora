"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  isClosing: boolean;
};

type ShowToastOptions = {
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  showToast: (message: string, options?: ShowToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toastStyle(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return {
        container: "border-emerald-700 bg-emerald-700 text-white",
        icon: <CheckCircle2 className="size-4 text-white/90" />,
      };
    case "error":
      return {
        container: "border-rose-700 bg-rose-700 text-white",
        icon: <AlertCircle className="size-4 text-white/90" />,
      };
    default:
      return {
        container: "border-slate-900 bg-slate-900 text-white",
        icon: <Info className="size-4 text-white/90" />,
      };
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const fadeOutMs = 220;

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const closeToast = useCallback(
    (id: number) => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, isClosing: true } : toast)),
      );
      window.setTimeout(() => removeToast(id), fadeOutMs);
    },
    [removeToast],
  );

  const showToast = useCallback(
    (message: string, options?: ShowToastOptions) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const variant = options?.variant ?? "info";
      const durationMs = options?.durationMs ?? 3500;
      setToasts((prev) => [...prev, { id, message, variant, isClosing: false }]);
      window.setTimeout(() => closeToast(id), durationMs);
    },
    [closeToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
        <div className="w-full max-w-xl space-y-2.5">
          {toasts.map((toast) => {
            const styles = toastStyle(toast.variant);
            return (
              <div
                key={toast.id}
                className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.45)] transition-all duration-200 ${
                  toast.isClosing ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
                } ${styles.container}`}
              >
                <div className="pt-0.5">{styles.icon}</div>
                <p className="flex-1 text-sm font-medium leading-relaxed text-white">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => closeToast(toast.id)}
                  aria-label="通知を閉じる"
                  className="rounded p-1 text-white/70 hover:bg-white/15 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
