import { search, SafeSearchType } from 'duck-duck-scrape';
import chalk from 'chalk';

const DEFAULT_NUM_RESULTS = parseInt(process.env.SEARCH_RESULTS_COUNT) || 5;
const SEARCH_DELAY_MS = 1500; // Delay between searches to avoid DDG rate limiting
const MAX_RETRIES = 2;

// Track last search time for rate limiting
let lastSearchTime = 0;

/**
 * Wait until enough time has passed since the last search.
 */
async function throttle() {
  const now = Date.now();
  const elapsed = now - lastSearchTime;
  if (elapsed < SEARCH_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, SEARCH_DELAY_MS - elapsed));
  }
  lastSearchTime = Date.now();
}

/**
 * Search the web using DuckDuckGo and return formatted snippet text.
 * Includes rate limiting and retry logic to handle DDG anomaly detection.
 * Returns an empty string on failure (graceful fallback).
 *
 * @param {string} query - The search query
 * @param {number} numResults - Max number of results to include
 * @returns {Promise<string>} Formatted search result snippets
 */
export async function searchWeb(query, numResults = DEFAULT_NUM_RESULTS) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await throttle();

      const results = await search(query, {
        safeSearch: SafeSearchType.MODERATE,
      });

      if (!results.results || results.results.length === 0) {
        return '';
      }

      return results.results
        .slice(0, numResults)
        .map((r, i) => `[${i + 1}] ${r.title}\n${r.description}\nSource: ${r.url}`)
        .join('\n\n');
    } catch (error) {
      const isRateLimit = error.message && error.message.includes('anomaly');

      if (isRateLimit && attempt < MAX_RETRIES) {
        const backoff = SEARCH_DELAY_MS * (attempt + 2); // 3s, 4.5s
        console.error(chalk.yellow(`⚠ DDG rate limited, retrying in ${(backoff / 1000).toFixed(1)}s... (attempt ${attempt + 1}/${MAX_RETRIES})`));
        await new Promise(resolve => setTimeout(resolve, backoff));
        lastSearchTime = Date.now();
        continue;
      }

      console.error(chalk.yellow(`⚠ Web search failed for "${query}": ${error.message}`));
      return '';
    }
  }
  return '';
}

/**
 * Check if web search is enabled via environment variable.
 * @returns {boolean}
 */
export function isSearchEnabled() {
  const val = process.env.SEARCH_ENABLED;
  if (val === undefined || val === null) return true;
  return val.toLowerCase() !== 'false' && val !== '0';
}
