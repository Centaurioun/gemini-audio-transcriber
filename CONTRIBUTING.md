# Contributing to Audio Transcriber with Speaker Diarization

Thank you for considering contributing to this project! This document provides guidelines and instructions for contributing.

## 📜 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please:
- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/yourusername/audio-transcriber-gemini-diarization.git
   cd audio-transcriber-gemini-diarization
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 💻 Development Workflow

### 1. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Keep functions small and focused

### 2. Test Your Changes

**Manual testing:**
```bash
npm run dev
```

Test these scenarios:
- Upload various audio formats (MP3, WAV, M4A)
- Test with 1, 2, 3+ speakers
- Test vocabulary hints
- Test FileLogger output (verify 5 files download)
- Test error cases (no API key, large files, etc.)

**Build test:**
```bash
npm run build
npm run preview
```

**TypeScript check:**
```bash
npx tsc --noEmit
```

### 3. Commit Your Changes

Use clear, descriptive commit messages:

```bash
git add .
git commit -m "Add feature: speaker color coding in transcription output"
```

**Good commit message format:**
```
<type>: <short description>

<optional detailed description>

<optional breaking changes>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Formatting, missing semicolons, etc.
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance tasks

**Examples:**
```bash
git commit -m "feat: add SRT subtitle export functionality"
git commit -m "fix: speaker identification fails with 3+ speakers"
git commit -m "docs: add troubleshooting section for API errors"
```

### 4. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 5. Create a Pull Request

1. Go to the original repository
2. Click "New Pull Request"
3. Select your feature branch
4. Fill out the PR template (see below)

## 📝 Pull Request Guidelines

### PR Title Format

Use the same format as commit messages:
```
feat: Add speaker color coding
fix: Resolve vocabulary hint parsing error
docs: Update installation instructions
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
Describe how you tested these changes:
- Test case 1
- Test case 2

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tested locally
- [ ] Build succeeds
```

## 🎨 Code Style Guidelines

### TypeScript/JavaScript

**Naming conventions:**
```typescript
// Classes: PascalCase
class FileLogger { }

// Functions/variables: camelCase
const transcribeAudio = () => { }
let speakerCount = 2;

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Interfaces: PascalCase with 'I' prefix (optional)
interface ISpeakerHint {
  characteristics: string;
  displayName: string;
}
```

**Formatting:**
- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Max line length: 100 characters (soft limit)
- Use template literals for string interpolation

**Example:**
```typescript
// Good
const message = `Processing ${speakerCount} speakers`;

// Avoid
const message = "Processing " + speakerCount + " speakers";
```

### Comments

Add comments for:
- Complex algorithms
- Non-obvious logic
- API interactions
- Workarounds

```typescript
// Good: Explains why, not just what
// FileLogger must download files sequentially to avoid browser
// blocking multiple simultaneous downloads from localhost
for (const file of files) {
  await downloadFile(file);
}

// Avoid: States the obvious
// Loop through files
for (const file of files) {
  await downloadFile(file);
}
```

### File Organization

```typescript
// 1. Imports
import React from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 2. Interfaces/Types
interface TranscriptionSettings { }

// 3. Constants
const MAX_RETRIES = 3;

// 4. Helper functions
function parseResponse(text: string) { }

// 5. Main component/class
export default function App() { }
```

## 🐛 Reporting Bugs

### Before Submitting

1. Check [existing issues](https://github.com/yourusername/audio-transcriber-gemini-diarization/issues)
2. Test on the latest version
3. Check the [Troubleshooting](README.md#troubleshooting) section

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Screenshots**
If applicable

**Environment:**
- OS: [e.g., macOS 13.0]
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., 20.0.0]

**Additional Context**
Any other relevant information
```

## ✨ Feature Requests

### Feature Request Template

```markdown
**Problem**
Describe the problem this feature would solve

**Proposed Solution**
Describe your proposed solution

**Alternatives Considered**
Other solutions you've thought about

**Additional Context**
Mockups, examples, etc.
```

## 🧪 Testing Checklist

Before submitting a PR, verify:

- [ ] **Basic functionality**
  - [ ] Audio file uploads successfully
  - [ ] Transcription completes without errors
  - [ ] Results display correctly

- [ ] **Speaker diarization**
  - [ ] Auto-detect mode works
  - [ ] Manual mode with 2 speakers works
  - [ ] Manual mode with 3+ speakers works
  - [ ] Speaker hints applied correctly

- [ ] **Vocabulary hints**
  - [ ] Single-line hints work
  - [ ] Multi-line hints work
  - [ ] Special characters handled

- [ ] **FileLogger**
  - [ ] 5 files download automatically
  - [ ] Files contain expected content
  - [ ] Filenames follow naming convention

- [ ] **Settings persistence**
  - [ ] Settings saved to localStorage
  - [ ] Settings restored on page reload

- [ ] **Build**
  - [ ] `npm run build` succeeds
  - [ ] No TypeScript errors (or documented)
  - [ ] Production build works (`npm run preview`)

## 📚 Documentation Guidelines

### README Updates

Update README.md when:
- Adding new features
- Changing installation process
- Modifying configuration options
- Adding troubleshooting steps

### Code Documentation

Add JSDoc comments for:
- Public functions/methods
- Complex algorithms
- Classes

**Example:**
```typescript
/**
 * Downloads a file with the specified content and filename
 * @param content - The text content to download
 * @param filename - The name of the file to create
 * @param mimeType - MIME type (default: 'text/plain')
 */
function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  // Implementation
}
```

## 🔄 Release Process

**Maintainers only:**

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag -a v1.1.0 -m "Release v1.1.0"`
4. Push tag: `git push origin v1.1.0`
5. Create GitHub release with notes

## 🤝 Getting Help

- **Questions:** Use [GitHub Discussions](https://github.com/yourusername/audio-transcriber-gemini-diarization/discussions)
- **Bugs:** Create an [Issue](https://github.com/yourusername/audio-transcriber-gemini-diarization/issues)
- **Security:** Email maintainer directly (see README)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing! 🎉**
