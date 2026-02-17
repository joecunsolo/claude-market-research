# CLAUDE.md

## Project Overview

Automated market research CLI tool for telecom/network service providers. Uses the Anthropic Claude API with the built-in web search tool to research 14+ data points per company (revenue, market cap, TM Forum engagement, news sentiment, customer base, etc.), then exports structured results to CSV and generates interactive HTML dashboard reports.

## Tech Stack

- **Runtime**: Node.js 18+ with ES Modules (`"type": "module"`)
- **AI**: `@anthropic-ai/sdk` — model: `claude-sonnet-4-20250514` with `web_search_20250305` tool
- **CSV**: `csv-parser` (read), `csv-writer` (write)
- **CLI**: `chalk` (colored output), `ora` (spinners)
- **HTML Reports**: Vanilla JS + Chart.js (CDN) + PapaParse (CSV parsing in browser)
- **Package Manager**: npm

## Project Structure

Uses **version folders** instead of git branches. Each version is self-contained with its own `package.json`, `node_modules`, and scripts.

```
assets/                          # Sample output files
src/
  1.0/                           # Prototype (browser-based HTML, no Node.js)
  1.1.0/                         # First Node.js CLI version
  1.1.1/                         # Added --update flag
  1.1.2/                         # Added summarize + HTML report
  1.1.3/                         # Iteration on 1.1.2
  1.1.4/                         # Latest — added standalone report.js
```

**`src/1.1.4/` is the canonical latest version.** Work here unless otherwise specified.

## Commands

All commands run from the latest version folder (`src/1.1.4/`):

| Command | Script | Description |
|---|---|---|
| `npm start` | `index.js` | Full research pipeline — reads input CSV, queries Claude + web search, writes results CSV |
| `npm run update` | `index.js --update` | Re-researches only fields that previously failed |
| `npm run summarize` | `summarize.js` | Extracts clean numerical values from verbose results; produces summary CSV + HTML report |
| `npm run report` | `report.js` | Regenerates HTML report from existing CSVs (no API calls) |

## Key Files (in src/1.1.4/)

- `index.js` — Main research pipeline (Claude + web search)
- `summarize.js` — Two-stage cleanup: Claude extracts numbers from verbose text
- `generate-html-report.js` — Builds interactive HTML dashboard
- `report.js` — Standalone report regeneration
- `network_providers_template.csv` — Input template (Company Name, Website, Stock Ticker)
- `.env` — Must contain `ANTHROPIC_API_KEY=sk-...` (not committed)

## Code Conventions

- **Variables/functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Script files**: kebab-case (`generate-html-report.js`) or lowercase (`index.js`)
- **CSV headers**: Title Case with spaces
- **Async pattern**: `async/await` with top-level `main()` + `.catch()`
- **API rate limiting**: Sequential `for...of` loops with 500ms delays between calls
- **Error handling**: Graceful fallbacks returning `'Error retrieving data'` or `'N/A'`
- **Two-stage AI pipeline**: Stage 1 (web search → verbose text), Stage 2 (no web search → clean numbers)

## Environment Setup

1. `cd src/1.1.4`
2. `npm install`
3. Create `.env` with `ANTHROPIC_API_KEY=your-key-here`
4. Place input data in `network_providers_template.csv`
5. `npm start`

## Notes

- No git repository, tests, linting, or CI — this is a rapid-iteration tool
- Each version folder is fully independent (no shared code between versions)
- The `.env.example` in `src/1.1.0/` shows the expected env var format
