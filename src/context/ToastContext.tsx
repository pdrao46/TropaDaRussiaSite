import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';

export type ToastTone = 'success' | 'info' | 'warning';
export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toasts: ToastItem[];
  notify: (toast: Omit<ToastItem, 'id' | 'tone'> & { tone?: ToastTone }) => void;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback<ToastContextValue['notify']>(
    ({ tone = 'success', ...rest }) => {
      const id = ++seq;
      setToasts((t) => [...t.slice(-2), { id, tone, ...rest }]);
      window.setTimeout(() => dismiss(id), 2800);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
