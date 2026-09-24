import { cn } from '@/lib/utils';
import React from 'react';
import { Container, type ContainerProps } from './Container';

/**
 * Vertical rhythm wrapper for page sections. `tone` sets the background band;
 * `containerSize` controls the inner max width. Set `bare` to skip the inner
 * Container (for full-bleed sections that manage their own layout).
 */
export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  tone?: 'white' | 'stone' | 'dark';
  containerSize?: ContainerProps['size'];
  bare?: boolean;
}

const TONES: Record<NonNullable<SectionProps['tone']>, string> = {
  white: 'bg-white text-stone-900',
  stone: 'bg-stone-50 text-stone-900',
  dark: 'bg-stone-900 text-white',
};

export function Section({
  tone = 'white',
  containerSize = 'wide',
  bare = false,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn('py-24', TONES[tone], className)} {...props}>
      {bare ? children : <Container size={containerSize}>{children}</Container>}
    </section>
  );
}
