# Network Provider Research Tool (Ollama)

Automated research tool that analyzes network service providers using local Ollama LLM and DuckDuckGo web search.

## Features

- Researches 14+ data points per company
- Uses local Ollama LLM — no API key or cloud dependency
- DuckDuckGo web search for up-to-date data (no API key needed)
- Analyzes news sentiment
- Exports results to CSV
- Generates interactive HTML dashboard with charts
- Beautiful CLI with progress indicators

## Prerequisites

- Node.js 18+ installed
- [Ollama](https://ollama.com) installed and running
- A model pulled (e.g., `ollama pull qwen2.5`)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Pull an Ollama model (if you haven't already):
```bash
ollama pull qwen2.5
```

3. Make sure Ollama is running:
```bash
ollama serve
```

## Configuration

Configuration is done via environment variables (or a `.env` file). See `.env.example` for all options.

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | Ollama server address |
| `OLLAMA_MODEL` | `qwen2.5` | Model to use for all LLM tasks |
| `SEARCH_ENABLED` | `true` | Enable/disable DuckDuckGo web search |
| `SEARCH_RESULTS_COUNT` | `5` | Number of search results per query |

## Usage

### Initial Research

1. Fill in the `network_providers_template.csv` file with your companies:
   - Column 1: Company Name (required)
   - Column 2: Website (optional)
   - Column 3: Stock Ticker (optional)

2. Run the research tool:
```bash
npm start
```

3. Wait for the research to complete (progress is shown in real-time)

4. Find results in `network_provider_research_results.csv`

### Update Mode - Fix Errors

If some fields failed to retrieve data, re-run just those failed fields:

```bash
npm run update
```

### Summarize - Extract Clean Numbers

After research is complete, generate a clean summary with extracted numerical values:

```bash
npm run summarize
```

This creates:
- `network_provider_summary.csv` — Clean numerical data for analysis
- `network_provider_report.html` — Interactive dashboard with charts

### Regenerate Report

Regenerate the HTML report from existing CSVs (no LLM calls):

```bash
npm run report
```

## Offline Mode

Set `SEARCH_ENABLED=false` to skip web search and rely only on the model's training data. Useful for faster runs or when working offline.

```bash
SEARCH_ENABLED=false npm start
```

## How It Works

**Two-stage AI pipeline:**

1. **Stage 1** (`npm start`): For each company and data field, searches DuckDuckGo for current data, then feeds the search results as context to the local LLM for analysis.

2. **Stage 2** (`npm run summarize`): Takes the verbose Stage 1 text and uses the LLM to extract clean numerical values (e.g., "$134B revenue" becomes "134.0").

## Data Points Collected

For each company, the tool researches:

- **TAM %** - Total Addressable Market share
- **Carrier Revenue** - Annual revenue
- **Market Cap** - Market capitalization
- **TM Forum Speakers** - Number of speakers at TM Forum events
- **TM Forum Sponsorship** - Sponsorship level/tier
- **Catalyst Projects** - TM Forum Catalyst project participation
- **White Papers** - Published telecommunications white papers
- **Membership Tier** - TM Forum membership level
- **Recent News Articles** - Recent news with titles, sources, sentiment, and links
- **OSS Spend Ranking** - Operational Support Systems spending
- **Customer Base** - Total subscribers/users
- **Stock Change YoY** - Year-over-year stock price change
- **Carrier Type** - Mobile, fixed-line, or hybrid
- **Regional Market** - Geographic presence

## Troubleshooting

**Cannot connect to Ollama**
- Make sure Ollama is running: `ollama serve`
- Check the host setting: default is `http://127.0.0.1:11434`

**Model not found**
- Pull the model first: `ollama pull qwen2.5`
- Or set a different model: `OLLAMA_MODEL=llama3.1 npm start`

**Web search failing**
- DuckDuckGo may rate-limit heavy usage — the tool falls back gracefully to LLM-only mode
- Disable search entirely with `SEARCH_ENABLED=false`

**Slow performance**
- Local inference speed depends on your hardware (GPU, RAM, model size)
- Use a smaller model for faster results: `OLLAMA_MODEL=qwen2.5:7b npm start`
- Disable web search for faster runs: `SEARCH_ENABLED=false`

## License

MIT
