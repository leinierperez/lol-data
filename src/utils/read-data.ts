import fsPromises from 'fs/promises';
import path from 'path';
import { ChampionQuote } from '../lol-wiki/types.js';

export async function getQuotesFromFile() {
  try {
    const filePath = path.join(process.cwd(), './data/quotes.json');
    const jsonData = await fsPromises.readFile(filePath, 'utf-8');
    const quoteData = (await JSON.parse(jsonData)) as ChampionQuote[];
    return quoteData;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
