# CLAUDE.md

## Project Overview

Automated market research CLI tool for telecom/network service providers. Uses a local Ollama LLM with DuckDuckGo web search to research 14+ data points per company (revenue, market cap, TM Forum engagement, news sentiment, customer base, etc.), then exports structured results to CSV and generates interactive HTML dashboard reports.

## Tech Stack

- **Runtime**: Node.js 18+ with ES Modules (`"type": "module"`)
- **AI**: `ollama` npm package — local Ollama instance (default model: `qwen2.5`, configurable via `OLLAMA_MODEL`)
- **Web Search**: `duck-duck-scrape` — DuckDuckGo scraping for up-to-date data (no API key)
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
  1.1.0/                         # First Node.js CLI version (Anthropic API)
  1.1.1/                         # Added --update flag
  1.1.2/                         # Added summarize + HTML report
  1.1.3/                         # Iteration on 1.1.2
  1.1.4/                         # Added standalone report.js (last Anthropic version)
  1.2.0/                         # Latest — migrated to local Ollama + DuckDuckGo search
```

**`src/1.2.0/` is the canonical latest version.** Work here unless otherwise specified.

## Commands

All commands run from the latest version folder (`src/1.2.0/`):

| Command | Script | Description |
|---|---|---|
| `npm start` | `index.js` | Full research pipeline — DuckDuckGo search + Ollama LLM, writes results CSV |
| `npm run update` | `index.js --update` | Re-researches only fields that previously failed |
| `npm run summarize` | `summarize.js` | Extracts clean numerical values from verbose results; produces summary CSV + HTML report |
| `npm run report` | `report.js` | Regenerates HTML report from existing CSVs (no LLM calls) |

## Key Files (in src/1.2.0/)

- `index.js` — Main research pipeline (DuckDuckGo search + Ollama)
- `summarize.js` — Two-stage cleanup: Ollama extracts numbers from verbose text
- `llm-client.js` — Ollama abstraction layer (chatWithSearch, chatExtract, checkConnection)
- `web-search.js` — DuckDuckGo search wrapper using duck-duck-scrape
- `generate-html-report.js` — Builds interactive HTML dashboard
- `report.js` — Standalone report regeneration
- `network_providers_template.csv` — Input template (Company Name, Website, Stock Ticker)
- `.env.example` — Shows available configuration env vars

## Code Conventions

- **Variables/functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Script files**: kebab-case (`generate-html-report.js`) or lowercase (`index.js`)
- **CSV headers**: Title Case with spaces
- **Async pattern**: `async/await` with top-level `main()` + `.catch()`
- **LLM abstraction**: All Ollama calls go through `llm-client.js` (never import ollama directly in scripts)
- **Error handling**: Graceful fallbacks returning `'Error retrieving data'` or `'N/A'`
- **Two-stage AI pipeline**: Stage 1 (web search + LLM → verbose text), Stage 2 (LLM only → clean numbers)

## Environment Setup

1. Install [Ollama](https://ollama.com) and start it: `ollama serve`
2. Pull a model: `ollama pull qwen2.5`
3. `cd src/1.2.0`
4. `npm install`
5. (Optional) Copy `.env.example` to `.env` and customize settings
6. Place input data in `network_providers_template.csv`
7. `npm start`

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | Ollama server address |
| `OLLAMA_MODEL` | `qwen2.5` | Model for all LLM tasks |
| `SEARCH_ENABLED` | `true` | Enable/disable DuckDuckGo web search |
| `SEARCH_RESULTS_COUNT` | `5` | Number of search results per query |

## Notes

- No tests, linting, or CI — this is a rapid-iteration tool
- Each version folder is fully independent (no shared code between versions)
- Versions 1.0–1.1.4 used the Anthropic Claude API; 1.2.0+ uses local Ollama
- No API key needed — everything runs locally (LLM via Ollama, search via DuckDuckGo scraping)
