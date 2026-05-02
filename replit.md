# Quranic Linguistic Explorer

## Overview
A full-stack web application for deep linguistic analysis of the Quran, powered by Groq AI. Originally built in Google AI Studio (Gemini), rebuilt here with Groq as the AI backend.

## Architecture

### Frontend — `artifacts/quran-explorer` (React + Vite)
- Served at `/` (root path)
- Uses AlQuran Cloud API for Quran text (Uthmani script + translations)
- Calls the backend `/api/analysis/stream` endpoint for AI analysis
- Notes stored in `localStorage` (no auth required)
- Dark mode toggle, font size control

### Backend — `artifacts/api-server` (Express)
- Serves at `/api`
- Groq AI integration via `groq-sdk` using model `llama-3.3-70b-versatile`
- Streaming SSE endpoint: `POST /api/analysis/stream`
  - Supports types: `grammar`, `morphology`, `dictionary`, `word`

## Key Features
- **114 Surahs** with Arabic (Uthmani script), English (Sahih International), Urdu (Jalandhry), and Arabic Tafsir (Jalalayn)
- **Grammar Analysis (I'rab)** — based on classical works by Al-Darwish, Al-Zajjaj, Al-Nahhas
- **Morphology Analysis (Sarf)** — follows Ibn Jinni and Al-Hamalawy methodology
- **Word Dictionary** — cross-referenced with Lisan al-Arab, Mu'jam Maqayis al-Lugha, Lane's Lexicon
- **Global Dictionary** — search any Arabic word
- **Personal Notes** — saved per ayah in localStorage
- **Dark mode** + adjustable Arabic font size
- **Caching** — analysis results cached in localStorage/sessionStorage

## Environment Variables
- `GROQ_API_KEY` — Groq API key (stored as secret)

## Dependencies
- `groq-sdk` in api-server for AI streaming
- `react-markdown` in quran-explorer for rendering AI output
- `@tailwindcss/typography` for markdown prose styling
- `lucide-react` for icons
- Google Fonts: Inter, Amiri (Arabic), JetBrains Mono
