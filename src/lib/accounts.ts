/** Canonical handles — must match scripts/accounts.py */
export const CANONICAL_HANDLES = {
  BJP: { instagram: 'bjp4india', x: 'bjp4india' },
  CJP: { instagram: 'cockroachjantaparty', x: 'Cockroachisback' },
} as const;

export const CJP_LEGACY_X_HANDLE = 'CJP_2029';

export function isCanonicalSnapshot(
  party: 'BJP' | 'CJP',
  platform: 'instagram' | 'x',
  handle: string
): boolean {
  const normalized = handle.replace(/_mock$/i, '').trim();
  if (!normalized) return false;

  const expected = CANONICAL_HANDLES[party][platform];
  return normalized.toLowerCase() === expected.toLowerCase();
}
