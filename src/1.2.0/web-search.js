import chalk from 'chalk';

const DEFAULT_NUM_RESULTS = parseInt(process.env.SEARCH_RESULTS_COUNT) || 5;
const SEARCH_DELAY_MS = 2000; // Delay between searches to avoid rate limiting
const MAX_RETRIES = 3;

// Track last search time for rate limiting
let lastSearchTime = 0;

/**
 * Wait until enough time has passed since the last search.
 * Adds random jitter (0-1s) to make request pattern less predictable.
 */
async function throttle() {
  const now = Date.now();
  const jitter = Math.random() * 1000;
  const delay = SEARCH_DELAY_MS + jitter;
  const elapsed = now - lastSearchTime;
  if (elapsed < delay) {
    await new Promise(resolve => setTimeout(resolve, delay - elapsed));
  }
  lastSearchTime = Date.now();
}

/**
 * Parse search results from DuckDuckGo HTML response.
 * @param {string} html - Raw HTML from html.duckduckgo.com
 * @returns {Array<{title: string, description: string, url: string}>}
 */
function parseResults(html) {
  const results = [];

  // Match result blocks: each has a link with class="result__a" and snippet with class="result__snippet"
  const resultBlocks = html.split('class="result results_links');

  for (const block of resultBlocks) {
    try {
      // Extract URL from result__a href
      const urlMatch = block.match(/class="result__a"[^>]*href="([^"]+)"/);
      if (!urlMatch) continue;

      let url = urlMatch[1];
      // DDG wraps URLs in a redirect — extract the actual URL
      const uddgMatch = url.match(/uddg=([^&]+)/);
      if (uddgMatch) {
        url = decodeURIComponent(uddgMatch[1]);
      }

      // Extract title text from result__a
      const titleMatch = block.match(/class="result__a"[^>]*>([^<]+)</);
      const title = titleMatch ? decodeHTMLEntities(titleMatch[1].trim()) : '';

      // Extract snippet from result__snippet
      const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      let description = '';
      if (snippetMatch) {
        description = decodeHTMLEntities(snippetMatch[1].replace(/<[^>]+>/g, '').trim());
      }

      if (title && url && !url.startsWith('//duckduckgo.com')) {
        results.push({ title, description, url });
      }
    } catch {
      // Skip malformed blocks
    }
  }

  return results;
}

/**
 * Decode common HTML entities.
 */
function decodeHTMLEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code));
}

/**
 * Search the web using DuckDuckGo HTML endpoint and return formatted snippet text.
 * Uses html.duckduckgo.com/html which is more reliable than the JSON API.
 * Returns an empty string on failure (graceful fallback).
 *
 * @param {string} query - The search query
 * @param {number} numResults - Max number of results to include
 * @returns {Promise<{success: boolean, results: string}>}
 */
export async function searchWeb(query, numResults = DEFAULT_NUM_RESULTS) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await throttle();

      const params = new URLSearchParams({ q: query, kl: '' });
      const response = await fetch('https://html.duckduckgo.com/html/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://duckduckgo.com/',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Check for rate limiting / bot detection
      if (html.includes('detected unusual activity') || html.includes('Sorry, there were no results')) {
        if (attempt < MAX_RETRIES) {
          const backoff = SEARCH_DELAY_MS * Math.pow(2, attempt + 1);
          console.error(chalk.yellow(`⚠ DDG rate limited, retrying in ${(backoff / 1000).toFixed(0)}s... (attempt ${attempt + 1}/${MAX_RETRIES})`));
          await new Promise(resolve => setTimeout(resolve, backoff));
          lastSearchTime = Date.now();
          continue;
        }
        return { success: false, results: '' };
      }

      const parsed = parseResults(html);

      if (parsed.length === 0) {
        return { success: true, results: '' };
      }

      const formatted = parsed
        .slice(0, numResults)
        .map((r, i) => `[${i + 1}] ${r.title}\n${r.description}\nSource: ${r.url}`)
        .join('\n\n');

      return { success: true, results: formatted };
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const backoff = SEARCH_DELAY_MS * Math.pow(2, attempt + 1);
        console.error(chalk.yellow(`⚠ Web search error, retrying in ${(backoff / 1000).toFixed(0)}s... (attempt ${attempt + 1}/${MAX_RETRIES}): ${error.message}`));
        await new Promise(resolve => setTimeout(resolve, backoff));
        lastSearchTime = Date.now();
        continue;
      }

      console.error(chalk.yellow(`⚠ Web search failed for "${query}": ${error.message}`));
      return { success: false, results: '' };
    }
  }
  return { success: false, results: '' };
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
