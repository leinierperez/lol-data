import fsPromises from 'fs/promises';
import { Quote } from '../lol-wiki/types.js';
import { getMerakiChampionData } from '../meraki-analytics/champions.js';
import { getQuotesFromFile } from '../utils/read-data.js';

export async function generateQuotesArtDataToFile(): Promise<QuotesArtData[]> {
  try {
    const merakiChampionData = await getMerakiChampionData();
    const quotesData = await getQuotesFromFile();
    const quotesArtData: QuotesArtData[] = [];

    if (merakiChampionData.length !== quotesData.length) {
      console.log(
        '🚀 quotes-art.ts:10 ~ quotesData.length:',
        quotesData.length
      );
      console.log(
        '🚀 quotes-art.ts:10 ~ merakiChampionData.length:',
        merakiChampionData.length
      );
      throw 'The size of champion data differ. Scrape new quotesData if a new champion was released';
    }

    for (const [i, champion] of merakiChampionData.entries()) {
      const { id, key, name, title, icon, skins } = champion;
      const quotes = quotesData[i]?.quotes;
      const newSkins: Skin[] | undefined = skins?.map((skin) => {
        return {
          name: skin.name,
          id: skin.id,
          splashPath: skin.splashPath,
          uncenteredSplashPath: skin.uncenteredSplashPath,
          tilePath: skin.tilePath,
          loadScreenPath: skin.loadScreenPath,
          loadScreenVintagePath: skin.loadScreenVintagePath,
        };
      });

      quotesArtData.push({
        id,
        key,
        name,
        title,
        icon,
        quotes: quotes || [],
        skins: newSkins || [],
      });
    }

    await fsPromises.writeFile(
      'data/quotes-art.json',
      JSON.stringify(quotesArtData),
      'utf-8'
    );

    return quotesArtData;
  } catch (err) {
    throw err;
  }
}

interface QuotesArtData {
  id: number;
  key: string;
  name: string;
  title: string;
  icon: string;
  quotes: Quote[];
  skins: Skin[];
}

interface Skin {
  name: string;
  id: number;
  splashPath: string;
  uncenteredSplashPath: string;
  tilePath: string;
  loadScreenPath: string;
  loadScreenVintagePath: string | null | undefined;
}
