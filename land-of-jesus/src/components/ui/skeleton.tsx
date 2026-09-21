import { cn } from '@/lib/utils';
import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', ...props }, ref) => {
    const baseStyles = 'animate-pulse bg-stone-200';
    
    const variantStyles = {
      text: 'h-4 rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-md',
    };
    
    return (
      <div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

export { Skeleton };
