import { search, SafeSearchType } from 'duck-duck-scrape';
import chalk from 'chalk';

const DEFAULT_NUM_RESULTS = parseInt(process.env.SEARCH_RESULTS_COUNT) || 5;

/**
 * Search the web using DuckDuckGo and return formatted snippet text.
 * Returns an empty string on failure (graceful fallback).
 *
 * @param {string} query - The search query
 * @param {number} numResults - Max number of results to include
 * @returns {Promise<string>} Formatted search result snippets
 */
export async function searchWeb(query, numResults = DEFAULT_NUM_RESULTS) {
  try {
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
    console.error(chalk.yellow(`⚠ Web search failed for "${query}": ${error.message}`));
    return '';
  }
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
