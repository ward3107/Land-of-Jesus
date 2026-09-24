import { cn } from '@/lib/utils';
import React from 'react';

/**
 * Horizontal layout primitive: centered max-width with a consistent side gutter.
 * `size` picks the max width; default matches the site's wide content shell.
 */
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'narrow' | 'base' | 'wide' | 'full';
}

const MAX_WIDTHS: Record<NonNullable<ContainerProps['size']>, string> = {
  narrow: 'max-w-2xl',
  base: 'max-w-4xl',
  wide: 'max-w-7xl',
  full: 'max-w-full',
};

export function Container({ size = 'wide', className, ...props }: ContainerProps) {
  return <div className={cn('mx-auto w-full px-6', MAX_WIDTHS[size], className)} {...props} />;
}
