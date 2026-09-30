import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  X, 
  Terminal, 
  Globe, 
  Cpu, 
  Check, 
  AlertCircle, 
  RefreshCw,
  Search,
  Zap,
  Key,
  Layers,
  ChevronDown,
  ExternalLink,
  Tag,
  SlidersHorizontal,
  Image as ImageIcon
} from 'lucide-react';
import { 
  checkOpencodeStatus, 
  fetchOpencodeModels, 
  fetchOpencodeProviders, 
  fetchOllamaModels, 
  fetchOpenAICompatibleModels 
} from '../utils/apiServices';
import { getUnsplashKey, setUnsplashKey, testUnsplashKey } from '../utils/unsplash';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  showToast,
}) {
  const [formData, setFormData] = useState({ ...settings });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Opencode Models Discovery State
  const [isFetchingOpencodeModels, setIsFetchingOpencodeModels] = useState(false);
  const [opencodeDiscovery, setOpencodeDiscovery] = useState({
    models: [],
    providers: [],
    grouped: {},
    count: 0
  });
  const [opencodeSearch, setOpencodeSearch] = useState('');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState('all');
  const [opencodeProvidersText, setOpencodeProvidersText] = useState('');
  const [showOpencodeModelFinder, setShowOpencodeModelFinder] = useState(false);

  // Ollama Models Discovery State
  const [isFetchingOllama, setIsFetchingOllama] = useState(false);
  const [ollamaModelsList, setOllamaModelsList] = useState([]);

  // Direct API Models Discovery State
  const [isFetchingDirectModels, setIsFetchingDirectModels] = useState(false);
  const [directModelsList, setDirectModelsList] = useState([]);

  // Unsplash Image Engine State
  const [unsplashKeyDraft, setUnsplashKeyDraft] = useState(() => getUnsplashKey());
  const [isTestingUnsplash, setIsTestingUnsplash] = useState(false);
  const [unsplashTestResult, setUnsplashTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...settings });
      setTestResult(null);
      setUnsplashKeyDraft(getUnsplashKey());
      setUnsplashTestResult(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  // Fetch Opencode models
  const handleFetchOpencodeModels = async () => {
    setIsFetchingOpencodeModels(true);
    try {
      const [modelsData, provData] = await Promise.all([
        fetchOpencodeModels(),
        fetchOpencodeProviders()
      ]);

      setOpencodeDiscovery(modelsData);
      if (provData && provData.output) {
        setOpencodeProvidersText(provData.output);
      }
      setShowOpencodeModelFinder(true);
      showToast(`Found ${modelsData.count || modelsData.models.length} Opencode models across ${modelsData.providers.length} providers.`);
    } catch (err) {
      showToast('Opencode model discovery error: ' + err.message);
    } finally {
      setIsFetchingOpencodeModels(false);
    }
  };

  // Fetch Ollama models
  const handleFetchOllamaModels = async () => {
    setIsFetchingOllama(true);
    try {
      const models = await fetchOllamaModels(formData.endpoint);
      setOllamaModelsList(models);
      showToast(`Found ${models.length} installed Ollama models.`);
    } catch (err) {
      showToast('Ollama model discovery error: ' + err.message);
    } finally {
      setIsFetchingOllama(false);
    }
  };

  // Fetch Direct API models
  const handleFetchDirectModels = async () => {
    setIsFetchingDirectModels(true);
    try {
      const models = await fetchOpenAICompatibleModels(formData.openaiEndpoint, formData.apiKey);
      setDirectModelsList(models);
      showToast(`Found ${models.length} models from endpoint.`);
    } catch (err) {
      showToast('API model discovery error: ' + err.message);
    } finally {
      setIsFetchingDirectModels(false);
    }
  };

  // Test Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      if (formData.provider === 'opencode') {
        const res = await checkOpencodeStatus();
        if (res.available) {
          setTestResult({ success: true, message: `Opencode CLI active (${res.version || 'v1.18+'})` });
        } else {
          setTestResult({ success: false, message: 'Opencode CLI not reachable on local path.' });
        }
      } else if (formData.provider === 'ollama') {
        const ep = (formData.endpoint || 'http://localhost:11434').replace(/\/+$/, '');
        const res = await fetch(`${ep}/api/tags`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          const models = data.models ? data.models.map(m => m.name).join(', ') : 'connected';
          setTestResult({ success: true, message: `Ollama is active! Available models: ${models}` });
        } else {
          setTestResult({ success: false, message: `Could not connect to Ollama at ${ep}. Is 'ollama serve' running?` });
        }
      } else if (formData.provider === 'openai') {
        if (!formData.apiKey && !formData.openaiEndpoint.includes('localhost')) {
          setTestResult({ success: false, message: 'API key is missing.' });
        } else {
          setTestResult({ success: true, message: `Ready to connect to ${formData.openaiEndpoint}` });
        }
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestUnsplash = async () => {
    setIsTestingUnsplash(true);
    setUnsplashTestResult(null);
    try {
      const res = await testUnsplashKey(unsplashKeyDraft);
      if (res.ok) {
        setUnsplashTestResult({ success: true, message: `Unsplash API key is active & verified! (${res.rateLimit})` });
      } else {
        setUnsplashTestResult({ success: false, message: `Unsplash test failed: ${res.error}` });
      }
    } catch (err) {
      setUnsplashTestResult({ success: false, message: err.message });
    } finally {
      setIsTestingUnsplash(false);
    }
  };

  const handleSave = () => {
    setUnsplashKey(unsplashKeyDraft);
    onSaveSettings(formData);
    onClose();
    showToast('AI and Unsplash Settings saved.');
  };

  // Filtered Opencode Models
  const filteredOpencodeModels = (opencodeDiscovery.models || []).filter(modelStr => {
    const matchesSearch = !opencodeSearch.trim() || modelStr.toLowerCase().includes(opencodeSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedProviderFilter === 'all') return true;
    return modelStr.toLowerCase().startsWith(selectedProviderFilter.toLowerCase() + '/');
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-badge-icon">
              <Settings size={18} className="text-lime" />
            </div>
            <div>
              <h2 className="modal-title">AI / LLM Settings &amp; Model Finder</h2>
              <p className="modal-subtitle">Configure providers and dynamically discover available models.</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body space-y-4">
          {/* Provider Selection */}
          <div className="input-group">
            <label className="input-label font-semibold">Active AI Copywriting Engine</label>
            <div className="provider-card-grid">
              <div 
                className={`provider-card ${formData.provider === 'opencode' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, provider: 'opencode' }))}
              >
                <Terminal size={18} className="provider-icon" />
                <div className="provider-name">Opencode CLI</div>
                <div className="provider-desc">Local CLI engine &amp; models</div>
              </div>

              <div 
                className={`provider-card ${formData.provider === 'openai' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, provider: 'openai' }))}
              >
                <Globe size={18} className="provider-icon" />
                <div className="provider-name">Direct API</div>
                <div className="provider-desc">OpenAI / OpenRouter / Groq</div>
              </div>

              <div 
                className={`provider-card ${formData.provider === 'ollama' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, provider: 'ollama' }))}
              >
                <Cpu size={18} className="provider-icon" />
                <div className="provider-name">Ollama (Local)</div>
                <div className="provider-desc">localhost:11434</div>
              </div>
            </div>
          </div>

          {/* Conditional Provider Fields */}
          {/* 1. OPENCODE CLI PROVIDER WITH DYNAMIC MODEL FINDER */}
          {formData.provider === 'opencode' && (
            <div className="provider-settings-box space-y-3">
              <div className="input-group">
                <div className="flex justify-between items-center mb-1">
                  <label className="input-label font-semibold">Selected Opencode Model</label>
                  <button 
                    className="btn btn-secondary btn-xs flex items-center gap-1.5"
                    onClick={handleFetchOpencodeModels}
                    disabled={isFetchingOpencodeModels}
                  >
                    {isFetchingOpencodeModels ? <RefreshCw size={11} className="animate-spin" /> : <Zap size={11} className="text-lime" />}
                    <span>{isFetchingOpencodeModels ? 'Scanning CLI...' : 'Discover Models'}</span>
                  </button>
                </div>

                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    className="text-input flex-1"
                    placeholder="e.g. cursor/claude-sonnet-4-5, openai/gpt-4o, or leave empty for default"
                    value={formData.opencodeModel || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, opencodeModel: e.target.value }))}
                  />
                  {formData.opencodeModel && (
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setFormData(prev => ({ ...prev, opencodeModel: '' }))}
                      title="Clear to use default opencode model"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <span className="text-xs text-muted mt-1 block">
                  Leave empty to let Opencode use your active default model, or specify a model below.
                </span>
              </div>

              {/* Dynamic Opencode Model Finder Panel */}
              {showOpencodeModelFinder && (
                <div className="model-finder-panel p-3 border border-border rounded-lg bg-surface space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-pure uppercase tracking-wider flex items-center gap-1.5">
                      <Zap size={12} className="text-lime" />
                      <span>Discovered Models ({filteredOpencodeModels.length} of {opencodeDiscovery.count})</span>
                    </span>

                    <button 
                      className="text-xs text-muted hover:text-pure underline"
                      onClick={() => setShowOpencodeModelFinder(false)}
                    >
                      Hide Finder
                    </button>
                  </div>

                  {/* Provider Filter Chips */}
                  {opencodeDiscovery.providers && opencodeDiscovery.providers.length > 0 && (
                    <div className="provider-filter-scroll flex gap-1 overflow-x-auto py-1">
                      <button 
                        className={`filter-chip ${selectedProviderFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedProviderFilter('all')}
                      >
                        All ({opencodeDiscovery.count})
                      </button>
                      {opencodeDiscovery.providers.map(prov => (
                        <button 
                          key={prov}
                          className={`filter-chip ${selectedProviderFilter === prov ? 'active' : ''}`}
                          onClick={() => setSelectedProviderFilter(prov)}
                        >
                          {prov} ({opencodeDiscovery.grouped?.[prov]?.length || 0})
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Search Input */}
                  <div className="relative">
                    <Search size={13} className="search-icon-inside" />
                    <input 
                      type="text" 
                      className="text-input text-xs w-full pl-7 py-1.5"
                      placeholder="Search models by name (e.g. claude, gpt, grok, gemini, free)..."
                      value={opencodeSearch}
                      onChange={(e) => setOpencodeSearch(e.target.value)}
                    />
                  </div>

                  {/* Model Chips List */}
                  <div className="model-chips-scroll-area max-h-48 overflow-y-auto space-y-1 p-1">
                    {filteredOpencodeModels.length === 0 ? (
                      <div className="text-xs text-muted text-center py-3">No matching models found.</div>
                    ) : (
                      filteredOpencodeModels.map((m) => {
                        const isSelected = formData.opencodeModel === m;
                        const isFree = m.toLowerCase().includes('free');
                        const isFast = m.toLowerCase().includes('fast');
                        const isThinking = m.toLowerCase().includes('thinking');
                        const isReasoning = m.toLowerCase().includes('reasoning');

                        return (
                          <div 
                            key={m}
                            className={`model-row-item ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, opencodeModel: m }));
                              showToast(`Selected model: ${m}`);
                            }}
                          >
                            <span className="model-row-name">{m}</span>
                            <div className="model-row-tags">
                              {isFree && <span className="tag-pill tag-free">FREE</span>}
                              {isFast && <span className="tag-pill tag-fast">FAST</span>}
                              {isThinking && <span className="tag-pill tag-think">THINK</span>}
                              {isReasoning && <span className="tag-pill tag-think">REASON</span>}
                              {isSelected && <span className="tag-pill tag-selected">ACTIVE</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. DIRECT OPENAI-COMPATIBLE API */}
          {formData.provider === 'openai' && (
            <div className="provider-settings-box space-y-3">
              <div className="input-group">
                <label className="input-label">API Base Endpoint</label>
                <input 
                  type="text" 
                  className="text-input"
                  placeholder="https://api.openai.com/v1"
                  value={formData.openaiEndpoint || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, openaiEndpoint: e.target.value }))}
                />
                <div className="endpoint-quick-presets flex gap-1 mt-1">
                  <span className="text-xs text-muted mr-1">Presets:</span>
                  <button 
                    className="btn-preset-link"
                    onClick={() => setFormData(prev => ({ ...prev, openaiEndpoint: 'https://api.openai.com/v1', openaiModel: 'gpt-4o-mini' }))}
                  >
                    OpenAI
                  </button>
                  <button 
                    className="btn-preset-link"
                    onClick={() => setFormData(prev => ({ ...prev, openaiEndpoint: 'https://openrouter.ai/api/v1', openaiModel: 'anthropic/claude-3.5-sonnet' }))}
                  >
                    OpenRouter
                  </button>
                  <button 
                    className="btn-preset-link"
                    onClick={() => setFormData(prev => ({ ...prev, openaiEndpoint: 'https://api.groq.com/openai/v1', openaiModel: 'llama-3.3-70b-versatile' }))}
                  >
                    Groq
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">API Key</label>
                <input 
                  type="password" 
                  className="text-input"
                  placeholder="sk-..."
                  value={formData.apiKey || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>

              <div className="input-group">
                <div className="flex justify-between items-center mb-1">
                  <label className="input-label font-semibold">Model Name</label>
                  <button 
                    className="btn btn-secondary btn-xs flex items-center gap-1.5"
                    onClick={handleFetchDirectModels}
                    disabled={isFetchingDirectModels || !formData.apiKey}
                    title="Fetch models list from API endpoint"
                  >
                    {isFetchingDirectModels ? <RefreshCw size={11} className="animate-spin" /> : <Zap size={11} className="text-lime" />}
                    <span>{isFetchingDirectModels ? 'Fetching...' : 'Fetch Models'}</span>
                  </button>
                </div>
                <input 
                  type="text" 
                  className="text-input"
                  placeholder="e.g. gpt-4o-mini, llama-3.3-70b, deepseek-chat"
                  value={formData.openaiModel || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, openaiModel: e.target.value }))}
                />

                {directModelsList.length > 0 && (
                  <div className="model-chips-scroll-area max-h-36 overflow-y-auto space-y-1 mt-2 p-1 border border-border rounded-lg bg-surface">
                    {directModelsList.map(m => (
                      <div 
                        key={m}
                        className={`model-row-item ${formData.openaiModel === m ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, openaiModel: m }))}
                      >
                        <span className="model-row-name">{m}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. LOCAL OLLAMA PROVIDER */}
          {formData.provider === 'ollama' && (
            <div className="provider-settings-box space-y-3">
              <div className="input-group">
                <label className="input-label">Ollama Endpoint</label>
                <input 
                  type="text" 
                  className="text-input"
                  placeholder="http://localhost:11434"
                  value={formData.endpoint || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                />
              </div>

              <div className="input-group">
                <div className="flex justify-between items-center mb-1">
                  <label className="input-label font-semibold">Model Name</label>
                  <button 
                    className="btn btn-secondary btn-xs flex items-center gap-1.5"
                    onClick={handleFetchOllamaModels}
                    disabled={isFetchingOllama}
                    title="Discover models installed in local Ollama"
                  >
                    {isFetchingOllama ? <RefreshCw size={11} className="animate-spin" /> : <Zap size={11} className="text-lime" />}
                    <span>{isFetchingOllama ? 'Scanning Ollama...' : 'Fetch Installed Models'}</span>
                  </button>
                </div>
                <input 
                  type="text" 
                  className="text-input"
                  placeholder="e.g. llama3.2, mistral, qwen2.5"
                  value={formData.ollamaModel || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, ollamaModel: e.target.value }))}
                />

                {ollamaModelsList.length > 0 && (
                  <div className="model-chips-scroll-area max-h-36 overflow-y-auto space-y-1 mt-2 p-1 border border-border rounded-lg bg-surface">
                    {ollamaModelsList.map(m => (
                      <div 
                        key={m}
                        className={`model-row-item ${formData.ollamaModel === m ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, ollamaModel: m }))}
                      >
                        <span className="model-row-name">{m}</span>
                        {formData.ollamaModel === m && <span className="tag-pill tag-selected">SELECTED</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test connection & Result feedback */}
          <div className="pt-2">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? <RefreshCw size={13} className="animate-spin" /> : null}
              <span>Test AI Connection</span>
            </button>

            {testResult && (
              <div className={`connection-test-feedback mt-2 ${testResult.success ? 'success' : 'error'}`}>
                {testResult.success ? <Check size={14} className="text-lime" /> : <AlertCircle size={14} />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Unsplash Image API & Media Provider */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-lime" />
                <label className="input-label font-semibold mb-0">Unsplash Image API (High-Res Photos)</label>
              </div>
              <a 
                href="https://unsplash.com/developers" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-accent flex items-center gap-1 hover:underline"
              >
                <span>Unsplash Portal</span>
                <ExternalLink size={10} />
              </a>
            </div>
            <p className="text-xs text-muted">
              Powers the Slide Image Picker to search 5M+ high-resolution editorial photos by keyword.
            </p>
            <div className="input-group">
              <label className="input-label text-xs">Unsplash Access Key (Client-ID)</label>
              <input 
                type="password" 
                className="text-input text-xs font-mono"
                placeholder="e.g. q_3KHZSWrHh3eS8Rn5SVvmtK2PINDVB95qsWAKyZyjo"
                value={unsplashKeyDraft}
                onChange={(e) => setUnsplashKeyDraft(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <button 
                type="button" 
                className="btn btn-secondary btn-xs flex items-center gap-1.5"
                onClick={handleTestUnsplash}
                disabled={isTestingUnsplash}
              >
                {isTestingUnsplash ? <RefreshCw size={11} className="animate-spin" /> : <Zap size={11} className="text-lime" />}
                <span>{isTestingUnsplash ? 'Testing API...' : 'Test Unsplash Key'}</span>
              </button>
            </div>
            {unsplashTestResult && (
              <div className={`connection-test-feedback ${unsplashTestResult.success ? 'success' : 'error'}`}>
                {unsplashTestResult.success ? <Check size={14} className="text-lime" /> : <AlertCircle size={14} />}
                <span>{unsplashTestResult.message}</span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
