/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* tslint:disable */

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

const MODEL_NAME = 'gemini-2.5-flash';
const MAX_SPEAKERS = 10;
const MISSING_API_KEY_MESSAGE = 'Missing Gemini API key. Set VITE_GEMINI_API_KEY (or GEMINI_API_KEY/API_KEY) in your .env file before running.';

const resolveGeminiApiKey = (): string => {
  const candidates = [
    import.meta.env.VITE_GEMINI_API_KEY,
    import.meta.env.GEMINI_API_KEY,
    import.meta.env.API_KEY,
  ];

  const key = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);

  if (!key) {
    console.warn(MISSING_API_KEY_MESSAGE);
    return '';
  }

  return key.trim();
};

const GEMINI_API_KEY = resolveGeminiApiKey();

// --- Utility Functions ---

/**
 * Downloads a file to the user's Downloads folder
 * @param filename - Name of the file (e.g., '01-settings.json')
 * @param content - File content as Blob or string
 * @param folderPrefix - Prefix for the downloaded filename
 * @param mimeType - The MIME type of the blob
 */
const downloadFile = (filename: string, content: BlobPart, folderPrefix: string, mimeType: string = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderPrefix}-${filename}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};


// --- File Logger Class ---
/**
 * FileLogger - Automatic debug log capture and export system
 * Captures settings, prompts, responses, metrics, and errors,
 * then exports them based on user-defined logging level.
 */
class FileLogger {
  private logs: string[] = [];
  private sessionId: string;
  private promptText: string = '';
  private aiResponseText: string = '';
  private parsingLogs: string[] = [];
  private settingsSnapshot: string = '';
  private metrics: Record<string, any> = {};
  private errors: any[] = [];


  constructor() {
    this.sessionId = this.generateSessionId();
    this.log('SESSION', `📋 Session started: ${this.sessionId}`);
  }

  private generateSessionId(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  log(category: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${category}] ${message}`;
    this.logs.push(logEntry);
    if (data) {
      this.logs.push(JSON.stringify(data, null, 2));
    }
    console.log(message, data || '');
  }

  savePrompt(prompt: string) {
    this.promptText = prompt;
    this.log('PROMPT', `📝 Prompt saved (${prompt.length} chars)`);
  }

  saveAIResponse(response: string) {
    this.aiResponseText = response;
    this.log('AI_RESPONSE', `🤖 AI response saved (${response.length} chars)`);
  }

  saveParsingLog(message: string) {
    this.parsingLogs.push(`[${new Date().toISOString()}] ${message}`);
  }

  saveSettings(settings: any) {
    this.settingsSnapshot = JSON.stringify(settings, null, 2);
    this.log('SETTINGS', `⚙️ Settings snapshot saved`);
  }
  
  saveMetrics(newMetrics: Record<string, any>) {
    this.metrics = { ...this.metrics, ...newMetrics };
    this.log('METRICS', 'Metrics updated', this.metrics);
  }

  saveError(type: string, error: Error, requestId?: string) {
    const errorEntry = {
      time: new Date().toISOString(),
      type: type,
      message: error.message,
      stack: error.stack,
      requestId: requestId || 'N/A',
    };
    this.errors.push(errorEntry);
    this.log('ERROR', `${type}: ${error.message}`);
  }

  async exportToFiles(level: 'off' | 'basic' | 'verbose', appVersion: string = '1.0.0') {
    if (level === 'off') {
        this.log('EXPORT', 'Logging is off. No files exported.');
        return;
    }
    try {
      const folderName = `logs-${this.sessionId}`;
      this.metrics['version'] = appVersion;
      
      const files = [
        { name: '01-settings.json', content: this.settingsSnapshot, levels: ['basic', 'verbose'] },
        { name: '02-prompt.txt', content: this.promptText, levels: ['basic', 'verbose'] },
        { name: '03-ai-response.txt', content: this.aiResponseText, levels: ['basic', 'verbose'] },
        { name: '06-metrics.json', content: JSON.stringify(this.metrics, null, 2), levels: ['basic', 'verbose'] },
        { name: '04-parsing-log.txt', content: this.parsingLogs.join('\n'), levels: ['verbose'] },
        { name: '05-console-full.txt', content: this.logs.join('\n'), levels: ['verbose'] },
        { name: '07-errors.json', content: JSON.stringify(this.errors, null, 2), levels: ['verbose'] },
      ];

      for (const file of files) {
        if (file.content && file.levels.includes(level)) {
          downloadFile(file.name, file.content, folderName);
        }
      }

      this.log('EXPORT', `✅ Log files exported to downloads as: ${folderName}-*.txt`);
      return folderName;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.saveError('EXPORT_FAILURE', err);
      this.log('ERROR', `❌ Failed to export logs: ${err.message}`);
      throw error;
    }
  }

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
  displayFormat: 'speakersOnly' | 'timestampsAndSpeakers' | 'plain';
  outputMode: 'verbatim' | 'cleaned';
  cleanlinessBudgetPct: number;
  autoExport: boolean;
  loggingLevel: 'off' | 'basic' | 'verbose';
  nonSpeechTags: boolean;
  repairTimestamps: boolean;
}

interface TranscriptSegment {
  id: string;
  timestamp?: string;
  speakerId: string;
  text: string;
}

interface Note {
  id: string;
  rawTranscription: string;
  timestamp: number;
  segments: TranscriptSegment[];
}

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
  private geminiApiKey: string;

  // --- UI Elements ---
  private processingStatus: HTMLDivElement;
  private rawTranscription: HTMLDivElement;
  private newButton: HTMLButtonElement;
  private themeToggleButton: HTMLButtonElement;
  private themeToggleIcon: HTMLElement;
  private editorTitle: HTMLDivElement;
  private uploadButton: HTMLButtonElement;
  private fileInput: HTMLInputElement;
  private dropZone: HTMLDivElement;
  private copyButton: HTMLButtonElement;
  private exportTxtButton: HTMLButtonElement;
  private exportMdButton: HTMLButtonElement;
  private exportDocxButton: HTMLButtonElement;
  private speakerSettingsPanel: HTMLDivElement;
  private resetSettingsButton: HTMLButtonElement;
  private diarizationToggle: HTMLInputElement;
  private autoDetectToggle: HTMLInputElement;
  private autoDetectRow: HTMLDivElement;
  private speakerCountInput: HTMLInputElement;
  private speakerCountRow: HTMLDivElement;
  private displayFormatSelect: HTMLSelectElement;
  private speakerDetailsContainer: HTMLDivElement;
  private vocabularyHints: HTMLTextAreaElement;
  private batchProgress: HTMLProgressElement;
  private outputModeSelect: HTMLSelectElement;
  private cleanlinessBudgetInput: HTMLInputElement;
  private editBudgetRow: HTMLDivElement;
  private autoExportToggle: HTMLInputElement;
  private loggingLevelSelect: HTMLSelectElement;
  private nonSpeechTagsToggle: HTMLInputElement;
  private repairTimestampsToggle: HTMLInputElement;

  // --- State ---
  private isProcessing = false;
  private currentNote: Note | null = null;
  private settings: SpeakerSettings;
  private speakerMap = new Map<string, Speaker>();
  private logger: FileLogger | null = null;

  constructor() {
    this.geminiApiKey = GEMINI_API_KEY;
    this.genAI = new GoogleGenAI({ apiKey: this.geminiApiKey || 'missing-api-key' });
    this.bindDOM();
    this.loadSettings();
    this.bindEventListeners();
    this.initTheme();
    this.renderSettingsUI();
    this.createNewNote();
    this.warnIfMissingApiKey();
  }

  private warnIfMissingApiKey(): void {
    if (this.geminiApiKey) return;
    this.processingStatus.textContent = MISSING_API_KEY_MESSAGE;
  }

  private bindDOM(): void {
    this.processingStatus = document.getElementById('processingStatus') as HTMLDivElement;
    this.rawTranscription = document.getElementById('rawTranscription') as HTMLDivElement;
    this.editorTitle = document.querySelector('.editor-title') as HTMLDivElement;
    this.uploadButton = document.getElementById('uploadButton') as HTMLButtonElement;
    this.fileInput = document.getElementById('fileInput') as HTMLInputElement;
    this.dropZone = document.querySelector('.note-content-wrapper') as HTMLDivElement;
    this.copyButton = document.getElementById('copyButton') as HTMLButtonElement;
    this.exportTxtButton = document.getElementById('exportTxtButton') as HTMLButtonElement;
    this.exportMdButton = document.getElementById('exportMdButton') as HTMLButtonElement;
    this.exportDocxButton = document.getElementById('exportDocxButton') as HTMLButtonElement;
    this.newButton = document.getElementById('newButton') as HTMLButtonElement;
    this.themeToggleButton = document.getElementById('themeToggleButton') as HTMLButtonElement;
    this.themeToggleIcon = this.themeToggleButton.querySelector('i') as HTMLElement;
    this.speakerSettingsPanel = document.getElementById('speakerSettings') as HTMLDivElement;
    this.resetSettingsButton = document.getElementById('resetSettingsButton') as HTMLButtonElement;
    this.diarizationToggle = document.getElementById('diarizationToggle') as HTMLInputElement;
    this.autoDetectToggle = document.getElementById('autoDetectToggle') as HTMLInputElement;
    this.autoDetectRow = document.getElementById('autoDetectRow') as HTMLDivElement;
    this.speakerCountInput = document.getElementById('speakerCount') as HTMLInputElement;
    this.speakerCountRow = document.getElementById('speakerCountRow') as HTMLDivElement;
    this.displayFormatSelect = document.getElementById('displayFormatSelect') as HTMLSelectElement;
    this.speakerDetailsContainer = document.getElementById('speakerDetailsContainer') as HTMLDivElement;
    this.vocabularyHints = document.getElementById('vocabularyHints') as HTMLTextAreaElement;
    this.batchProgress = document.getElementById('batchProgress') as HTMLProgressElement;
    this.outputModeSelect = document.getElementById('outputMode') as HTMLSelectElement;
    this.cleanlinessBudgetInput = document.getElementById('cleanlinessBudgetPct') as HTMLInputElement;
    this.editBudgetRow = document.getElementById('editBudgetRow') as HTMLDivElement;
    this.autoExportToggle = document.getElementById('autoExport') as HTMLInputElement;
    this.loggingLevelSelect = document.getElementById('loggingLevel') as HTMLSelectElement;
    this.nonSpeechTagsToggle = document.getElementById('nonSpeechTags') as HTMLInputElement;
    this.repairTimestampsToggle = document.getElementById('repairTimestamps') as HTMLInputElement;
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
    this.copyButton.addEventListener('click', () => this.handleCopyToClipboard());
    this.exportTxtButton.addEventListener('click', () => this.handleExport('txt'));
    this.exportMdButton.addEventListener('click', () => this.handleExport('md'));
    this.exportDocxButton.addEventListener('click', () => this.handleExport('docx'));

    const settingsInputs = [
        this.diarizationToggle, this.autoDetectToggle, this.speakerCountInput,
        this.displayFormatSelect, this.outputModeSelect, this.cleanlinessBudgetInput,
        this.autoExportToggle, this.loggingLevelSelect, this.nonSpeechTagsToggle,
        this.repairTimestampsToggle
    ];
    settingsInputs.forEach(input => input.addEventListener('change', () => this.updateSettingsFromUI()));
    this.vocabularyHints.addEventListener('input', () => this.updateSettingsFromUI(true));

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
      speakerCount: 6,
      displayFormat: 'speakersOnly',
      outputMode: 'cleaned',
      cleanlinessBudgetPct: 10,
      autoExport: false,
      loggingLevel: 'basic',
      vocabularyHints: '',
      nonSpeechTags: false,
      repairTimestamps: true,
      speakers: defaultSpeakers,
    };

    this.settings = savedSettings ? { ...defaults, ...JSON.parse(savedSettings) } : defaults;
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
    localStorage.removeItem('voiceNotesSettings');
    this.loadSettings();
    this.renderSettingsUI();
    this.showStatusMessage('Settings reset to defaults', 2000);
  }

  private updateSettingsFromUI(skipRender: boolean = false): void {
    this.settings.diarizationEnabled = this.diarizationToggle.checked;
    this.settings.autoDetectSpeakers = this.autoDetectToggle.checked;
    this.settings.speakerCount = parseInt(this.speakerCountInput.value, 10);
    this.settings.vocabularyHints = this.vocabularyHints.value;
    this.settings.displayFormat = this.displayFormatSelect.value as SpeakerSettings['displayFormat'];
    this.settings.outputMode = this.outputModeSelect.value as SpeakerSettings['outputMode'];
    this.settings.cleanlinessBudgetPct = parseInt(this.cleanlinessBudgetInput.value, 10);
    this.settings.autoExport = this.autoExportToggle.checked;
    this.settings.loggingLevel = this.loggingLevelSelect.value as SpeakerSettings['loggingLevel'];
    this.settings.nonSpeechTags = this.nonSpeechTagsToggle.checked;
    this.settings.repairTimestamps = this.repairTimestampsToggle.checked;

    document.querySelectorAll('.speaker-detail-row').forEach((row, index) => {
      const nameInput = row.querySelector('.speaker-name-input') as HTMLInputElement;
      const hintsInput = row.querySelector('.speaker-hints-input') as HTMLInputElement;
      if (nameInput && hintsInput && this.settings.speakers[index]) {
        this.settings.speakers[index].displayName = nameInput.value;
        this.settings.speakers[index].hints = hintsInput.value;
      }
    });

    if (!skipRender) {
      this.renderSettingsUI();
    }
    if (this.currentNote?.segments?.length) {
        this.renderTranscriptSegments();
    }

    this.debouncedSaveSettings();
  }

  private renderSettingsUI(): void {
    this.diarizationToggle.checked = this.settings.diarizationEnabled;
    this.autoDetectToggle.checked = this.settings.autoDetectSpeakers;
    this.speakerCountInput.value = this.settings.speakerCount.toString();
    this.vocabularyHints.value = this.settings.vocabularyHints;
    this.displayFormatSelect.value = this.settings.displayFormat;
    this.outputModeSelect.value = this.settings.outputMode;
    this.cleanlinessBudgetInput.value = this.settings.cleanlinessBudgetPct.toString();
    this.autoExportToggle.checked = this.settings.autoExport;
    this.loggingLevelSelect.value = this.settings.loggingLevel;
    this.nonSpeechTagsToggle.checked = this.settings.nonSpeechTags;
    this.repairTimestampsToggle.checked = this.settings.repairTimestamps;

    const diarizationOn = this.settings.diarizationEnabled;
    this.autoDetectRow.style.display = diarizationOn ? 'flex' : 'none';
    this.speakerCountRow.style.display = diarizationOn && !this.settings.autoDetectSpeakers ? 'flex' : 'none';
    this.speakerDetailsContainer.style.display = diarizationOn && !this.settings.autoDetectSpeakers ? 'flex' : 'none';
    this.editBudgetRow.style.display = this.settings.outputMode === 'cleaned' ? 'flex' : 'none';

    if (diarizationOn && !this.settings.autoDetectSpeakers) {
      const currentRows = this.speakerDetailsContainer.children.length;
      const targetCount = this.settings.speakerCount;

      if (targetCount > currentRows) {
        for (let i = currentRows; i < targetCount; i++) {
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
      } else if (targetCount < currentRows) {
        for (let i = currentRows; i > targetCount; i--) {
          this.speakerDetailsContainer.lastElementChild?.remove();
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
    const fileNumberRegex = /-(\d+)\.\w+$/;
    const isBatch = files.length > 1 && files.every(f => fileNumberRegex.test(f.name));

    if (isBatch) {
      files.sort((a, b) => {
        const numA = parseInt(a.name.match(fileNumberRegex)![1], 10);
        const numB = parseInt(b.name.match(fileNumberRegex)![1], 10);
        return numA - numB;
      });
      await this.processBatch(files);
    } else {
      await this.processSingleFile(files[0]);
    }
  }

  private async processBatch(files: File[]): Promise<void> {
    this.createNewNote();
    this.setControlsDisabled(true);
    this.batchProgress.classList.remove('hidden');
    this.batchProgress.value = 0;
    this.batchProgress.max = files.length;

    for (const [index, file] of files.entries()) {
      try {
        this.processingStatus.textContent = `Processing file ${index + 1} of ${files.length}: "${file.name}"...`;
        await this.transcribeAudio(file, true, index + 1);
        this.currentNote!.segments = this.postProcessTranscript(this.currentNote!.rawTranscription);
        this.renderTranscriptSegments();
        this.batchProgress.value = index + 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.processingStatus.textContent = `Error on file ${index + 1}: ${message}. Skipping.`;
        if (this.logger) this.logger.saveError('BATCH_PART_FAILURE', error instanceof Error ? error : new Error(message));
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

    this.logger = new FileLogger();
    this.logger.log('SESSION', `📁 Processing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    this.logger.saveMetrics({ fileName: file.name, fileSize_MB: (file.size / 1024 / 1024).toFixed(2) });

    try {
      const rawText = await this.transcribeAudio(file, false, 0);
      this.currentNote!.segments = this.postProcessTranscript(rawText);
      this.setNoteTitle(rawText);
      this.renderTranscriptSegments();

      if (this.settings.autoExport && this.settings.loggingLevel !== 'off') {
        const folderName = await this.logger.exportToFiles(this.settings.loggingLevel);
        this.processingStatus.textContent = `✅ Complete! Logs saved to Downloads folder. Ready for new file.`;
      } else {
        this.processingStatus.textContent = `✅ Transcription Complete! Ready for new file.`;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      if (this.logger) {
        this.logger.saveError('TRANSCRIPTION_FAILURE', error instanceof Error ? error : new Error(message));
        await this.logger.exportToFiles('verbose'); // Always export verbose on error
        this.processingStatus.textContent = `Error: ${message}. Detailed logs saved to Downloads folder.`;
      } else {
        this.processingStatus.textContent = `Error: ${message}`;
      }
    } finally {
      this.setControlsDisabled(false);
      this.fileInput.value = '';
    }
  }

  private buildTranscriptionPrompt(): string {
    const {
        diarizationEnabled, autoDetectSpeakers, speakerCount, speakers,
        vocabularyHints, outputMode, cleanlinessBudgetPct, nonSpeechTags
    } = this.settings;

    const directives = `
**Role**: You are a high-accuracy audio transcription and diarization engine.
**Objective**: Produce a perfectly structured transcript from the provided audio, adhering to all constraints.
**Reasoning Effort**: HIGH. Treat all instructions as hard constraints.

**MODES**
- **Verbatim**: Capture every spoken word, including fillers, false starts, and repetitions.
- **Cleaned (Minimal Edit)**: Preserve original meaning and order. Apply the smallest necessary clean-ups. This is NOT a rewrite.

**MINIMAL-EDIT GUARDRAIL (FOR 'CLEANED' MODE ONLY)**
- **Edit Budget**: Target **≤ ~${cleanlinessBudgetPct}%** textual change vs. the verbatim source.
- **Allowed**: Remove fillers (um, uh, you know), false starts, and micro-repetitions. Fix basic punctuation. You may split ONE run-on sentence for readability.
- **Disallowed**: No paraphrasing, re-ordering of events, or changing meaning, tense, or person.

**OUTPUT SCHEMA (MANDATORY)**
- Every transcribed segment MUST be on a **new line**.
- Every line MUST strictly follow this format: \`[mm:ss] [Speaker Name] The transcribed text...\`
- Example: \`[00:09] [Speaker 1] This is the first sentence of the transcription.\`
- For unknown speakers, use labels like \`Unknown 1\`, \`Unknown 2\`, and reuse them consistently for the same voice.
- Do NOT add any extra commentary, headings, or summaries before or after the transcript. The output must be ONLY the transcript lines.
    `;

    let prompt = '## TRANSCRIPTION TASK\n\n' + directives;

    prompt += '\n\n## CURRENT SETTINGS\n';
    prompt += `- **Output Mode**: ${outputMode}\n`;
    if (diarizationEnabled) {
        prompt += `- **Diarization**: ENABLED\n`;
        if (autoDetectSpeakers) {
            prompt += `- **Speaker Detection**: auto_detect. Identify distinct voices and label them consistently.\n`;
        } else {
            prompt += `- **Speaker Detection**: fixed_count. There are exactly ${speakerCount} speakers.\n`;
            const speakerList = speakers.slice(0, speakerCount).map(s => `  • ${s.displayName}${s.hints ? ` (Hint: ${s.hints})` : ''}`).join('\n');
            if (speakerList) {
                prompt += `- **Speaker Roster (use these exact names)**:\n${speakerList}\n`;
            }
        }
    } else {
        prompt += `- **Diarization**: DISABLED. Transcribe all speech under a single label like '[Speech]'.\n`;
    }

    prompt += `- **Non-speech Tags**: ${nonSpeechTags ? 'ENABLED. Use [laughter], [music], [applause], [overlap], [inaudible] where clearly present.' : 'DISABLED. Do not include any non-speech tags.'}\n`;

    if (vocabularyHints.trim()) {
        prompt += `\n## CRITICAL VOCABULARY\n- You MUST use these exact terms and spellings. This is a hard requirement, not a suggestion.\n- Transcribe them exactly as provided below, case-sensitively if appropriate:\n${vocabularyHints.trim()}\n`;
    }

    prompt += `\n## FINAL INSTRUCTION\nBegin the transcription now. Ensure every single line of your output adheres to the specified \`[mm:ss] [Speaker Name] Text...\` format.`;
    
    if (this.logger) {
        this.logger.saveSettings(this.settings);
        this.logger.savePrompt(prompt);
    }
    return prompt;
  }

  private async transcribeAudio(file: File, isBatchPart: boolean, batchPartNumber: number): Promise<string> {
    const startTime = Date.now();
    this.processingStatus.textContent = `Processing "${file.name}"...`;
    const FILE_UPLOAD_THRESHOLD = 20 * 1024 * 1024; // 20 MB
    let audioPart: object;
    let uploadedFileName: string | null = null;

    if (file.size > FILE_UPLOAD_THRESHOLD) {
      const uploadedFile = await this.uploadFile(file);
      audioPart = { fileData: { mimeType: file.type, fileUri: uploadedFile.uri } };
      uploadedFileName = uploadedFile.name;
    } else {
      this.processingStatus.textContent = 'Converting audio to base64...';
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (e) => reject(reader.error || new Error('File reading failed.'));
        reader.readAsDataURL(file);
      });
      audioPart = { inlineData: { mimeType: file.type, data: base64Audio } };
    }

    this.processingStatus.textContent = 'Getting transcription...';
    const promptText = this.buildTranscriptionPrompt();

    const contents = [{ text: promptText }, audioPart];
    let transcriptionText = '';
    try {
      const response: GenerateContentResponse = await this.genAI.models.generateContent({
        model: MODEL_NAME,
        contents: contents,
        config: {
          temperature: 0.0,
          topP: 1.0,
        }
      });
      transcriptionText = response.text;
      
      if (this.logger) {
        this.logger.saveAIResponse(transcriptionText);
        this.logger.saveMetrics({
            model: MODEL_NAME,
            temperature: 0.0,
            topP: 1.0,
            latency_ms: Date.now() - startTime
        });
      }

      if (!transcriptionText) throw new Error('Transcription returned empty.');
      
      if (this.currentNote) {
        this.currentNote.rawTranscription += (this.currentNote.rawTranscription ? '\n' : '') + transcriptionText;
      }
    } catch (e) {
      throw e;
    } finally {
      if (uploadedFileName) {
        await this.deleteFile(uploadedFileName);
      }
    }

    return transcriptionText;
  }

  private async uploadFile(file: File): Promise<any> {
    this.processingStatus.textContent = `Uploading large file "${file.name}"...`;
    const uploadedFile = await this.genAI.files.upload({
      file: file,
      config: { mimeType: file.type },
    });
    
    let fileStatus = uploadedFile;
    while (fileStatus.state === 'PROCESSING') {
      this.processingStatus.textContent = `Server is processing the audio... Please wait.`;
      await new Promise(res => setTimeout(res, 5000));
      fileStatus = await this.genAI.files.get(uploadedFile.name);
    }

    if (fileStatus.state !== 'ACTIVE') {
      throw new Error(`File processing failed. Final state: ${fileStatus.state}`);
    }
    return fileStatus;
  }

  private async deleteFile(fileName: string): Promise<void> {
    try {
      await this.genAI.files.delete(fileName);
    } catch (e) {
      if (this.logger) this.logger.saveError('FILE_DELETION_ERROR', e as Error);
    }
  }

  private postProcessTranscript(rawText: string): TranscriptSegment[] {
    if (this.logger) this.logger.log('PARSING', `🔍 Starting post-processing on ${rawText.length} chars.`);

    const lines = rawText.split('\n').filter(line => line.trim() !== '');
    let lastGoodTimestamp: string | null = null;
    const segments: TranscriptSegment[] = [];
    
    const fullRegex = /^\s*\[((?:\d{1,2}:)?\d{1,2}:\d{2})\]\s*\[([^\]]+)\]\s*(.+)$/;
    const speakerOnlyRegex = /^\s*\[([^\]]+)\]\s*(.+)$/;
    
    lines.forEach((line, index) => {
        let timestamp: string | undefined;
        let speakerName: string;
        let text: string;
        let match = line.match(fullRegex);

        if (match) {
            let rawTimestamp = match[1];
            speakerName = match[2].trim();
            text = match[3].trim();

            if (this.settings.repairTimestamps) {
                const parts = rawTimestamp.split(':').map(p => parseInt(p, 10));
                if (parts.length === 3) { // HH:MM:SS
                    const [h, m, s] = parts;
                    const totalMinutes = h * 60 + m;
                    timestamp = `${String(totalMinutes).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                } else { // MM:SS or M:SS
                    const [m, s] = parts;
                    timestamp = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                }
            } else {
                timestamp = rawTimestamp;
            }
            lastGoodTimestamp = timestamp;

        } else if ((match = line.match(speakerOnlyRegex))) {
            speakerName = match[1].trim();
            text = match[2].trim();
            if (this.settings.repairTimestamps) {
                timestamp = lastGoodTimestamp ?? undefined;
                if (this.logger) this.logger.saveParsingLog(`Line ${index+1}: Inherited timestamp '${lastGoodTimestamp}'`);
            }
        
        } else {
            speakerName = 'Unknown';
            text = line.trim();
            if (this.settings.repairTimestamps) {
                timestamp = lastGoodTimestamp ?? undefined;
            }
            if (this.logger) this.logger.saveParsingLog(`Line ${index+1}: Failed to match schema. Treating as text for '${speakerName}'.`);
        }

        if (!text) return;

        let speaker = this.speakerMap.get(speakerName) || Array.from(this.speakerMap.values()).find(s => s.displayName === speakerName);
        if (!speaker) {
            const id = `speaker_runtime_${this.speakerMap.size}`;
            speaker = { id, displayName: speakerName, hints: '', color: generateColor(this.speakerMap.size) };
            this.speakerMap.set(speakerName, speaker);
        }

        segments.push({
            id: `segment_${Date.now()}_${index}`,
            timestamp,
            speakerId: speaker.id,
            text,
        });
    });

    if (this.logger) this.logger.log('PARSING', `✅ Post-processing complete. Found ${segments.length} segments.`);
    return segments;
  }

  private renderTranscriptSegments(): void {
    if (!this.currentNote) return;
    this.rawTranscription.innerHTML = '';

    if (this.currentNote.segments.length === 0) {
      this.rawTranscription.classList.add('placeholder-active');
      return;
    }

    this.currentNote.segments.forEach(segment => {
      const speaker = Array.from(this.speakerMap.values()).find(s => s.id === segment.speakerId);
      if (!speaker) return;

      const segmentEl = document.createElement('div');
      segmentEl.className = 'transcript-segment';
      const display = this.settings.displayFormat;

      let content = '';
      if (display === 'timestampsAndSpeakers') {
        content += `<div class="segment-timestamp">${segment.timestamp || '[--:--]'}</div>`;
        content += this.createSpeakerChip(speaker).outerHTML;
      } else if (display === 'speakersOnly') {
        content += this.createSpeakerChip(speaker).outerHTML;
      }
      content += `<div class="segment-text">${segment.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
      segmentEl.innerHTML = content;
      this.rawTranscription.appendChild(segmentEl);
    });
    this.rawTranscription.classList.remove('placeholder-active');
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

    const segmentCount = this.currentNote?.segments.filter(s => s.speakerId === speakerId).length || 0;
    if (segmentCount > 0) {
      if (!confirm(`Update all ${segmentCount} instances of "${oldSpeaker.displayName}" to "${newName}"?`)) {
        nameEl.textContent = oldSpeaker.displayName;
        return;
      }
    }

    this.speakerMap.delete(oldSpeaker.displayName);
    oldSpeaker.displayName = newName;
    this.speakerMap.set(newName, oldSpeaker);

    const preDefinedSpeaker = this.settings.speakers.find(s => s.id === speakerId);
    if (preDefinedSpeaker) {
      preDefinedSpeaker.displayName = newName;
      this.debouncedSaveSettings();
    }

    this.rawTranscription.querySelectorAll(`.speaker-chip-name[data-speaker-id="${speakerId}"]`).forEach(el => {
      el.textContent = newName;
    });
    this.showStatusMessage(`Renamed speaker to "${newName}".`, 2000);
  }

  private setNoteTitle(text: string): void {
    if (!this.editorTitle) return;
    let title = '';
    const firstMeaningfulLine = text.split('\n').map(line => line.replace(/^\s*\[[^\]]+\]\s*/, '').trim()).find(line => line.length > 3);
    if (firstMeaningfulLine) {
      let potentialTitle = firstMeaningfulLine.replace(/^[\*_\`#\->\s\[\]\(.\d)]+/, '').replace(/[\*_\`#]+$/, '').trim();
      const maxLength = 60;
      title = potentialTitle.substring(0, maxLength) + (potentialTitle.length > maxLength ? '...' : '');
    }
    this.editorTitle.textContent = title || this.editorTitle.getAttribute('placeholder') || 'Untitled Note';
    this.editorTitle.classList.toggle('placeholder-active', !title);
  }

  private createNewNote(): void {
    this.currentNote = {
      id: `note_${Date.now()}`,
      rawTranscription: '',
      timestamp: Date.now(),
      segments: [],
    };
    this.speakerMap.clear();
    this.renderTranscriptSegments();
    if (this.editorTitle) {
      this.editorTitle.textContent = this.editorTitle.getAttribute('placeholder') || 'Untitled Note';
      this.editorTitle.classList.add('placeholder-active');
    }
    if (!this.isProcessing) this.processingStatus.textContent = 'Select an audio file to transcribe';
    this.batchProgress.classList.add('hidden');
  }

  private generateTranscriptText(format: 'txt' | 'md'): string {
    if (!this.currentNote || this.currentNote.segments.length === 0) return '';
    const { displayFormat } = this.settings;
    return this.currentNote.segments.map(segment => {
      const speaker = Array.from(this.speakerMap.values()).find(s => s.id === segment.speakerId);
      if (!speaker) return '';
      let line = '';
      if (displayFormat === 'timestampsAndSpeakers') {
        line += segment.timestamp ? `[${segment.timestamp}] ` : '';
        line += format === 'md' ? `**${speaker.displayName}:** ` : `[${speaker.displayName}] `;
      } else if (displayFormat === 'speakersOnly') {
        line += format === 'md' ? `**${speaker.displayName}:** ` : `[${speaker.displayName}] `;
      }
      line += segment.text;
      return line;
    }).join('\n');
  }

  private generateTranscriptHtmlForDocx(): string {
    if (!this.currentNote || this.currentNote.segments.length === 0) return '';
    const { displayFormat } = this.settings;
    const styles = `body { font-family: sans-serif; font-size: 11pt; } p { margin: 0 0 5px 0; } .ts { color: #555; } .spk { font-weight: bold; }`;
    const bodyContent = this.currentNote.segments.map(segment => {
      const speaker = Array.from(this.speakerMap.values()).find(s => s.id === segment.speakerId);
      if (!speaker) return '';
      let line = '<p>';
      if (displayFormat === 'timestampsAndSpeakers') {
        line += segment.timestamp ? `<span class="ts">[${segment.timestamp}]</span> ` : '';
        line += `<span class="spk">${speaker.displayName}:</span> `;
      } else if (displayFormat === 'speakersOnly') {
        line += `<span class="spk">${speaker.displayName}:</span> `;
      }
      line += segment.text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>';
      return line;
    }).join('');
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${styles}</style></head><body>${bodyContent}</body></html>`;
  }

  private async handleCopyToClipboard(): Promise<void> {
    const text = this.generateTranscriptText('txt');
    if (!text) {
        this.showStatusMessage('Nothing to copy', 2000);
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
        this.showStatusMessage('Copied to clipboard!', 2000);
    } catch (err) {
        this.showStatusMessage('Failed to copy', 2000);
    }
  }

  private handleExport(format: 'txt' | 'md' | 'docx'): void {
    let content: string;
    let mimeType: string;
    // FIX: Explicitly type `fileExt` as string. Its type was inferred as 'txt' | 'md' | 'docx',
    // which caused an error on line 1010 when assigning 'doc' to it for docx export.
    let fileExt: string = format;

    if (format === 'docx') {
        content = this.generateTranscriptHtmlForDocx();
        mimeType = 'application/msword';
        fileExt = 'doc'; // Use .doc for better compatibility with simple HTML
    } else {
        content = this.generateTranscriptText(format);
        mimeType = 'text/plain';
    }
     if (!content) {
        this.showStatusMessage('Nothing to export', 2000);
        return;
    }
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    
    downloadFile(`transcript.${fileExt}`, content, `transcript-${timestamp}`, mimeType);
    this.showStatusMessage(`Exported as .${fileExt}`, 2000);
  }

  private showStatusMessage(message: string, duration: number): void {
      const originalStatus = this.processingStatus.textContent;
      this.processingStatus.textContent = message;
      setTimeout(() => {
          if (this.processingStatus.textContent === message) {
              this.processingStatus.textContent = this.isProcessing ? originalStatus : 'Ready to upload';
          }
      }, duration);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new VoiceNotesApp();

  document.querySelectorAll<HTMLElement>('[contenteditable="true"][placeholder]').forEach((el) => {
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
