const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

type AnalysisType = 'grammar' | 'morphology' | 'dictionary' | 'word';

export async function streamAnalysis(
  type: AnalysisType,
  payload: { ayahText?: string; surahName?: string; ayahNumber?: number; word?: string },
  onChunk: (text: string) => void
): Promise<string> {
  const response = await fetch(`${BASE}/api/analysis/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, ...payload })
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) {
            fullText += parsed.text;
            onChunk(fullText);
          }
        } catch { /* ignore malformed chunks */ }
      }
    }
  }

  return fullText;
}
