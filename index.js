import Xray from 'x-ray';
import { champions } from './champions.js';
import fs from 'fs';

const x = Xray();

const filters = ['Effort Sound', 'Sound Effect'];

const filterQuotes = ({ quote, url }) => {
  if (filters.includes(quote)) return false;
  if (quote.length > 3 && quote.slice(-3) === 'ogg') return false;
  if (url.includes('SFX')) return false;
  return true;
};

const scrapeChampionQuotes = async (champion) => {
  return new Promise((resolve, reject) => {
    x(`https://leagueoflegends.fandom.com/wiki/${champion}/LoL/Audio`, {
      quotes: x('.mw-parser-output ul li', [
        {
          quote: x('i'),
          url: x('.audio-button audio@src'),
          url2: x('.ext-audiobutton source@src'),
        },
      ]),
    })((err, obj) => {
      if (err) {
        reject(err);
      } else {
        const quotes = [];
        for (const q of obj.quotes) {
          const url = q.url || q.url2;
          if (!url || !q.quote) continue;
          const quote = q.quote.replace(/"([^"]+)"/g, '$1');
          quotes.push({
            quote,
            url: url.split('/revision')[0],
          });
        }
        const filteredQuotes = quotes.filter(filterQuotes);
        const uniqueQuotes = [
          ...new Map(filteredQuotes.map((q) => [q.quote, q])).values(),
        ];
        resolve({ name: champion, quotes: uniqueQuotes });
      }
    });
  });
};

const getQuotes = async () => {
  const quotePromises = champions.map(scrapeChampionQuotes);
  return Promise.all(quotePromises);
};

const saveData = async () => {
  const data = await getQuotes();
  await fs.promises.writeFile('data.json', JSON.stringify(data));
  console.log('Data Saved');
};
saveData();
