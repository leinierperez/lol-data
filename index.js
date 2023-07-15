import Xray from 'x-ray';
import { champions } from './champions.js';
import fs from 'fs';
import uploadBatch from './s3Upload.js';

const x = Xray();

const quoteFilters = ['Effort Sound', 'Sound Effect'];
const urlFilters = ['SFX', 'FX', 'Music'];
const dialogueChamps = ['Xayah', 'Rakan', 'Kayle', 'Morgana'];

const filterQuotes = ({ quote, url }) => {
  if (quoteFilters.includes(quote)) return false;
  if (quote.length > 3 && quote.slice(-3) === 'ogg') return false;
  if (urlFilters.some((filter) => url.includes(filter))) return false;
  return true;
};

const handleDialogueChamps = (
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

const scrapeChampionQuotes = async (champion, { useWikiUrl, uploadToS3 }) => {
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
    })(async (err, obj) => {
      if (err) {
        reject(err);
      } else {
        const quotes = [];
        const files = [];
        let s3URL, key;
        for (const q of obj.quotes) {
          let extraQuote = '';
          let url = q.url || q.url2 || q.aatroxUrl;
          if (!url || !q.quote) continue;
          let quote = q.quote.replace(/"([^"]+)"/g, '$1');
          url = url.split('/revision')[0];
          if (!useWikiUrl) {
            key = url.substring(url.lastIndexOf('/') + 1);
            s3URL = `https://r2.leaguesounds.com/${key}`;
          }
          if (q.innerQuoteChamp && q.innerQuote) {
            if (champion === 'Kindred') {
              extraQuote = q.innerQuote.replace(/"([^"]+)"/g, '$1');
            } else if (dialogueChamps.includes(champion)) {
              quote = handleDialogueChamps(champion, q);
            }
          }
          if (q.innerQuote && champion === 'Kayn') {
            extraQuote = q.innerQuote;
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
            url: useWikiUrl ? url : s3URL,
          });
          if (uploadToS3) {
            files.push({
              key,
              url,
            });
          }
        }
        const filteredQuotes = quotes.filter(filterQuotes);
        const uniqueQuotes = [
          ...new Map(filteredQuotes.map((q) => [q.quote, q])).values(),
        ];
        resolve({ name: champion, quotes: uniqueQuotes, files });
      }
    });
  });
};

const getQuotes = async ({ useWikiUrl, uploadToS3 }) => {
  const quotePromises = champions.map((champion) =>
    scrapeChampionQuotes(champion, { useWikiUrl, uploadToS3 })
  );
  return Promise.all(quotePromises);
};

const handleS3Upload = async (data) => {
  const files = data.flatMap(({ files }) => files);
  await uploadBatch(files);
};

const saveData = async ({ useWikiUrl, uploadToS3 }) => {
  const data = await getQuotes({ useWikiUrl, uploadToS3 });
  const dataWithoutFiles = data.map(({ name, quotes }) => ({
    name,
    quotes,
  }));
  if (uploadToS3) {
    await handleS3Upload(data, uploadToS3);
  }
  if (useWikiUrl) {
    await fs.promises.writeFile(
      'data_wiki_links.json',
      JSON.stringify(dataWithoutFiles)
    );
  } else {
    await fs.promises.writeFile(
      'data_s3_links.json',
      JSON.stringify(dataWithoutFiles)
    );
  }
  console.log('Data Saved!');
};

saveData({ useWikiUrl: false, uploadToS3: false });
