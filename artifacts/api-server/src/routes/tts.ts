import { Router } from 'express';

const router = Router();

router.get('/tts', async (req, res) => {
  const { text } = req.query;
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'text query param required' });
    return;
  }

  const truncated = text.trim().slice(0, 200);
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(truncated)}&tl=ar&client=tw-ob&ttsspeed=0.82`;

  try {
    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
        'Accept': 'audio/mpeg, audio/*, */*',
        'Accept-Language': 'ar,en;q=0.9',
      },
    });

    if (!response.ok) {
      req.log.warn({ status: response.status }, 'TTS upstream failed');
      res.status(502).json({ error: 'TTS service unavailable' });
      return;
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(buffer));
  } catch (err) {
    req.log.error({ err }, 'TTS proxy error');
    res.status(500).json({ error: 'TTS failed' });
  }
});

export default router;
