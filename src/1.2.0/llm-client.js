import { Ollama } from 'ollama';
import chalk from 'chalk';
import { searchWeb, isSearchEnabled } from './web-search.js';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5';

const client = new Ollama({ host: OLLAMA_HOST });

/**
 * Check that Ollama is reachable and the configured model is available.
 * Exits the process with a helpful message if not.
 */
export async function checkConnection() {
  try {
    const models = await client.list();
    const modelNames = models.models.map(m => m.name);

    // Check if the configured model (or a variant) is available
    const modelAvailable = modelNames.some(
      name => name === OLLAMA_MODEL || name.startsWith(OLLAMA_MODEL + ':')
    );

    if (!modelAvailable) {
      console.error(chalk.red(`\n❌ Model '${OLLAMA_MODEL}' not found in Ollama`));
      console.log(chalk.yellow('\nAvailable models:'));
      modelNames.forEach(name => console.log(chalk.white(`  • ${name}`)));
      console.log(chalk.yellow(`\nPull the model with:`));
      console.log(chalk.white(`  ollama pull ${OLLAMA_MODEL}\n`));
      process.exit(1);
    }

    console.log(chalk.green(`✓ Connected to Ollama at ${OLLAMA_HOST}`));
    console.log(chalk.green(`✓ Using model: ${OLLAMA_MODEL}`));
    return true;
  } catch (error) {
    console.error(chalk.red('\n❌ Cannot connect to Ollama'));
    console.log(chalk.yellow(`\nMake sure Ollama is running at ${OLLAMA_HOST}`));
    console.log(chalk.white('\nInstall Ollama: https://ollama.com'));
    console.log(chalk.white(`Start Ollama:   ollama serve`));
    console.log(chalk.white(`Pull a model:   ollama pull ${OLLAMA_MODEL}\n`));
    process.exit(1);
  }
}

/**
 * Stage 1: Chat with web search context.
 * Searches the web first, then feeds the results as context to the LLM.
 * If search is enabled but fails, throws an error so the field can be retried later.
 *
 * @param {string} prompt - The user-facing question/instruction
 * @param {string} searchQuery - The query to search the web for
 * @param {number} numPredict - Max tokens to generate (default 500)
 * @returns {Promise<string>} The model's text response
 * @throws {Error} If web search is enabled but fails to retrieve results
 */
export async function chatWithSearch(prompt, searchQuery, numPredict = 500) {
  let fullPrompt = prompt;

  if (isSearchEnabled()) {
    const { success, results: searchContext } = await searchWeb(searchQuery);

    if (!success) {
      // Search was enabled but failed — don't let the LLM hallucinate
      throw new Error('Web search failed — cannot provide up-to-date data');
    }

    if (searchContext) {
      fullPrompt = `Based on the following web search results:\n\n${searchContext}\n\n---\n\n${prompt}\n\nIMPORTANT: Only use information from the search results above. Do not make up or invent any data.`;
    } else {
      // Search succeeded but returned no results for this query
      fullPrompt = `${prompt}\n\nNote: No web search results were found for this query. If you do not have reliable information, respond with "No data found". Do not fabricate or guess data.`;
    }
  }

  const response = await client.chat({
    model: OLLAMA_MODEL,
    messages: [{ role: 'user', content: fullPrompt }],
    options: { num_predict: numPredict },
  });

  return response.message.content.trim();
}

/**
 * Stage 2: Direct chat for value extraction (no web search).
 * Uses a system message to enforce strict output formatting.
 *
 * @param {string} prompt - The extraction prompt
 * @param {number} numPredict - Max tokens to generate (default 100)
 * @returns {Promise<string>} The extracted value
 */
export async function chatExtract(prompt, numPredict = 100) {
  const response = await client.chat({
    model: OLLAMA_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a data extraction tool. Return ONLY the requested value — a number, a short label, or "N/A". Never add explanations, disclaimers, or extra text.',
      },
      { role: 'user', content: prompt },
    ],
    options: { num_predict: numPredict },
  });

  return cleanExtractedValue(response.message.content.trim());
}

/**
 * Post-process extracted values to strip common LLM artifacts.
 * @param {string} value
 * @returns {string}
 */
function cleanExtractedValue(value) {
  let cleaned = value;

  // Remove surrounding quotes
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '');

  // Remove common prefixes like "Answer:", "Result:", "Value:", etc.
  cleaned = cleaned.replace(/^(answer|result|value|output|response)\s*[:=]\s*/i, '');

  // Remove trailing periods
  cleaned = cleaned.replace(/\.$/, '');

  // If multi-line, take only the first line (models sometimes add explanations)
  const firstLine = cleaned.split('\n')[0].trim();
  if (firstLine) {
    cleaned = firstLine;
  }

  return cleaned.trim();
}
