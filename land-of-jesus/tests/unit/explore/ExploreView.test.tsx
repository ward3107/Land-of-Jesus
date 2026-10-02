import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithIntl } from '../helpers/intl';
import { ExploreView, type ExploreChurch } from '@/app/[locale]/explore/ExploreView';

vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);
vi.mock('@/components/explore/ChurchMap', () => ({
  ChurchMap: ({ churches }: { churches: ExploreChurch[] }) => <div data-testid="map-count">{churches.length}</div>,
}));

const base = { hasProjects: false, image: '', latitude: 31.7, longitude: 35.2 };
const churches: ExploreChurch[] = [
  { ...base, slug: 'nazareth', name: 'Nazareth Church', location: 'Nazareth', tradition: 'Roman Catholic', isOpen: true },
  { ...base, slug: 'bethlehem', name: 'Bethlehem Church', location: 'Bethlehem', tradition: 'Greek Orthodox', isOpen: true },
  { ...base, slug: 'jerusalem', name: 'Jerusalem Church', location: 'Jerusalem', tradition: 'Roman Catholic', isOpen: false },
];

describe('ExploreView filters', () => {
  it('applies location, tradition, and visitor filters to the map and list', () => {
    renderWithIntl(<ExploreView initialView="list" churches={churches} />);
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'nazareth' } });
    expect(screen.getByText('Nazareth Church')).toBeInTheDocument();
    expect(screen.queryByText('Bethlehem Church')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Location'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Tradition'), { target: { value: 'catholic' } });
    fireEvent.click(screen.getByLabelText('Open to Visitors'));
    expect(screen.getByText('Nazareth Church')).toBeInTheDocument();
    expect(screen.queryByText('Jerusalem Church')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Map' }));
    expect(screen.getByTestId('map-count')).toHaveTextContent('1');
  });
});
