import { Reveal } from './Reveal';
import { TricolorLine } from './TricolorLine';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  id?: string;
  align?: 'center' | 'left';
}

export function SectionHeading({ eyebrow, title, subtitle, id, align = 'center' }: SectionHeadingProps) {
  const centered = align === 'center';
  return (
    <Reveal className={`flex flex-col gap-4 ${centered ? 'items-center text-center' : 'items-start text-left'}`}>
      <span className="text-display flex items-center gap-3 text-xs font-semibold tracking-[0.35em] text-steel">
        <span className="h-px w-8 bg-ru-red" aria-hidden="true" />
        {eyebrow}
        {centered && <span className="h-px w-8 bg-ru-blue" aria-hidden="true" />}
      </span>
      <h2 id={id} className="text-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      <TricolorLine className="h-[3px] w-28" />
      {subtitle && <p className="max-w-2xl text-base leading-relaxed text-steel sm:text-lg">{subtitle}</p>}
    </Reveal>
  );
}
