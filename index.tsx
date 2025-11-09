/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

const MODEL_NAME = 'gemini-2.5-flash';
const MAX_SPEAKERS = 10;

// --- File Logger Class ---
/**
 * FileLogger - Automatic debug log capture and export system
 *
 * Captures all console logs, AI prompts, responses, and settings during transcription,
 * then automatically exports them to 5 downloadable files for debugging.
 *
 * @example
 * ```typescript
 * const logger = new FileLogger();
 * logger.saveSettings(settings);
 * logger.savePrompt(promptText);
 * logger.log('INFO', 'Processing audio...');
 * logger.saveAIResponse(response);
 * await logger.exportToFiles(); // Downloads 5 files to user's Downloads folder
 * ```
 */
class FileLogger {
  private logs: string[] = [];
  private sessionId: string;
  private promptText: string = '';
  private aiResponseText: string = '';
  private parsingLogs: string[] = [];
  private settingsSnapshot: string = ''

  /**
   * Creates a new FileLogger instance with timestamped session ID
   */
  constructor() {
    this.sessionId = this.generateSessionId();
    this.log('SESSION', `📋 Session started: ${this.sessionId}`);
  }

  /**
   * Generates a unique session ID based on current timestamp
   * @returns Session ID in format: YYYY-MM-DD-HHMMSS
   * @private
   */
  private generateSessionId(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  /**
   * Logs a message with timestamp and category
   * @param category - Log category (e.g., 'INFO', 'ERROR', 'AI_RESPONSE')
   * @param message - The log message
   */
  log(category: string, message: string) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${category}] ${message}`;
    this.logs.push(logEntry);
    console.log(message); // Keep console output for real-time monitoring
  }

  /**
   * Saves the complete prompt text sent to AI
   * @param prompt - The full prompt text
   */
  savePrompt(prompt: string) {
    this.promptText = prompt;
    this.log('PROMPT', `📝 Prompt saved (${prompt.length} chars)`);
  }

  /**
   * Saves the complete AI response (no truncation)
   * @param response - The full AI response text
   */
  saveAIResponse(response: string) {
    this.aiResponseText = response;
    this.log('AI_RESPONSE', `🤖 AI response saved (${response.length} chars)`);
  }

  /**
   * Saves a parsing log entry for transcript processing
   * @param message - The parsing log message
   */
  saveParsingLog(message: string) {
    this.parsingLogs.push(message);
  }

  /**
   * Saves a snapshot of current settings configuration
   * @param settings - The settings object to save
   */
  saveSettings(settings: any) {
    this.settingsSnapshot = JSON.stringify(settings, null, 2);
    this.log('SETTINGS', `⚙️ Settings snapshot saved`);
  }

  /**
   * Exports all captured logs to 5 downloadable files
   *
   * Files created:
   * - 01-settings.json: Configuration snapshot
   * - 02-prompt.txt: Complete prompt sent to AI
   * - 03-ai-response.txt: Full AI response (no truncation)
   * - 04-parsing-log.txt: Parsing details for transcript
   * - 05-console-full.txt: All console logs with timestamps
   *
   * @returns The folder name prefix used for downloaded files
   * @throws Error if file export fails
   */
  async exportToFiles() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const folderName = `test-logs-${this.sessionId}`;

      // Create download links for each file
      const files = [
        { name: '01-settings.json', content: this.settingsSnapshot },
        { name: '02-prompt.txt', content: this.promptText },
        { name: '03-ai-response.txt', content: this.aiResponseText },
        { name: '04-parsing-log.txt', content: this.parsingLogs.join('\n') },
        { name: '05-console-full.txt', content: this.logs.join('\n') },
      ];

      // Download each file
      for (const file of files) {
        if (file.content) {
          this.downloadFile(file.name, file.content, folderName);
        }
      }

      this.log('EXPORT', `✅ All log files exported to downloads as: ${folderName}-*.txt`);
      return folderName;
    } catch (error) {
      this.log('ERROR', `❌ Failed to export logs: ${error}`);
      throw error;
    }
  }

  /**
   * Downloads a single file to the user's Downloads folder
   * @param filename - Name of the file (e.g., '01-settings.json')
   * @param content - File content as string
   * @param folderPrefix - Prefix for the downloaded filename (session ID)
   * @private
   */
  private downloadFile(filename: string, content: string, folderPrefix: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderPrefix}-${filename}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Gets the current session ID
   * @returns The session ID string
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

// --- Interfaces and Types ---
interface Speaker {
  id: string;
  displayName: string;
  hints: string;
  color: string;
}

interface SpeakerSettings {
  diarizationEnabled: boolean;
  autoDetectSpeakers: boolean;
  speakerCount: number;
  speakers: Speaker[];
  vocabularyHints: string;
}

interface TranscriptSegment {
  id: string;
  timestamp?: string;
  speakerId: string;
  text: string;
}

interface Note {
  id: string;
  rawTranscription: string; // The raw text from the model
  timestamp: number;
  segments: TranscriptSegment[];
}

// --- Utility Functions ---
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: number;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

const generateColor = (index: number): string => {
  const colors = [
    '#ff8a80', '#80d8ff', '#82b1ff', '#b9f6ca', '#ffff8d',
    '#ffd180', '#ff80ab', '#ea80fc', '#a7ffeb', '#ccff90',
  ];
  return colors[index % colors.length];
};

class VoiceNotesApp {
  private genAI: GoogleGenAI;

  // --- Core UI Elements ---
  private processingStatus: HTMLDivElement;
  private rawTranscription: HTMLDivElement;
  private newButton: HTMLButtonElement;
  private themeToggleButton: HTMLButtonElement;
  private themeToggleIcon: HTMLElement;
  private editorTitle: HTMLDivElement;
  private uploadButton: HTMLButtonElement;
  private fileInput: HTMLInputElement;
  private dropZone: HTMLDivElement;

  // --- Diarization UI Elements ---
  private speakerSettingsPanel: HTMLDivElement;
  private resetSettingsButton: HTMLButtonElement;
  private diarizationToggle: HTMLInputElement;
  private autoDetectToggle: HTMLInputElement;
  private autoDetectRow: HTMLDivElement;
  private speakerCountInput: HTMLInputElement;
  private speakerCountRow: HTMLDivElement;
  private speakerDetailsContainer: HTMLDivElement;
  private vocabularyHints: HTMLTextAreaElement;
  private batchProgress: HTMLProgressElement;

  // --- State ---
  private isProcessing = false;
  private currentNote: Note | null = null;
  private settings: SpeakerSettings;
  private speakerMap = new Map<string, Speaker>(); // Maps speaker name from transcript to Speaker object
  private logger: FileLogger | null = null; // Logger instance for current transcription

  constructor() {
    this.genAI = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    this.bindDOM();
    this.loadSettings();
    this.bindEventListeners();
    this.initTheme();
    this.renderSettingsUI();
    this.createNewNote();
  }

  private bindDOM(): void {
    // --- Core UI Elements ---
    this.processingStatus = document.getElementById('processingStatus') as HTMLDivElement;
    this.rawTranscription = document.getElementById('rawTranscription') as HTMLDivElement;
    this.newButton = document.getElementById('newButton') as HTMLButtonElement;
    this.themeToggleButton = document.getElementById('themeToggleButton') as HTMLButtonElement;
    this.themeToggleIcon = this.themeToggleButton.querySelector('i') as HTMLElement;
    this.editorTitle = document.querySelector('.editor-title') as HTMLDivElement;
    this.uploadButton = document.getElementById('uploadButton') as HTMLButtonElement;
    this.fileInput = document.getElementById('fileInput') as HTMLInputElement;
    this.dropZone = document.querySelector('.note-content-wrapper') as HTMLDivElement;

    // --- Diarization UI Elements ---
    this.speakerSettingsPanel = document.getElementById('speakerSettings') as HTMLDivElement;
    this.resetSettingsButton = document.getElementById('resetSettingsButton') as HTMLButtonElement;
    this.diarizationToggle = document.getElementById('diarizationToggle') as HTMLInputElement;
    this.autoDetectToggle = document.getElementById('autoDetectToggle') as HTMLInputElement;
    this.autoDetectRow = document.getElementById('autoDetectRow') as HTMLDivElement;
    this.speakerCountInput = document.getElementById('speakerCount') as HTMLInputElement;
    this.speakerCountRow = document.getElementById('speakerCountRow') as HTMLDivElement;
    this.speakerDetailsContainer = document.getElementById('speakerDetailsContainer') as HTMLDivElement;
    this.vocabularyHints = document.getElementById('vocabularyHints') as HTMLTextAreaElement;
    this.batchProgress = document.getElementById('batchProgress') as HTMLProgressElement;
  }

  private bindEventListeners(): void {
    this.uploadButton.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
    this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.dropZone.addEventListener('drop', this.handleFileDrop.bind(this));

    this.newButton.addEventListener('click', () => this.createNewNote());
    this.themeToggleButton.addEventListener('click', () => this.toggleTheme());
    this.resetSettingsButton.addEventListener('click', () => this.resetSettings());

    // Settings Listeners
    this.diarizationToggle.addEventListener('change', () => this.updateSettingsFromUI());
    this.autoDetectToggle.addEventListener('change', () => this.updateSettingsFromUI());
    this.speakerCountInput.addEventListener('input', () => this.updateSettingsFromUI());
    this.vocabularyHints.addEventListener('input', () => this.updateSettingsFromUI(true));

    // Speaker Chip Rename Listener (Delegation)
    this.rawTranscription.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('speaker-chip-name') && e.key === 'Enter') {
        e.preventDefault();
        target.blur();
      }
    });
    this.rawTranscription.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const chipName = target.closest('.speaker-chip-name');
      if (chipName) {
        this.handleSpeakerRename(chipName as HTMLElement);
      }
    });
    this.rawTranscription.addEventListener('blur', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('speaker-chip-name')) {
        this.finishSpeakerRename(target);
      }
    }, true);
  }

  private initTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
      this.themeToggleIcon.classList.remove('fa-sun');
      this.themeToggleIcon.classList.add('fa-moon');
    } else {
      document.body.classList.remove('light-mode');
      this.themeToggleIcon.classList.remove('fa-moon');
      this.themeToggleIcon.classList.add('fa-sun');
    }
  }

  private toggleTheme(): void {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
      localStorage.setItem('theme', 'light');
      this.themeToggleIcon.classList.remove('fa-sun');
      this.themeToggleIcon.classList.add('fa-moon');
    } else {
      localStorage.setItem('theme', 'dark');
      this.themeToggleIcon.classList.remove('fa-moon');
      this.themeToggleIcon.classList.add('fa-sun');
    }
  }

  // --- Settings Management ---
  private loadSettings(): void {
    const savedSettings = localStorage.getItem('voiceNotesSettings');
    const defaultSpeakers = Array.from({ length: MAX_SPEAKERS }, (_, i) => ({
      id: `speaker_pre_${i}`,
      displayName: `Speaker ${i + 1}`,
      hints: '',
      color: generateColor(i),
    }));

    const defaults: SpeakerSettings = {
      diarizationEnabled: true,
      autoDetectSpeakers: true,
      speakerCount: 2,
      speakers: defaultSpeakers,
      vocabularyHints: '',
    };

    this.settings = savedSettings ? { ...defaults, ...JSON.parse(savedSettings) } : defaults;
    // Ensure speakers array is full
    if (this.settings.speakers.length < MAX_SPEAKERS) {
      this.settings.speakers = [
        ...this.settings.speakers,
        ...defaultSpeakers.slice(this.settings.speakers.length)
      ];
    }
  }

  private debouncedSaveSettings = debounce(() => {
    localStorage.setItem('voiceNotesSettings', JSON.stringify(this.settings));
  }, 300);

  private resetSettings(): void {
    // Clear saved settings from localStorage
    localStorage.removeItem('voiceNotesSettings');

    // Reload default settings
    this.loadSettings();

    // Re-render UI with defaults
    this.renderSettingsUI();

    // Show feedback
    this.processingStatus.textContent = 'Settings reset to defaults';
    setTimeout(() => {
      if (!this.isProcessing) {
        this.processingStatus.textContent = 'Ready to upload';
      }
    }, 2000);
  }

  private updateSettingsFromUI(skipRender: boolean = false): void {
    console.log('⚙️ [DEBUG] updateSettingsFromUI called, skipRender:', skipRender);

    this.settings.diarizationEnabled = this.diarizationToggle.checked;
    this.settings.autoDetectSpeakers = this.autoDetectToggle.checked;
    this.settings.speakerCount = parseInt(this.speakerCountInput.value, 10);
    this.settings.vocabularyHints = this.vocabularyHints.value;

    console.log('⚙️ [DEBUG] Current speaker count:', this.settings.speakerCount);

    // Update speaker data from inputs without rebuilding
    document.querySelectorAll('.speaker-detail-row').forEach((row, index) => {
      const nameInput = row.querySelector('.speaker-name-input') as HTMLInputElement;
      const hintsInput = row.querySelector('.speaker-hints-input') as HTMLInputElement;
      if (nameInput && hintsInput && this.settings.speakers[index]) {
        this.settings.speakers[index].displayName = nameInput.value;
        this.settings.speakers[index].hints = hintsInput.value;
        if (index < 3) {
          console.log(`⚙️ [DEBUG] Updated speaker ${index}:`, {
            name: this.settings.speakers[index].displayName,
            hints: this.settings.speakers[index].hints.substring(0, 50)
          });
        }
      }
    });

    // Only re-render if structure needs to change (not for text input changes)
    if (!skipRender) {
      this.renderSettingsUI();
    }
    this.debouncedSaveSettings();
  }

  private renderSettingsUI(): void {
    this.diarizationToggle.checked = this.settings.diarizationEnabled;
    this.autoDetectToggle.checked = this.settings.autoDetectSpeakers;
    this.speakerCountInput.value = this.settings.speakerCount.toString();
    this.vocabularyHints.value = this.settings.vocabularyHints;

    const diarizationOn = this.settings.diarizationEnabled;
    this.autoDetectRow.style.display = diarizationOn ? 'flex' : 'none';
    this.speakerCountRow.style.display = diarizationOn && !this.settings.autoDetectSpeakers ? 'flex' : 'none';
    this.speakerDetailsContainer.style.display = diarizationOn && !this.settings.autoDetectSpeakers ? 'flex' : 'none';

    if (diarizationOn && !this.settings.autoDetectSpeakers) {
      // Check if we need to rebuild the speaker details
      const currentRows = this.speakerDetailsContainer.querySelectorAll('.speaker-detail-row');
      const needsRebuild = currentRows.length !== this.settings.speakerCount;

      console.log('⚙️ [DEBUG] renderSettingsUI - needsRebuild:', needsRebuild, {
        currentRows: currentRows.length,
        targetCount: this.settings.speakerCount
      });

      if (needsRebuild) {
        console.warn('⚠️ [DEBUG] REBUILDING speaker details - this will reset hints!');
        this.speakerDetailsContainer.innerHTML = '';
        for (let i = 0; i < this.settings.speakerCount; i++) {
          const speaker = this.settings.speakers[i];
          const row = document.createElement('div');
          row.className = 'speaker-detail-row';
          row.innerHTML = `
            <div class="speaker-color-swatch" style="background-color: ${speaker.color};"></div>
            <input type="text" class="speaker-input speaker-name-input" value="${speaker.displayName}" placeholder="Speaker ${i + 1}">
            <input type="text" class="speaker-input speaker-hints-input" value="${speaker.hints}" placeholder="Hints (e.g., male, high-pitched)">
          `;
          row.querySelectorAll('.speaker-input').forEach(input => {
            input.addEventListener('input', () => this.updateSettingsFromUI(true));
          });
          this.speakerDetailsContainer.appendChild(row);
        }
      }
    } else {
      this.speakerDetailsContainer.innerHTML = '';
    }
  }

  private setControlsDisabled(disabled: boolean): void {
    this.isProcessing = disabled;
    this.uploadButton.disabled = disabled;
    this.newButton.disabled = disabled;
    this.fileInput.disabled = disabled;
    this.speakerSettingsPanel.toggleAttribute('disabled', disabled);
  }

  // --- File Handling and Processing ---
  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dropZone.classList.add('dragover');
  }

  private handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dropZone.classList.remove('dragover');
  }

  private async handleFileDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.dropZone.classList.remove('dragover');
    if (this.isProcessing) return;
    if (event.dataTransfer?.files) {
      await this.processFiles(Array.from(event.dataTransfer.files));
    }
  }

  private async handleFileSelect(event: Event): Promise<void> {
    if (this.isProcessing) return;
    const target = event.target as HTMLInputElement;
    if (target.files) {
      await this.processFiles(Array.from(target.files));
    }
  }

  private async processFiles(files: File[]): Promise<void> {
    if (files.length === 0) return;

    // Batch detection: check for part-01, part-02 pattern
    const fileNumberRegex = /-(\d+)\.\w+$/;
    const isBatch = files.length > 1 && files.every(f => fileNumberRegex.test(f.name));

    if (isBatch) {
      files.sort((a, b) => {
        const numA = parseInt(a.name.match(fileNumberRegex)![1], 10);
        const numB = parseInt(b.name.match(fileNumberRegex)![1], 10);
        return numA - numB;
      });
      await this.processBatch(files);
    } else if (files.length === 1) {
      await this.processSingleFile(files[0]);
    } else {
      // Multiple non-batch files - for now, we just process the first one.
      // Could be extended to process all sequentially without context.
      this.processingStatus.textContent = "Multiple files detected without a batch pattern (e.g., 'part-01'). Processing the first file only.";
      await this.processSingleFile(files[0]);
    }
  }

  private async processBatch(files: File[]): Promise<void> {
    this.createNewNote();
    this.setControlsDisabled(true);
    this.batchProgress.classList.remove('hidden');
    this.batchProgress.value = 0;
    this.batchProgress.max = files.length;

    let combinedRawText = '';

    for (const [index, file] of files.entries()) {
      try {
        this.processingStatus.textContent = `Processing file ${index + 1} of ${files.length}: "${file.name}"...`;
        const partRawText = await this.transcribeAudio(file, true, index + 1);
        combinedRawText += (combinedRawText ? '\n' : '') + partRawText;
        this.parseAndRenderRawTranscript(combinedRawText, true); // Re-render with accumulated text
        this.batchProgress.value = index + 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.processingStatus.textContent = `Error on file ${index + 1}: ${message}. Skipping.`;
        await new Promise(res => setTimeout(res, 2000));
      }
    }

    this.processingStatus.textContent = 'Batch transcription complete. Ready for new file.';
    this.setControlsDisabled(false);
    this.fileInput.value = '';
    this.batchProgress.classList.add('hidden');
  }

  private async processSingleFile(file: File): Promise<void> {
    this.createNewNote();
    this.setControlsDisabled(true);

    if (!file || !file.type.startsWith('audio/')) {
      this.processingStatus.textContent = 'Invalid file. Please upload an audio file.';
      this.setControlsDisabled(false);
      return;
    }

    // Initialize logger for this transcription session
    this.logger = new FileLogger();
    this.logger.log('SESSION', `📁 Processing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    try {
      const rawText = await this.transcribeAudio(file, false, 0);
      this.parseAndRenderRawTranscript(rawText, false);

      // Export logs automatically
      const folderName = await this.logger.exportToFiles();
      this.processingStatus.textContent = `✅ Complete! Logs saved as: ${folderName}-*.txt in Downloads folder. Ready for new file.`;

      // Show notification in console
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📋 LOGS AUTOMATICALLY SAVED TO DOWNLOADS FOLDER`);
      console.log(`   Folder prefix: ${folderName}`);
      console.log(`   Files created:`);
      console.log(`   - ${folderName}-01-settings.json`);
      console.log(`   - ${folderName}-02-prompt.txt`);
      console.log(`   - ${folderName}-03-ai-response.txt`);
      console.log(`   - ${folderName}-04-parsing-log.txt`);
      console.log(`   - ${folderName}-05-console-full.txt`);
      console.log(`${'='.repeat(80)}\n`);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error in processSingleFile:', error);
      if (this.logger) {
        this.logger.log('ERROR', `❌ Error: ${message}`);
        try {
          await this.logger.exportToFiles();
          this.processingStatus.textContent = `Error: ${message}. Logs saved to Downloads folder.`;
        } catch (exportError) {
          this.processingStatus.textContent = `Error: ${message}`;
        }
      } else {
        this.processingStatus.textContent = `Error: ${message}`;
      }
    } finally {
      this.setControlsDisabled(false);
      this.fileInput.value = '';
    }
  }

  private buildTranscriptionPrompt(isBatchPart: boolean, batchPartNumber: number): string {
    const { diarizationEnabled, autoDetectSpeakers, speakerCount, speakers, vocabularyHints } = this.settings;

    const settingsSnapshot = {
      diarizationEnabled,
      autoDetectSpeakers,
      speakerCount,
      speakers: speakers.slice(0, speakerCount).map(s => ({ name: s.displayName, hints: s.hints })),
      vocabularyHints: vocabularyHints.substring(0, 100) + (vocabularyHints.length > 100 ? '...' : '')
    };

    console.log('🔧 [DEBUG] Building transcription prompt with settings:', settingsSnapshot);

    if (this.logger) {
      this.logger.log('PROMPT_BUILD', '🔧 Building transcription prompt with settings: ' + JSON.stringify(settingsSnapshot, null, 2));
      this.logger.saveSettings(settingsSnapshot);
    }

    let prompt = 'TASK\n- Transcribe the following audio with high accuracy.\n- The transcription MUST be in the original language spoken in the audio. DO NOT TRANSLATE to English or any other language.\n\n';

    if (isBatchPart) {
      const priorSpeakersList = Array.from(this.speakerMap.values())
        .map(s => `• ${s.displayName}`)
        .join('\n');
      prompt += `BATCH CONTEXT\n- This audio is part ${batchPartNumber} of an ordered sequence.\n- Previously identified speakers (reuse names if voices match):\n${priorSpeakersList || 'None yet.'}\n- Introduce new names for new voices and keep them consistent.\n\n`;
    }

    prompt += 'DIARIZATION\n';
    prompt += `- Enabled: ${diarizationEnabled}\n`;
    if (diarizationEnabled) {
      const mode = autoDetectSpeakers ? 'auto_detect' : 'fixed_count';
      prompt += `- Mode: ${mode}\n`;
      if (!autoDetectSpeakers) {
        prompt += `- There are exactly ${speakerCount} speakers. Use the provided labels.\n`;
        const speakerList = speakers
          .slice(0, speakerCount)
          .map(s => `• ${s.displayName}${s.hints ? ` — hints: ${s.hints}` : ''}`)
          .join('\n');
        if (speakerList) {
          prompt += `- Known speakers (use EXACT spelling):\n${speakerList}\n`;
        }
      }
    }
    prompt += '\n';

    if (vocabularyHints.trim()) {
      prompt += 'VOCABULARY HINTS (optional)\n- Prefer these terms and spellings exactly:\n';
      prompt += `${vocabularyHints.trim()}\n\n`;
    }

    prompt += 'OUTPUT\n- Produce PLAIN TEXT only, no Markdown or code fences.\n- One segment per line, strict format:\n[Speaker Name] text...\n- If you infer time cues, optionally prefix a minute:second timestamp:\n[mm:ss] [Speaker Name] text...\n- Reuse EXACT names from Known speakers when a voice matches; otherwise introduce "Unknown 1", "Unknown 2", ... and reuse consistently.\n- Do NOT include JSON, headings, or commentary.\n\n';
    prompt += 'QUALITY\n- Transcribe verbatim while tidying obvious fillers ("um", "uh") and false starts.\n- Keep numbers as spoken unless conventional (e.g., "Q4", "H100").\n- Expand acronyms only when certain from context.';

    console.log('📝 [DEBUG] Complete prompt sent to AI:\n', prompt);

    if (this.logger) {
      this.logger.log('PROMPT', '📝 Complete prompt sent to AI');
      this.logger.savePrompt(prompt);
    }

    return prompt;
  }

  /**
   * Upload a file using the Files API
   *
   * The Files API should be used when the total request size (including files,
   * text prompt, system instructions, etc.) is larger than 20 MB.
   *
   * Example usage:
   * ```tsx
   * import {
   *   GoogleGenAI,
   *   createUserContent,
   *   createPartFromUri,
   * } from "@google/genai";
   *
   * const ai = new GoogleGenAI({});
   *
   * async function main() {
   *   const myfile = await ai.files.upload({
   *     file: "path/to/sample.mp3",
   *     config: { mimeType: "audio/mpeg" },
   *   });
   *
   *   const response = await ai.models.generateContent({
   *     model: "gemini-2.5-flash",
   *     contents: createUserContent([
   *       createPartFromUri(myfile.uri, myfile.mimeType),
   *       "Describe this audio clip",
   *     ]),
   *   });
   *   console.log(response.text);
   * }
   * await main();
   * ```
   */
  private async transcribeAudio(file: File, isBatchPart: boolean, batchPartNumber: number): Promise<string> {
    this.processingStatus.textContent = `Processing "${file.name}"...`;
    const FILE_UPLOAD_THRESHOLD = 20 * 1024 * 1024; // 20 MB
    let audioPart: object;
    let uploadedFileName: string | null = null;

    if (file.size > FILE_UPLOAD_THRESHOLD) {
      const uploadedFile = await this.uploadFile(file);

      if (!uploadedFile?.uri) {
        throw new Error("File upload succeeded, but did not return a URI.");
      }

      this.processingStatus.textContent = 'File uploaded. Getting transcription...';
      audioPart = { fileData: { mimeType: file.type, fileUri: uploadedFile.uri } };
      uploadedFileName = uploadedFile.name; // e.g. "files/xxxxxxxx"
    } else {
      this.processingStatus.textContent = 'Converting audio to base64...';
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(reader.error || new Error('File reading failed.'));
        reader.readAsDataURL(file);
      });

      if (!base64Audio) {
        throw new Error('Failed to convert audio to base64');
      }

      audioPart = { inlineData: { mimeType: file.type, data: base64Audio } };
    }

    this.processingStatus.textContent = 'Getting transcription...';
    const promptText = this.buildTranscriptionPrompt(isBatchPart, batchPartNumber);

    const contents = [
      { text: promptText },
      audioPart,
    ];

    let transcriptionText = '';
    try {
      const response: GenerateContentResponse = await this.genAI.models.generateContent({
        model: MODEL_NAME,
        contents: contents,
        generationConfig: {
          temperature: 0.2,
          topP: 1.0,
        }
      });

      transcriptionText = response.text;
      console.log('🤖 [DEBUG] AI Raw Response:', transcriptionText);
      console.log('🤖 [DEBUG] First 500 characters:', transcriptionText.substring(0, 500));

      if (this.logger) {
        this.logger.log('AI_RESPONSE', `🤖 AI returned ${transcriptionText.length} characters`);
        this.logger.saveAIResponse(transcriptionText);
      }

      if (!transcriptionText) {
        throw new Error('Transcription failed or returned empty.');
      }

      if (this.currentNote) {
        this.currentNote.rawTranscription += (this.currentNote.rawTranscription ? '\n' : '') + transcriptionText;
      }
    } catch (e) {
      // Re-throw the error to be caught by the calling function, but ensure cleanup happens.
      throw e;
    } finally {
      // After transcription (or if it fails), delete the uploaded file to manage storage.
      if (uploadedFileName) {
        await this.deleteFile(uploadedFileName);
      }
    }

    return transcriptionText;
  }

  private async uploadFile(file: File): Promise<any> {
    this.processingStatus.textContent = `Uploading large file "${file.name}"... This may take a moment.`;

    // Use the SDK's built-in upload method
    const uploadedFile = await this.genAI.files.upload({
      file: file,
      config: { mimeType: file.type },
    });

    if (!uploadedFile?.uri) {
      throw new Error("File upload succeeded, but did not return a URI.");
    }

    this.processingStatus.textContent = `File uploaded successfully. Waiting for processing...`;

    // Poll for the file to become ACTIVE
    const maxRetries = 24; // 24 retries * 5s = 2 minutes max wait time
    let retries = 0;
    let fileStatus = uploadedFile;

    while (fileStatus.state === 'PROCESSING' && retries < maxRetries) {
      this.processingStatus.textContent = `Server is processing the audio... Please wait.`;
      await new Promise(res => setTimeout(res, 5000)); // Wait 5 seconds

      try {
        fileStatus = await this.genAI.files.get(uploadedFile.name);
      } catch (error) {
        console.warn(`Failed to get file status (attempt ${retries + 1}):`, error);
      }
      retries++;
    }

    if (fileStatus.state !== 'ACTIVE') {
      throw new Error(`File processing did not complete in time. Final state: ${fileStatus.state}`);
    }

    return fileStatus;
  }

  private async deleteFile(fileName: string): Promise<void> {
    try {
      await this.genAI.files.delete(fileName);
    } catch (e) {
      console.error(`Error during file deletion for ${fileName}:`, e);
    }
  }


  private parseAndRenderRawTranscript(rawText: string, isUpdate: boolean): void {
    if (!isUpdate) {
      this.speakerMap.clear();
      this.currentNote!.segments = [];
    }

    this.rawTranscription.innerHTML = ''; // Full re-render is simpler and fine for this use case

    const lines = rawText.split('\n').filter(line => line.trim() !== '');
    const timestampRegex = /^\s*\[(\d{1,2}:\d{2})\]\s*\[([^\]]+)\]\s*(.+)$/;
    const noTimestampRegex = /^\s*\[([^\]]+)\]\s*(.+)$/;

    console.log('🔍 [DEBUG] Parsing response, total lines:', lines.length);
    console.log('🔍 [DEBUG] First 5 lines to parse:', lines.slice(0, 5));

    if (this.logger) {
      this.logger.log('PARSING', `🔍 Parsing ${lines.length} lines`);
      this.logger.saveParsingLog(`Total lines: ${lines.length}`);
      this.logger.saveParsingLog(`First 10 lines: ${JSON.stringify(lines.slice(0, 10), null, 2)}`);
    }

    const segments: TranscriptSegment[] = [];

    lines.forEach((line, index) => {
      let match = line.match(timestampRegex);
      let timestamp: string | undefined;
      let speakerName: string;
      let text: string;

      if (match) {
        [, timestamp, speakerName, text] = match;
        if (index < 3) console.log(`✅ [DEBUG] Line ${index} matched timestampRegex:`, { timestamp, speakerName, text: text.substring(0, 50) });
        if (this.logger && index < 10) {
          this.logger.saveParsingLog(`Line ${index} MATCHED timestampRegex: [${timestamp}] [${speakerName}] ${text.substring(0, 50)}`);
        }
      } else {
        match = line.match(noTimestampRegex);
        if (match) {
          [, speakerName, text] = match;
          if (index < 3) console.log(`✅ [DEBUG] Line ${index} matched noTimestampRegex:`, { speakerName, text: text.substring(0, 50) });
          if (this.logger && index < 10) {
            this.logger.saveParsingLog(`Line ${index} MATCHED noTimestampRegex: [${speakerName}] ${text.substring(0, 50)}`);
          }
        } else {
          speakerName = 'Unknown';
          text = line;
          if (index < 3) console.log(`⚠️ [DEBUG] Line ${index} matched NEITHER regex, fallback to Unknown:`, line.substring(0, 100));
          if (this.logger && index < 10) {
            this.logger.saveParsingLog(`Line ${index} MATCHED NEITHER - Unknown: ${line.substring(0, 100)}`);
          }
        }
      }
      speakerName = speakerName.trim();
      text = text.trim();

      let speaker = this.speakerMap.get(speakerName) || Array.from(this.speakerMap.values()).find(s => s.displayName === speakerName);
      if (!speaker) {
        const id = `speaker_runtime_${this.speakerMap.size}`;
        speaker = { id, displayName: speakerName, hints: '', color: generateColor(this.speakerMap.size) };
        this.speakerMap.set(speakerName, speaker);
      }

      const segment: TranscriptSegment = {
        id: `segment_${Date.now()}_${index}`,
        timestamp,
        speakerId: speaker.id,
        text,
      };
      segments.push(segment);

      // Render segment
      const segmentEl = document.createElement('div');
      segmentEl.className = 'transcript-segment';
      if (timestamp) {
        segmentEl.innerHTML += `<div class="segment-timestamp">${timestamp}</div>`;
      }
      segmentEl.appendChild(this.createSpeakerChip(speaker));
      segmentEl.innerHTML += `<div class="segment-text">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
      this.rawTranscription.appendChild(segmentEl);
    });

    this.currentNote!.segments = segments;
    this.rawTranscription.classList.remove('placeholder-active');
    this.setNoteTitle(rawText);
  }

  private createSpeakerChip(speaker: Speaker): HTMLElement {
    const chip = document.createElement('div');
    chip.className = 'speaker-chip';
    chip.dataset.speakerId = speaker.id;
    chip.dataset.speakerName = speaker.displayName;
    chip.innerHTML = `
        <div class="speaker-chip-color" style="background-color: ${speaker.color};"></div>
        <span class="speaker-chip-name" data-speaker-id="${speaker.id}">${speaker.displayName}</span>
    `;
    return chip;
  }

  private handleSpeakerRename(nameEl: HTMLElement): void {
    nameEl.contentEditable = 'true';
    nameEl.focus();
    document.execCommand('selectAll', false, undefined);
  }

  private finishSpeakerRename(nameEl: HTMLElement): void {
    nameEl.contentEditable = 'false';
    const speakerId = nameEl.dataset.speakerId;
    const newName = nameEl.textContent?.trim();

    if (!speakerId || !newName) return;

    const oldSpeaker = Array.from(this.speakerMap.values()).find(s => s.id === speakerId);
    if (!oldSpeaker || oldSpeaker.displayName === newName) return;

    // Update speaker map
    this.speakerMap.delete(oldSpeaker.displayName);
    oldSpeaker.displayName = newName;
    this.speakerMap.set(newName, oldSpeaker);

    // Update pre-defined settings if it matches
    const preDefinedSpeaker = this.settings.speakers.find(s => s.id === speakerId);
    if (preDefinedSpeaker) {
      preDefinedSpeaker.displayName = newName;
      this.debouncedSaveSettings();
    }

    // Update all chips in the UI
    this.rawTranscription.querySelectorAll(`.speaker-chip-name[data-speaker-id="${speakerId}"]`).forEach(el => {
      el.textContent = newName;
    });

    this.processingStatus.textContent = `Renamed speaker to "${newName}".`;
  }

  private setNoteTitle(text: string): void {
    if (!this.editorTitle) return;
    let title = '';

    const firstMeaningfulLine = text.split('\n')
      .map(line => line.replace(/^\s*\[[^\]]+\]\s*/, '').trim()) // remove timestamp and speaker tags
      .find(line => line.length > 3);

    if (firstMeaningfulLine) {
      let potentialTitle = firstMeaningfulLine.replace(/^[\*_\`#\->\s\[\]\(.\d)]+/, '').replace(/[\*_\`#]+$/, '').trim();
      const maxLength = 60;
      title = potentialTitle.substring(0, maxLength) + (potentialTitle.length > maxLength ? '...' : '');
    }

    if (title) {
      this.editorTitle.textContent = title;
      this.editorTitle.classList.remove('placeholder-active');
    } else {
      this.editorTitle.textContent = this.editorTitle.getAttribute('placeholder') || 'Untitled Note';
      this.editorTitle.classList.add('placeholder-active');
    }
  }

  private createNewNote(): void {
    this.currentNote = {
      id: `note_${Date.now()}`,
      rawTranscription: '',
      timestamp: Date.now(),
      segments: [],
    };
    this.speakerMap.clear();

    this.rawTranscription.innerHTML = '';
    this.rawTranscription.classList.add('placeholder-active');

    if (this.editorTitle) {
      const placeholder = this.editorTitle.getAttribute('placeholder') || 'Untitled Note';
      this.editorTitle.textContent = placeholder;
      this.editorTitle.classList.add('placeholder-active');
    }

    if (!this.isProcessing) {
      this.processingStatus.textContent = 'Select an audio file to transcribe';
    }
    this.batchProgress.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new VoiceNotesApp();

  document
    .querySelectorAll<HTMLElement>('[contenteditable="true"][placeholder]')
    .forEach((el) => {
      const placeholder = el.getAttribute('placeholder')!;
      function updatePlaceholderState() {
        if (!el.textContent?.trim()) {
          el.textContent = placeholder;
          el.classList.add('placeholder-active');
        } else if (el.textContent.trim() !== placeholder) {
          el.classList.remove('placeholder-active');
        }
      }
      updatePlaceholderState();
      el.addEventListener('focus', function () {
        if (this.textContent?.trim() === placeholder) {
          this.textContent = '';
          this.classList.remove('placeholder-active');
        }
      });
      el.addEventListener('blur', updatePlaceholderState);
    });
});

export { };