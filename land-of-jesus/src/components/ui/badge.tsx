import { cn } from '@/lib/utils';
import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'base';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'base', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center rounded-full font-medium';
    
    const variantStyles = {
      default: 'bg-stone-100 text-stone-900',
      primary: 'bg-primary-500 text-white',
      success: 'bg-green-500 text-white',
      warning: 'bg-yellow-500 text-white',
      error: 'bg-red-500 text-white',
      outline: 'border border-stone-300 text-stone-700',
    };
    
    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      base: 'px-2.5 py-0.5 text-sm',
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
