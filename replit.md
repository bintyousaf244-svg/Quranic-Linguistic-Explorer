# Quranic Linguistic Explorer

## Overview
A full-stack web application for deep linguistic analysis of the Quran, powered by Groq AI. React + Vite frontend at `/`, Express + Groq backend at `/api`.

## Architecture

### Frontend — `artifacts/quran-explorer` (React + Vite)
- Served at `/` (root path)
- Routing via `wouter` with `ClerkProvider` wrapping the whole app
- AlQuran Cloud API for Quran text (Uthmani script + translations)
- Streaming SSE for AI analysis (`/api/analysis/stream`)
- Notes synced to cloud (PostgreSQL) when signed in; localStorage fallback
- Recently Viewed surahs (last 5, localStorage)
- Dark mode toggle, font size control, EN/UR language switcher

### Backend — `artifacts/api-server` (Express)
- Serves at `/api`
- Groq AI integration via `groq-sdk`, model `llama-3.1-8b-instant`
- Multi-key rotation: `GROQ_API_KEY`, `GROQ_API_KEY_2`, `GROQ_API_KEY_3`
- Rotates key on 429 errors; explicit error message to user
- Clerk middleware (`@clerk/express`) for session-based auth
- Clerk proxy middleware at `/api/__clerk`

### Database
- PostgreSQL (`DATABASE_URL` env var)
- `notes` table: `(id, user_id, surah_number, ayah_number, content, updated_at)`

## Key Features
- **114 Surahs** with Arabic (Uthmani script), English (Sahih International), Urdu (Jalandhry), Arabic Tafsir (Jalalayn)
- **Grammar Analysis (I'rab)** — based on classical works by Al-Darwish, Al-Zajjaj, Al-Nahhas
- **Morphology Analysis (Sarf)** — follows Ibn Jinni and Al-Hamalawy methodology
- **Word Dictionary** — cross-referenced with Lisan al-Arab, Mu'jam Maqayis al-Lugha, Lane's Lexicon
- **Root Search** — find all Quranic verses sharing an Arabic root
- **Thematic Search** — AI-powered search by topic/concept
- **Verb Conjugation (Tasreef)** — full sarf table for any Arabic verb
- **Personal Notes** — per-ayah notes, synced to PostgreSQL when signed in
- **Recently Viewed** — last 5 surahs shown on homepage
- **Google Sign-In** via Clerk auth
- **Dark mode** + adjustable Arabic font size
- **Caching** — analysis results cached in localStorage/sessionStorage

## Authentication
- Clerk (`@clerk/react` frontend, `@clerk/express` backend)
- Keys: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`
- Sign-in/sign-up pages at `/sign-in` and `/sign-up` (wouter routes)
- `openSignIn()` modal used for header Sign In button

## Context Architecture (HMR-stable)
- `src/context/langCtx.ts` — shared context instance (prevents HMR duplicate)
- `src/context/LanguageProvider.tsx` — provider component
- `src/context/useLanguage.ts` — hook for consumers

## Word Tap Popup — Hybrid Morphology Lookup

Tapping any Quranic word shows a popup with root, wazn, type, meaning, and transliteration.

Three-tier lookup in `artifacts/api-server/src/routes/wordLookup.ts`:

1. **Classical Dictionary** (instant, ~60+ words) — Lisan al-Arab / Al-Mufradat sourced entries with root, wazn, full English + Arabic meaning. Transliteration enriched from quran.com text match only.
2. **Corpus + quran.com** (for all other words) — `corpus.quran.com/wordmorphology.jsp?location=(S:A:W:segment)` HTML-scraped for root (Arabic, from `<span class="at">`) and POS type. `api.quran.com/api/v4` word-by-word API for meaning + transliteration. Both called in parallel. Source badge shows "Corpus + quran.com".
3. Cache: `runtimeCache` (Map, in-memory, server lifetime) keyed by `S:A:W`. Frontend also caches in localStorage with key `word_popup_v4_{surah}_{ayah}_{wordIndex}`.

Word positions: frontend sends `{word, surah, ayah, wordIndex}` (0-based). Backend uses `wordIndex+1` as 1-based position for corpus.quran.com. corpus.quran.com tries segments 1→2→3 to find the one with root data.

## API Routes
| Route | Auth | Description |
|-------|------|-------------|
| `POST /api/word-lookup` | None | Hybrid word morphology (classical + corpus.quran.com + quran.com) |
| `POST /api/analysis/stream` | None | SSE streaming AI analysis |
| `POST /api/tasreef` | None | Verb conjugation JSON |
| `POST /api/root-search` | None | Root search |
| `POST /api/thematic-search` | None | Thematic search |
| `GET /api/notes` | Required | Fetch user notes |
| `POST /api/notes` | Required | Save/update a note |
| `DELETE /api/notes/:surah/:ayah` | Required | Delete a note |

## Environment Variables
- `GROQ_API_KEY` — primary Groq API key (secret)
- `GROQ_API_KEY_2`, `GROQ_API_KEY_3` — rotation keys (optional secrets)
- `CLERK_SECRET_KEY` — Clerk backend key (secret)
- `CLERK_PUBLISHABLE_KEY` — Clerk publishable key (secret)
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk key for Vite (env var)
- `DATABASE_URL` — PostgreSQL connection string

## Key Dependencies
- `groq-sdk` — Groq AI streaming
- `@clerk/react`, `@clerk/themes` — frontend auth
- `@clerk/express`, `@clerk/shared` — backend auth
- `http-proxy-middleware` — Clerk proxy
- `react-markdown` — render AI markdown output
- `wouter` — client-side routing
- `drizzle-orm`, `pg` — database (via `@workspace/db`)
- `@tailwindcss/typography` — markdown prose styling
- Google Fonts: Inter, Amiri (Arabic), JetBrains Mono
