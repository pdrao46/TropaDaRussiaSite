/** Cantoneiras cinematográficas (mesma linguagem dos banners oficiais). */
export function CornerFrame({ className = '', size = 'h-5 w-5' }: { className?: string; size?: string }) {
  const corner = `absolute ${size} border-white/70`;
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute inset-3 sm:inset-4 ${className}`}>
      <span className={`${corner} left-0 top-0 border-l-2 border-t-2`} />
      <span className={`${corner} right-0 top-0 border-r-2 border-t-2`} />
      <span className={`${corner} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${corner} bottom-0 right-0 border-b-2 border-r-2`} />
    </span>
  );
}
