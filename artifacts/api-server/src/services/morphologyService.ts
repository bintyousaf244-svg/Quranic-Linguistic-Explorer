import fs from 'fs';
import path from 'path';

export type MorphologyEntry = {
  location: string;
  word: string;
  pos: string;
  features: string[];
};

export interface WordMorphologyResult {
  root?: string;
  lemma?: string;
  type?: string;
  features?: string[];
  wazn?: string;
}

const morphologyMap = new Map<string, MorphologyEntry[]>();

function findMorphologyFile(): string | null {
  const candidates = [
    path.join(process.cwd(), 'data', 'quran-morphology.txt'),
    path.join(process.cwd(), 'artifacts', 'api-server', 'data', 'quran-morphology.txt'),
    path.join(process.cwd(), 'data', 'quran-morphology-rabail-pc.txt'),
    path.join(process.cwd(), 'artifacts', 'api-server', 'data', 'quran-morphology-rabail-pc.txt'),
    path.join(__dirname, '..', '..', 'data', 'quran-morphology.txt'),
    path.join(__dirname, '..', 'data', 'quran-morphology.txt'),
    path.join(__dirname, 'data', 'quran-morphology.txt'),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function loadMorphology() {
  try {
    const filePath = findMorphologyFile();
    if (!filePath) {
      console.warn('Morphology database file not found in candidates');
      return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split('\t');
      if (parts.length < 4) continue;

      const [location, word, pos, featureString] = parts;
      const verseKey = location.split(':').slice(0, 2).join(':');

      const entry: MorphologyEntry = {
        location,
        word,
        pos,
        features: featureString.split('|'),
      };

      if (!morphologyMap.has(verseKey)) {
        morphologyMap.set(verseKey, []);
      }
      morphologyMap.get(verseKey)?.push(entry);
    }

    console.log(`Morphology database loaded successfully from ${filePath}`);
  } catch (err) {
    console.error('Error loading morphology database:', err);
  }
}

loadMorphology();

export function getVerseMorphology(surah: number, ayah: number): MorphologyEntry[] {
  const key = `${surah}:${ayah}`;
  return morphologyMap.get(key) || [];
}

export function getWordMorphology(surah: number, ayah: number, wordPos: number): WordMorphologyResult | null {
  const verseEntries = getVerseMorphology(surah, ayah);
  if (!verseEntries || verseEntries.length === 0) return null;

  const prefix = `${surah}:${ayah}:${wordPos}:`;
  const wordEntries = verseEntries.filter(e => e.location.startsWith(prefix));
  if (wordEntries.length === 0) return null;

  let root: string | undefined;
  let lemma: string | undefined;
  let type = 'Noun';
  const allFeatures: string[] = [];

  for (const entry of wordEntries) {
    for (const f of entry.features) {
      allFeatures.push(f);
      if (f.startsWith('ROOT:')) {
        const rawRoot = f.replace('ROOT:', '').trim();
        root = rawRoot.split('').join(' ');
      }
      if (f.startsWith('LEM:')) {
        lemma = f.replace('LEM:', '').trim();
      }
    }

    if (entry.pos === 'V') {
      type = 'Verb';
    } else if (entry.pos === 'N') {
      if (entry.features.includes('ADJ')) type = 'Adjective';
      else if (entry.features.includes('PRON')) type = 'Pronoun';
      else if (entry.features.includes('PN')) type = 'Proper Noun';
      else type = 'Noun';
    } else if (entry.pos === 'P') {
      if (type !== 'Verb' && type !== 'Noun' && type !== 'Adjective') type = 'Particle';
    } else if (entry.pos === 'PRON') {
      type = 'Pronoun';
    }
  }

  return { root, lemma, type, features: allFeatures };
}