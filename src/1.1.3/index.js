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

// Error indicators to check for
const ERROR_INDICATORS = [
  'error retrieving data',
  'no data found',
  'error',
  'n/a',
  'not found',
  'unavailable'
];

// Function to check if a field value indicates an error
function hasError(value) {
  if (!value || value.trim() === '') return true;
  const lowerValue = value.toLowerCase();
  return ERROR_INDICATORS.some(indicator => lowerValue.includes(indicator));
}

// Function to identify which fields need to be re-researched
function getFieldsToUpdate(company) {
  const fieldsToUpdate = [];
  
  RESEARCH_QUERIES.forEach(({ field }) => {
    if (hasError(company[field])) {
      fieldsToUpdate.push(field);
    }
  });
  
  // Check news articles separately
  if (hasError(company.newsArticles)) {
    fieldsToUpdate.push('newsArticles');
  }
  
  return fieldsToUpdate;
}

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

// Function to get recent news articles with links
async function getNewsArticles(companyName) {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Search for the 3-5 most recent and relevant news articles about ${companyName} from the last 3 months. For each article, provide:
1. Article title
2. Source/publication name
3. URL link
4. Brief sentiment (positive/negative/neutral)

Format each article on a new line as: [Title] - Source (sentiment) - URL

Keep it concise and factual.`
      }],
      tools: [{
        type: "web_search_20250305",
        name: "web_search"
      }]
    });

    const textContent = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join(' ')
      .trim();

    return textContent || 'No recent news found';
  } catch (error) {
    console.error(chalk.red(`Error getting news articles:`), error.message);
    return 'Error retrieving news';
  }
}

// Function to research a single company
async function researchCompany(company, fieldsToResearch = null) {
  const companyName = company['Company Name'];
  console.log(chalk.cyan(`\n🔍 Researching: ${companyName}`));
  
  const spinner = ora('Gathering data...').start();
  
  const result = {
    'Company Name': companyName,
    'Website': company['Website'] || '',
    'Stock Ticker': company['Stock Ticker'] || '',
  };

  // Determine which fields to research
  const queries = fieldsToResearch 
    ? RESEARCH_QUERIES.filter(q => fieldsToResearch.includes(q.field))
    : RESEARCH_QUERIES;

  // Copy existing data if we're doing a partial update
  if (fieldsToResearch) {
    RESEARCH_QUERIES.forEach(({ field }) => {
      if (!fieldsToResearch.includes(field) && company[field]) {
        result[field] = company[field];
      }
    });
    if (!fieldsToResearch.includes('newsArticles') && company.newsArticles) {
      result.newsArticles = company.newsArticles;
    }
  }

  // Research each data point
  for (const { field, query } of queries) {
    spinner.text = `Searching: ${query}...`;
    result[field] = await searchCompanyData(companyName, query);
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Get news articles if needed
  if (!fieldsToResearch || fieldsToResearch.includes('newsArticles')) {
    spinner.text = 'Searching for recent news articles...';
    result.newsArticles = await getNewsArticles(companyName);
  }
  
  const updateInfo = fieldsToResearch 
    ? ` (updated ${fieldsToResearch.length} field${fieldsToResearch.length > 1 ? 's' : ''})`
    : '';
  spinner.succeed(chalk.green(`✓ Completed research for ${companyName}${updateInfo}`));
  
  return result;
}

// Main function
async function main() {
  const isUpdateMode = process.argv.includes('--update');
  
  console.log(chalk.bold.magenta(`\n📊 Network Provider Research Tool${isUpdateMode ? ' - Update Mode' : ''}\n`));
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

  let companies = [];
  let inputFile = INPUT_FILE;

  if (isUpdateMode) {
    // In update mode, read from the results file
    if (!fs.existsSync(OUTPUT_FILE)) {
      console.error(chalk.red(`\n❌ Error: Results file '${OUTPUT_FILE}' not found`));
      console.log(chalk.yellow('\nRun the tool in normal mode first to create initial results.\n'));
      process.exit(1);
    }
    inputFile = OUTPUT_FILE;
    console.log(chalk.blue(`\n🔄 Update mode: Checking ${OUTPUT_FILE} for errors...\n`));
  } else {
    // Normal mode - check for input file
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(chalk.red(`\n❌ Error: Input file '${INPUT_FILE}' not found`));
      console.log(chalk.yellow('\nPlease create the CSV file with company data.\n'));
      process.exit(1);
    }
  }

  // Read companies from CSV
  const readSpinner = ora('Reading CSV file...').start();
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(inputFile)
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

  // In update mode, identify companies/fields with errors
  let companiesToUpdate = [];
  if (isUpdateMode) {
    companies.forEach(company => {
      const fieldsToUpdate = getFieldsToUpdate(company);
      if (fieldsToUpdate.length > 0) {
        companiesToUpdate.push({
          company,
          fieldsToUpdate
        });
      }
    });

    if (companiesToUpdate.length === 0) {
      console.log(chalk.green('\n✅ No errors found! All companies have complete data.\n'));
      process.exit(0);
    }

    console.log(chalk.yellow(`\n⚠️  Found ${companiesToUpdate.length} compan${companiesToUpdate.length > 1 ? 'ies' : 'y'} with errors:\n`));
    companiesToUpdate.forEach(({ company, fieldsToUpdate }) => {
      console.log(chalk.white(`  • ${company['Company Name']}: ${chalk.red(fieldsToUpdate.length)} field${fieldsToUpdate.length > 1 ? 's' : ''} to update`));
    });
    console.log(chalk.gray('\n' + '━'.repeat(60)));
  }

  // Research companies
  const results = [];
  const toProcess = isUpdateMode ? companiesToUpdate : companies.map(c => ({ company: c, fieldsToUpdate: null }));
  
  for (let i = 0; i < toProcess.length; i++) {
    const { company, fieldsToUpdate } = toProcess[i];
    console.log(chalk.blue(`\nProgress: ${i + 1}/${toProcess.length}`));
    const result = await researchCompany(company, fieldsToUpdate);
    results.push(result);
  }

  // In update mode, merge with existing data
  if (isUpdateMode) {
    const updatedCompanyNames = new Set(results.map(r => r['Company Name']));
    
    // Add companies that didn't need updates
    companies.forEach(company => {
      if (!updatedCompanyNames.has(company['Company Name'])) {
        results.push(company);
      }
    });
    
    // Sort to maintain original order
    results.sort((a, b) => {
      const indexA = companies.findIndex(c => c['Company Name'] === a['Company Name']);
      const indexB = companies.findIndex(c => c['Company Name'] === b['Company Name']);
      return indexA - indexB;
    });
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
      { id: 'newsArticles', title: 'Recent News Articles' },
      { id: 'ossSpend', title: 'OSS Spend Ranking' },
      { id: 'customerBase', title: 'Customer Base' },
      { id: 'stockChange', title: 'Stock Change YoY' },
      { id: 'carrierType', title: 'Carrier Type' },
      { id: 'regionalMarket', title: 'Regional Market' }
    ]
  });

  await csvWriter.writeRecords(results);
  writeSpinner.succeed(chalk.green(`✓ Results saved to ${OUTPUT_FILE}`));

  if (isUpdateMode) {
    console.log(chalk.bold.green('\n✅ Update complete!\n'));
    console.log(chalk.cyan(`📝 Updated ${companiesToUpdate.length} compan${companiesToUpdate.length > 1 ? 'ies' : 'y'}`));
  } else {
    console.log(chalk.bold.green('\n✅ Research complete!\n'));
  }
  
  console.log(chalk.cyan(`📄 Output file: ${OUTPUT_FILE}`));
  console.log(chalk.gray('━'.repeat(60) + '\n'));
}

// Run the script
main().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error.message);
  process.exit(1);
});
