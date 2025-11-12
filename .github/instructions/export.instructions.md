---
applyTo:
  - "**/index.tsx"
  - "src/**/export*.ts"
  - "src/**/export*.tsx"
---

# Copilot Path Instructions — Exporters (TXT/MD/DOCX)

**Goal:** preserve transcript structure exactly; no paraphrasing; correct formatting.

## Do
- **TXT**: one segment per line as `[mm:ss] [Speaker] Text…`.
- **MD**: one segment per line; **bold** the speaker label; keep timestamps, e.g.  
  `**[Speaker]** [mm:ss] Text…` (or `[mm:ss] **[Speaker]** Text…` — choose one and keep it repo-wide).
- **DOCX**: use a real `.docx` builder; each segment is a paragraph; speaker label bold.
- Preserve text exactly apart from required formatting; no collapsing into a single paragraph.

## Don’t
- Don’t change words, reorder lines, or “clean” content here.  
- Don’t emit HTML “.doc” masquerading as DOCX.

## Acceptance
- 3 segments → 3 lines in `.md` and `.txt`; bold speaker labels present in MD/DOCX.  
- Opening DOCX in Word/Pages/Google Docs shows bold labels and correct paragraphing.  
- Export code only; no side effects on transcription logic.
