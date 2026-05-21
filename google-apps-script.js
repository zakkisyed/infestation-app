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
  
  const jsonData = rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      let key = header.toString().toLowerCase().replace(/ /g, '_');
      obj[key] = row[index];
    });
    return obj;
  });

  return ContentService.createTextOutput(JSON.stringify(jsonData))
    .setMimeType(ContentService.MimeType.JSON);
}

// ------------------------------------------------------------------
// 2. WEBHOOK ENDPOINT (doPost) - Receives Scraped Data
// ------------------------------------------------------------------
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  
  try {
    const payload = JSON.parse(e.postData.contents);
    const data = sheet.getDataRange().getValues();
    
    let maxId = 0;
    if (data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        let id = parseInt(data[i][0], 10);
        if (!isNaN(id) && id > maxId) {
          maxId = id;
        }
      }
    }
    
    // We expect payload.rows to be an array: [ { platform, party, handle, follower_count }, ... ]
    const timestamp = new Date().toISOString();
    
    if (payload.rows && Array.isArray(payload.rows)) {
      payload.rows.forEach(r => {
        sheet.appendRow([
          ++maxId, 
          timestamp, 
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


