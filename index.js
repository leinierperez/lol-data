import Xray from 'x-ray';
import { champions } from './champions.js';
import fs from 'fs';

const x = Xray();

const filterQuotes = (quote) => {
  if (!quote) return false;
  if (quote.includes('SFX')) return false;
  if (quote.length > 3 && quote.slice(-3) === 'ogg') return false;
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
          if (!url) continue;
          const quote = q.quote?.replace(/[^\w\s]/g, '');
          if (quote === 'Sound Effect') continue;
          quotes.push({
            quote,
            url: url.split('/revision')[0],
          });
        }
        const filteredQuotes = quotes.filter((q) => filterQuotes(q.quote));
        const uniqueQuotes = [
          ...new Map(filteredQuotes.map((q) => [q.quote, q])).values(),
        ];
        resolve({ name: champion, uniqueQuotes });
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
