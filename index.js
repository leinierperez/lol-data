import Xray from 'x-ray';
import { champions } from './champions.js';
import fs from 'fs';

const x = Xray();

const filters = ['Effort Sound', 'Sound Effect'];
const dialogueChamps = ['Xayah', 'Rakan'];

const filterQuotes = ({ quote, url }) => {
  if (filters.includes(quote)) return false;
  if (quote.length > 3 && quote.slice(-3) === 'ogg') return false;
  if (url.includes('SFX')) return false;
  return true;
};

const handleXayahRakan = (
  champion,
  { quote, innerQuote, innerQuoteChamp, firstQuoteChamp }
) => {
  if (firstQuoteChamp && firstQuoteChamp.includes(champion)) {
    return quote;
  } else if (innerQuoteChamp.includes(champion)) {
    return innerQuote;
  }
  return false;
};

const scrapeChampionQuotes = async (champion) => {
  return new Promise((resolve, reject) => {
    x(`https://leagueoflegends.fandom.com/wiki/${champion}/LoL/Audio`, {
      quotes: x('.mw-parser-output ul li', [
        {
          quote: x('i'),
          firstQuoteChamp: x('b'),
          innerQuoteChamp: x('ul li b'),
          innerQuote: x('ul li i'),
          url: x('.audio-button audio@src'),
          url2: x('.ext-audiobutton source@src'),
          aatroxUrl: x('span .ext-audiobutton source@src'),
        },
      ]),
    })((err, obj) => {
      if (err) {
        reject(err);
      } else {
        const quotes = [];
        for (const q of obj.quotes) {
          let extraQuote = '';
          const url = q.url || q.url2 || q.aatroxUrl;
          if (!url || !q.quote) continue;
          let quote = q.quote.replace(/"([^"]+)"/g, '$1');
          if (q.innerQuoteChamp && q.innerQuote) {
            if (champion === 'Kindred') {
              extraQuote = q.innerQuote.replace(/"([^"]+)"/g, '$1');
            } else if (dialogueChamps.includes(champion)) {
              quote = handleXayahRakan(champion, q);
            }
          }
          if (
            dialogueChamps.includes(champion) &&
            q.firstQuoteChamp &&
            !q.firstQuoteChamp.includes(champion)
          ) {
            continue;
          }
          if (extraQuote) {
            quote += ' ' + extraQuote;
          }
          quote = quote.replace(/"/g, '');
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
