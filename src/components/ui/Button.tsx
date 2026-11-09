import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

type Variant = 'blue' | 'red' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const base =
  'sheen group inline-flex select-none items-center justify-center gap-2.5 rounded-xl font-display font-semibold uppercase tracking-[0.12em] transition-[box-shadow,background-color,border-color,color,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  blue:
    'bg-gradient-to-b from-[#1a6fd4] to-ru-blue text-white border border-white/15 shadow-[0_10px_30px_-10px_rgba(0,87,184,0.9),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_14px_40px_-8px_rgba(0,87,184,1),0_0_0_1px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.3)]',
  red:
    'bg-gradient-to-b from-[#e8402f] to-ru-red text-white border border-white/15 shadow-[0_10px_30px_-10px_rgba(213,43,30,0.9),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_14px_40px_-8px_rgba(213,43,30,1),0_0_0_1px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.3)]',
  ghost: 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/25',
  outline: 'bg-transparent text-white border border-white/25 hover:border-white/60 hover:bg-white/5',
};

const sizes: Record<Size, string> = {
  sm: 'h-10 px-4 text-[13px]',
  md: 'h-12 px-6 text-sm',
  lg: 'h-14 px-8 text-[15px] sm:h-[60px] sm:px-10',
};

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'blue', size = 'md', icon, iconRight, className = '', children, type = 'button', ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={rest.disabled ? undefined : { scale: 0.96 }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {icon && <span className="shrink-0 transition-transform duration-300 group-hover:scale-110">{icon}</span>}
      {children}
      {iconRight && <span className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5">{iconRight}</span>}
    </motion.button>
  );
});
