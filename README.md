# TrafficSchoolPicker

Traffic school comparison site built with Next.js 14, Tailwind CSS, and Notion as the data backend.

## Setup

```bash
npm install
cp .env.local.example .env.local
# Fill in your Notion integration token and database IDs
npm run dev
```

## Data Management

All school data lives in Notion. There is no custom admin panel to build — Notion IS the admin.

### To update a school's price
1. Open the Traffic Schools database in Notion
2. Find the school, update the Price field
3. The site updates automatically within 24 hours, or click "Trigger Redeploy" at `/admin` for immediate update

### To add a new school
1. Add a row to Traffic Schools in Notion
2. Fill in all fields, especially: Slug, Tier, State Codes, Show On Site
3. State Codes format: `all` for all 50 states, or `CA,TX,FL` for specific states
4. Check "Show On Site" to make it visible
5. Trigger redeploy

### To hide a school temporarily
1. Uncheck "Show On Site" in Notion
2. Trigger redeploy — school disappears from site immediately

### To add affiliate link once approved
1. Paste tracking URL into "Affiliate URL" field in Notion
2. Trigger redeploy — CTA buttons switch from "Visit Website" to "Enroll Now"

### To add more directory schools (CA/TX/FL)
Run the scraper script: `npm run scrape:ca`
This writes to the Notion School Directory database.
Trigger redeploy to show updated count on state pages.

## Architecture

- **Data backend**: Notion databases (Schools, Directory, States)
- **Data layer**: `lib/notion.ts` — the only file that talks to the Notion API
- **ISR**: Pages revalidate every 24 hours from Notion
- **Admin**: `/admin` — read-only status page with deploy button
- **Scrapers**: `scripts/` — CA DMV, TX TDLR, price monitoring
- **Workflow**: `.github/workflows/monthly-update.yml` — runs scrapers on the 1st of each month
