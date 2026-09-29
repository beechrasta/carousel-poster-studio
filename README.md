# Carousel Poster Studio (local)

A local-first web app that turns tech/AI news into downloadable social-media
carousel posters — square 1080x1080 PNGs sized for Instagram and Threads.

## Run it

No build step, no server, no account. Just open the file:

- **Double-click `index.html`**, or
- serve it locally: `python3 -m http.server 8000` and open
  `http://localhost:8000`

Works offline except for two optional CDN loads (Google Fonts and the JSZip
library), which degrade gracefully.

## Workflow

1. Click **News → Slides**, paste news text, and generate headline/subtext
   pairs (requires the LLM to be configured, see below).
2. Or write copy manually: select a slide, edit **Headline** and **Subtext**.
3. Attach a **real image** per slide — upload a file or paste an image URL.
   (URL hosts that block cross-origin fetching will fail; upload the file
   instead. The app never generates AI images.)
4. Adjust fit (cover/contain) and the focal-point slider for crops.
5. **Download this slide as PNG**, or **Download all as ZIP**
   (`slide-01.png`, `slide-02.png`, … in deck order).

## Deck management

Add / delete / duplicate slides, drag to reorder (frame numbers like
`FRAME 01` update automatically). The header shows the slide count.

## Project files

- Autosaves to the browser's localStorage.
- **Export JSON / Import JSON** for portable project files — images are
  embedded as data URLs, so one JSON file carries everything.

## LLM copy generation (optional)

Click **LLM Settings**:

- **Ollama (local):** endpoint `http://localhost:11434`, model e.g. `llama3.1`.
  Start Ollama first (`ollama serve`).
- **OpenAI-compatible API:** endpoint base URL, model name, API key.

The **News → Slides** button only appears once an endpoint and model are set.

## Notes

- Slide design: 1080x1080, near-black `#0B0B0B`, Anton headline, Inter
  subtext, lime `#CDFF3C` frame labels. Long headlines auto-shrink and
  clamp so they never overflow the canvas.
- Image credits you enter are drawn tiny in the poster's bottom-left corner.
