import fs from "fs";
import path from "path";

type MorphologyEntry = {
  location: string;
  word: string;
  pos: string;
  features: string[];
};

const morphologyMap = new Map<string, MorphologyEntry[]>();

function loadMorphology() {
  const filePath = path.join(
    process.cwd(),
    "data",
    "quran-morphology.txt"
  );

  const fileContent = fs.readFileSync(filePath, "utf-8");

  const lines = fileContent.split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split("\t");

    if (parts.length < 4) continue;

    const [location, word, pos, featureString] = parts;

    const verseKey = location.split(":").slice(0, 2).join(":");

    const entry: MorphologyEntry = {
      location,
      word,
      pos,
      features: featureString.split("|"),
    };

    if (!morphologyMap.has(verseKey)) {
      morphologyMap.set(verseKey, []);
    }

    morphologyMap.get(verseKey)?.push(entry);
  }

  console.log("Morphology database loaded");
}

loadMorphology();

export function getVerseMorphology(
  surah: number,
  ayah: number
) {
  const key = `${surah}:${ayah}`;

  return morphologyMap.get(key) || [];
}