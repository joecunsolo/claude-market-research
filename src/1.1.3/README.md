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

If some fields failed to retrieve data (showing errors like "Error retrieving data", "No data found", etc.), you can re-run just those failed fields:

```bash
npm run update
```

This will:
- Scan the results CSV for any errors
- Show you which companies have errors and how many fields need updating
- Re-research only the failed fields
- Preserve all successful data
- Update the results CSV with the new data

**Example:**
```bash
$ npm run update

📊 Network Provider Research Tool - Update Mode

⚠️  Found 2 companies with errors:

  • Verizon: 3 fields to update
  • AT&T: 1 field to update

Progress: 1/2

🔍 Researching: Verizon
✓ Completed research for Verizon (updated 3 fields)
```

### Summarize - Extract Clean Numbers

After research is complete, generate a clean summary with extracted numerical values:

```bash
npm run summarize
```

This will:
- Read the research results CSV
- Use AI to extract clean, standardized values from all text descriptions
- Create a summary CSV with standardized columns optimized for comparison
- Generate an interactive HTML report with charts and visualizations

**Outputs:**
1. **network_provider_summary.csv** - Clean numerical data for Excel/analysis
2. **network_provider_report.html** - Interactive dashboard with charts (open in browser)

**Financial Metrics:**
  - **Carrier Revenue ($B)** - Revenue in billions USD
  - **Market Cap ($B)** - Market capitalization in billions USD
  - **TAM (%)** - Total addressable market percentage
  - **Stock Change YoY (%)** - Year-over-year stock change with +/- sign

**Customer Segmentation:**
  - **Customers - Mobile (M)** - Mobile/wireless subscribers in millions
  - **Customers - Broadband (M)** - Fixed-line/broadband subscribers in millions
  - **Customers - Enterprise (M)** - Enterprise/wholesale customers in millions

**TM Forum Engagement (Numerical Scores for Easy Ranking):**
  - **TM Forum Speakers** - Count of speakers/presentations
  - **TM Forum Sponsorship Score** - Numerical tier (Platinum=100, Gold=75, Silver=50, Bronze=25)
  - **Catalyst Projects** - Number of Catalyst project participations
  - **White Papers** - Count of published white papers

**News & Reputation:**
  - **News Article Count** - Number of recent news articles
  - **News Sentiment Score** - Sentiment rating from -10 (negative) to +10 (positive)

**Geographic:**
  - **Primary Country** - Main country of operation/headquarters

**Interactive HTML Report Features:**
  - 📊 **Tabbed Navigation**: Overview, Financial, Customers, TM Forum, News, Data Table
  - 📈 **20+ Interactive Charts**: Pie, bar, scatter, radar charts using Chart.js
  - 🔍 **Click-through Details**: Click any company row to see full metrics + raw research data
  - 📋 **Sortable Table**: Sort by any column (revenue, sentiment, sponsorship, etc.)
  - 📱 **Responsive Design**: Works on desktop, tablet, and mobile
  - 🎨 **Modern Dark Theme**: Professional gradient design with smooth animations

The summary file (`network_provider_summary.csv`) is perfect for:
- Quick comparisons between companies
- Importing into spreadsheets for analysis
- Creating charts and visualizations
- Executive summaries and reports

**Example output:**
```
Company Name,Primary Country,Carrier Revenue ($B),Sponsorship Score,Speakers,Sentiment
Verizon,United States,134.0,100,12,+6
AT&T,United States,120.7,75,8,-2
Deutsche Telekom,Germany,95.2,100,15,+7
Vodafone,United Kingdom,52.3,75,5,+3
Orange,France,48.1,50,3,+4
```

**Comparison Use Cases:**

*TM Forum Engagement Ranking:*
```
Company          | Country        | Sponsorship | Speakers | Catalyst | White Papers
-----------------|----------------|-------------|----------|----------|-------------
Deutsche Telekom | Germany        | 100         | 15       | 8        | 12
Verizon          | United States  | 100         | 12       | 5        | 8
AT&T             | United States  | 75          | 8        | 3        | 5
Vodafone         | United Kingdom | 75          | 5        | 2        | 3
```

*News Analysis:*
```
Company  | Country        | Article Count | Sentiment | Analysis
---------|----------------|---------------|-----------|----------------------------------
Verizon  | United States  | 8             | +6        | High visibility, positive coverage
AT&T     | United States  | 12            | -2        | High visibility, mixed/negative
Orange   | France         | 3             | +4        | Low visibility, positive when covered
```

*Multi-dimensional Comparison in Excel:*
- Sort by TM Forum Sponsorship Score to find top-tier partners
- Filter by Primary Country to analyze specific markets
- Filter by News Sentiment > 0 to find companies with positive press
- Sum (Speakers + Catalyst Projects + White Papers) for overall engagement
- Create scatter plots: Revenue vs TM Forum Engagement
- Pivot tables: Primary Country × Sponsorship Score

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

**Error: Results file not found (in update mode)**
- Run the tool in normal mode first: `npm start`
- Update mode requires an existing results file to check for errors

**Rate limiting errors**
- The tool includes automatic delays between requests
- If issues persist, increase the delay in the code

**Fields still showing errors after update**
- Some data may genuinely not be available publicly
- Try running update mode again - sometimes web search results vary
- Consider manual research for critical missing data

**Output file is locked (in summarize mode)**
- Close the `network_provider_summary.csv` file in Excel or any other application
- Make sure no other processes are accessing the file
- The tool now checks for file locks before starting to avoid wasted processing time

## Cost Estimation

- Each company requires ~15 API calls
- Using Claude Sonnet: approximately $0.15-0.30 per company
- 10 companies ≈ $1.50-3.00

## License

MIT
