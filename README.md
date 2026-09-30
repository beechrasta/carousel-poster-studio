# Carousel Poster Studio 🎨⚡

A high-performance, full-featured studio and REST API for transforming tech and AI news stories into viral, punchy **1080 &times; 1080 px** social media carousel posters (Instagram, Threads, LinkedIn, & X format).

[![Live Demo](https://img.shields.io/badge/Live%20App-posterbuilder.vercel.app-7928CA?style=flat&logo=vercel)](https://posterbuilder.vercel.app)
[![OpenAPI Spec](https://img.shields.io/badge/OpenAPI-3.1.0-6BA539?style=flat&logo=swagger)](https://posterbuilder.vercel.app/api/help)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ✨ Features

### 📐 1080 &times; 1080 px Canvas Engine
- **Near-Black Signature Dark Aesthetic**: Deep `#0B0B0B` backdrop with high-contrast `#CDFF3C` lime accents.
- **6 Premium Layout Templates**:
  1. `default` / `top-image`: Top 400px image panel with 12px rounded corners, headline, and roast subtext.
  2. `bottom-image`: Headline at the top, full-width focal image docked at the base.
  3. `overlay` / `full-bleed`: Full-canvas edge-to-edge background visual with gradient readability scrim.
  4. `split-left`: Left column visual showcase, right column punchy typography.
  5. `split-right`: Left column hook typography, right column visual showcase.
  6. `multi-grid`: Quad grid layout supporting up to 4 comparison or multi-aspect visuals per slide.
- **Dynamic Multi-Image Support**: Attach 1 to 4 images per slide with focal point cropping (Cover / Contain).
- **Zero-Overflow Typography Engine**:
  - Google Fonts **Anton** / **Archivo Black** with harmonized starting size scaling.
  - Subtext clean word-wrapping with graceful `…` ellipsis truncation on overflow.
  - Automatic strip of raw markdown formatting (e.g. `**`) for clean, pristine renders.

### 🖼️ Asset & Visual Sourcing
- **Integrated Unsplash Stock Engine**: Instant stock photo keyword search with automatic photographer credit attribution (`Photographer / Unsplash`).
- **AI Visual Synthesis**: Built-in fallback to Pollinations AI generation with transparent synthetic tagging (`Visual: AI Synthesis`).
- **Drag-and-Drop Batch Pairing**: Upload multiple images and stories simultaneously to auto-populate multi-slide carousels.

### 🏷️ Branding & Watermark Suite
- Custom watermark text or uploaded PNG brand logo.
- 9 anchor alignment positions (Top-Left, Top-Center, Top-Right, Center-Left, Center, Center-Right, Bottom-Left, Bottom-Center, Bottom-Right).
- Fine-grained controls for opacity, scale, rotation, and slide-level toggle.

### ⚡ Workflow & Productivity
- **Real-time History Timeline**: Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`) states for all canvas edits.
- **Autosave & Project Portability**: Automatic browser `localStorage` persistence with full `.json` project import/export.
- **One-Click Exporting**:
  - High-res single 1080x1080 PNG download.
  - Instant PNG copy to clipboard (paste directly into Figma, Slack, or Discord).
  - Multi-slide ZIP bundle (`slide-01.png`, `slide-02.png`, ...).
- **Access Lock**: Optional password protection for public deployments (`LOGIN_USER` / `LOGIN_PASS`) that keeps the web UI secure while leaving `/api/*` open for automated integrations.

---

## 🚀 Quick Start

### 1. Installation & Local Development

```bash
# Clone repository
git clone https://github.com/beechrasta/carousel-poster-studio.git
cd carousel-poster-studio

# Install dependencies
npm install

# Run local development server (Vite)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Environment Configuration (`.env`)

Create a `.env` file in the project root:

```ini
# Unsplash API Access Key (optional, built-in fallback provided)
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# Web UI Access Lock (optional, leave blank for open access)
LOGIN_USER=admin
LOGIN_PASS=your_secure_password
```

### 3. Run Automated Tests & Production Build

```bash
# Run Vitest unit & integration test suite
npm test

# Build production bundle
npm run build
```

---

## 🌐 Serverless REST API & Swagger UI

Carousel Poster Studio includes serverless API endpoints for rendering single posters and multi-slide decks programmatically from any external service (e.g. Meta Muse, ChatGPT GPT Actions, Python scripts, GitHub Actions, or cron jobs).

| Endpoint | Method | Description |
|---|---|---|
| `/api/help` | `GET` | Interactive Swagger UI API documentation |
| `/api/openapi.json` | `GET` | OpenAPI 3.1.0 JSON specification |
| `/api/render-poster` | `POST`, `GET` | Render a single 1080x1080 px poster (Base64 JSON or binary PNG) |
| `/api/render-deck` | `POST` | Render a multi-slide carousel deck (JSON, HTML preview, or ZIP) |
| `/api/generate-from-news` | `POST` | Convert raw news story text into an auto-styled carousel deck |

### Interactive API Explorer
Visit [`https://posterbuilder.vercel.app/api/help`](https://posterbuilder.vercel.app/api/help) to test endpoints directly in your browser.

---

## 💻 API Code Examples

### 1. Generate Single Poster (Python `requests`)

```python
import requests
import base64

url = "https://posterbuilder.vercel.app/api/render-poster"
payload = {
    "headline": "OPENAI SHIPS GPT-5",
    "subtext": "PhD-level intelligence ready to debug your code while you sleep.",
    "frameLabel": "BREAKING NEWS",
    "template": "top-image",
    "theme": "lime"
}

response = requests.post(url, json=payload)
data = response.json()

if data.get("success"):
    image_base64 = data["dataUrl"].split(",")[1]
    with open("poster.png", "wb") as f:
        f.write(base64.b64decode(image_base64))
    print("Saved poster.png successfully!")
```

### 2. Generate Multi-Slide Carousel Deck (cURL)

```bash
curl -X POST https://posterbuilder.vercel.app/api/render-deck \
  -H "Content-Type: application/json" \
  -d '{
    "slides": [
      {
        "headline": "AI WILL NOT REPLACE YOU",
        "subtext": "A human who knows how to use AI will definitely replace you though.",
        "frameLabel": "SLIDE 01"
      },
      {
        "headline": "HOW TO STAY AHEAD",
        "subtext": "Master prompt engineering, build workflows, and stop fearing the bots.",
        "frameLabel": "SLIDE 02"
      }
    ],
    "theme": "lime",
    "template": "top-image"
  }'
```

### 3. Generate Deck from Raw News Story

```bash
curl -X POST https://posterbuilder.vercel.app/api/generate-from-news \
  -H "Content-Type: application/json" \
  -d '{
    "newsText": "Anthropic announced Claude 3.7 Sonnet featuring hybrid reasoning capabilities. It combines near-instant responses with extended thinking modes for complex coding and math problems."
  }'
```

---

## 🤖 AI Copywriter System Prompt

To generate roast-style carousel copy using Meta Muse, ChatGPT, or local LLMs (Ollama / OpenCode), use the following embedded prompt:

```text
You write punchy carousel-poster copy about AI and tech news. For EACH story produce:
HEADLINE: under 10 words, bold, funny, attention-grabbing. No em dashes, no corporate jargon.
SUBTEXT: 2-4 short lines that summarize the story with a joke, roast, or witty twist.
Tone: blunt, witty, internet-native, like a smart friend roasting tech news. Punchy over polished.

Output format per story:
HEADLINE: <text>
SUBTEXT: <text>
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Left Arrow` / `Right Arrow` | Navigate previous / next slide |
| `Ctrl + Z` / `Cmd + Z` | Undo last action |
| `Ctrl + Y` / `Cmd + Y` / `Ctrl + Shift + Z` | Redo action |
| `Ctrl + D` / `Cmd + D` | Duplicate active slide |
| `Delete` / `Backspace` | Remove active slide (with confirmation) |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Vanilla CSS (Design Tokens, Dark Glassmorphism, Responsive Grid).
- **Icons**: Lucide React.
- **Canvas Rendering**: HTML5 Canvas API (Browser) & `@napi-rs/canvas` (Serverless / Node.js).
- **Stock Visuals**: Unsplash API.
- **Synthetic Fallback**: Pollinations AI.
- **Archive Generation**: JSZip.
- **Testing**: Vitest, React Testing Library, JSDOM.
- **Deployment**: Vercel Serverless Functions.

---

## 📄 License

MIT License © 2026 Beech Rasta. Built for creators, developers, and tech curators.
