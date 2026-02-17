# Network Provider Research Tool

Automated research tool that analyzes network service providers using web search and AI.

## Features

- 📊 Researches 14+ data points per company
- 🔍 Uses Claude AI with web search capabilities
- 📈 Analyzes news sentiment
- 💾 Exports results to CSV
- 🎨 Beautiful CLI with progress indicators

## Prerequisites

- Node.js 18+ installed
- Anthropic API key ([Get one here](https://console.anthropic.com/))

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set your Anthropic API key:

**Linux/Mac:**
```bash
export ANTHROPIC_API_KEY=your-api-key-here
```

**Windows (Command Prompt):**
```cmd
set ANTHROPIC_API_KEY=your-api-key-here
```

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY="your-api-key-here"
```

## Usage

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
- **News Score** - Sentiment analysis (-10 to +10)
- **OSS Spend Ranking** - Operational Support Systems spending
- **Customer Base** - Total subscribers/users
- **Stock Change YoY** - Year-over-year stock price change
- **Carrier Type** - Mobile, fixed-line, or hybrid
- **Regional Market** - Geographic presence

## Example Output

The tool will display progress like this:

```
📊 Network Provider Research Tool

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Loaded 5 companies from CSV
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Progress: 1/5

🔍 Researching: Verizon
✓ Completed research for Verizon

Progress: 2/5
...
```

## Notes

- Research takes approximately 30-60 seconds per company
- The tool includes rate limiting to respect API limits
- All data is gathered from real-time web searches
- Results accuracy depends on publicly available information

## Troubleshooting

**Error: ANTHROPIC_API_KEY environment variable not set**
- Make sure you've set the API key environment variable

**Error: Input file not found**
- Ensure `network_providers_template.csv` exists in the project directory

**Rate limiting errors**
- The tool includes automatic delays between requests
- If issues persist, increase the delay in the code

## Cost Estimation

- Each company requires ~15 API calls
- Using Claude Sonnet: approximately $0.15-0.30 per company
- 10 companies ≈ $1.50-3.00

## License

MIT
