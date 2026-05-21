export interface RawSnapshotRow {
  id?: number | string;
  captured_at?: string;
  timestamp?: string;
  platform?: string;
  party?: string;
  handle?: string;
  follower_count?: number | string;
}

export interface FollowerSnapshot {
  id: number;
  captured_at: string;
  platform: 'instagram' | 'x';
  party: 'BJP' | 'CJP';
  handle: string;
  follower_count: number;
}

export interface ChartDataPoint {
  captured_at: string;
  bjp_instagram: number;
  bjp_x: number;
  cjp_instagram: number;
  cjp_x: number;
  bjp_total: number;
  cjp_total: number;
}

import { isCanonicalSnapshot } from './accounts';

export interface AggregatedData {
  latestBJPInsta: number;
  latestBJPX: number;
  latestCJPInsta: number;
  latestCJPX: number;
  lastScan: string;
  chartData: ChartDataPoint[];
}

const VALID_PLATFORMS = new Set(['instagram', 'x']);
const VALID_PARTIES = new Set(['BJP', 'CJP']);

export function isValidTimestamp(ts: unknown): ts is string {
  if (ts == null || ts === '') return false;
  const d = new Date(String(ts));
  return !isNaN(d.getTime());
}

export function normalizeSnapshots(rows: unknown[]): FollowerSnapshot[] {
  if (!Array.isArray(rows)) return [];

  const normalized: FollowerSnapshot[] = [];

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const r = row as RawSnapshotRow;

    const capturedAt = r.captured_at ?? r.timestamp;
    if (!isValidTimestamp(capturedAt)) continue;

    const party = String(r.party ?? '').trim();
    const platform = String(r.platform ?? '').trim().toLowerCase();
    if (!VALID_PARTIES.has(party as 'BJP' | 'CJP')) continue;
    if (!VALID_PLATFORMS.has(platform as 'instagram' | 'x')) continue;

    const followerCount = Number(r.follower_count);
    if (!Number.isFinite(followerCount)) continue;

    const id = Number(r.id);
    if (!Number.isFinite(id) || id <= 0) continue;

    const handle = String(r.handle ?? '');
    if (handle.includes('_mock')) continue;
    if (!isCanonicalSnapshot(party as 'BJP' | 'CJP', platform as 'instagram' | 'x', handle)) {
      continue;
    }

    normalized.push({
      id,
      captured_at: String(capturedAt),
      platform: platform as 'instagram' | 'x',
      party: party as 'BJP' | 'CJP',
      handle,
      follower_count: followerCount,
    });
  }

  return normalized.sort(
    (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
  );
}

export function aggregateSnapshots(snapshots: FollowerSnapshot[]): AggregatedData | null {
  if (snapshots.length === 0) return null;

  const timeMap = new Map<string, ChartDataPoint>();

  for (const s of snapshots) {
    const timeKey = s.captured_at;
    if (!timeMap.has(timeKey)) {
      timeMap.set(timeKey, {
        captured_at: timeKey,
        bjp_instagram: 0,
        bjp_x: 0,
        cjp_instagram: 0,
        cjp_x: 0,
        bjp_total: 0,
        cjp_total: 0,
      });
    }

    const entry = timeMap.get(timeKey)!;
    if (s.party === 'BJP' && s.platform === 'instagram') entry.bjp_instagram = s.follower_count;
    if (s.party === 'BJP' && s.platform === 'x') entry.bjp_x = s.follower_count;
    if (s.party === 'CJP' && s.platform === 'instagram') entry.cjp_instagram = s.follower_count;
    if (s.party === 'CJP' && s.platform === 'x') entry.cjp_x = s.follower_count;

    entry.bjp_total = entry.bjp_instagram + entry.bjp_x;
    entry.cjp_total = entry.cjp_instagram + entry.cjp_x;
  }

  const chartData = Array.from(timeMap.values()).sort(
    (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
  );

  const latest =
    [...chartData].reverse().find((p) => p.bjp_total + p.cjp_total > 0) ??
    chartData[chartData.length - 1];
  if (!latest) return null;

  return {
    latestBJPInsta: latest.bjp_instagram,
    latestBJPX: latest.bjp_x,
    latestCJPInsta: latest.cjp_instagram,
    latestCJPX: latest.cjp_x,
    lastScan: latest.captured_at,
    chartData,
  };
}
