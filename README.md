<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1bVC0eLBOooFRNLySMyQpaiK2SeDwzh7q

## Audio Transcriber with Speaker Diarization

> Audio transcription with speaker identification using Google Gemini 2.5 Flash API

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## ✨ Features

- 🎙️ **High-accuracy transcription** using Gemini 2.5 Flash
- 👥 **Speaker diarization** with automatic or manual modes
- 🔤 **Vocabulary hints** for domain-specific terminology
- 📋 **Automatic debug logs** exported to files
- 💾 **Settings persistence** via localStorage
- 🎯 **Batch processing** for large files
- ⚡ **Fast setup** - no backend required
- 🔍 **FileLogger debugging** - complete logs auto-download

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Features in Detail](#features-in-detail)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## 🔧 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Google Gemini API key** ([Get one here](https://aistudio.google.com/app/apikey))

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/audio-transcriber-gemini-diarization.git
   cd audio-transcriber-gemini-diarization
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

4. **Add your API key to `.env.local`:**
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   API_KEY=your_actual_gemini_api_key_here
   ```

## 🚀 Usage

### Development Mode

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Build for production:
```bash
npm run build
npm run preview
```

### Basic Workflow

1. **Upload audio file** - Click "Choose Audio File" (max 20 MB)
2. **Configure settings** (optional):
   - Enable speaker diarization
   - Set number of speakers
   - Add speaker hints (characteristics, names, roles)
   - Add vocabulary terms (proper nouns, technical terms)
3. **Start transcription** - Click "Start Transcription"
4. **Download logs** - 5 debug log files auto-download for troubleshooting

## ⚙️ Configuration

### Speaker Diarization Modes

#### Auto-detect
AI identifies and labels speakers automatically based on voice characteristics.

#### Manual Mode
Specify exact number of speakers with optional hints:
- **Speaker hints**: Provide characteristics to help AI identify speakers
  - Example: "Male voice, British accent, older"
  - Example: "Female voice, higher pitch, younger"
- **Display names**: Custom labels for each speaker
  - Example: "Interviewer", "Guest", "Narrator"

### Vocabulary Hints

Add domain-specific terms that AI should transcribe exactly:
- **Film names**: "Werckmeister Harmonies", "The Turin Horse"
- **People**: "Béla Tarr", "Ágnes Hranitzky"
- **Technical terms**: "chiaroscuro", "mise-en-scène"
- **Organizations**: "ACME Corporation", "IEEE"

**Tip:** Add one term per line for best results.

### Automatic Log Export

When transcription completes, 5 files automatically download to help debugging:

| File | Contents |
|------|----------|
| `01-settings.json` | Configuration snapshot |
| `02-prompt.txt` | Complete prompt sent to AI |
| `03-ai-response.txt` | Full AI response (no truncation) |
| `04-parsing-log.txt` | Parsing details (first 10 lines) |
| `05-console-full.txt` | All console logs with timestamps |

**Why?** Console logs may truncate for large transcriptions. These files ensure you have complete debug information.

**Files are named:** `test-logs-[timestamp]-##-filename.ext`

## 🎯 Features in Detail

### FileLogger Class

Automatically captures debug information without manual work:
- ✅ No manual copy-paste needed
- ✅ No truncation of long outputs
- ✅ Timestamped files for each session
- ✅ Helps troubleshooting transcription issues
- ✅ Complete AI responses saved (can be 10,000+ characters)

### Settings Persistence

All settings stored in browser localStorage:
- API key (stored securely in browser)
- Speaker preferences and hints
- Vocabulary hints
- Last used configuration

**Privacy:** Settings never leave your browser. API key only used for Gemini API calls.

### Batch Processing

For files >20 MB:
1. Split audio into <20 MB chunks using your audio editor
2. Process each chunk separately
3. Combine results manually (speaker IDs consistent across chunks)

## 🐛 Troubleshooting

### "API key not found"

**Problem:** App can't find your Gemini API key.

**Solutions:**
1. Ensure `.env.local` file exists in project root
2. Verify file contains: `GEMINI_API_KEY=your_key_here` and `API_KEY=your_key_here`
3. Restart dev server after adding API key: `Ctrl+C`, then `npm run dev`
4. Check for typos in environment variable names
5. Don't put API key in quotes in .env.local

### "File too large"

**Problem:** File exceeds 20 MB limit.

**Solutions:**
1. Compress audio:
   ```bash
   ffmpeg -i input.mp3 -b:a 64k output.mp3
   ```
2. Split into smaller files:
   ```bash
   ffmpeg -i input.mp3 -f segment -segment_time 300 -c copy output%03d.mp3
   ```
3. Use batch processing mode

### Poor transcription quality

**Possible causes and solutions:**

| Issue | Solution |
|-------|----------|
| Technical terms wrong | Add vocabulary hints with correct spellings |
| Speakers not identified | Enable manual mode, specify speaker count, add hints |
| Background noise | Use noise reduction before uploading |
| Multiple languages | Process each language separately |
| Mumbling/unclear speech | Increase audio clarity or add vocabulary context |

**Best practices:**
- Use clear audio (minimize background noise)
- Sample rate: 16-48 kHz recommended
- Format: MP3, WAV, M4A, FLAC supported
- Add vocabulary hints for proper nouns
- Use manual speaker mode for distinct speakers

### Speakers not identified correctly

**Solutions:**
1. Enable manual speaker mode
2. Specify correct number of speakers (count distinct voices)
3. Add speaker hints with distinguishing characteristics:
   - Voice qualities: "deep voice", "soft-spoken", "loud"
   - Accents: "British accent", "Southern accent"
   - Age: "older male", "younger female"
4. Check audio quality - distinct voices needed
5. Review downloaded logs (file 03) to see what AI detected

### Log files not downloading

**Solutions:**
1. Check browser's download settings
   - Allow multiple downloads from localhost
   - Check if downloads are blocked
2. Look in your Downloads folder for `test-logs-*` files
3. Check browser console for errors (F12 → Console tab)
4. Try different browser (Chrome/Firefox/Safari)

### Build errors

**Problem:** `npm run build` fails.

**Solutions:**
1. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Check Node.js version: `node --version` (should be >=18.0.0)
3. Update npm: `npm install -g npm@latest`
4. Check for TypeScript errors: `npx tsc --noEmit`

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick start for contributors:**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Powered by [Google Gemini 2.5 Flash](https://ai.google.dev/)
- Built with [Vite](https://vitejs.dev/) and [TypeScript](https://www.typescriptlang.org/)
- Inspired by the need for accurate speaker-identified transcriptions

## 📞 Contact & Support

- **Issues**: [Report a bug](https://github.com/yourusername/audio-transcriber-gemini-diarization/issues)
- **Discussions**: [Ask questions](https://github.com/yourusername/audio-transcriber-gemini-diarization/discussions)
- **Pull Requests**: [Contribute code](https://github.com/yourusername/audio-transcriber-gemini-diarization/pulls)

## 🔒 Privacy & Security

- **Local processing**: All settings stored in your browser only
- **API calls**: Audio sent only to Google Gemini API
- **No tracking**: No analytics or tracking code
- **Open source**: Review all code in this repository

## 🚀 What's Next?

Planned features:
- [ ] Export to SRT/VTT subtitle formats
- [ ] Speaker color coding in UI
- [ ] Real-time audio visualization
- [ ] Multiple language support
- [ ] Keyboard shortcuts
- [ ] Dark mode

---

**Made with ❤️ for accurate transcriptions**

**Star ⭐ this repo if you find it useful!**
