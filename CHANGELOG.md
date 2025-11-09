# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Repository setup with comprehensive documentation
- MIT License
- Contributing guidelines
- GitHub issue and PR templates

## [1.0.0] - 2025-01-07

**Initial public release** - Audio transcription with speaker diarization using Google Gemini 2.5 Flash

### Added
- **Audio transcription** powered by Gemini 2.5 Flash API
- **Speaker diarization** with automatic and manual modes
  - Auto-detect mode for automatic speaker identification
  - Manual mode with configurable speaker count (1-10+)
  - Speaker hints for improved accuracy (voice characteristics, accents, ages)
  - Custom display names for speaker labels
- **Vocabulary hints** for domain-specific terminology
  - Support for film names, people, technical terms, organizations
  - Multi-line input with one term per line
- **FileLogger debugging system**
  - Automatic export of 5 debug log files on transcription complete
  - Files: settings snapshot, prompt text, full AI response, parsing logs, console logs
  - Timestamped filenames: `test-logs-[timestamp]-##-filename.ext`
  - No truncation of long outputs (AI responses can be 10,000+ characters)
- **Settings persistence** using browser localStorage
  - API key storage (secure browser-side only)
  - Speaker configuration and hints
  - Vocabulary hints
  - Last used settings restoration on page reload
- **Batch processing mode** for files >20 MB
- **Modern UI** with Vite + React + TypeScript
- **Environment configuration** with `.env.local` support
- **Production builds** optimized for deployment

### Features
- Support for multiple audio formats: MP3, WAV, M4A, FLAC
- Maximum file size: 20 MB (with batch processing guidance)
- Real-time transcription progress display
- Error handling with user-friendly messages
- Cross-browser compatibility (Chrome, Firefox, Safari)
- No backend required - runs entirely client-side

### Documentation
- Comprehensive README with installation, usage, troubleshooting
- API key setup instructions
- Speaker diarization mode explanations
- Vocabulary hint usage examples
- FileLogger feature documentation
- Troubleshooting guide for common issues
- Contributing guidelines
- MIT License

### Developer Experience
- TypeScript for type safety
- Vite for fast development and builds
- ESLint configuration
- Hot module replacement (HMR)
- Environment variable management
- Build size: 172 KB total (34 KB gzipped)
- Zero npm security vulnerabilities

---

## Detailed Development History

For a complete, chronological log of all code changes, configuration updates, and development decisions during the project's creation phase, see:
- `/local-files/changelog-archive/` - Archived detailed change logs
- `/local-files/assessments/comprehensive-assessment-v2.md` - Project assessment

**Note:** The detailed changelog archives contain extensive implementation notes, code snippets, and decision rationale that informed the initial release. They are preserved in `local-files/` for development reference but not included in the public repository.

[unreleased]: https://github.com/yourusername/gemini-audio-transcriber/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/gemini-audio-transcriber/releases/tag/v1.0.0


---

## Change #001 - Automatic Log File Export
**Date:** 2025-11-07
**Time:** [Phase 1 Preparation]
**Change Number:** #001
**Type:** Enhancement - Testing Infrastructure
**Status:** ✅ IMPLEMENTED

### What Changed
Added automatic log file export system that saves ALL console logs to downloadable files:
1. Created `FileLogger` class that captures all debug output
2. Automatically exports 5 log files when transcription completes
3. Files saved to Downloads folder with timestamped names
4. No manual copying needed - fully automated

### Files Modified
- `/index.tsx` - Added FileLogger class (lines 13-103)
- `/index.tsx` - Integrated logger into VoiceNotesApp (lines 182, 532-584)
- `/index.tsx` - Logger calls in buildTranscriptionPrompt (lines 538-542, 591-594)
- `/index.tsx` - Logger calls in transcribeAudio (lines 688-691)
- `/index.tsx` - Logger calls in parseAndRenderRawTranscript (lines 774-777, 792-811)

### Log Files Generated
When transcription completes, automatically downloads 5 files:
```
test-logs-[timestamp]-01-settings.json     (Settings snapshot)
test-logs-[timestamp]-02-prompt.txt        (Complete prompt sent to AI)
test-logs-[timestamp]-03-ai-response.txt   (Full AI response, NOT truncated)
test-logs-[timestamp]-04-parsing-log.txt   (Parsing details for first 10 lines)
test-logs-[timestamp]-05-console-full.txt  (All console logs with timestamps)
```

### Code Added

#### FileLogger Class (New):
```typescript
class FileLogger {
  private logs: string[] = [];
  private sessionId: string;
  private promptText: string = '';
  private aiResponseText: string = '';
  private parsingLogs: string[] = [];
  private settingsSnapshot: string = '';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.log('SESSION', `📋 Session started: ${this.sessionId}`);
  }

  // Methods: log(), savePrompt(), saveAIResponse(), saveParsingLog(),
  //          saveSettings(), exportToFiles(), downloadFile()
}
```

#### Integration Points:
```typescript
// In VoiceNotesApp
private logger: FileLogger | null = null;

// In processSingleFile()
this.logger = new FileLogger();
// ... after transcription ...
const folderName = await this.logger.exportToFiles();
```

### Why This Change
**User Request:** "Console logs may be truncated when the process ends due to the size of the things we want to log. So, can everything be almost automated so that I would only start it?"

**Benefits:**
1. ✅ No truncation - full AI response saved (could be 10,000+ chars)
2. ✅ No manual copying - everything automatic
3. ✅ Organized files - easy to share with AI assistant for analysis
4. ✅ Timestamped - can compare multiple test runs
5. ✅ Persistent - logs survive browser refresh
6. ✅ User-friendly - just run test, files appear in Downloads

### Expected Outcome
**User Workflow:**
1. Configure settings in UI
2. Upload `bela-tarr-torino-ati-2011-part-01.mp3`
3. Wait for transcription to complete
4. 5 files automatically download to Downloads folder
5. Share folder with AI assistant: "Here are the logs from test run [timestamp]"
6. AI assistant analyzes files and confirms/revises diagnosis

**No manual work required** - user just starts transcription and gets all logs automatically.

### Test Results
- ⏳ Pending (user will test in Phase 1)

### Side Effects
- Downloads 5 files to Downloads folder (user aware, this is intended)
- Console still shows logs in real-time (for monitoring)
- Files include timestamp in name (e.g., `test-logs-2025-11-07-143015-02-prompt.txt`)

### Rollback Instructions
If this causes issues:

```bash
# Option 1: Git rollback
git diff HEAD~1 index.tsx  # Review changes
git checkout HEAD~1 -- index.tsx  # Rollback file

# Option 2: Remove logger manually
# Delete FileLogger class (lines 13-103)
# Remove logger property from VoiceNotesApp
# Remove all "if (this.logger)" blocks
```

### Documentation Updates
- Updated quick-start-phase-1.md to mention automatic log export
- User no longer needs to manually copy console logs
- User just shares the downloaded log files

---

## Pre-Fix Baseline - Debug Logging Added
**Date:** 2025-11-07
**Time:** [Completed before assessment]
**Change Number:** #000
**Type:** Enhancement - Debug Logging

### What Changed
Added comprehensive debug logging to key functions for real-time troubleshooting:
- Prompt building (`buildTranscriptionPrompt`)
- AI response capture (`transcribeAudio`)
- Response parsing (`parseAndRenderRawTranscript`)
- Settings updates (`updateSettingsFromUI`, `renderSettingsUI`)

### Files Modified
- `/index.tsx` - Lines 420-435, 555-565, 641-670, 247-285

### Before/After Comparison

#### Before (Line 420):
```typescript
  private buildTranscriptionPrompt(isBatchPart: boolean, batchPartNumber: number): string {
    const { diarizationEnabled, autoDetectSpeakers, speakerCount, speakers, vocabularyHints } = this.settings;

    let prompt = 'TASK\n- Transcribe the following audio with high accuracy.\n- The transcription MUST be in the original language spoken in the audio. DO NOT TRANSLATE to English or any other language.\n\n';
```

#### After (Lines 420-432):
```typescript
  private buildTranscriptionPrompt(isBatchPart: boolean, batchPartNumber: number): string {
    const { diarizationEnabled, autoDetectSpeakers, speakerCount, speakers, vocabularyHints } = this.settings;

    console.log('🔧 [DEBUG] Building transcription prompt with settings:', {
      diarizationEnabled,
      autoDetectSpeakers,
      speakerCount,
      speakers: speakers.slice(0, speakerCount).map(s => ({ name: s.displayName, hints: s.hints })),
      vocabularyHints: vocabularyHints.substring(0, 100) + (vocabularyHints.length > 100 ? '...' : '')
    });

    let prompt = 'TASK\n- Transcribe the following audio with high accuracy.\n- The transcription MUST be in the original language spoken in the audio. DO NOT TRANSLATE to English or any other language.\n\n';
```

### Why This Change
To enable real-time debugging by seeing:
1. What settings are being sent to AI
2. What prompt is constructed
3. What AI returns (format and content)
4. How parsing logic handles the response
5. When speaker settings change (and why hints might be lost)

### Expected Outcome
- Developers can see console logs during transcription
- Issues can be diagnosed without guessing
- Root causes become visible immediately
- Testing becomes data-driven rather than assumption-driven

### Test Results
- ✅ Logs appear in browser console
- ✅ Emoji icons make logs easy to scan
- ✅ First 500 characters of AI response visible
- ✅ Parsing logic decisions visible (which regex matched)
- ✅ Settings changes tracked with warnings

### Side Effects
- None (logging is passive, doesn't affect functionality)
- Console output verbose during transcription (expected)

### Rollback Instructions
Remove console.log statements added in this change:
```bash
# Revert to previous commit before debug logging
git diff HEAD~1 index.tsx | grep "console.log"
```

Or manually remove all lines containing:
- `console.log('🔧 [DEBUG]`
- `console.log('📝 [DEBUG]`
- `console.log('🤖 [DEBUG]`
- `console.log('🔍 [DEBUG]`
- `console.log('⚙️ [DEBUG]`
- `console.warn('⚠️ [DEBUG]`

---

## Environment Setup - Local Development
**Date:** 2025-11-07
**Time:** [Completed before assessment]
**Change Number:** #-001
**Type:** Infrastructure

### What Changed
Set up local development environment in VS Code:
1. Installed npm dependencies
2. Started Vite development server
3. Opened app in Simple Browser
4. Configured hot-reload for instant feedback

### Commands Run
```bash
cd /Users/centaurioun/Repos/audio-transcriber-with-diarization-with-gemini-2.5-flash
npm install
npm run dev
```

### Configuration Files
- `package.json` - Dependencies already defined
- `vite.config.ts` - Server configured for port 3000
- `.env.local` - API key already configured

### Expected Outcome
- App accessible at http://localhost:3000/
- Changes to code reflect instantly (hot reload)
- Console debugging available in browser DevTools
- Full development workflow enabled

### Test Results
- ✅ App running at http://localhost:3000/
- ✅ Simple Browser opened successfully
- ✅ No compilation errors
- ✅ Hot reload working

### Side Effects
- Node modules (~45 packages) installed
- Dev server process running in background

### Rollback Instructions
```bash
# Stop dev server
# Kill terminal process (Ctrl+C)

# Remove node_modules if needed
rm -rf node_modules
```

---

## Template for Future Changes

## Change #[NUMBER] - [TITLE]
**Date:** YYYY-MM-DD
**Time:** HH:MM
**Change Number:** #XXX
**Type:** [Fix | Enhancement | Refactor | Documentation]
**Issue:** [Reference to issue from assessment]
**Priority:** [🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low]

### What Changed
[Describe what was modified, added, or removed]

### Files Modified
- `[filename]` - Lines [start-end]

### Before/After Comparison
#### Before (Line X):
```typescript
[old code]
```

#### After (Line X):
```typescript
[new code]
```

### Why This Change
[Explain the root cause and rationale]

### Expected Outcome
[What should happen after this change]

### Test Results
- [ ] Test 1: [description] - [✅ Pass | ❌ Fail]
- [ ] Test 2: [description] - [✅ Pass | ❌ Fail]

### Side Effects
[Any unintended consequences or related changes]

### Dependencies
[Other changes that must be made before/after this]

### Rollback Instructions
```bash
[Exact commands to undo this change]
```

---

## Guidelines for Maintaining This Log

1. **ALWAYS log changes BEFORE and AFTER making them**
2. **Include full context:** Why, What, How
3. **Include test results:** What worked, what didn't
4. **Include rollback plans:** How to undo if needed
5. **Use clear numbering:** Sequential for easy reference
6. **Reference assessment issues:** Link changes to problems
7. **Update immediately:** Don't batch log entries
8. **Be honest:** Document failures and side effects
9. **Include timestamps:** Track when changes occurred
10. **Review regularly:** Ensure log stays current

---

**Last Updated:** 2025-11-07
**Total Changes:** 0 (baseline established)
**Next Change Number:** #001
