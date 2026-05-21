/**
 * Infestation App - Google Apps Script Backend
 *
 * RUN ONCE after clearing the sheet (headers only):
 *   setupInfestationSheet()
 *
 * Deploy: Deploy > Manage deployments > Edit > New version > Deploy
 */

const SHEET_NAME = 'Snapshots';
const HEADERS = ['ID', 'Captured At', 'Platform', 'Party', 'Handle', 'Follower Count'];

const SEED_START_UTC = '2026-05-19T12:00:00.000Z';
const CJP_BLOCK_AT_UTC = '2026-05-21T06:30:00.000Z'; // 12:00 IST
const CJP_LEGACY_X_HANDLE = 'CJP_2029';
const CJP_LEGACY_X_FOLLOWERS = 187200;

const CANONICAL = {
  BJP: { instagram: 'bjp4india', x: 'bjp4india' },
  CJP: { instagram: 'cockroachjantaparty', x: 'Cockroachisback' },
};

const VALID_PARTIES = ['BJP', 'CJP'];
const VALID_PLATFORMS = ['instagram', 'x'];

// ------------------------------------------------------------------
// Sheet helpers
// ------------------------------------------------------------------
function getSnapshotsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function ensureHeaders(sheet) {
  const width = HEADERS.length;
  const firstRow = sheet.getRange(1, 1, 1, width).getValues()[0];
  const needsHeaders =
    sheet.getLastRow() === 0 ||
    firstRow[0] !== 'ID' ||
    firstRow[1] !== 'Captured At';

  if (needsHeaders) {
    if (sheet.getLastRow() > 0) {
      sheet.clear();
    }
    sheet.getRange(1, 1, 1, width).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, width).setFontWeight('bold');
  }
  return needsHeaders;
}

function clearSnapshotRows(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}

function getMaxId(sheet) {
  const data = sheet.getDataRange().getValues();
  let maxId = 0;
  for (let i = 1; i < data.length; i++) {
    const id = parseInt(data[i][0], 10);
    if (!isNaN(id) && id > maxId) maxId = id;
  }
  return maxId;
}

function writeSnapshotRows(sheet, rows) {
  if (rows.length === 0) return;
  sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
}

// ------------------------------------------------------------------
// Validation
// ------------------------------------------------------------------
function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((header, index) => {
    const key = header.toString().toLowerCase().replace(/ /g, '_');
    let value = row[index];
    if (value instanceof Date) {
      value = value.toISOString();
    } else if (value !== null && value !== undefined && value !== '') {
      value = value.toString();
    } else {
      value = '';
    }
    obj[key] = value;
  });
  return obj;
}

function isValidRow(obj) {
  const id = parseInt(obj.id, 10);
  if (isNaN(id) || id <= 0) return false;

  const capturedAt = obj.captured_at || obj.timestamp;
  if (!capturedAt || capturedAt === '') return false;

  const followerCount = parseFloat(obj.follower_count);
  if (isNaN(followerCount) || followerCount < 0) return false;

  const party = (obj.party || '').toString().trim();
  const platform = (obj.platform || '').toString().trim().toLowerCase();
  if (VALID_PARTIES.indexOf(party) === -1) return false;
  if (VALID_PLATFORMS.indexOf(platform) === -1) return false;

  const handle = (obj.handle || '').toString();
  if (!handle || handle.indexOf('_mock') !== -1) return false;

  return true;
}

function isAllowedHandle(party, platform, handle) {
  const h = handle.toString().trim();
  const canonical = CANONICAL[party] && CANONICAL[party][platform];
  if (canonical && h.toLowerCase() === canonical.toLowerCase()) return true;
  if (party === 'CJP' && platform === 'x' && h === CJP_LEGACY_X_HANDLE) return true;
  return false;
}

/**
 * Audit sheet data. Logs issues and returns a report object.
 */
function auditSnapshotData(sheet) {
  sheet = sheet || getSnapshotsSheet();
  const values = sheet.getDataRange().getValues();
  const report = {
    ok: true,
    totalRows: Math.max(0, values.length - 1),
    validRows: 0,
    invalidRows: 0,
    emptyRows: 0,
    issues: [],
    blockBaselineFound: false,
    legacyXRows: 0,
    canonicalXRows: 0,
  };

  if (values.length <= 1) {
    report.ok = false;
    report.issues.push('No data rows (headers only).');
    return report;
  }

  const headers = values[0];
  if (headers[0] !== 'ID') {
    report.ok = false;
    report.issues.push('Header row missing or incorrect.');
    return report;
  }

  const seenIds = {};

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const isEmpty = row.every(cell => cell === '' || cell === null);
    if (isEmpty) {
      report.emptyRows++;
      report.invalidRows++;
      report.issues.push('Row ' + (i + 1) + ' is completely empty.');
      continue;
    }

    const obj = rowToObject(headers, row);
    if (!isValidRow(obj)) {
      report.invalidRows++;
      report.issues.push('Row ' + (i + 1) + ' failed validation.');
      continue;
    }

    const party = obj.party;
    const platform = obj.platform;
    const handle = obj.handle;

    if (!isAllowedHandle(party, platform, handle)) {
      report.invalidRows++;
      report.issues.push('Row ' + (i + 1) + ': disallowed handle @' + handle);
      continue;
    }

    const id = parseInt(obj.id, 10);
    if (seenIds[id]) {
      report.issues.push('Duplicate ID ' + id + ' at row ' + (i + 1));
    }
    seenIds[id] = true;

    report.validRows++;

    if (party === 'CJP' && platform === 'x') {
      if (handle === CJP_LEGACY_X_HANDLE) {
        report.legacyXRows++;
        if (
          parseFloat(obj.follower_count) === CJP_LEGACY_X_FOLLOWERS &&
          (obj.captured_at === CJP_BLOCK_AT_UTC || obj.timestamp === CJP_BLOCK_AT_UTC)
        ) {
          report.blockBaselineFound = true;
        }
      } else {
        report.canonicalXRows++;
      }
    }
  }

  if (report.emptyRows > 0) {
    report.ok = false;
    report.issues.push('Delete ' + report.emptyRows + ' blank row(s) — they break the API.');
  }

  if (report.validRows === 0) {
    report.ok = false;
    report.issues.push('No valid snapshot rows.');
  }

  if (!report.blockBaselineFound) {
    report.issues.push(
      'Missing @' + CJP_LEGACY_X_HANDLE + ' block baseline (' +
      CJP_LEGACY_X_FOLLOWERS + ' at ' + CJP_BLOCK_AT_UTC + ').'
    );
  }

  if (report.invalidRows > 0) {
    report.ok = false;
  }

  return report;
}

function logAuditReport(report) {
  Logger.log('--- Snapshot audit ---');
  Logger.log('Valid rows: ' + report.validRows);
  Logger.log('Invalid rows: ' + report.invalidRows);
  Logger.log('Empty rows: ' + report.emptyRows);
  Logger.log('Block baseline @' + CJP_LEGACY_X_HANDLE + ': ' + report.blockBaselineFound);
  Logger.log('CJP legacy X rows: ' + report.legacyXRows);
  Logger.log('CJP canonical X rows: ' + report.canonicalXRows);
  if (report.issues.length) {
    report.issues.forEach(msg => Logger.log('  ! ' + msg));
  }
  Logger.log('Overall OK: ' + report.ok);
}

// ------------------------------------------------------------------
// Seed row builder
// ------------------------------------------------------------------
function buildSeedRows() {
  const startDate = new Date(SEED_START_UTC);
  const blockDate = new Date(CJP_BLOCK_AT_UTC);
  const endDate = new Date();
  endDate.setUTCHours(12, 0, 0, 0);

  const bjpPlatforms = [
    { platform: 'instagram', party: 'BJP', handle: 'bjp4india', base: 8850000 },
    { platform: 'x', party: 'BJP', handle: 'bjp4india', base: 23050000 },
  ];
  const cjpInstagram = {
    platform: 'instagram',
    party: 'CJP',
    handle: 'cockroachjantaparty',
    base: 15100000,
  };
  const cjpLegacyX = {
    platform: 'x',
    party: 'CJP',
    handle: CJP_LEGACY_X_HANDLE,
    base: 175000,
  };
  const cjpNewX = {
    platform: 'x',
    party: 'CJP',
    handle: 'Cockroachisback',
    base: 30000,
  };

  const rows = [];
  let nextId = 1;
  const dayMs = 24 * 60 * 60 * 1000;

  for (let t = startDate.getTime(); t <= endDate.getTime(); t += dayMs) {
    const capturedAt = new Date(t);
    const dayIndex = Math.floor((t - startDate.getTime()) / dayMs);
    const growth = 1 + dayIndex * 0.002;

    bjpPlatforms.forEach(p => {
      rows.push([
        nextId++,
        capturedAt.toISOString(),
        p.platform,
        p.party,
        p.handle,
        Math.round(p.base * growth),
      ]);
    });

    rows.push([
      nextId++,
      capturedAt.toISOString(),
      cjpInstagram.platform,
      cjpInstagram.party,
      cjpInstagram.handle,
      Math.round(cjpInstagram.base * growth),
    ]);

    if (capturedAt.getTime() < blockDate.getTime()) {
      const legacyGrowth = 1 + dayIndex * 0.006;
      rows.push([
        nextId++,
        capturedAt.toISOString(),
        cjpLegacyX.platform,
        cjpLegacyX.party,
        cjpLegacyX.handle,
        Math.round(cjpLegacyX.base * legacyGrowth),
      ]);
    } else {
      rows.push([
        nextId++,
        capturedAt.toISOString(),
        cjpNewX.platform,
        cjpNewX.party,
        cjpNewX.handle,
        Math.round(cjpNewX.base * growth),
      ]);
    }
  }

  rows.push([
    nextId++,
    CJP_BLOCK_AT_UTC,
    'x',
    'CJP',
    CJP_LEGACY_X_HANDLE,
    CJP_LEGACY_X_FOLLOWERS,
  ]);

  return rows;
}

// ------------------------------------------------------------------
// MAIN SETUP — run this once on a cleared sheet
// ------------------------------------------------------------------
function setupInfestationSheet() {
  const sheet = getSnapshotsSheet();

  Logger.log('1/4 Ensuring headers...');
  ensureHeaders(sheet);

  Logger.log('2/4 Clearing old data rows...');
  clearSnapshotRows(sheet);

  Logger.log('3/4 Seeding from May 19, 2026...');
  const rows = buildSeedRows();
  writeSnapshotRows(sheet, rows);
  Logger.log('   Wrote ' + rows.length + ' rows.');

  Logger.log('4/4 Running data audit...');
  const report = auditSnapshotData(sheet);
  logAuditReport(report);

  if (!report.ok) {
    throw new Error('Setup finished with issues — see Execution log.');
  }

  Logger.log('Setup complete. Deploy a new version if you changed this script.');
}

/** Health check only — does not modify the sheet. */
function runDataHealthCheck() {
  const report = auditSnapshotData(getSnapshotsSheet());
  logAuditReport(report);
  return report;
}

/** @deprecated Use setupInfestationSheet() on a fresh sheet. */
function seedHistoricalData() {
  setupInfestationSheet();
}

/** Append block row only if missing (sheet already has other data). */
function seedCjpBlockedBaseline() {
  const sheet = getSnapshotsSheet();
  const report = auditSnapshotData(sheet);
  if (report.blockBaselineFound) {
    Logger.log('Block baseline already present.');
    return;
  }
  const maxId = getMaxId(sheet);
  sheet.appendRow([
    maxId + 1,
    CJP_BLOCK_AT_UTC,
    'x',
    'CJP',
    CJP_LEGACY_X_HANDLE,
    CJP_LEGACY_X_FOLLOWERS,
  ]);
  logAuditReport(auditSnapshotData(sheet));
}

// ------------------------------------------------------------------
// API: normalizeForApi + doGet / doPost
// ------------------------------------------------------------------
function normalizeForApi(obj) {
  const capturedAt = obj.captured_at || obj.timestamp || '';
  return {
    id: parseInt(obj.id, 10),
    captured_at: capturedAt,
    timestamp: capturedAt,
    platform: (obj.platform || '').toString().trim().toLowerCase(),
    party: (obj.party || '').toString().trim(),
    handle: (obj.handle || '').toString(),
    follower_count: parseFloat(obj.follower_count),
  };
}

function doGet(e) {
  const sheet = getSnapshotsSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const headers = values[0];
  const jsonData = values
    .slice(1)
    .map(row => rowToObject(headers, row))
    .filter(isValidRow)
    .filter(obj => isAllowedHandle(obj.party, obj.platform, obj.handle))
    .map(normalizeForApi);

  return ContentService.createTextOutput(JSON.stringify(jsonData))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = getSnapshotsSheet();

  try {
    const payload = JSON.parse(e.postData.contents);
    const timestamp = new Date().toISOString();
    let maxId = getMaxId(sheet);
    let appended = 0;
    const rejected = [];

    if (payload.rows && Array.isArray(payload.rows)) {
      payload.rows.forEach(r => {
        const handle = (r.handle || '').toString();
        const party = (r.party || '').toString().trim();
        const platform = (r.platform || '').toString().trim().toLowerCase();

        if (!isAllowedHandle(party, platform, handle)) {
          rejected.push({ handle: handle, reason: 'disallowed handle' });
          return;
        }

        const capturedAt = r.captured_at || r.timestamp || timestamp;
        sheet.appendRow([
          ++maxId,
          capturedAt,
          platform,
          party,
          handle,
          r.follower_count,
        ]);
        appended++;
      });
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, appended: appended, rejected: rejected })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
