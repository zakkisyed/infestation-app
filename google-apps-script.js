/**
 * Infestation App - Google Apps Script Backend (Webhook version)
 * 
 * Instructions:
 * 1. Go to your Google Sheet > Extensions > Apps Script.
 * 2. Replace the entire file with this new code.
 * 3. Click Save.
 * 4. Click Deploy > Manage Deployments.
 * 5. Edit your active deployment (pencil icon) and change 'Version' to 'New version'. 
 * 6. Click Deploy.
 */

const SHEET_NAME = 'Snapshots';

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
  if (isNaN(followerCount)) return false;

  const party = (obj.party || '').toString().trim();
  const platform = (obj.platform || '').toString().trim().toLowerCase();
  if (!party || !platform) return false;

  return true;
}

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

// ------------------------------------------------------------------
// 1. WEB APP ENDPOINT (doGet) - Serves data to React Frontend
// ------------------------------------------------------------------
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Sheet not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  if (values.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const headers = values[0];
  const rows = values.slice(1);

  const jsonData = rows
    .map(row => rowToObject(headers, row))
    .filter(isValidRow)
    .map(normalizeForApi);

  return ContentService.createTextOutput(JSON.stringify(jsonData))
    .setMimeType(ContentService.MimeType.JSON);
}

// ------------------------------------------------------------------
// 2. WEBHOOK ENDPOINT (doPost) - Receives Scraped Data
// Column B: Captured At (ISO timestamp). Also works if header is "Timestamp".
// ------------------------------------------------------------------
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  try {
    const payload = JSON.parse(e.postData.contents);
    const data = sheet.getDataRange().getValues();

    let maxId = 0;
    if (data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        const id = parseInt(data[i][0], 10);
        if (!isNaN(id) && id > maxId) {
          maxId = id;
        }
      }
    }

    const timestamp = new Date().toISOString();

    if (payload.rows && Array.isArray(payload.rows)) {
      payload.rows.forEach(r => {
        const capturedAt = r.captured_at || r.timestamp || timestamp;
        sheet.appendRow([
          ++maxId,
          capturedAt,
          r.platform,
          r.party,
          r.handle,
          r.follower_count
        ]);
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// CJP @CJP_2029 blocked 21 May 2026 at 12:00 IST (06:30 UTC) at ~187.2K followers
const CJP_BLOCK_AT_UTC = '2026-05-21T06:30:00.000Z';
const CJP_LEGACY_X_HANDLE = 'CJP_2029';
const CJP_LEGACY_X_FOLLOWERS = 187200;

// ------------------------------------------------------------------
// 3. SEED HISTORICAL DATA (run once from Apps Script editor)
// Generates sample rows from May 19, 2026 through today.
// ------------------------------------------------------------------
function seedHistoricalData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME + '" not found.');
  }

  const headers = ['ID', 'Captured At', 'Platform', 'Party', 'Handle', 'Follower Count'];
  const existing = sheet.getDataRange().getValues();
  if (existing.length === 0 || existing[0][0] !== 'ID') {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  const startDate = new Date('2026-05-19T12:00:00Z');
  const blockDate = new Date(CJP_BLOCK_AT_UTC);
  const endDate = new Date();

  const bjpPlatforms = [
    { platform: 'instagram', party: 'BJP', handle: 'bjp4india', base: 8850000 },
    { platform: 'x', party: 'BJP', handle: 'bjp4india', base: 23050000 },
  ];
  const cjpInstagram = { platform: 'instagram', party: 'CJP', handle: 'cockroachjantaparty', base: 15100000 };
  const cjpLegacyX = { platform: 'x', party: 'CJP', handle: CJP_LEGACY_X_HANDLE, base: 175000 };
  const cjpNewX = { platform: 'x', party: 'CJP', handle: 'Cockroachisback', base: 30000 };

  let maxId = 0;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const id = parseInt(data[i][0], 10);
    if (!isNaN(id) && id > maxId) maxId = id;
  }

  const rows = [];
  const dayMs = 24 * 60 * 60 * 1000;
  let blockRowAdded = false;

  for (let t = startDate.getTime(); t <= endDate.getTime(); t += dayMs) {
    const capturedAt = new Date(t);
    const dayIndex = Math.floor((t - startDate.getTime()) / dayMs);
    const growth = 1 + dayIndex * 0.002;

    bjpPlatforms.forEach(p => {
      rows.push([
        ++maxId,
        capturedAt.toISOString(),
        p.platform,
        p.party,
        p.handle,
        Math.round(p.base * growth),
      ]);
    });

    rows.push([
      ++maxId,
      capturedAt.toISOString(),
      cjpInstagram.platform,
      cjpInstagram.party,
      cjpInstagram.handle,
      Math.round(cjpInstagram.base * growth),
    ]);

    // Before block: CJP X = @CJP_2029; after block day: @Cockroachisback
    if (capturedAt.getTime() < blockDate.getTime()) {
      const legacyGrowth = 1 + dayIndex * 0.006;
      rows.push([
        ++maxId,
        capturedAt.toISOString(),
        cjpLegacyX.platform,
        cjpLegacyX.party,
        cjpLegacyX.handle,
        Math.round(cjpLegacyX.base * legacyGrowth),
      ]);
    } else {
      rows.push([
        ++maxId,
        capturedAt.toISOString(),
        cjpNewX.platform,
        cjpNewX.party,
        cjpNewX.handle,
        Math.round(cjpNewX.base * growth),
      ]);
    }
  }

  // Exact block baseline: @CJP_2029 at 187.2K, 12:00 IST
  rows.push([
    ++maxId,
    CJP_BLOCK_AT_UTC,
    'x',
    'CJP',
    CJP_LEGACY_X_HANDLE,
    CJP_LEGACY_X_FOLLOWERS,
  ]);
  blockRowAdded = true;

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
  }

  Logger.log('Seeded ' + rows.length + ' rows (block baseline @CJP_2029: ' + blockRowAdded + ').');
}

// ------------------------------------------------------------------
// 4. Append only the @CJP_2029 block row (if sheet already seeded)
// ------------------------------------------------------------------
function seedCjpBlockedBaseline() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + SHEET_NAME + '" not found.');

  let maxId = 0;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const handle = (data[i][4] || '').toString();
    const count = parseFloat(data[i][5]);
    if (handle === CJP_LEGACY_X_HANDLE && count === CJP_LEGACY_X_FOLLOWERS) {
      Logger.log('Block baseline already exists (id ' + data[i][0] + ').');
      return;
    }
    const id = parseInt(data[i][0], 10);
    if (!isNaN(id) && id > maxId) maxId = id;
  }

  sheet.appendRow([
    ++maxId,
    CJP_BLOCK_AT_UTC,
    'x',
    'CJP',
    CJP_LEGACY_X_HANDLE,
    CJP_LEGACY_X_FOLLOWERS,
  ]);
  Logger.log('Appended @CJP_2029 block baseline at ' + CJP_BLOCK_AT_UTC);
}
