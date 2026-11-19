import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';

describe('app entry point', () => {
  it('mounts the Dashboard on / instead of a blank screen', async () => {
    // A missing BrowserRouter makes the Router hooks throw and unmount the whole tree.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    await import('./main');
    await waitFor(() => expect(root.innerHTML).not.toBe(''), { timeout: 3000 });

    expect(root.textContent).toContain('Dashboard');
    root.remove();
  });
});
