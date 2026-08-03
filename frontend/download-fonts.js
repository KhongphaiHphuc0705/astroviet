import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fonts = [
  {
    family: "newsreader",
    id: "newsreader",
    weight: "400",
    dir: "newsreader",
    name: "newsreader-regular.woff2",
  },
  {
    family: "newsreader",
    id: "newsreader",
    weight: "600",
    dir: "newsreader",
    name: "newsreader-semibold.woff2",
  },
  {
    family: "inter",
    id: "inter",
    weight: "400",
    dir: "inter",
    name: "inter-regular.woff2",
  },
  {
    family: "inter",
    id: "inter",
    weight: "500",
    dir: "inter",
    name: "inter-medium.woff2",
  },
  {
    family: "inter",
    id: "inter",
    weight: "600",
    dir: "inter",
    name: "inter-semibold.woff2",
  },
  {
    family: "inter",
    id: "inter",
    weight: "700",
    dir: "inter",
    name: "inter-bold.woff2",
  },
  {
    family: "ibm-plex-mono",
    id: "ibm-plex-mono",
    weight: "400",
    dir: "ibm-plex-mono",
    name: "ibm-plex-mono-regular.woff2",
  },
];

async function downloadFonts() {
  for (const font of fonts) {
    const dirPath = path.join(__dirname, "public", "fonts", font.dir);
    fs.mkdirSync(dirPath, { recursive: true });

    // Using gwfh API to get woff2 URLs
    const apiUrl = `https://gwfh.mranftl.com/api/fonts/${font.id}?subsets=latin,vietnamese`;
    console.log(`Fetching info for ${font.id} ${font.weight}...`);

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      const variant =
        data.variants.find(
          (v) =>
            String(v.fontWeight) === font.weight && v.fontStyle === "normal",
        ) || data.variants[0];

      if (variant && variant.woff2) {
        console.log(`Downloading ${font.name}...`);
        const woff2Res = await fetch(variant.woff2);
        const arrayBuffer = await woff2Res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        fs.writeFileSync(path.join(dirPath, font.name), buffer);
        console.log(`Saved ${font.name}`);
      } else {
        console.error(`Variant not found for ${font.name}`);
      }
    } catch (err) {
      console.error(`Error downloading ${font.name}:`, err.message);
    }
  }
}

downloadFonts();
