import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import chalk from 'chalk';
import ora from 'ora';

// Initialize Anthropic client
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const INPUT_FILE = 'network_providers_template.csv';
const OUTPUT_FILE = 'network_provider_research_results.csv';

// Research configuration
const RESEARCH_QUERIES = [
  { field: 'tamPercent', query: 'TAM total addressable market share percentage' },
  { field: 'carrierRevenue', query: 'annual revenue latest financial year' },
  { field: 'marketCap', query: 'market capitalization current value' },
  { field: 'tmForumSpeakers', query: 'TM Forum speakers presentations' },
  { field: 'tmForumSponsorship', query: 'TM Forum sponsorship level tier' },
  { field: 'catalystProjects', query: 'TM Forum Catalyst projects participation' },
  { field: 'whitePapers', query: 'telecommunications white papers publications' },
  { field: 'membershipTier', query: 'TM Forum membership tier level' },
  { field: 'ossSpend', query: 'OSS operational support systems spending investment' },
  { field: 'customerBase', query: 'customer base total subscribers users' },
  { field: 'stockChange', query: 'stock price change year over year YoY percentage' },
  { field: 'carrierType', query: 'carrier type mobile wireless fixed line broadband' },
  { field: 'regionalMarket', query: 'regional market presence geographic coverage' }
];

// Function to search for specific data about a company
async function searchCompanyData(companyName, query) {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Search for: ${companyName} ${query}. Provide a concise, factual answer with specific numbers or data where available. Keep response under 100 words.`
      }],
      tools: [{
        type: "web_search_20250305",
        name: "web_search"
      }]
    });

    // Extract text content from response
    const textContent = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join(' ')
      .trim();

    return textContent || 'No data found';
  } catch (error) {
    console.error(chalk.red(`Error searching for ${query}:`), error.message);
    return 'Error retrieving data';
  }
}

// Function to get news sentiment score
async function getNewsScore(companyName) {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Search for recent news (last 3 months) about ${companyName}. Analyze overall sentiment and provide a score from -10 (very negative) to +10 (very positive). Respond with ONLY the number, no explanation.`
      }],
      tools: [{
        type: "web_search_20250305",
        name: "web_search"
      }]
    });

    const textContent = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join(' ');

    const score = parseInt(textContent.match(/-?\d+/)?.[0] || '0');
    return Math.max(-10, Math.min(10, score)); // Clamp between -10 and 10
  } catch (error) {
    console.error(chalk.red(`Error getting news score:`), error.message);
    return 0;
  }
}

// Function to research a single company
async function researchCompany(company) {
  const companyName = company['Company Name'];
  console.log(chalk.cyan(`\n🔍 Researching: ${companyName}`));
  
  const spinner = ora('Gathering data...').start();
  
  const result = {
    'Company Name': companyName,
    'Website': company['Website'] || '',
    'Stock Ticker': company['Stock Ticker'] || '',
  };

  // Research each data point
  for (const { field, query } of RESEARCH_QUERIES) {
    spinner.text = `Searching: ${query}...`;
    result[field] = await searchCompanyData(companyName, query);
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Get news sentiment score
  spinner.text = 'Analyzing recent news sentiment...';
  result.newsScore = await getNewsScore(companyName);
  
  spinner.succeed(chalk.green(`✓ Completed research for ${companyName}`));
  
  return result;
}

// Main function
async function main() {
  console.log(chalk.bold.magenta('\n📊 Network Provider Research Tool\n'));
  console.log(chalk.gray('━'.repeat(60)));

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(chalk.red('\n❌ Error: ANTHROPIC_API_KEY environment variable not set'));
    console.log(chalk.yellow('\nPlease set your API key:'));
    console.log(chalk.white('  export ANTHROPIC_API_KEY=your-api-key-here'));
    console.log(chalk.gray('  or'));
    console.log(chalk.white('  set ANTHROPIC_API_KEY=your-api-key-here (Windows)\n'));
    process.exit(1);
  }

  // Check if input file exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(chalk.red(`\n❌ Error: Input file '${INPUT_FILE}' not found`));
    console.log(chalk.yellow('\nPlease create the CSV file with company data.\n'));
    process.exit(1);
  }

  // Read companies from CSV
  const companies = [];
  const readSpinner = ora('Reading CSV file...').start();
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(INPUT_FILE)
      .pipe(csv())
      .on('data', (row) => {
        if (row['Company Name']) {
          companies.push(row);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  readSpinner.succeed(chalk.green(`✓ Loaded ${companies.length} companies from CSV`));

  if (companies.length === 0) {
    console.error(chalk.red('\n❌ No companies found in CSV file\n'));
    process.exit(1);
  }

  console.log(chalk.gray('━'.repeat(60)));

  // Research all companies
  const results = [];
  for (let i = 0; i < companies.length; i++) {
    console.log(chalk.blue(`\nProgress: ${i + 1}/${companies.length}`));
    const result = await researchCompany(companies[i]);
    results.push(result);
  }

  console.log(chalk.gray('\n' + '━'.repeat(60)));

  // Write results to CSV
  const writeSpinner = ora('Writing results to CSV...').start();
  
  const csvWriter = createObjectCsvWriter({
    path: OUTPUT_FILE,
    header: [
      { id: 'Company Name', title: 'Company Name' },
      { id: 'Website', title: 'Website' },
      { id: 'Stock Ticker', title: 'Stock Ticker' },
      { id: 'tamPercent', title: 'TAM %' },
      { id: 'carrierRevenue', title: 'Carrier Revenue' },
      { id: 'marketCap', title: 'Market Cap' },
      { id: 'tmForumSpeakers', title: 'TM Forum Speakers' },
      { id: 'tmForumSponsorship', title: 'TM Forum Sponsorship' },
      { id: 'catalystProjects', title: 'Catalyst Projects' },
      { id: 'whitePapers', title: 'White Papers' },
      { id: 'membershipTier', title: 'Membership Tier' },
      { id: 'newsScore', title: 'News Score' },
      { id: 'ossSpend', title: 'OSS Spend Ranking' },
      { id: 'customerBase', title: 'Customer Base' },
      { id: 'stockChange', title: 'Stock Change YoY' },
      { id: 'carrierType', title: 'Carrier Type' },
      { id: 'regionalMarket', title: 'Regional Market' }
    ]
  });

  await csvWriter.writeRecords(results);
  writeSpinner.succeed(chalk.green(`✓ Results saved to ${OUTPUT_FILE}`));

  console.log(chalk.bold.green('\n✅ Research complete!\n'));
  console.log(chalk.cyan(`📄 Output file: ${OUTPUT_FILE}`));
  console.log(chalk.gray('━'.repeat(60) + '\n'));
}

// Run the script
main().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error.message);
  process.exit(1);
});
