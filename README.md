# Infestation App

A minimalist dashboard tracking the follower counts for BJP and Cockroach Janta Party across X/Twitter and Instagram. Designed with a "Minimal Neo-Brutalist Protest Dashboard" aesthetic.

## Tech Stack
- Frontend: Vite, React, TypeScript, Tailwind CSS v4, Recharts
- Backend / DB: Google Sheets + Google Apps Script

## Setup Instructions

### 1. Google Sheets Setup
1. Create a new [Google Sheet](https://sheets.new/).
2. Rename the first tab to `Snapshots` (or leave as `Sheet1`, but you'll need to update the script).
3. Set the first row (A1:F1) as headers exactly like this:
   - A1: `ID`
   - B1: `Captured At`
   - C1: `Platform`
   - D1: `Party`
   - E1: `Handle`
   - F1: `Follower Count`

**Important:** Delete any blank rows below your data. Empty formatted rows cause the API to return hundreds of invalid entries and can break the dashboard.

The frontend accepts column B as either `Captured At` or `Timestamp` (the API normalizes both to `captured_at`).

### 2. Google Apps Script Setup
1. In your Google Sheet, go to **Extensions > Apps Script**.
2. Open the `google-apps-script.js` file included in this repository and copy all its contents.
3. Paste the contents into the Apps Script editor, replacing the default `myFunction()`.
4. Click the **Save** icon.

### 2b. One-click sheet setup (cleared sheet with headers only)
1. In Apps Script, select **`setupInfestationSheet`** from the function dropdown.
2. Click **Run** and approve permissions.
3. The script will: ensure headers → **clear all data rows** → seed May 19 → today → add **@CJP_2029** block at 187.2K (12:00 IST) → **audit** and log results.
4. Check **Execution log** for `Overall OK: true`.

Other functions:
- `runDataHealthCheck()` — audit only, no changes
- `seedHistoricalData()` — alias for `setupInfestationSheet()`

### 3. Deploy the Web App
1. In the Apps Script editor, click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set "Execute as" to **Me**.
4. Set "Who has access" to **Anyone**.
5. Click Deploy and authorize the necessary permissions.
6. Copy the resulting **Web app URL**.

After any script changes, use **Deploy > Manage deployments > Edit > New version** so `doGet` updates go live.

### 4. Populate Historical Data (Optional but recommended)
1. In the Apps Script editor, select the function `seedHistoricalData` from the dropdown in the top toolbar.
2. Click **Run**.
3. Check your Google Sheet to verify that sample historical data from May 19, 2026 through today was generated.

**@CJP_2029 block marker:** Seed includes a row at **12:00 IST (06:30 UTC) on 21 May 2026** with **187,200** followers on X. If you already seeded without it, run `seedCjpBlockedBaseline` once in Apps Script.

### 5. GitHub Actions Webhook Integration (15-minute snapshots)
A Python scraper (`scripts/scrape.py`) runs on GitHub Actions every **15 minutes** and POSTs live counts to your Apps Script web app.

**Tracked handles** (defined in `scripts/accounts.py`):

| Party | X/Twitter | Instagram |
|-------|-----------|-----------|
| BJP | [@bjp4india](https://x.com/bjp4india) | [@bjp4india](https://www.instagram.com/bjp4india) |
| CJP | [@Cockroachisback](https://x.com/Cockroachisback) | [@cockroachjantaparty](https://www.instagram.com/cockroachjantaparty) |

The legacy handle `@CJP_2029` is **not** scraped (blocked); it is shown in the UI as historical context only.

Setup:
1. Push this repository to GitHub.
2. Go to **Settings > Secrets and variables > Actions**.
3. Add secret `WEBHOOK_URL` = your Google Apps Script Web App URL (same as `VITE_GOOGLE_SCRIPT_URL`).
4. The workflow `.github/workflows/scrape.yml` runs on cron `*/15 * * * *` (UTC) or via **Actions > Run workflow**.

Scraping: X via [VxTwitter API](https://api.vxtwitter.com) with syndication fallback; Instagram via Instagram `web_profile_info` API (exact counts — HTML meta tags round to `4M` and are unreliable). Only real counts are posted (no mock data).

Verify live counts locally:

```bash
python scripts/fetch_counts.py
```

**Inflact** ([profile analyzer](https://inflact.com/tools/profile-analyzer/)) is not used for scraping — it is Cloudflare-protected and loads stats via browser JS, so it cannot be called from GitHub Actions.

### 6. Frontend Configuration
Copy `.env.example` to `.env.local` and set your web app URL:

```bash
cp .env.example .env.local
```

```env
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Restart the dev server after changing env vars.

### 7. Running Locally
Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Open http://localhost:5173/

### 8. Deployment
Deploy the frontend to Vercel or any static hosting provider.
Ensure you set the `VITE_GOOGLE_SCRIPT_URL` as an environment variable in your deployment platform.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Blank white page | React crash (often invalid dates) | Open DevTools Console; ensure sheet has valid rows and no blank rows; redeploy Apps Script |
| "NO DATA FOUND" | Missing env, empty sheet, or all rows filtered | Set `VITE_GOOGLE_SCRIPT_URL`; run `seedHistoricalData` or wait for scraper; delete blank sheet rows |
| Chart shows zeros | Party/platform mismatch or legacy `@CJP_2029` rows | Use canonical handles; delete `_mock` rows; re-run scraper |
| Wrong follower counts | Old sheet rows from blocked handle | Frontend filters to canonical handles only; run scraper for fresh data |
| Stale data | Scraper not running | Set `WEBHOOK_URL` secret; check Actions tab; trigger workflow manually |

## Manual scraper (optional)

```bash
pip install -r requirements.txt
WEBHOOK_URL=your_apps_script_url python scripts/scrape.py
```
