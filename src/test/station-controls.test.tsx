import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { museumSnapshot } from '@/lib/museum-model';
import { StationShowcase } from '@/components/jukebox/station/StationShowcase';

const { speak, announce } = vi.hoisted(() => ({ speak: vi.fn(), announce: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({ ClientOnly: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/lib/a11y', () => ({ useA11y: () => ({ settings: { volume: 0.85, calmMotion: true }, speak, announce, buzz: vi.fn() }) }));
vi.mock('@/lib/audio/engine', () => ({ getEngine: async () => ({ setVolume: vi.fn(), setSample: vi.fn(), setMix: vi.fn(), marimba: vi.fn(), coast: vi.fn() }) }));
vi.mock('@/components/jukebox/station/Station3D', () => ({ default: ({ onTouch }: { onTouch: (lat: number, lng: number) => void }) => <button onClick={() => onTouch(52, 13)}>Test globe touch</button> }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('museum spoken controls', () => {
  it('speaks Where am I at the last touched latitude and longitude, with matching subtitle text', async () => {
    render(<StationShowcase />);
    fireEvent.click(await screen.findByRole('button', { name: 'Test globe touch' }));
    fireEvent.click(screen.getByRole('button', { name: 'Where am I?' }));
    const message = speak.mock.lastCall?.[0];
    expect(message).toContain(`You are at ${museumSnapshot('ocean', 52, 13).name}.`);
    expect(announce).toHaveBeenLastCalledWith(message);
    await waitFor(() => expect(screen.getByText(`"${message}"`)).toBeInTheDocument());
  });
  it.each(['Sea temperature', 'Lightning & thunder', 'Forest height', 'Night lights', '← West', 'East →'])('speaks when pressing %s', (name) => {
    render(<StationShowcase />);
    fireEvent.click(screen.getByRole('button', { name }));
    expect(speak).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith(speak.mock.lastCall?.[0]);
  });
});