# Copilot Repository Instructions — Gemini Audio Transcriber

> Scope: **Repository-wide**. Keep changes small, testable, and reversible. Favor deterministic behavior for anything that affects transcription quality.

## What this app is
Vite + TypeScript + React SPA that uploads audio, runs **transcription with diarization**, and exports **TXT/MD/DOCX**. User selects **Verbatim** or **Cleaned (Minimal Edit)**.

## Non-negotiable product rules

### Modes
- **Verbatim**: Capture every word, including fillers/false starts/repetitions. Only fix encoding glitches and stray spaces. **No rewrites.**
- **Cleaned (Minimal Edit)**: Preserve **original meaning and order**; apply **smallest necessary** cleanups. **Not** a rewrite.

### Minimal-Edit Guardrail
- **Edit budget** target: **≤ ~10%** change vs. input (clamp 0–30 via UI).
- **Per-sentence limit**: **≤1 content-word substitution** (noun/verb/adj/adv).
- **Structure**: Keep sentence boundaries; at most **one** extra split for a run-on.
- **Do not** re-order events/actors/objects or add/remove facts; keep tense/person/modality.

### Allowed in Cleaned
- Remove fillers: **TR** (*eee, ıı/ııı, hani, yani, işte, şey, falan filan, böyle, hı hı*), **EN** (*um, uh, like, you know, I mean, kinda, sorta*).
- Drop false starts; collapse micro-repetitions (“Nietzsche Nietzsche” → “Nietzsche”).
- Fix punctuation/spacing/casing (proper names preserved).
- Keep numbers as spoken unless conventional (e.g., “Q4”, “H100”).
- Expand acronyms **only when certain** from context.

### Output Schema (all formats)
- One line per segment: **`[mm:ss] [Speaker Name] Text…`** (zero-padded `mm:ss`).
- Unknown speakers: `Unknown 1`, `Unknown 2`, … reused consistently.
- No headings/summaries before or after the transcript.

### Timestamps & Non-speech
- Normalize `HH:MM:SS` → `mm:ss` (hours rolled into minutes).  
- Missing timestamp inherits the last seen timestamp; never fabricate.  
- Non-speech tags default **Off**; when **On**, allow only `[laughter]`, `[music]`, `[applause]`, `[overlap]`, `[inaudible]` when actually present.

### Determinism
- For **Cleaned**, prefer deterministic decoding (`temperature: 0.0`, `topP: 1.0`).  
- Add a **minimal local cleaner** post-pass when model output misses obvious fillers; respect the edit budget.

### Exports
- TXT/MD/DOCX.  
- MD: one segment per line; **bold** speaker labels.  
- DOCX: real `.docx` with **bold** speaker labels and preserved paragraphs.

### Logging
- `loggingLevel: off|basic|verbose`.  
- When enabled, write structured logs and export a bundle (also for **batch** runs).

## Acceptance checklist (per PR)
- [ ] Mode respected; no disallowed edits; edit budget honored.  
- [ ] Every line matches `[mm:ss] [Speaker] Text…`; timestamps normalized.  
- [ ] Session-aware diarization across multi-file batches; stable labels.  
- [ ] Exports correct (MD lines preserved; DOCX bold speakers).  
- [ ] Logs export when enabled (single + batch).  
- [ ] README and UI strings updated if user-visible.

## Coding standards
- TS strict; React hooks; minimal deps; small pure utilities for cleaners/normalizers.  
- Tests for timestamp normalization, schema enforcement, and cleaners.  
- Conventional Commits; branches `feat/*`, `fix/*`, `chore/*`.

## Security & privacy
- Don’t log PII or raw audio unless user explicitly enables logging.  
- Respect any repo/org content-exclusion configs.
