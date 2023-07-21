import fs from 'fs';
import Xray from 'x-ray';
import { champions } from '../utils/champions.js';
import uploadBatch from '../utils/cloudflare.js';
import {
  ChampionQuote,
  ChampionRawQuote,
  Quote,
  QuoteFile,
  UnfilteredQuote,
  XRayObject,
  XRayQuote,
} from './types.js';

const x = Xray();

const quoteFilters = ['effort sound', 'sound effect', 'sfx', 'music plays'];
const urlFilters = ['sfx', 'fx', 'music'];
const dialogueChamps = ['Xayah', 'Rakan', 'Kayle', 'Morgana'];

const filterQuotes = ({ quote, wikiURL, s3URL }: UnfilteredQuote) => {
  quote = quote.toLowerCase();
  wikiURL = wikiURL.toLowerCase();
  s3URL = s3URL.toLowerCase();
  if (quoteFilters.some((filter) => quote.includes(filter))) return false;
  if (quote.length > 3 && quote.slice(-3) === 'ogg') return false;
  if (
    urlFilters.some(
      (filter) => wikiURL.includes(filter) && s3URL.includes(filter)
    )
  )
    return false;
  return true;
};

const handleDialogueChamps = (
  champion: string,
  { quote, innerQuote, innerQuoteChamp, firstQuoteChamp }: XRayQuote
) => {
  if (firstQuoteChamp && firstQuoteChamp.includes(champion)) {
    return quote;
  } else if (innerQuoteChamp!.includes(champion)) {
    return innerQuote;
  }
};

// TODO: Refactor
const scrapeChampionQuotes = async (
  champion: string,
  { uploadToS3 }: { uploadToS3: boolean }
): Promise<ChampionRawQuote> => {
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
    })(async (err: unknown, obj: XRayObject) => {
      if (err) {
        reject(err);
      } else {
        const quotes: UnfilteredQuote[] = [];
        let files: QuoteFile[] = [];
        let s3URL: string, key: string;
        for (const q of obj.quotes) {
          let extraQuote = '';
          let url = q.url || q.url2 || q.aatroxUrl;
          if (!url || !q.quote) continue;
          let quote = q.quote.replace(/"([^"]+)"/g, '$1');
          url = url.split('/revision')[0];
          key = decodeURIComponent(url!.substring(url!.lastIndexOf('/') + 1));
          s3URL = `https://r2.leaguesounds.com/${key}`;
          if (q.innerQuoteChamp && q.innerQuote) {
            if (champion === 'Kindred') {
              extraQuote = q.innerQuote.replace(/"([^"]+)"/g, '$1');
            } else if (dialogueChamps.includes(champion)) {
              quote = handleDialogueChamps(champion, q)!;
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
            wikiURL: url!,
            s3URL,
          });
        }
        const filteredQuotes = quotes.filter(filterQuotes);
        const uniqueQuotes = [
          ...new Map(filteredQuotes.map((q) => [q.quote, q])).values(),
        ];
        if (uploadToS3) {
          files = uniqueQuotes.map(({ wikiURL }) => {
            const key = wikiURL.substring(wikiURL.lastIndexOf('/') + 1);
            const decodedKey = decodeURIComponent(key);
            return { key: decodedKey, url: wikiURL };
          });
        }
        resolve({
          name: champion,
          quotes: uniqueQuotes,
          files,
        });
      }
    });
  });
};

const getQuotes = async ({
  uploadToS3,
}: {
  uploadToS3: boolean;
}): Promise<ChampionRawQuote[]> => {
  const quotePromises = champions.map((champion: string) =>
    scrapeChampionQuotes(champion, { uploadToS3 })
  );
  return Promise.all(quotePromises);
};

const handleS3Upload = async (data: ChampionRawQuote[]) => {
  const files = data.flatMap(({ files }) => files);
  await uploadBatch(files);
};

const saveData = async ({ uploadToS3 }: { uploadToS3: boolean }) => {
  const data = await getQuotes({ uploadToS3 });
  const finalData: ChampionQuote[] = data.map(({ name, quotes }) => {
    const newQuotes: Quote[] = quotes.map(({ quote, s3URL }) => {
      return { quote, url: s3URL };
    });
    return { name, quotes: newQuotes };
  });
  if (uploadToS3) {
    await handleS3Upload(data);
  }
  await fs.promises.writeFile('./data/quotes.json', JSON.stringify(finalData));
  console.log('Data Saved!');
};

saveData({ uploadToS3: true });
