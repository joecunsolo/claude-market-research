import fs from 'fs';
import csv from 'csv-parser';
import chalk from 'chalk';
import ora from 'ora';
import { generateHTMLReport } from './generate-html-report.js';

const SUMMARY_FILE = 'network_provider_summary.csv';
const RESULTS_FILE = 'network_provider_research_results.csv';
const HTML_REPORT_FILE = 'network_provider_report.html';

async function readCSV(filePath) {
  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => { if (row['Company Name']) rows.push(row); })
      .on('end', resolve)
      .on('error', reject);
  });
  return rows;
}

async function main() {
  console.log(chalk.bold.magenta('\n📊 Network Provider Report Generator\n'));
  console.log(chalk.gray('━'.repeat(60)));

  // Check summary CSV exists
  if (!fs.existsSync(SUMMARY_FILE)) {
    console.error(chalk.red(`\n❌ Error: Summary file '${SUMMARY_FILE}' not found`));
    console.log(chalk.yellow('\nRun npm run summarize first to generate the summary data.\n'));
    process.exit(1);
  }

  // Check results CSV exists
  if (!fs.existsSync(RESULTS_FILE)) {
    console.error(chalk.red(`\n❌ Error: Results file '${RESULTS_FILE}' not found`));
    console.log(chalk.yellow('\nRun npm start first to generate the research results.\n'));
    process.exit(1);
  }

  // Read both files
  const readSpinner = ora('Reading CSV files...').start();
  const [summaries, rawData] = await Promise.all([
    readCSV(SUMMARY_FILE),
    readCSV(RESULTS_FILE)
  ]);
  readSpinner.succeed(chalk.green(`✓ Loaded ${summaries.length} companies`));

  if (summaries.length === 0) {
    console.error(chalk.red('\n❌ No companies found in summary file\n'));
    process.exit(1);
  }

  // Generate HTML report
  const htmlSpinner = ora('Generating interactive HTML report...').start();
  try {
    generateHTMLReport(summaries, rawData, HTML_REPORT_FILE);
    htmlSpinner.succeed(chalk.green(`✓ Report saved to ${HTML_REPORT_FILE}`));
  } catch (error) {
    htmlSpinner.fail(chalk.red(`Failed to generate report: ${error.message}`));
    process.exit(1);
  }

  console.log(chalk.bold.green('\n✅ Report generated!\n'));
  console.log(chalk.cyan(`📊 Open in browser: ${HTML_REPORT_FILE}`));
  console.log(chalk.gray('━'.repeat(60) + '\n'));
}

main().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error.message);
  process.exit(1);
});
