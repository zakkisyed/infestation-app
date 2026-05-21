/** Canonical handles — must match scripts/accounts.py */
export const CANONICAL_HANDLES = {
  BJP: { instagram: 'bjp4india', x: 'bjp4india' },
  CJP: { instagram: 'cockroachjantaparty', x: 'Cockroachisback' },
} as const;

export const CJP_LEGACY_X_HANDLE = 'CJP_2029';

/** @CJP_2029 peak before block on 21 May 2026, 12:00 IST */
export const CJP_LEGACY_X_FOLLOWERS = 187_200;

/** 12:00 IST = 06:30 UTC — May 21 morning baseline */
export const CJP_BLOCK_TIMESTAMP = '2026-05-21T06:30:00.000Z';
export const MAY_21_MORNING_UTC = CJP_BLOCK_TIMESTAMP;
export const BJP_IG_BASELINE = 8_500_000;
export const CJP_IG_BASELINE = 10_000_000;

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

/** Canonical rows plus the legacy CJP X account (for chart history only). */
export function isAllowedSnapshot(
  party: 'BJP' | 'CJP',
  platform: 'instagram' | 'x',
  handle: string
): boolean {
  const normalized = handle.replace(/_mock$/i, '').trim();
  if (!normalized || normalized.includes('_mock')) return false;

  if (isCanonicalSnapshot(party, platform, normalized)) return true;

  return (
    party === 'CJP' &&
    platform === 'x' &&
    normalized.toLowerCase() === CJP_LEGACY_X_HANDLE.toLowerCase()
  );
}
