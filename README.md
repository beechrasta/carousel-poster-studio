# Carousel Poster Studio 🎨⚡

A high-performance, local-first studio for converting tech and AI news stories into square **1080 &times; 1080 px** social media carousel posters (Instagram & Threads format).

---

## ✨ Features

- **Exact Design Spec (1080 &times; 1080 px)**:
  - **Near-Black Background**: `#0B0B0B`.
  - **Top Image Panel**: 400px height with 12px rounded corners, Cover fit crop with vertical focal-point slider or Contain fit mode.
  - **Frame Label & Rule**: `#CDFF3C` Lime accent, `FRAME 01` letter-spaced monospace font with 60px &times; 4px underline rule.
  - **Heavy Grotesque Headline**: Google Fonts **Anton** or **Archivo Black**, pure white `#FFFFFF`, tight line-height, with intelligent auto-shrink algorithm to guarantee zero canvas overflow.
  - **Roast / Subtext**: Google Fonts **Inter**, `#D8D8D8`, comfortable 1.35 line height.
  - **70px Margins**: Crisp safe padding on all borders.

- **⚡ All-At-Once Batch Deck Builder**:
  - Paste multiple news stories and drag-and-drop multiple image files all at once.
  - Auto-pairs Image 1 &rarr; Slide 1, Image 2 &rarr; Slide 2, etc.
  - Direct structured copy parser (`HEADLINE: ...`, `SUBTEXT: ...`, `IMAGE: ...`, `CREDIT: ...`).

- **🤖 3 LLM / Copy Generation Modes**:
  1. **Opencode CLI (Local)**: Automatically bridges with your local `opencode` installation using your existing credentials.
  2. **Direct API (OpenAI-compatible)**: Connect to OpenAI (`https://api.openai.com/v1`), OpenRouter, Groq, DeepSeek, or any compatible endpoint with custom API key and model name.
  3. **Ollama (Local)**: Direct connection to `http://localhost:11434` with model selector (`llama3.2`, `mistral`, etc.).

- **💾 Project Persistence & Export**:
  - **Autosave**: Real-time debounce saving to browser `localStorage`.
  - **JSON Project Export/Import**: Full portable project `.json` with embedded data URLs.
  - **PNG Export**: Single-click 1080x1080 PNG download.
  - **Copy PNG to Clipboard**: Instant pasting into Discord, Figma, or Slack.
  - **ZIP Archive Export**: Bundles `slide-01.png`, `slide-02.png`, ... in deck order using JSZip.

---

## 🚀 Getting Started

### 1. Run Development Server
```bash
npm install
npm run dev
```
Open **`http://localhost:3000`** (or `http://localhost:3001`).

### 2. Build Production Bundle
```bash
npm run build
```

---

## 📋 Copywriter System Prompt (Embedded Verbatim)

```text
You write carousel-poster copy about AI and tech news. For EACH story produce exactly:
HEADLINE: under 10 words, bold, funny, attention-grabbing. No em dashes, no corporate speak.
SUBTEXT: 2-4 short lines that summarize the story with a joke, roast, or witty twist.
Tone: blunt, witty, internet-native, like a smart friend roasting tech news. Punchy over polished.
Output format per story:
HEADLINE: <text>
SUBTEXT: <text>
```

---

## ⌨️ Keyboard Shortcuts

- `Left Arrow` / `Right Arrow`: Navigate previous / next slide.
- `Ctrl + D` / `Cmd + D`: Duplicate active slide.
