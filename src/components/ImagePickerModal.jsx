import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Upload, Link as LinkIcon, X, Check,
  Loader2, Image as ImageIcon, RefreshCw, ExternalLink,
  ChevronLeft, ChevronRight, KeyRound
} from 'lucide-react';
import { searchUnsplash, extractKeywordsFromSlide, getUnsplashKey, setUnsplashKey } from '../utils/unsplash';
import { fileToDataURL, urlToDataURL } from '../utils/exportEngine';

/**
 * ImagePickerModal
 *
 * Props:
 *   isOpen         — boolean
 *   onClose        — () => void
 *   onSelect       — (imageUrl: string, credit: string) => void
 *   slide          — current slide (for keyword extraction)
 *   slotLabel      — 'Background Image', 'Left Image', etc.
 */
export default function ImagePickerModal({ isOpen, onClose, onSelect, slide, slotLabel = 'Image' }) {
  const [tab, setTab] = useState('search'); // 'search' | 'upload' | 'url'
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-extract keywords and search when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setSelectedPhoto(null);
    setPhotos([]);
    setPage(1);
    setSearchError('');
    setTab('search');
    const key = getUnsplashKey();
    setHasKey(!!key);
    setKeyDraft(key);
    const autoQuery = extractKeywordsFromSlide(slide);
    setQuery(autoQuery);
    // Small delay so modal is rendered before we search
    setTimeout(() => {
      doSearch(autoQuery, 1);
      searchInputRef.current?.focus();
    }, 120);
  }, [isOpen]);

  const doSearch = useCallback(async (q, p = 1) => {
    if (!q?.trim()) return;
    setIsSearching(true);
    setSearchError('');
    if (p === 1) setPhotos([]);
    try {
      const results = await searchUnsplash(q.trim(), p, 18);
      setPhotos(prev => p === 1 ? results : [...prev, ...results]);
    } catch (err) {
      setSearchError(err.message || 'Search failed. Check your Unsplash API key.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    setPage(1);
    doSearch(query, 1);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    doSearch(query, next);
  };

  const handleSelectPhoto = (photo) => {
    setSelectedPhoto(prev => prev?.id === photo.id ? null : photo);
  };

  const handleConfirmPhoto = async () => {
    if (!selectedPhoto) return;
    // Proxy via the regular URL directly - Unsplash allows hotlinking with credit
    const credit = `${selectedPhoto.author} / Unsplash`;
    onSelect(selectedPhoto.url_regular, credit);
    onClose();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    try {
      const dataUrl = await fileToDataURL(file);
      onSelect(dataUrl, '');
      onClose();
    } catch (err) {
      setSearchError('Failed to read image: ' + err.message);
    }
    e.target.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const dataUrl = await fileToDataURL(file);
        onSelect(dataUrl, '');
        onClose();
      } catch (err) {
        setSearchError('Drop failed: ' + err.message);
      }
    }
  };

  const handleAttachUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;
    try {
      setIsFetchingUrl(true);
      const dataUrl = await urlToDataURL(url);
      onSelect(dataUrl, url);
      setUrlInput('');
      onClose();
    } catch (err) {
      setSearchError('URL failed: ' + err.message);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleSaveKey = () => {
    setUnsplashKey(keyDraft.trim());
    setHasKey(!!keyDraft.trim());
    setShowKeyInput(false);
    // Re-search with new key
    doSearch(query, 1);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop img-picker-backdrop" onClick={onClose}>
      <div className="img-picker-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="img-picker-header">
          <div className="img-picker-title">
            <ImageIcon size={16} className="text-accent" />
            <span>Pick {slotLabel}</span>
          </div>
          <div className="img-picker-header-right">
            {tab === 'search' && (
              <button
                className="btn-key-toggle"
                onClick={() => setShowKeyInput(v => !v)}
                title={hasKey ? 'Unsplash API key set ✓' : 'Add Unsplash API key for keyword search'}
              >
                <KeyRound size={13} className={hasKey ? 'text-lime' : 'text-muted'} />
                <span className="text-xs">{hasKey ? 'Key ✓' : 'Add Key'}</span>
              </button>
            )}
            <button className="btn-close-modal" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* API Key Row */}
        {showKeyInput && tab === 'search' && (
          <div className="img-picker-key-row">
            <input
              type="text"
              className="text-input text-xs"
              placeholder="Paste your Unsplash Access Key..."
              value={keyDraft}
              onChange={e => setKeyDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
            />
            <button className="btn btn-primary btn-xs" onClick={handleSaveKey}>Save</button>
            <a
              href="https://unsplash.com/developers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent text-xs flex items-center gap-1"
            >
              Get free key <ExternalLink size={10} />
            </a>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="img-picker-tabs">
          <button
            className={`img-picker-tab ${tab === 'search' ? 'active' : ''}`}
            onClick={() => setTab('search')}
          >
            <Search size={13} />
            <span>Search Unsplash</span>
          </button>
          <button
            className={`img-picker-tab ${tab === 'upload' ? 'active' : ''}`}
            onClick={() => setTab('upload')}
          >
            <Upload size={13} />
            <span>Upload File</span>
          </button>
          <button
            className={`img-picker-tab ${tab === 'url' ? 'active' : ''}`}
            onClick={() => setTab('url')}
          >
            <LinkIcon size={13} />
            <span>Paste URL</span>
          </button>
        </div>

        {/* Search Tab */}
        {tab === 'search' && (
          <div className="img-picker-search-pane">
            <form className="img-picker-search-bar" onSubmit={handleSearch}>
              <div className="search-bar-inner">
                <Search size={15} className="search-bar-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-bar-input"
                  placeholder="Search Unsplash... (auto-suggested from slide)"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    className="search-bar-clear"
                    onClick={() => setQuery('')}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={isSearching || !query.trim()}
              >
                {isSearching ? <Loader2 size={13} className="spin" /> : 'Search'}
              </button>
            </form>

            {!hasKey && (
              <div className="img-picker-notice">
                <span>⚡ Add an Unsplash API key above for accurate keyword search. Without it, you get random photos.</span>
              </div>
            )}

            {searchError && (
              <div className="img-picker-error">{searchError}</div>
            )}

            {/* Photo Grid */}
            <div className="img-picker-grid">
              {photos.map(photo => (
                <button
                  key={photo.id}
                  className={`img-picker-cell ${selectedPhoto?.id === photo.id ? 'selected' : ''}`}
                  onClick={() => handleSelectPhoto(photo)}
                  title={`${photo.alt} — by ${photo.author}`}
                  style={{ backgroundColor: photo.color }}
                >
                  <img
                    src={photo.url_thumb}
                    alt={photo.alt}
                    className="img-picker-thumb"
                    loading="lazy"
                    crossOrigin="anonymous"
                  />
                  {selectedPhoto?.id === photo.id && (
                    <div className="img-picker-check">
                      <Check size={18} strokeWidth={3} />
                    </div>
                  )}
                  <div className="img-picker-cell-credit">{photo.author}</div>
                </button>
              ))}

              {isSearching && photos.length === 0 && (
                Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="img-picker-cell-skeleton" />
                ))
              )}

              {!isSearching && photos.length === 0 && !searchError && (
                <div className="img-picker-empty">
                  <ImageIcon size={32} className="text-muted" />
                  <span>Search for photos above</span>
                </div>
              )}
            </div>

            {/* Load More */}
            {photos.length > 0 && (
              <div className="img-picker-load-more">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleLoadMore}
                  disabled={isSearching}
                >
                  {isSearching
                    ? <><Loader2 size={13} className="spin" /> Loading…</>
                    : <><RefreshCw size={13} /> Load More</>
                  }
                </button>
              </div>
            )}

            {/* Confirm Bar (sticky bottom) */}
            {selectedPhoto && (
              <div className="img-picker-confirm-bar">
                <div className="confirm-preview">
                  <img
                    src={selectedPhoto.url_thumb}
                    alt="selected"
                    className="confirm-thumb"
                    crossOrigin="anonymous"
                  />
                  <div>
                    <div className="text-xs text-pure font-semibold">Selected</div>
                    <div className="text-xs text-muted">by {selectedPhoto.author}</div>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleConfirmPhoto}>
                  <Check size={14} />
                  <span>Use This Photo</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {tab === 'upload' && (
          <div className="img-picker-upload-pane">
            <label
              className="img-picker-dropzone"
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
              onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
              onDrop={e => { e.currentTarget.classList.remove('drag-over'); handleDrop(e); }}
            >
              <Upload size={36} className="text-muted" />
              <span className="text-pure font-semibold mt-2">Drag & drop image here</span>
              <span className="text-muted text-sm">or click to browse your computer</span>
              <span className="text-xs text-muted mt-1">PNG, JPG, WebP, GIF accepted</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </label>
            {searchError && <div className="img-picker-error">{searchError}</div>}
          </div>
        )}

        {/* URL Tab */}
        {tab === 'url' && (
          <div className="img-picker-url-pane">
            <p className="text-sm text-muted mb-3">
              Paste a direct image URL (must end with .jpg, .png, .webp, or serve an image MIME type).
            </p>
            <div className="url-attach-row">
              <div className="url-input-wrapper">
                <LinkIcon size={14} className="url-icon" />
                <input
                  type="url"
                  value={urlInput}
                  placeholder="https://example.com/image.jpg"
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAttachUrl()}
                  className="url-input"
                  autoFocus
                />
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAttachUrl}
                disabled={isFetchingUrl || !urlInput.trim()}
              >
                {isFetchingUrl
                  ? <><Loader2 size={13} className="spin" /> Loading…</>
                  : 'Use URL'
                }
              </button>
            </div>
            {searchError && <div className="img-picker-error mt-2">{searchError}</div>}
            <p className="text-xs text-muted mt-4">
              Note: CORS-blocked URLs (some news sites, social media) won't load. Download and upload the file instead.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
