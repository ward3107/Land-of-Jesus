import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders label, value and optional hint', () => {
    render(<StatCard label="Total subscribers" value={1240} hint="Active followers" />);
    expect(screen.getByText('Total subscribers')).toBeInTheDocument();
    expect(screen.getByText('1240')).toBeInTheDocument();
    expect(screen.getByText('Active followers')).toBeInTheDocument();
  });

  it('omits the hint when not provided', () => {
    render(<StatCard label="Messages sent" value="—" />);
    expect(screen.getByText('Messages sent')).toBeInTheDocument();
    expect(screen.queryByText('Active followers')).not.toBeInTheDocument();
  });
});
