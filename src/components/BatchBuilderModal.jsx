import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  X, 
  Upload, 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  Check, 
  Plus, 
  Trash2, 
  ArrowRight,
  AlertTriangle,
  Layers,
  Minimize2,
  Terminal,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { extractStoriesHeuristic, sanitizeNewsText } from '../utils/apiServices';
import { fileToDataURL, urlToDataURL } from '../utils/exportEngine';

export default function BatchBuilderModal({
  isOpen,
  onClose,
  onBuildDeck,
  settings,
  showToast,
  aiTask,
  onStartAITask,
  onCancelAITask,
  onClearAITask
}) {
  const [activeTab, setActiveTab] = useState('storiesAndImages'); // 'storiesAndImages' | 'structured'
  const [newsText, setNewsText] = useState('');
  const [structuredText, setStructuredText] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]); // Array of { id, dataUrl, name, url }
  const [urlBatchInput, setUrlBatchInput] = useState('');
  const [isUrlProcessing, setIsUrlProcessing] = useState(false);
  const [parsedCards, setParsedCards] = useState([]); // Array of { headline, subtext, image, credit }
  const [showLogs, setShowLogs] = useState(false);

  // Sync state if aiTask completes with results for batch_builder
  useEffect(() => {
    if (aiTask && aiTask.type === 'batch_builder' && aiTask.status === 'completed' && aiTask.results?.length) {
      setParsedCards(aiTask.results);
    }
  }, [aiTask]);

  if (!isOpen) return null;

  const isTaskRunning = aiTask?.status === 'running' && aiTask?.type === 'batch_builder';
  const isTaskError = aiTask?.status === 'error' && aiTask?.type === 'batch_builder';

  // Handle uploading multiple image files at once
  const handleMultiFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newImgs = [];
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          const dataUrl = await fileToDataURL(file);
          newImgs.push({
            id: Math.random().toString(36).slice(2, 9),
            dataUrl,
            name: file.name
          });
        } catch (err) {
          console.warn('Failed to read file ' + file.name, err);
        }
      }
    }

    setUploadedImages((prev) => [...prev, ...newImgs]);
    showToast(`Added ${newImgs.length} images to the batch pool.`);
    e.target.value = '';
  };

  // Handle batch URL addition (one per line)
  const handleAddBatchUrls = async () => {
    const lines = urlBatchInput.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
    if (!lines.length) {
      showToast('Please paste at least one valid image URL (http/https).');
      return;
    }

    setIsUrlProcessing(true);
    let count = 0;
    const newImgs = [];

    for (const url of lines) {
      try {
        const dataUrl = await urlToDataURL(url);
        newImgs.push({
          id: Math.random().toString(36).slice(2, 9),
          dataUrl,
          name: url.split('/').pop() || 'Remote Image'
        });
        count++;
      } catch (err) {
        console.warn('Failed fetching URL ' + url, err);
      }
    }

    setUploadedImages(prev => [...prev, ...newImgs]);
    setUrlBatchInput('');
    setIsUrlProcessing(false);
    showToast(`Successfully embedded ${count} of ${lines.length} images.`);
  };

  // Trigger Background AI Processing Task
  const handleProcessStories = () => {
    if (!newsText.trim()) {
      showToast('Please paste at least one news story.');
      return;
    }

    onStartAITask({
      type: 'batch_builder',
      newsInput: newsText,
      uploadedImages: uploadedImages,
      settings: settings
    });
  };

  // Instant local heuristic parser without AI
  const handleInstantFallback = () => {
    const textToParse = newsText || aiTask?.newsInput || '';
    if (!textToParse.trim()) {
      showToast('No text available to parse.');
      return;
    }

    const stories = extractStoriesHeuristic(textToParse);
    if (!stories.length) {
      showToast('Could not extract stories from the text.');
      return;
    }

    const combined = stories.map((s, idx) => ({
      headline: s.headline,
      subtext: s.subtext,
      image: uploadedImages[idx]?.dataUrl || null,
      fit: 'cover',
      focal: 50,
      credit: s.credit || ''
    }));

    setParsedCards(combined);
    if (onClearAITask) onClearAITask();
    showToast(`⚡ Extracted ${combined.length} slides instantly with local parser!`);
  };

  // Parse structured text (HEADLINE / SUBTEXT / IMAGE / CREDIT)
  const handleProcessStructured = async () => {
    if (!structuredText.trim()) {
      showToast('Please paste structured text.');
      return;
    }

    try {
      const blocks = structuredText.split(/(?=(?:HEADLINE:|--- Slide|\bStory \d+:))/i).filter(b => b.trim());
      const results = [];

      for (const block of blocks) {
        const headMatch = block.match(/HEADLINE:\s*(.+?)(?=(?:SUBTEXT:|IMAGE:|CREDIT:|$))/is);
        const subMatch = block.match(/SUBTEXT:\s*(.+?)(?=(?:IMAGE:|CREDIT:|HEADLINE:|$))/is);
        const imgMatch = block.match(/IMAGE:\s*(.+?)(?=(?:CREDIT:|HEADLINE:|SUBTEXT:|$))/is);
        const creditMatch = block.match(/CREDIT:\s*(.+?)(?=(?:IMAGE:|HEADLINE:|SUBTEXT:|$))/is);

        const headline = headMatch ? headMatch[1].trim().replace(/^["']|["']$/g, '') : '';
        const subtext = subMatch ? subMatch[1].trim().replace(/^["']|["']$/g, '') : '';
        let imageUrl = imgMatch ? imgMatch[1].trim() : null;
        const credit = creditMatch ? creditMatch[1].trim() : '';

        let dataUrl = null;
        if (imageUrl && imageUrl.startsWith('http')) {
          try {
            dataUrl = await urlToDataURL(imageUrl);
          } catch (e) {
            dataUrl = imageUrl;
          }
        } else if (imageUrl && imageUrl.startsWith('data:')) {
          dataUrl = imageUrl;
        }

        if (headline || subtext) {
          results.push({
            headline: headline || 'Untitled Slide',
            subtext: subtext || '',
            image: dataUrl,
            fit: 'cover',
            focal: 50,
            credit: credit || ''
          });
        }
      }

      if (!results.length) {
        const heuristic = extractStoriesHeuristic(structuredText);
        heuristic.forEach((p, idx) => {
          results.push({
            headline: p.headline,
            subtext: p.subtext,
            image: uploadedImages[idx]?.dataUrl || null,
            fit: 'cover',
            focal: 50,
            credit: p.credit || ''
          });
        });
      }

      setParsedCards(results);
      showToast(`Parsed ${results.length} slides.`);
    } catch (err) {
      showToast('Parsing failed: ' + err.message);
    }
  };

  // Final confirmation to replace or append to current deck
  const handleFinalBuild = (mode = 'replace') => {
    if (!parsedCards.length) {
      showToast('No slides ready to build.');
      return;
    }
    onBuildDeck(parsedCards, mode);
    if (onClearAITask) onClearAITask();
    onClose();
  };

  const formatTimer = (secs) => {
    const m = Math.floor((secs || 0) / 60);
    const s = (secs || 0) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container batch-builder-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-badge-icon">
              <Zap size={18} className="text-lime" />
            </div>
            <div>
              <h2 className="modal-title">All-At-Once Deck Builder</h2>
              <p className="modal-subtitle">Paste news stories and attach real photos to generate an instant carousel.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isTaskRunning && (
              <button 
                className="btn btn-secondary btn-xs flex items-center gap-1.5"
                onClick={onClose}
                title="Keep running in background and return to studio"
              >
                <Minimize2 size={12} />
                <span>Run in Background</span>
              </button>
            )}
            <button className="btn-close-modal" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="modal-tabs">
          <button 
            className={`modal-tab ${activeTab === 'storiesAndImages' ? 'active' : ''}`}
            onClick={() => setActiveTab('storiesAndImages')}
          >
            <Sparkles size={14} />
            <span>AI Copywriter + Batch Image Matcher</span>
          </button>
          <button 
            className={`modal-tab ${activeTab === 'structured' ? 'active' : ''}`}
            onClick={() => setActiveTab('structured')}
          >
            <FileText size={14} />
            <span>Direct Structured Copy + Links</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body space-y-4">
          {/* ACTIVE AI BACKGROUND TASK ANIMATED STATUS PANEL */}
          {isTaskRunning && (
            <div className="ai-live-pipeline-card">
              <div className="pipeline-header-row">
                <div className="flex items-center gap-2">
                  <div className="pulse-beacon">
                    <span className="pulse-dot"></span>
                    <span className="pulse-ring"></span>
                  </div>
                  <div>
                    <h3 className="pipeline-title">AI Copywriting Engine Active</h3>
                    <p className="pipeline-subtitle">
                      Model: <strong>{aiTask.provider === 'opencode' ? (aiTask.model || 'Opencode Default') : aiTask.provider}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="pipeline-timer-badge">
                    <Clock size={12} />
                    <span>{formatTimer(aiTask.elapsedSeconds)}</span>
                  </span>
                  <button 
                    className="btn btn-danger btn-xs"
                    onClick={onCancelAITask}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Glowing Waveform Animation */}
              <div className="ai-waveform-container">
                <div className="ai-waveform-bar" style={{ animationDelay: '0.1s' }}></div>
                <div className="ai-waveform-bar" style={{ animationDelay: '0.3s' }}></div>
                <div className="ai-waveform-bar" style={{ animationDelay: '0.2s' }}></div>
                <div className="ai-waveform-bar" style={{ animationDelay: '0.4s' }}></div>
                <div className="ai-waveform-bar" style={{ animationDelay: '0.25s' }}></div>
                <div className="ai-waveform-bar" style={{ animationDelay: '0.5s' }}></div>
                <div className="ai-waveform-bar" style={{ animationDelay: '0.15s' }}></div>
                <div className="ai-waveform-bar" style={{ animationDelay: '0.35s' }}></div>
                <div className="ai-waveform-bar" style={{ animationDelay: '0.45s' }}></div>
              </div>

              {/* 4-Step Interactive Pipeline Progress */}
              <div className="pipeline-steps-grid">
                <div className={`pipeline-step-item ${(aiTask.step || 1) >= 1 ? 'active' : ''} ${(aiTask.step || 1) > 1 ? 'completed' : ''}`}>
                  <div className="step-num">1</div>
                  <div className="step-text">
                    <div className="step-label">Ingest &amp; Sanitize</div>
                    <div className="step-hint">Extract raw stories &amp; URLs</div>
                  </div>
                </div>

                <div className={`pipeline-step-item ${(aiTask.step || 1) >= 2 ? 'active' : ''} ${(aiTask.step || 1) > 2 ? 'completed' : ''}`}>
                  <div className="step-num">2</div>
                  <div className="step-text">
                    <div className="step-label">Connect Engine</div>
                    <div className="step-hint">{aiTask.provider}</div>
                  </div>
                </div>

                <div className={`pipeline-step-item ${(aiTask.step || 1) >= 3 ? 'active' : ''} ${(aiTask.step || 1) > 3 ? 'completed' : ''}`}>
                  <div className="step-num">3</div>
                  <div className="step-text">
                    <div className="step-label">Generate Viral Copy</div>
                    <div className="step-hint">Roast tone, &lt;10w headline</div>
                  </div>
                </div>

                <div className={`pipeline-step-item ${(aiTask.step || 1) >= 4 ? 'active' : ''} ${(aiTask.step || 1) > 4 ? 'completed' : ''}`}>
                  <div className="step-num">4</div>
                  <div className="step-text">
                    <div className="step-label">Match Images</div>
                    <div className="step-hint">Bind uploaded photos</div>
                  </div>
                </div>
              </div>

              {/* Real-time Status and Terminal Log Toggle */}
              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-muted flex items-center gap-1.5">
                  <RefreshCw size={12} className="animate-spin text-lime" />
                  <span>{aiTask.stepLabel || 'Processing news stories...'}</span>
                </span>

                <button 
                  className="text-muted hover:text-pure flex items-center gap-1 underline"
                  onClick={() => setShowLogs(!showLogs)}
                >
                  <Terminal size={12} />
                  <span>{showLogs ? 'Hide Live Logs' : 'View Live Logs'}</span>
                  {showLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>

              {/* Terminal Logs View */}
              {showLogs && (
                <div className="ai-terminal-log-box">
                  {aiTask.logs && aiTask.logs.length > 0 ? (
                    aiTask.logs.map((log, idx) => (
                      <div key={idx} className="terminal-log-line">
                        <span className="text-muted">➔</span> {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted text-center py-1">Initializing AI communication stream...</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI Task Error Fallback Notification */}
          {isTaskError && (
            <div className="ai-error-banner">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">AI Generation Encountered an Error</h4>
                  <p className="text-xs text-muted">
                    {aiTask.error || 'The chosen model returned an upstream error or timeout.'}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button 
                      className="btn btn-primary btn-xs flex items-center gap-1"
                      onClick={handleInstantFallback}
                    >
                      <Zap size={12} />
                      <span>⚡ Instant Local Fallback Parser (Auto-Extract All Stories)</span>
                    </button>
                    <button 
                      className="btn btn-secondary btn-xs"
                      onClick={onClearAITask}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Tab Content */}
          {activeTab === 'storiesAndImages' ? (
            <div className="batch-grid-layout">
              {/* Left Column: News Stories Input */}
              <div className="batch-input-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="input-label font-semibold">
                    1. Paste News Story / Stories
                  </label>
                  <span className="text-xs text-muted">
                    Engine: <strong className="text-pure">{settings.provider}</strong>
                  </span>
                </div>
                <textarea 
                  rows={8}
                  className="text-area batch-text-area"
                  placeholder="Paste multi-section news stories (World, Tech, Politics, etc.). AI will generate punchy headlines & funny subtexts..."
                  value={newsText}
                  onChange={(e) => setNewsText(e.target.value)}
                  disabled={isTaskRunning}
                />

                <div className="batch-action-row flex gap-2">
                  <button 
                    className="btn btn-primary btn-generate-hero flex-1"
                    onClick={handleProcessStories}
                    disabled={isTaskRunning || !newsText.trim()}
                  >
                    <Sparkles size={15} />
                    <span>{isTaskRunning ? 'AI Working in Background...' : 'Generate Copy & Match Images'}</span>
                  </button>

                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={handleInstantFallback}
                    disabled={!newsText.trim()}
                    title="Extract slides instantly using local rule parser without waiting for AI"
                  >
                    <Zap size={14} className="text-lime" />
                    <span>Instant Local Parser</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Image Pool */}
              <div className="batch-image-col">
                <label className="input-label font-semibold">
                  2. Attach Real Images ({uploadedImages.length} ready)
                </label>

                {/* Drop Zone */}
                <label className="batch-drop-zone">
                  <Upload size={20} className="text-lime" />
                  <span className="text-sm font-medium">Drop multiple image files at once</span>
                  <span className="text-xs text-muted">Auto-paired to slide 1, slide 2, etc.</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleMultiFileUpload} 
                    style={{ display: 'none' }} 
                  />
                </label>

                {/* Or paste URLs */}
                <div className="batch-url-box">
                  <span className="text-xs text-muted mb-1 block">Or paste image URLs (one per line):</span>
                  <div className="flex gap-2">
                    <textarea 
                      rows={2}
                      className="text-area text-xs"
                      placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
                      value={urlBatchInput}
                      onChange={(e) => setUrlBatchInput(e.target.value)}
                    />
                    <button 
                      className="btn btn-secondary btn-sm h-auto"
                      onClick={handleAddBatchUrls}
                      disabled={isUrlProcessing || !urlBatchInput.trim()}
                    >
                      {isUrlProcessing ? <RefreshCw size={12} className="animate-spin" /> : 'Fetch'}
                    </button>
                  </div>
                </div>

                {/* Image Pool Preview */}
                {uploadedImages.length > 0 && (
                  <div className="batch-thumb-strip">
                    {uploadedImages.map((img, i) => (
                      <div key={img.id} className="batch-thumb-item">
                        <img src={img.dataUrl} alt={img.name} className="batch-thumb-img" />
                        <span className="batch-thumb-num">#{i + 1}</span>
                        <button 
                          className="batch-thumb-del"
                          onClick={() => setUploadedImages(prev => prev.filter(x => x.id !== img.id))}
                          title="Remove"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Structured Tab */
            <div className="structured-input-container">
              <label className="input-label font-semibold">
                Paste Formatted Carousel Content
              </label>
              <textarea 
                rows={10}
                className="text-area font-mono text-sm"
                placeholder={`HEADLINE: OpenAI just killed its own model before launch\nSUBTEXT: GPT-6.1 'Astra' got scrapped for being too deceptive in testing.\nIMAGE: https://images.unsplash.com/photo-example.jpg\nCREDIT: Photo: OpenAI\n\nHEADLINE: Nvidia wants to be the seatbelt of the AI world\nSUBTEXT: New Open Agent Safety Platform, 100+ companies signed on.\nIMAGE: https://images.unsplash.com/photo-example2.jpg\nCREDIT: Photo: Nvidia`}
                value={structuredText}
                onChange={(e) => setStructuredText(e.target.value)}
              />
              <div className="mt-3 flex justify-end">
                <button 
                  className="btn btn-primary"
                  onClick={handleProcessStructured}
                  disabled={!structuredText.trim()}
                >
                  <Sparkles size={15} />
                  <span>Parse Slides &amp; Images</span>
                </button>
              </div>
            </div>
          )}

          {/* Review Parsed Cards Section */}
          {parsedCards.length > 0 && (
            <div className="parsed-review-section">
              <div className="review-header flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-accent uppercase tracking-wider">
                    Ready to Build ({parsedCards.length} Slides)
                  </h3>
                  <span className="text-xs text-muted">Review, edit, or adjust before adding to your deck</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    className="btn btn-secondary btn-xs"
                    onClick={() => setParsedCards([])}
                  >
                    Clear Results
                  </button>
                </div>
              </div>

              <div className="parsed-cards-grid">
                {parsedCards.map((card, i) => (
                  <div key={i} className="parsed-card-item">
                    <div className="card-top-header">
                      <span className="badge badge-accent">FRAME {String(i + 1).padStart(2, '0')}</span>
                      <button 
                        className="btn-card-del"
                        onClick={() => setParsedCards(prev => prev.filter((_, idx) => idx !== i))}
                        title="Remove Slide"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="card-image-box">
                      {card.image ? (
                        <img src={card.image} alt="Slide img" className="parsed-card-img" />
                      ) : (
                        <div className="no-img-badge">No Image (Attach Later)</div>
                      )}
                    </div>

                    <input 
                      type="text" 
                      className="text-input font-bold text-sm mb-2"
                      value={card.headline}
                      onChange={(e) => {
                        const val = e.target.value;
                        setParsedCards(prev => prev.map((c, idx) => idx === i ? { ...c, headline: val } : c));
                      }}
                      placeholder="Headline"
                    />

                    <textarea 
                      rows={2}
                      className="text-area text-xs"
                      value={card.subtext}
                      onChange={(e) => {
                        const val = e.target.value;
                        setParsedCards(prev => prev.map((c, idx) => idx === i ? { ...c, subtext: val } : c));
                      }}
                      placeholder="Subtext"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          
          {parsedCards.length > 0 && (
            <div className="flex gap-2">
              <button 
                className="btn btn-secondary"
                onClick={() => handleFinalBuild('append')}
              >
                <Plus size={14} />
                <span>Append to Existing Deck</span>
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleFinalBuild('replace')}
              >
                <Check size={15} />
                <span>Replace Deck &amp; Open Studio ({parsedCards.length} Slides)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
