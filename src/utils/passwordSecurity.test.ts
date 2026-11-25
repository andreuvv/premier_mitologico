import { describe, expect, it, vi } from 'vitest';
import { pwnedPasswordCount } from './passwordSecurity';

// SHA-1('password') = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
const respond = (body: string, ok = true) =>
  vi.fn(async () => ({ ok, text: async () => body }) as Response);

describe('pwnedPasswordCount', () => {
  it('sends only the 5-char hash prefix and finds the suffix count', async () => {
    const fetchMock = respond('0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n1E4C9B93F3F0682250B6CF8331B7EE68FD8:3861493\r\n');
    expect(await pwnedPasswordCount('password', fetchMock)).toBe(3861493);
    expect(fetchMock).toHaveBeenCalledWith('https://api.pwnedpasswords.com/range/5BAA6', expect.anything());
  });

  it('returns 0 when the suffix is not listed (padding rows have count 0)', async () => {
    expect(await pwnedPasswordCount('password', respond('ABCDEF0123456789ABCDEF0123456789ABC:0'))).toBe(0);
  });

  it('returns null when the service fails, so sign-up is not blocked', async () => {
    expect(await pwnedPasswordCount('password', respond('', false))).toBeNull();
    const failing = vi.fn(async () => { throw new Error('offline'); });
    expect(await pwnedPasswordCount('password', failing as unknown as typeof fetch)).toBeNull();
  });
});
