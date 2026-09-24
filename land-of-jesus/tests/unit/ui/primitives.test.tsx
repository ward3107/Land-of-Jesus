import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/projects/ProgressBar';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';
import { ChurchCard } from '@/components/churches/ChurchCard';

vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);
vi.mock('next/image', async () => (await import('../helpers/mocks')).nextImageModule);

describe('buttonVariants', () => {
  it('makes primary buttons cedar-600 pills (AA with white) with press feedback', () => {
    const cls = buttonVariants();
    expect(cls).toContain('bg-primary-600');
    expect(cls).toContain('hover:bg-primary-700');
    expect(cls).toContain('rounded-full');
    expect(cls).toContain('active:scale-[0.97]');
    expect(cls).not.toContain('bg-primary-500');
  });

  it('has tinted and glass variants', () => {
    expect(buttonVariants({ variant: 'tinted' })).toContain('bg-primary-100');
    expect(buttonVariants({ variant: 'glass' })).toContain('text-white');
  });

  it('uses AA-safe cedar-700 for text links', () => {
    expect(buttonVariants({ variant: 'link' })).toContain('text-primary-700');
  });
});

describe('Badge', () => {
  it('puts white text on cedar-600', () => {
    render(<Badge variant="primary">New</Badge>);
    expect(screen.getByText('New').className).toContain('bg-primary-600');
  });
});

describe('ProgressBar', () => {
  it('clamps the value and draws cedar on a gold track', () => {
    render(<ProgressBar value={140} label="Progress" />);
    const bar = screen.getByRole('progressbar', { name: 'Progress' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar.className).toContain('bg-gold');
    expect((bar.firstElementChild as HTMLElement).className).toContain('bg-primary-600');
  });
});

describe('ImagePlaceholder', () => {
  it('renders the photo with its alt text', () => {
    render(<ImagePlaceholder src="/images/x.jpg" alt="Basilica" />);
    expect(screen.getByRole('img', { name: 'Basilica' })).toHaveAttribute('src', '/images/x.jpg');
  });

  it('labels the fallback, or hides it when decorative', () => {
    const { container, rerender } = render(<ImagePlaceholder alt="Basilica" />);
    expect(screen.getByRole('img', { name: 'Basilica' })).toBeInTheDocument();
    rerender(<ImagePlaceholder alt="" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.firstElementChild?.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports the 4:5 portrait ratio used by the sites strip', () => {
    const { container } = render(<ImagePlaceholder alt="" ratio="4/5" />);
    expect((container.firstElementChild as HTMLElement).className).toContain('aspect-[4/5]');
  });
});

describe('ChurchCard', () => {
  it('links to the church with its details and extra pills', () => {
    render(
      <ChurchCard
        slug="holy-sepulchre-jerusalem"
        name="Holy Sepulchre"
        location="Jerusalem, Israel"
        tradition="Orthodox"
        imageUrl="/images/churches/holy-sepulchre.jpg"
      >
        <span>Open</span>
      </ChurchCard>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/churches/holy-sepulchre-jerusalem');
    expect(link).toHaveTextContent('Holy Sepulchre');
    expect(link).toHaveTextContent('Jerusalem, Israel');
    expect(link).toHaveTextContent('Orthodox');
    expect(link).toHaveTextContent('Open');
  });
});
