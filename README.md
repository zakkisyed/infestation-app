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

### 2. Google Apps Script Setup
1. In your Google Sheet, go to **Extensions > Apps Script**.
2. Open the `google-apps-script.js` file included in this repository and copy all its contents.
3. Paste the contents into the Apps Script editor, replacing the default `myFunction()`.
4. Click the **Save** icon.

### 3. Deploy the Web App
1. In the Apps Script editor, click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set "Execute as" to **Me**.
4. Set "Who has access" to **Anyone**.
5. Click Deploy and authorize the necessary permissions.
6. Copy the resulting **Web app URL**.

### 4. Populate Historical Data (Optional but recommended)
1. In the Apps Script editor, select the function `seedHistoricalData` from the dropdown in the top toolbar.
2. Click **Run**.
3. Check your Google Sheet to verify that the historical data from May 16, 2026 to today was generated.

### 5. GitHub Actions Webhook Integration
To fetch real accurate data every 15 minutes, we use a Python `scrapling` script running on GitHub Actions that posts data to your Google Apps Script Web App.
1. Push this repository to GitHub.
2. Go to your GitHub Repository Settings > Secrets and variables > Actions.
3. Add a new repository secret called `WEBHOOK_URL` and paste your Google Apps Script Web App URL.
4. The GitHub Action `.github/workflows/scrape.yml` will automatically run every 15 minutes, scrape Tweethunter, and push the data directly into your Google Sheet.

### 6. Frontend Configuration
Create a `.env.local` file in the project root of the frontend:
```env
VITE_GOOGLE_SCRIPT_URL=your_web_app_url_here
```

### 7. Running Locally
Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

### 8. Deployment
Deploy the frontend to Vercel or any static hosting provider.
Ensure you set the `VITE_GOOGLE_SCRIPT_URL` as an environment variable in your deployment platform.
