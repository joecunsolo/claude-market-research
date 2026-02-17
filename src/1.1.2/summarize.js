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

const INPUT_FILE = 'network_provider_research_results.csv';
const OUTPUT_FILE = 'network_provider_summary.csv';

// Function to extract clean numerical values from text using Claude
async function extractValue(companyName, fieldName, fieldValue) {
  try {
    let prompt = '';
    
    switch(fieldName) {
      case 'Carrier Revenue':
        prompt = `Extract the numerical revenue value from this text: "${fieldValue}"
        
Company: ${companyName}

Return ONLY a clean number in billions of USD (e.g., "45.2" for $45.2B). 
If the value is in millions, convert to billions.
If multiple years are mentioned, use the most recent.
If no clear value exists, return "N/A".
Do not include currency symbols, letters, or explanations - just the number or "N/A".`;
        break;
        
      case 'Market Cap':
        prompt = `Extract the market capitalization value from this text: "${fieldValue}"
        
Company: ${companyName}

Return ONLY a clean number in billions of USD (e.g., "150.5" for $150.5B).
If the value is in millions, convert to billions.
If the value is in trillions, convert to billions.
Use the most recent value if multiple dates are mentioned.
If no clear value exists, return "N/A".
Do not include currency symbols, letters, or explanations - just the number or "N/A".`;
        break;
        
      case 'TAM %':
        prompt = `Extract the TAM (Total Addressable Market) percentage from this text: "${fieldValue}"
        
Company: ${companyName}

Return ONLY a clean percentage number (e.g., "12.5" for 12.5%).
Do not include the % symbol.
If multiple percentages are mentioned, use the most relevant market share figure.
If no clear percentage exists, return "N/A".
Do not include explanations - just the number or "N/A".`;
        break;
        
      case 'Customer Base - Mobile':
        prompt = `Extract the MOBILE/WIRELESS subscriber count from this text: "${fieldValue}"
        
Company: ${companyName}

Return ONLY a clean number in millions (e.g., "85.3" for 85.3M mobile subscribers).
Look for terms like: mobile, wireless, cellular, postpaid, prepaid, mobile connections
If the value is in billions, convert to millions (multiply by 1000).
If the value is in thousands, convert to millions (divide by 1000).
Use the most recent total if multiple figures are mentioned.
If no mobile subscriber count is mentioned, return "N/A".
Do not include letters, units, or explanations - just the number or "N/A".`;
        break;
        
      case 'Customer Base - Broadband':
        prompt = `Extract the BROADBAND/FIXED-LINE/INTERNET subscriber count from this text: "${fieldValue}"
        
Company: ${companyName}

Return ONLY a clean number in millions (e.g., "25.7" for 25.7M broadband subscribers).
Look for terms like: broadband, fixed-line, fiber, DSL, internet, home internet, fixed broadband
If the value is in billions, convert to millions (multiply by 1000).
If the value is in thousands, convert to millions (divide by 1000).
Use the most recent total if multiple figures are mentioned.
If no broadband subscriber count is mentioned, return "N/A".
Do not include letters, units, or explanations - just the number or "N/A".`;
        break;
        
      case 'Customer Base - Enterprise':
        prompt = `Extract the ENTERPRISE/BUSINESS/WHOLESALE customer count from this text: "${fieldValue}"
        
Company: ${companyName}

Return ONLY a clean number in millions (e.g., "2.1" for 2.1M enterprise customers).
Look for terms like: enterprise, business, B2B, wholesale, corporate, business customers
If the value is in billions, convert to millions (multiply by 1000).
If the value is in thousands, convert to millions (divide by 1000).
Use the most recent total if multiple figures are mentioned.
If no enterprise customer count is mentioned, return "N/A".
Do not include letters, units, or explanations - just the number or "N/A".`;
        break;
        
      case 'Stock Change YoY':
        prompt = `Extract the year-over-year stock price change percentage from this text: "${fieldValue}"
        
Company: ${companyName}

Return ONLY a clean number with + or - sign (e.g., "+15.3" or "-8.2").
Use the most recent YoY change if multiple periods are mentioned.
If no clear percentage change exists, return "N/A".
Do not include the % symbol or explanations - just the number with sign or "N/A".`;
        break;
        
      case 'TM Forum Speakers':
        prompt = `Extract the number of TM Forum speakers or presentations from this text: "${fieldValue}"
        
Company: ${companyName}

Return ONLY a clean whole number (e.g., "5" for 5 speakers, "12" for 12 presentations).
Look for mentions of speakers, presenters, presentations, sessions at TM Forum events.
If a range is given (e.g., "5-8 speakers"), use the higher number.
If multiple events are mentioned, sum the total.
If no clear number exists, return "0".
Do not include explanations - just the number or "0".`;
        break;
        
      case 'TM Forum Sponsorship':
        prompt = `Extract the TM Forum sponsorship level as a numerical score from this text: "${fieldValue}"
        
Company: ${companyName}

Convert sponsorship to a numerical score using this scale:
- Platinum/Premier/Strategic = 100
- Gold/Principal = 75
- Silver/Standard = 50
- Bronze/Associate = 25
- Member (no specific tier mentioned) = 10
- No sponsorship mentioned = 0

Return ONLY the number (0, 10, 25, 50, 75, or 100).
If a specific tier is mentioned, use the corresponding score.
Do not include explanations - just the number.`;
        break;
        
      case 'Catalyst Projects':
        prompt = `Extract the number of TM Forum Catalyst projects from this text: "${fieldValue}"
        
Company: ${companyName}

Return ONLY a clean whole number for the count of Catalyst projects.
Look for: number of projects, project participation, catalyst initiatives.
If a range is given (e.g., "3-5 projects"), use the higher number.
If multiple years are mentioned, use the most recent or total count.
If no clear number exists, return "0".
Do not include explanations - just the number or "0".`;
        break;
        
      case 'White Papers':
        prompt = `Extract the number of white papers or publications from this text: "${fieldValue}"
        
Company: ${companyName}

Return ONLY a clean whole number for the count of white papers/publications.
Look for: number of white papers, publications, technical papers, research papers.
If a range is given, use the higher number.
If multiple years are mentioned, sum the total or use the most comprehensive count.
If no clear number exists, return "0".
Do not include explanations - just the number or "0".`;
        break;
        
      case 'News Article Count':
        prompt = `Count the number of distinct news articles mentioned in this text: "${fieldValue}"
        
Company: ${companyName}

Return ONLY a clean whole number for the count of articles.
Look for: distinct article titles, news sources, separate news items.
Each unique article should be counted once.
If the text describes articles but doesn't list them, estimate based on context.
Typical range: 0-10 articles.
Return "0" if no articles are mentioned.
Do not include explanations - just the number.`;
        break;
        
      case 'News Sentiment':
        prompt = `Analyze the overall news sentiment from this text: "${fieldValue}"
        
Company: ${companyName}

Return a sentiment score from -10 to +10:
- Highly positive news: +7 to +10
- Moderately positive: +3 to +6
- Slightly positive: +1 to +2
- Neutral: 0
- Slightly negative: -1 to -2
- Moderately negative: -3 to -6
- Highly negative: -7 to -10

Consider the tone and content of the articles mentioned.
If multiple articles with different sentiments, average them.
Return ONLY the number with sign (e.g., "+5", "-3", "0").
Do not include explanations - just the number with sign.`;
        break;
        
      case 'Carrier Type':
        prompt = `Extract and classify the carrier type from this text: "${fieldValue}"
        
Company: ${companyName}

Return ONLY ONE of these exact values:
- "Mobile" - if primarily mobile/wireless/cellular
- "Fixed" - if primarily fixed-line/broadband/wireline
- "Converged" - if offering both mobile and fixed services significantly
- "N/A" - if unclear or not mentioned

Base your classification on what services are mentioned or what the company primarily offers.
Return only the classification word, nothing else.`;
        break;
        
      case 'Regional Market':
        prompt = `Extract and summarize the primary regional market(s) from this text: "${fieldValue}"
        
Company: ${companyName}

Return a concise region name or list (e.g., "North America", "Europe", "Asia-Pacific", "EMEA", "Global").
If multiple regions are mentioned, list the most significant ones separated by commas (max 3).
Use standard region names: North America, Latin America, Europe, Asia-Pacific, Middle East, Africa, EMEA, Global.
If unclear or not mentioned, return "N/A".
Keep the response under 50 characters.`;
        break;
        
      case 'TM Forum Membership':
        prompt = `Extract the TM Forum membership tier from this text: "${fieldValue}"
        
Company: ${companyName}

Return ONLY the membership tier/level if clearly stated.
Common tiers include: Platinum, Gold, Silver, Bronze, Strategic, Premier, Standard, Associate, Member.
Return the exact tier name if found.
If no specific tier is mentioned but membership is confirmed, return "Member".
If no membership information is found, return "N/A".
Return only the tier name, nothing else.`;
        break;
        
      default:
        return fieldValue;
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const result = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')
      .trim();

    return result;
  } catch (error) {
    console.error(chalk.red(`Error extracting ${fieldName}:`), error.message);
    return 'N/A';
  }
}

// Main function
async function main() {
  console.log(chalk.bold.magenta('\n📊 Network Provider Summary Generator\n'));
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

  // Check if results file exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(chalk.red(`\n❌ Error: Results file '${INPUT_FILE}' not found`));
    console.log(chalk.yellow('\nPlease run the research tool first to generate results.\n'));
    process.exit(1);
  }

  // Check if output file is locked/in use
  console.log(chalk.blue('\n🔒 Checking output file access...'));
  try {
    // Try to open the file for writing to check if it's locked
    const testFile = fs.openSync(OUTPUT_FILE, 'a');
    fs.closeSync(testFile);
    console.log(chalk.green('✓ Output file is accessible\n'));
  } catch (error) {
    if (error.code === 'EBUSY' || error.code === 'EPERM') {
      console.error(chalk.red(`\n❌ Error: Output file '${OUTPUT_FILE}' is locked or in use`));
      console.log(chalk.yellow('\nThe file may be open in Excel, another application, or locked by your system.'));
      console.log(chalk.white('\nPlease:'));
      console.log(chalk.white('  1. Close the file in any open applications'));
      console.log(chalk.white('  2. Make sure no other processes are accessing it'));
      console.log(chalk.white('  3. Try running the command again\n'));
      process.exit(1);
    }
    // If file doesn't exist yet, that's fine - we'll create it
    if (error.code !== 'ENOENT') {
      console.error(chalk.red(`\n❌ Error checking output file: ${error.message}\n`));
      process.exit(1);
    }
    console.log(chalk.green('✓ Output file will be created\n'));
  }

  console.log(chalk.gray('━'.repeat(60)));

  // Read companies from results CSV
  const companies = [];
  const readSpinner = ora('Reading results CSV...').start();
  
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

  readSpinner.succeed(chalk.green(`✓ Loaded ${companies.length} companies`));

  if (companies.length === 0) {
    console.error(chalk.red('\n❌ No companies found in results file\n'));
    process.exit(1);
  }

  console.log(chalk.gray('━'.repeat(60)));

  // Process each company
  const summaries = [];
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const companyName = company['Company Name'];
    
    console.log(chalk.cyan(`\n📝 Processing: ${companyName} (${i + 1}/${companies.length})`));
    const spinner = ora('Extracting values...').start();
    
    // Extract clean values for key metrics
    const summary = {
      'Company Name': companyName,
      'Website': company['Website'] || 'N/A',
      'Stock Ticker': company['Stock Ticker'] || 'N/A',
      'Carrier Revenue ($B)': await extractValue(companyName, 'Carrier Revenue', company['Carrier Revenue'] || ''),
      'Market Cap ($B)': await extractValue(companyName, 'Market Cap', company['Market Cap'] || ''),
      'TAM (%)': await extractValue(companyName, 'TAM %', company['TAM %'] || ''),
      'Customers - Mobile (M)': await extractValue(companyName, 'Customer Base - Mobile', company['Customer Base'] || ''),
      'Customers - Broadband (M)': await extractValue(companyName, 'Customer Base - Broadband', company['Customer Base'] || ''),
      'Customers - Enterprise (M)': await extractValue(companyName, 'Customer Base - Enterprise', company['Customer Base'] || ''),
      'Stock Change YoY (%)': await extractValue(companyName, 'Stock Change YoY', company['Stock Change YoY'] || ''),
      'TM Forum Speakers': await extractValue(companyName, 'TM Forum Speakers', company['TM Forum Speakers'] || ''),
      'TM Forum Sponsorship Score': await extractValue(companyName, 'TM Forum Sponsorship', company['TM Forum Sponsorship'] || ''),
      'Catalyst Projects': await extractValue(companyName, 'Catalyst Projects', company['Catalyst Projects'] || ''),
      'White Papers': await extractValue(companyName, 'White Papers', company['White Papers'] || ''),
      'News Article Count': await extractValue(companyName, 'News Article Count', company['Recent News Articles'] || ''),
      'News Sentiment Score': await extractValue(companyName, 'News Sentiment', company['Recent News Articles'] || ''),
      'Carrier Type': await extractValue(companyName, 'Carrier Type', company['Carrier Type'] || ''),
      'Regional Market': await extractValue(companyName, 'Regional Market', company['Regional Market'] || ''),
      'TM Forum Membership': await extractValue(companyName, 'TM Forum Membership', company['Membership Tier'] || '')
    };
    
    summaries.push(summary);
    spinner.succeed(chalk.green(`✓ Completed ${companyName}`));
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(chalk.gray('\n' + '━'.repeat(60)));

  // Write summary to CSV
  const writeSpinner = ora('Writing summary to CSV...').start();
  
  const csvWriter = createObjectCsvWriter({
    path: OUTPUT_FILE,
    header: [
      { id: 'Company Name', title: 'Company Name' },
      { id: 'Website', title: 'Website' },
      { id: 'Stock Ticker', title: 'Stock Ticker' },
      { id: 'Carrier Revenue ($B)', title: 'Carrier Revenue ($B)' },
      { id: 'Market Cap ($B)', title: 'Market Cap ($B)' },
      { id: 'TAM (%)', title: 'TAM (%)' },
      { id: 'Customers - Mobile (M)', title: 'Customers - Mobile (M)' },
      { id: 'Customers - Broadband (M)', title: 'Customers - Broadband (M)' },
      { id: 'Customers - Enterprise (M)', title: 'Customers - Enterprise (M)' },
      { id: 'Stock Change YoY (%)', title: 'Stock Change YoY (%)' },
      { id: 'TM Forum Speakers', title: 'TM Forum Speakers' },
      { id: 'TM Forum Sponsorship Score', title: 'TM Forum Sponsorship Score' },
      { id: 'Catalyst Projects', title: 'Catalyst Projects' },
      { id: 'White Papers', title: 'White Papers' },
      { id: 'News Article Count', title: 'News Article Count' },
      { id: 'News Sentiment Score', title: 'News Sentiment Score' },
      { id: 'Carrier Type', title: 'Carrier Type' },
      { id: 'Regional Market', title: 'Regional Market' },
      { id: 'TM Forum Membership', title: 'TM Forum Membership' }
    ]
  });

  await csvWriter.writeRecords(summaries);
  writeSpinner.succeed(chalk.green(`✓ Summary saved to ${OUTPUT_FILE}`));

  console.log(chalk.bold.green('\n✅ Summary generation complete!\n'));
  console.log(chalk.cyan(`📄 Summary file: ${OUTPUT_FILE}`));
  console.log(chalk.yellow('\nℹ️  The summary contains clean numerical values extracted from the research data.'));
  console.log(chalk.gray('━'.repeat(60) + '\n'));
}

// Run the script
main().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error.message);
  process.exit(1);
});
