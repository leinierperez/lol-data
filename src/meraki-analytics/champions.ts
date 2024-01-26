import fs from 'fs';
import { Champion } from './types.js';

export async function getMerakiChampionData(): Promise<Champion[]> {
  const response = await fetch(
    'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json'
  );
  const merakiData: Record<string, Champion> = await response.json();
  const merakiChampions: Champion[] = [];
  for (const champKey of Object.keys(merakiData)) {
    const champion = merakiData[champKey];
    if (champion) {
      merakiChampions.push(champion);
    }
  }
  return merakiChampions;
}

export async function saveChampionNames() {
  const response = await fetch(
    'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json'
  );
  const merakiData: Record<string, Champion> = await response.json();
  const merakiChampions: Champion[] = [];
  for (const champKey of Object.keys(merakiData)) {
    const champion = merakiData[champKey];
    if (champion) {
      merakiChampions.push(champion);
    }
  }
  const champs = merakiChampions.map((s) => {
    if (s.name === 'Nunu & Willump') {
      return 'Nunu';
    }
    return s.name.replaceAll(' ', '_');
  });
  await fs.promises.writeFile(
    './src/utils/champions.json',
    JSON.stringify(champs)
  );
}

saveChampionNames();
