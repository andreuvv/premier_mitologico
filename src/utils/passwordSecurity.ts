/**
 * Leaked-password check against HaveIBeenPwned (the same service Supabase uses
 * on paid plans). Uses k-anonymity: only the first 5 hex chars of the SHA-1 hash
 * leave the browser, never the password.
 */
const RANGE_URL = 'https://api.pwnedpasswords.com/range/';

async function sha1Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * How many times the password appears in known breaches (0 = not found).
 * Returns null when the service can't be reached, so callers can let the user
 * continue instead of blocking sign-ups on an outage.
 */
export async function pwnedPasswordCount(password: string, fetchImpl: typeof fetch = fetch): Promise<number | null> {
  try {
    const hash = await sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const response = await fetchImpl(RANGE_URL + prefix, { headers: { 'Add-Padding': 'true' } });
    if (!response.ok) return null;
    const body = await response.text();
    for (const line of body.split('\n')) {
      const [lineSuffix, count] = line.trim().split(':');
      if (lineSuffix === suffix) return Number(count) || 0;
    }
    return 0;
  } catch {
    return null;
  }
}

export const LEAKED_PASSWORD_MESSAGE =
  'Esta contraseña aparece en filtraciones de datos conocidas. Elige otra distinta.';

/** Error message for a leaked password, or null when it is fine (or the check is unavailable). */
export async function leakedPasswordError(password: string): Promise<string | null> {
  const count = await pwnedPasswordCount(password);
  return count && count > 0 ? LEAKED_PASSWORD_MESSAGE : null;
}
