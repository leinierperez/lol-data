import { generateQuotesArtDataToFile } from './custom/quotes-art.js';
import { saveData } from './lol-wiki/quotes.js';

async function main() {
  await saveData({ uploadToS3: false });
  await generateQuotesArtDataToFile();
}

main();
