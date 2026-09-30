import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Bot, 
  Copy, 
  Check, 
  Globe, 
  FileCode, 
  Play, 
  ExternalLink,
  Sparkles,
  Zap,
  Download,
  Code
} from 'lucide-react';

export default function ApiConnectorModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('chatgpt'); // 'chatgpt' | 'vercel' | 'tester' | 'snippets'
  const [vercelDomain, setVercelDomain] = useState(
    typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? window.location.origin
      : 'https://carousel-poster-studio.vercel.app'
  );
  const [copiedKey, setCopiedKey] = useState('');
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    headline: "OPENAI REVEALS GPT-5",
    subtext: "Claims AGI is here. Still cannot count letters in strawberry.",
    theme: "dark_lime",
    template: "classic_studio",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
    credit: "TechCrunch"
  }, null, 2));
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const openApiUrl = `${vercelDomain.replace(/\/$/, '')}/api/openapi.json`;
  const privacyUrl = `${vercelDomain.replace(/\/$/, '')}/privacy`;
  const singlePosterEndpoint = `${vercelDomain.replace(/\/$/, '')}/api/render-poster`;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const handleRunTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    try {
      const parsed = JSON.parse(testPayload);
      const res = await fetch('/api/render-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const parsed = JSON.parse(text);
        setTestPayload(JSON.stringify(parsed, null, 2));
      } catch (err) {
        alert('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const customGptInstructions = `You are an elite Tech & AI Carousel Poster copywriter and designer.
When a user asks for social media posters or tech carousels:
1. Write punchy headlines (under 10 words, bold, funny, no corporate speak).
2. Write roast subtexts (2-4 lines summarizing the news with wit/roast).
3. Call the action 'renderSinglePoster' or 'renderCarouselDeck' with the generated copy, selected theme (dark_lime, neon_cyber, clean_light, midnight_slate), and template (classic_studio, headline_first, hero_fullbleed).
4. Display the rendered poster image in your response so the user can immediately preview and save it.`;

  const curlSnippet = `curl -X POST "${singlePosterEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "headline": "OPENAI LAUNCHES GPT-5",
    "subtext": "Claims AGI is achieved. Still struggles with strawberry.",
    "theme": "dark_lime",
    "template": "classic_studio",
    "image": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"
  }'`;

  const pythonSnippet = `import requests

url = "${singlePosterEndpoint}"
payload = {
    "headline": "OPENAI LAUNCHES GPT-5",
    "subtext": "Claims AGI is achieved. Still struggles with counting letters.",
    "theme": "dark_lime",
    "template": "classic_studio",
    "image": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"
}

response = requests.post(url, json=payload)
data = response.json()
print("Generated image data URL:", data["image"][:50] + "...")`;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: 880, width: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(205, 255, 60, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} style={{ color: 'var(--accent-lime, #CDFF3C)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>API &amp; ChatGPT Connector</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Connect ChatGPT Actions, deploy to Vercel, and automate poster creation</p>
            </div>
          </div>
          <button className="btn btn-icon-subtle" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Vercel Domain Bar */}
        <div style={{ padding: '12px 16px', background: 'var(--bg-card, #141414)', borderRadius: 8, margin: '14px 0 10px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border-color)' }}>
          <Globe size={16} style={{ color: 'var(--accent-lime, #CDFF3C)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>YOUR DEPLOYED VERCEL DOMAIN:</label>
            <input 
              type="text" 
              value={vercelDomain} 
              onChange={(e) => setVercelDomain(e.target.value)}
              placeholder="https://your-poster-studio.vercel.app"
              style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFF', fontSize: 13, fontWeight: 600, outline: 'none' }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 8, marginBottom: 16 }}>
          <button 
            className={`btn btn-sm ${activeTab === 'chatgpt' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('chatgpt')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Bot size={14} />
            <span>ChatGPT Connector</span>
          </button>
          <button 
            className={`btn btn-sm ${activeTab === 'vercel' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('vercel')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Globe size={14} />
            <span>Deploy to Vercel</span>
          </button>
          <button 
            className={`btn btn-sm ${activeTab === 'tester' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('tester')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Play size={14} />
            <span>API Tester &amp; File Drop</span>
          </button>
          <button 
            className={`btn btn-sm ${activeTab === 'snippets' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('snippets')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Code size={14} />
            <span>cURL &amp; Python</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {/* TAB 1: CHATGPT CONNECTOR */}
          {activeTab === 'chatgpt' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 14, background: 'rgba(205, 255, 60, 0.05)', border: '1px solid rgba(205, 255, 60, 0.2)', borderRadius: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: 'var(--accent-lime, #CDFF3C)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} /> How to connect ChatGPT to your deployed site:
                </h3>
                <ol style={{ fontSize: 13, color: '#D0D0D0', margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
                  <li>Go to <strong>ChatGPT</strong> &rarr; Click <strong>Explore GPTs</strong> &rarr; Click <strong>+ Create</strong>.</li>
                  <li>Click the <strong>Configure</strong> tab &rarr; Scroll down to <strong>Actions</strong> &rarr; Click <strong>Create new action</strong>.</li>
                  <li>Click <strong>Import from URL</strong> and paste your OpenAPI URL below.</li>
                  <li>Paste the Privacy Policy URL below into the Privacy Policy field.</li>
                  <li>Done! ChatGPT can now write news copy and render posters automatically!</li>
                </ol>
              </div>

              {/* Action Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>1. OpenAPI Schema URL (for ChatGPT Import):</span>
                    <button 
                      className="btn btn-xs btn-secondary"
                      onClick={() => copyToClipboard(openApiUrl, 'openapi')}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {copiedKey === 'openapi' ? <Check size={12} className="text-lime" /> : <Copy size={12} />}
                      <span>{copiedKey === 'openapi' ? 'Copied!' : 'Copy URL'}</span>
                    </button>
                  </div>
                  <div style={{ padding: '8px 12px', background: '#090909', border: '1px solid var(--border-color)', borderRadius: 6, fontFamily: 'monospace', fontSize: 12, color: '#A0FFA0', wordBreak: 'break-all' }}>
                    {openApiUrl}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>2. Privacy Policy URL:</span>
                    <button 
                      className="btn btn-xs btn-secondary"
                      onClick={() => copyToClipboard(privacyUrl, 'privacy')}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {copiedKey === 'privacy' ? <Check size={12} className="text-lime" /> : <Copy size={12} />}
                      <span>{copiedKey === 'privacy' ? 'Copied!' : 'Copy URL'}</span>
                    </button>
                  </div>
                  <div style={{ padding: '8px 12px', background: '#090909', border: '1px solid var(--border-color)', borderRadius: 6, fontFamily: 'monospace', fontSize: 12, color: '#A0FFA0', wordBreak: 'break-all' }}>
                    {privacyUrl}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>3. Recommended Custom GPT System Instructions:</span>
                    <button 
                      className="btn btn-xs btn-secondary"
                      onClick={() => copyToClipboard(customGptInstructions, 'instructions')}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {copiedKey === 'instructions' ? <Check size={12} className="text-lime" /> : <Copy size={12} />}
                      <span>{copiedKey === 'instructions' ? 'Copied!' : 'Copy Instructions'}</span>
                    </button>
                  </div>
                  <pre style={{ padding: 12, background: '#090909', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 12, color: '#DDD', whiteSpace: 'pre-wrap', maxHeight: 140, overflowY: 'auto', margin: 0 }}>
                    {customGptInstructions}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEPLOY TO VERCEL */}
          {activeTab === 'vercel' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 14, background: 'var(--bg-card, #141414)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Deploy to Vercel in 2 Minutes</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px' }}>
                  This repository is already fully configured with <code>vercel.json</code>, Node.js serverless functions in <code>api/</code>, and pre-bundled Google Fonts!
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ padding: 10, background: '#0A0A0A', borderRadius: 6, border: '1px solid #222' }}>
                    <div style={{ fontSize: 12, color: 'var(--accent-lime, #CDFF3C)', fontWeight: 600, marginBottom: 4 }}>Option A: Deploy via Vercel CLI</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <code style={{ fontSize: 13, color: '#FFF' }}>npx vercel --prod</code>
                      <button className="btn btn-xs btn-secondary" onClick={() => copyToClipboard('npx vercel --prod', 'cli')}>
                        {copiedKey === 'cli' ? <Check size={12} className="text-lime" /> : <Copy size={12} />}
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: 10, background: '#0A0A0A', borderRadius: 6, border: '1px solid #222' }}>
                    <div style={{ fontSize: 12, color: 'var(--accent-lime, #CDFF3C)', fontWeight: 600, marginBottom: 4 }}>Option B: Deploy via GitHub</div>
                    <p style={{ fontSize: 12, color: '#AAA', margin: 0 }}>
                      Push this project to a GitHub repository, go to <a href="https://vercel.com/new" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-lime, #CDFF3C)' }}>vercel.com/new</a>, import your repo, and click <strong>Deploy</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TESTER & FILE DROP */}
          {activeTab === 'tester' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Test Payload (JSON Config):</span>
                <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FileCode size={12} />
                  <span>Attach/Drop File (.json)</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>

              <textarea
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                style={{
                  width: '100%',
                  height: 160,
                  background: '#090909',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  color: '#A0FFA0',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  padding: 10,
                  resize: 'vertical'
                }}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  className="btn btn-primary"
                  onClick={handleRunTest}
                  disabled={isLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Play size={14} />
                  <span>{isLoading ? 'Rendering...' : 'Execute Test Render'}</span>
                </button>
              </div>

              {testResult && (
                <div style={{ marginTop: 10, padding: 12, background: 'var(--bg-card, #141414)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                  {testResult.error ? (
                    <div style={{ color: '#FF5555', fontSize: 13 }}>
                      <strong>Error:</strong> {testResult.error}
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-lime, #CDFF3C)' }}>✨ Render Successful! (1080 &times; 1080 px)</span>
                        <a 
                          href={testResult.image} 
                          download="api-test-poster.png" 
                          className="btn btn-xs btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Download size={12} />
                          <span>Download PNG</span>
                        </a>
                      </div>
                      <div style={{ textAlign: 'center', background: '#000', padding: 10, borderRadius: 6 }}>
                        <img 
                          src={testResult.image} 
                          alt="Rendered Poster" 
                          style={{ maxHeight: 240, maxWidth: '100%', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CODE SNIPPETS */}
          {activeTab === 'snippets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>cURL Request:</span>
                  <button className="btn btn-xs btn-secondary" onClick={() => copyToClipboard(curlSnippet, 'curl')}>
                    {copiedKey === 'curl' ? <Check size={12} className="text-lime" /> : <Copy size={12} />}
                    <span>Copy cURL</span>
                  </button>
                </div>
                <pre style={{ padding: 10, background: '#090909', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 12, color: '#A0FFA0', overflowX: 'auto', margin: 0 }}>
                  {curlSnippet}
                </pre>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Python (Requests):</span>
                  <button className="btn btn-xs btn-secondary" onClick={() => copyToClipboard(pythonSnippet, 'python')}>
                    {copiedKey === 'python' ? <Check size={12} className="text-lime" /> : <Copy size={12} />}
                    <span>Copy Python</span>
                  </button>
                </div>
                <pre style={{ padding: 10, background: '#090909', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 12, color: '#A0FFA0', overflowX: 'auto', margin: 0 }}>
                  {pythonSnippet}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
