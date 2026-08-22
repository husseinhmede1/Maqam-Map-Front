import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegionPanel } from '@/features/region-panel/components/RegionPanel';
import { useAppStore } from '@/shared/store/app.store';
import type { Region } from '@/types/atlas';

function makeRegion(id: string, overrides: Partial<Region> = {}): Region {
  return {
    id,
    order: 0,
    color: '#E2A93E',
    coordinates: { lon: 31, lat: 27 },
    neighbors: [],
    translations: {
      ar: {
        name: `${id}-ar`,
        system: 'الطرب',
        instruments: ['عود', 'قانون'],
        description: 'وصف عربي',
      },
      en: {
        name: `${id}-en`,
        system: 'Tarab',
        instruments: ['Oud', 'Qanun'],
        description: 'English description',
      },
    },
    ...overrides,
  };
}

describe('RegionPanel', () => {
  beforeEach(() => {
    useAppStore.setState({ locale: 'ar' });
  });

  it('renders the selected region in the active locale', () => {
    render(<RegionPanel region={makeRegion('egypt')} neighbors={[]} onSelectRegion={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'egypt-ar' })).toBeInTheDocument();
    expect(screen.getByText('وصف عربي')).toBeInTheDocument();
    expect(screen.getByText('عود')).toBeInTheDocument();
  });

  it('switches every field when the locale changes', () => {
    useAppStore.setState({ locale: 'en' });
    render(<RegionPanel region={makeRegion('egypt')} neighbors={[]} onSelectRegion={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'egypt-en' })).toBeInTheDocument();
    expect(screen.getByText('English description')).toBeInTheDocument();
  });

  it('lets the visitor walk to a neighbouring tradition', async () => {
    const onSelectRegion = vi.fn();
    render(
      <RegionPanel
        region={makeRegion('egypt')}
        neighbors={[makeRegion('levant'), makeRegion('sudan')]}
        onSelectRegion={onSelectRegion}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'levant-ar' }));
    expect(onSelectRegion).toHaveBeenCalledWith('levant');
  });
});
