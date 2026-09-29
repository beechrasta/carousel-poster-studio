import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Plus, 
  RefreshCw, 
  Layers, 
  Minimize2, 
  Clock, 
  Terminal, 
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { extractStoriesHeuristic, SAMPLE_STORIES } from '../utils/apiServices';

export default function NewsGeneratorModal({
  isOpen,
  onClose,
  onAddGeneratedSlides,
  settings,
  showToast,
  aiTask,
  onStartAITask,
  onCancelAITask,
  onClearAITask
}) {
  const [newsInput, setNewsInput] = useState('');
  const [generatedList, setGeneratedList] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  // Sync if aiTask completes for news_generator
  useEffect(() => {
    if (aiTask && aiTask.type === 'news_generator' && aiTask.status === 'completed' && aiTask.results?.length) {
      setGeneratedList(aiTask.results);
    }
  }, [aiTask]);

  if (!isOpen) return null;

  const isTaskRunning = aiTask?.status === 'running' && aiTask?.type === 'news_generator';
  const isTaskError = aiTask?.status === 'error' && aiTask?.type === 'news_generator';

  const handleGenerate = () => {
    if (!newsInput.trim()) {
      showToast('Please paste some tech news story text first.');
      return;
    }

    onStartAITask({
      type: 'news_generator',
      newsInput: newsInput,
      uploadedImages: [],
      settings: settings
    });
  };

  const handleInstantFallback = () => {
    const textToParse = newsInput || aiTask?.newsInput || '';
    if (!textToParse.trim()) {
      showToast('No news text available.');
      return;
    }

    const stories = extractStoriesHeuristic(textToParse);
    if (!stories.length) {
      showToast('Could not extract stories from the text.');
      return;
    }

    setGeneratedList(stories);
    if (onClearAITask) onClearAITask();
    showToast(`⚡ Extracted ${stories.length} slides instantly with local parser!`);
  };

  const handleApply = (mode = 'append') => {
    if (!generatedList.length) return;
    const newSlides = generatedList.map((item) => ({
      id: Math.random().toString(36).slice(2, 9),
      headline: item.headline,
      subtext: item.subtext,
      image: item.image || null,
      fit: 'cover',
      focal: 50,
      credit: item.credit || '',
    }));
    onAddGeneratedSlides(newSlides, mode);
    if (onClearAITask) onClearAITask();
    onClose();
    showToast(`Added ${newSlides.length} slides to deck. Attach images next.`);
  };

  const formatTimer = (secs) => {
    const m = Math.floor((secs || 0) / 60);
    const s = (secs || 0) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container news-generator-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-badge-icon">
              <Sparkles size={18} className="text-lime" />
            </div>
            <div>
              <h2 className="modal-title">Generate Slides from News</h2>
              <p className="modal-subtitle">AI writes punchy headlines and roast subtexts in the target internet-native voice.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isTaskRunning && (
              <button 
                className="btn btn-secondary btn-xs flex items-center gap-1.5"
                onClick={onClose}
                title="Run in background and continue using the studio"
              >
                <Minimize2 size={12} />
                <span>Run in Background</span>
              </button>
            )}
            <button className="btn-close-modal" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div className="modal-body space-y-4">
          {/* Active AI Background Pipeline Panel */}
          {isTaskRunning && (
            <div className="ai-live-pipeline-card">
              <div className="pipeline-header-row">
                <div className="flex items-center gap-2">
                  <div className="pulse-beacon">
                    <span className="pulse-dot"></span>
                    <span className="pulse-ring"></span>
                  </div>
                  <div>
                    <h3 className="pipeline-title">Generating Carousel Copy in Background</h3>
                    <p className="pipeline-subtitle">
                      Provider: <strong>{aiTask.provider === 'opencode' ? (aiTask.model || 'Opencode Default') : aiTask.provider}</strong>
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
              </div>

              {/* Pipeline Step Tracker */}
              <div className="pipeline-steps-grid">
                <div className={`pipeline-step-item ${(aiTask.step || 1) >= 1 ? 'active' : ''} ${(aiTask.step || 1) > 1 ? 'completed' : ''}`}>
                  <div className="step-num">1</div>
                  <div className="step-text">
                    <div className="step-label">Parse Articles</div>
                    <div className="step-hint">Format prompt</div>
                  </div>
                </div>
                <div className={`pipeline-step-item ${(aiTask.step || 1) >= 2 ? 'active' : ''} ${(aiTask.step || 1) > 2 ? 'completed' : ''}`}>
                  <div className="step-num">2</div>
                  <div className="step-text">
                    <div className="step-label">Call Engine</div>
                    <div className="step-hint">{aiTask.provider}</div>
                  </div>
                </div>
                <div className={`pipeline-step-item ${(aiTask.step || 1) >= 3 ? 'active' : ''} ${(aiTask.step || 1) > 3 ? 'completed' : ''}`}>
                  <div className="step-num">3</div>
                  <div className="step-text">
                    <div className="step-label">Draft Copy</div>
                    <div className="step-hint">Roast tone</div>
                  </div>
                </div>
                <div className={`pipeline-step-item ${(aiTask.step || 1) >= 4 ? 'active' : ''} ${(aiTask.step || 1) > 4 ? 'completed' : ''}`}>
                  <div className="step-num">4</div>
                  <div className="step-text">
                    <div className="step-label">Done</div>
                    <div className="step-hint">Review deck</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-muted flex items-center gap-1.5">
                  <RefreshCw size={12} className="animate-spin text-lime" />
                  <span>{aiTask.stepLabel || 'Drafting carousel headlines...'}</span>
                </span>
                <button 
                  className="text-muted hover:text-pure flex items-center gap-1 underline"
                  onClick={() => setShowLogs(!showLogs)}
                >
                  <Terminal size={12} />
                  <span>{showLogs ? 'Hide Logs' : 'View Logs'}</span>
                  {showLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>

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
                  <h4 className="font-semibold text-sm">Generation Error Occurred</h4>
                  <p className="text-xs text-muted">
                    {aiTask.error || 'The model encountered an error.'}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button 
                      className="btn btn-primary btn-xs flex items-center gap-1"
                      onClick={handleInstantFallback}
                    >
                      <Zap size={12} />
                      <span>⚡ Instant Local Fallback Parser</span>
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

          <div className="input-group">
            <div className="flex justify-between items-center mb-1">
              <label className="input-label font-semibold">Paste News Story (or Multiple Stories)</label>
              <span className="text-xs text-muted">Backend: {settings.provider.toUpperCase()}</span>
            </div>
            <textarea 
              rows={6}
              className="text-area"
              placeholder="Paste article text, newsletter snippets, or AI headlines here..."
              value={newsInput}
              onChange={(e) => setNewsInput(e.target.value)}
              disabled={isTaskRunning}
            />
          </div>

          <div className="flex justify-between items-center mt-3">
            <div className="flex gap-2 items-center">
              <span className="text-xs text-muted">Sample Presets:</span>
              <button 
                className="btn btn-secondary btn-xs"
                onClick={() => setNewsInput("OpenAI scraps GPT-6.1 Astra before launch due to high deception rates in testing.")}
              >
                Astra Scrapped
              </button>
              <button 
                className="btn btn-secondary btn-xs"
                onClick={() => setNewsInput("Nvidia launches Open Agent Safety Platform with 100+ partners and announces $150B share buyback.")}
              >
                Nvidia Safety
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleInstantFallback}
                disabled={!newsInput.trim()}
                title="Extract slides immediately without waiting for AI"
              >
                <Zap size={13} className="text-lime" />
                <span>Instant Parser</span>
              </button>
              
              <button 
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={isTaskRunning || !newsInput.trim()}
              >
                <Sparkles size={14} />
                <span>{isTaskRunning ? 'Generating in Background...' : 'Generate Slides'}</span>
              </button>
            </div>
          </div>

          {/* Generated Results Preview */}
          {generatedList.length > 0 && (
            <div className="generated-results-container mt-5">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-accent uppercase tracking-wider">
                  Generated Copy Preview ({generatedList.length} Slides)
                </h4>
                <button 
                  className="text-xs text-muted hover:text-pure underline"
                  onClick={() => setGeneratedList([])}
                >
                  Clear
                </button>
              </div>

              <div className="space-y-3">
                {generatedList.map((item, idx) => (
                  <div key={idx} className="generated-slide-preview-card">
                    <span className="card-mini-tag">FRAME {String(idx + 1).padStart(2, '0')}</span>
                    <input 
                      type="text" 
                      className="text-input font-bold text-sm mb-2"
                      value={item.headline}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGeneratedList(prev => prev.map((it, i) => i === idx ? { ...it, headline: val } : it));
                      }}
                    />
                    <textarea 
                      rows={2}
                      className="text-area text-xs"
                      value={item.subtext}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGeneratedList(prev => prev.map((it, i) => i === idx ? { ...it, subtext: val } : it));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {generatedList.length > 0 && (
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={() => handleApply('append')}>
                <Plus size={14} />
                <span>Append to Deck</span>
              </button>
              <button className="btn btn-primary" onClick={() => handleApply('replace')}>
                <Check size={14} />
                <span>Replace Deck</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
