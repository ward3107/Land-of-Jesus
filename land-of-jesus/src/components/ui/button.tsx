import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import React from 'react';

/**
 * iOS-style buttons: pills with a subtle press (scale) response. Filled
 * buttons use cedar-600, the lightest cedar that passes AA with white text.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,color,transform] duration-150 ease-ios active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-linen disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700',
        tinted: 'bg-primary-100 text-primary-800 hover:bg-primary-200',
        secondary: 'border border-hairline bg-surface text-night hover:bg-stone-50',
        outline: 'border border-stone-300 bg-transparent text-night hover:bg-stone-100',
        ghost: 'text-night hover:bg-stone-100',
        glass: 'border border-white/40 bg-white/15 text-white hover:bg-white/25',
        link: 'text-primary-700 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        base: 'h-11 px-5 text-[15px]',
        lg: 'h-12 px-6 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'base',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export default Button;
