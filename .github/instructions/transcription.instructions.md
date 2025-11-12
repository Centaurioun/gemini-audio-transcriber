---
applyTo:
  - "**/index.tsx"
  - "src/**/transcrib*.ts"
  - "src/**/transcrib*.tsx"
  - "src/**/diariz*.ts"
  - "src/**/diariz*.tsx"
---

# Copilot Path Instructions — Transcription & Diarization

**Goal:** deterministic **Cleaned (Minimal Edit)**; strict line schema; session-aware diarization across multi-file batches.

## Do
- Implement/maintain a **minimal local cleaner** used only when `outputMode === "cleaned"`:
  - Remove fillers (TR: eee/ıı/ııı/hani/yani/işte/şey/falan filan/böyle/hı hı; EN: um/uh/like/you know/I mean/kinda/sorta) when standalone or comma-separated.
  - Drop false starts; collapse a single micro-repetition per sentence.
  - Fix spacing/punctuation; optional single sentence split.
  - Respect **edit budget** (≤ ~10%). If exceeded, fall back to a milder pass (e.g., only remove obvious `eee` + whitespace tidy).
- Enforce line schema **`[mm:ss] [Speaker] Text…`** on render; normalize `HH:MM:SS` → `mm:ss`; missing timestamp inherits previous.
- Keep **session speaker map** for batch uploads (parts 2..N reuse labels); merge adjacent same-speaker micro-segments under small gap/word thresholds.
- Deterministic decoding for Cleaned (`temperature: 0.0`, `topP: 1.0`).

## Don’t
- Don’t paraphrase or change meaning/order.  
- Don’t insert non-speech tags unless toggle is On and they’re actually present.  
- Don’t fabricate timestamps.

## Acceptance (for your PR)
- Cleaned outputs have fillers removed deterministically; Verbatim unchanged.  
- Batch of N parts → single transcript with stable labels and continuous timestamps.  
- 100% lines pass schema; timestamp normalization correct.  
- Small, focused diff touching only transcription/diarization code.
