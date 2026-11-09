export function StepHeader({ step, title, description }: { step: number; title: string; description?: string }) {
  return (
    <header className="mb-6">
      <span className="text-display text-[11px] tracking-[0.35em] text-ru-red-light">Etapa {String(step).padStart(2, '0')}</span>
      <h2 className="text-display mt-1 text-3xl font-bold tracking-[0.06em] sm:text-4xl">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel sm:text-[15px]">{description}</p>}
    </header>
  );
}
