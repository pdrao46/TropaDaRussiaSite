import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, CircleAlert } from 'lucide-react';

interface FieldShellProps {
  label: string;
  icon: ReactNode;
  error?: string;
  valid?: boolean;
  required?: boolean;
  hint?: string;
  children: (ids: { inputId: string; describedBy?: string }) => ReactNode;
}

function FieldShell({ label, icon, error, valid, required, hint, children }: FieldShellProps) {
  const inputId = useId();
  const errorId = `${inputId}-err`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col">
      <label htmlFor={inputId} className="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-white/90">
        {label}
        {required ? <span className="text-ru-red-light" aria-hidden="true">*</span> : <span className="text-xs font-normal text-steel">(opcional)</span>}
      </label>
      <div
        className={`group relative flex rounded-xl border bg-black/25 transition-[border-color,box-shadow,background-color] duration-300 focus-within:bg-black/40 ${
          error
            ? 'border-ru-red/70 shadow-[0_0_0_3px_rgba(213,43,30,0.15)]'
            : valid
              ? 'border-ru-blue/50'
              : 'border-white/12 hover:border-white/25 focus-within:border-ru-blue-light focus-within:shadow-[0_0_0_3px_rgba(0,87,184,0.25)]'
        }`}
      >
        <span className={`pointer-events-none flex w-11 shrink-0 items-start justify-center pt-3.5 transition-colors ${error ? 'text-ru-red-light' : 'text-steel group-focus-within:text-white'}`}>
          {icon}
        </span>
        {children({ inputId, describedBy })}
        <span className="pointer-events-none flex w-10 shrink-0 items-start justify-center pt-3.5">
          <AnimatePresence>
            {error ? (
              <motion.span key="e" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <CircleAlert className="h-4 w-4 text-ru-red-light" aria-hidden="true" />
              </motion.span>
            ) : valid ? (
              <motion.span key="v" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <CheckCircle2 className="h-4 w-4 text-ru-blue-light" aria-hidden="true" />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p id={errorId} role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-1.5 text-xs text-ru-red-light">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      {hint && !error && <p id={hintId} className="mt-1.5 text-[11px] text-steel">{hint}</p>}
    </div>
  );
}

const inputClass = 'min-w-0 flex-1 bg-transparent py-3 text-[15px] text-white placeholder:text-steel/50 outline-none';

type BaseProps = { label: string; icon: ReactNode; error?: string; valid?: boolean; hint?: string };

export const TextField = forwardRef<HTMLInputElement, BaseProps & InputHTMLAttributes<HTMLInputElement>>(function TextField(
  { label, icon, error, valid, hint, required, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} icon={icon} error={error} valid={valid} required={required} hint={hint}>
      {({ inputId, describedBy }) => (
        <input ref={ref} id={inputId} aria-invalid={Boolean(error)} aria-required={required} aria-describedby={describedBy} className={inputClass} {...rest} />
      )}
    </FieldShell>
  );
});

export const TextAreaField = forwardRef<HTMLTextAreaElement, BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextAreaField(
  { label, icon, error, valid, hint, required, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} icon={icon} error={error} valid={valid} required={required} hint={hint}>
      {({ inputId, describedBy }) => (
        <textarea ref={ref} id={inputId} rows={3} aria-invalid={Boolean(error)} aria-describedby={describedBy} className={`${inputClass} resize-none`} {...rest} />
      )}
    </FieldShell>
  );
});
