export function TricolorLine({ className = 'h-[3px] w-24', soft = false }: { className?: string; soft?: boolean }) {
  return <span aria-hidden="true" className={`block rounded-full ${soft ? 'tricolor-soft' : 'tricolor'} ${className}`} />;
}
