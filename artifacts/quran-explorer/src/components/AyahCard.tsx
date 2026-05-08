let fullText = '';

await streamAnalysis(
  type,
  {
    ayahText: ayah.text,
    surahName,
    surahNumber,
    ayahNumber: ayah.numberInSurah
  },
  (text) => {
    fullText = text;

    if (type === 'grammar') {
      setGrammarAnalysis(text);
      setGrammarSourceLabel('');
      setGrammarIsAuthentic(false);

    } else if (type === 'morphology') {

      setMorphologyAnalysis(text);

    } else {

      setDictionaryAnalysis(text);
    }
  }
);

if (fullText) {

  AnalysisCache.set(
    type,
    surahName,
    ayah.numberInSurah,
    fullText
  );
}