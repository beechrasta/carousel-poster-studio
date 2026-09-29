import React, { useEffect, useRef, useState } from 'react';
import { 
  Download, 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  Grid, 
  Check, 
  Sparkles, 
  Dices,
  Layers,
  Palette,
  Globe,
  Sliders,
  Shuffle,
  Undo2,
  Redo2
} from 'lucide-react';
import { renderSlideToCanvas, CANVAS_SIZE, PADDING, POSTER_THEMES } from '../utils/canvasRenderer';
import { downloadSlidePNG, copySlideToClipboard } from '../utils/exportEngine';

export default function PreviewStage({
  currentSlide,
  currentIndex,
  totalSlides,
  globalSettings,
  onPrevSlide,
  onNextSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onUpdateGlobalSettings,
  onRandomizeAllThemes,
  onApplyThemeToAllSlides,
  onOpenGlobalSettings,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  showToast,
}) {
  const canvasRef = useRef(null);
  const [zoomMode, setZoomMode] = useState('fit'); // 'fit' | 0.5 | 0.75 | 1.0
  const [showGuides, setShowGuides] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const activeThemeMode = globalSettings?.themeMode || 'uniform';
  const activeGlobalThemeId = globalSettings?.globalThemeId || 'dark_lime';

  // Render the canvas whenever the slide or global settings change
  useEffect(() => {
    let isCancelled = false;
    const canvas = canvasRef.current;
    if (!canvas || !currentSlide) return;

    renderSlideToCanvas(currentSlide, currentIndex, canvas, globalSettings, totalSlides).then(() => {
      if (isCancelled) return;
    }).catch(err => {
      console.error('Canvas preview render error:', err);
    });

    return () => { isCancelled = true; };
  }, [currentSlide, currentIndex, globalSettings, totalSlides]);

  // Handle PNG Download
  const handleDownloadPNG = async () => {
    if (!currentSlide) return;
    try {
      setIsDownloading(true);
      await downloadSlidePNG(currentSlide, currentIndex, globalSettings, totalSlides);
      showToast(`Downloaded slide-${String(currentIndex + 1).padStart(2, '0')}.png`);
    } catch (err) {
      showToast('Download failed: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Clipboard Copy
  const handleCopyClipboard = async () => {
    if (!currentSlide) return;
    try {
      await copySlideToClipboard(currentSlide, currentIndex, globalSettings, totalSlides);
      setIsCopied(true);
      showToast('Slide PNG copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2400);
    } catch (err) {
      showToast('Copy failed: ' + err.message);
    }
  };

  return (
    <section className="preview-stage-container">
      {/* Quick Global Deck Bar right above canvas */}
      <div className="stage-global-quick-bar">
        <div className="quick-bar-left">
          <span className="quick-bar-title">
            <Sparkles size={12} className="text-lime" />
            <span>Deck Themes:</span>
          </span>

          <div className="quick-theme-modes">
            <button 
              className={`quick-mode-btn ${activeThemeMode === 'uniform' ? 'active' : ''}`}
              onClick={() => {
                if (onUpdateGlobalSettings) onUpdateGlobalSettings({ themeMode: 'uniform' });
                showToast('Deck set to Same Theme for all cards.');
              }}
              title="Same theme across all cards"
            >
              Same Theme
            </button>

            <button 
              className={`quick-mode-btn ${activeThemeMode === 'random' ? 'active' : ''}`}
              onClick={() => {
                if (onUpdateGlobalSettings) onUpdateGlobalSettings({ themeMode: 'random' });
                if (onRandomizeAllThemes) onRandomizeAllThemes();
                showToast('🎲 Deck set to Random Colors mix!');
              }}
              title="Random vibrant colors across all cards"
            >
              <Dices size={12} className="text-lime" />
              <span>Random Colors</span>
            </button>

            <button 
              className={`quick-mode-btn ${activeThemeMode === 'alternating' ? 'active' : ''}`}
              onClick={() => {
                if (onUpdateGlobalSettings) onUpdateGlobalSettings({ themeMode: 'alternating' });
                showToast('Deck set to Alternating 2-theme cycle.');
              }}
              title="Alternating 2-theme cycle"
            >
              Alternating
            </button>

            <button 
              className={`quick-mode-btn ${activeThemeMode === 'rainbow' ? 'active' : ''}`}
              onClick={() => {
                if (onUpdateGlobalSettings) onUpdateGlobalSettings({ themeMode: 'rainbow' });
                showToast('Deck set to 7-Theme Rainbow Flow.');
              }}
              title="7-theme rainbow flow"
            >
              Rainbow
            </button>
          </div>

          {/* Quick theme swatches when in uniform mode */}
          {activeThemeMode === 'uniform' && (
            <div className="quick-swatches-strip">
              {Object.values(POSTER_THEMES).map((th) => {
                const isSelected = activeGlobalThemeId === th.id;
                return (
                  <button
                    key={th.id}
                    className={`quick-swatch-dot ${isSelected ? 'active' : ''}`}
                    style={{
                      background: th.bgType === 'gradient' && th.bgGradient
                        ? `linear-gradient(${th.bgGradient.angle || 135}deg, ${th.bgGradient.from}, ${th.bgGradient.to})`
                        : th.bgColor,
                      borderColor: isSelected ? th.accentColor : 'transparent'
                    }}
                    onClick={() => {
                      if (onApplyThemeToAllSlides) onApplyThemeToAllSlides(th.id);
                      showToast(`Applied ${th.name} to all ${totalSlides} slides!`);
                    }}
                    title={`Apply ${th.name} to all slides`}
                  >
                    <span className="dot-inner" style={{ background: th.accentColor }} />
                  </button>
                );
              })}
            </div>
          )}

          {activeThemeMode === 'random' && (
            <button 
              className="btn btn-secondary btn-xs ml-2"
              onClick={() => {
                if (onRandomizeAllThemes) onRandomizeAllThemes();
                showToast('🎲 Shuffled new random themes across deck!');
              }}
              title="Re-roll random color combination"
            >
              <Shuffle size={12} className="text-lime" />
              <span>Re-Roll</span>
            </button>
          )}
        </div>

        <div className="quick-bar-right">
          <button 
            className="btn btn-subtle-action btn-xs"
            onClick={onOpenGlobalSettings}
            title="Open full project global settings (typography, framing, image defaults)"
          >
            <Globe size={12} className="text-lime" />
            <span>Deck Settings (All)</span>
          </button>
        </div>
      </div>

      {/* Top stage controls */}
      <div className="stage-top-bar">
        <div className="stage-navigation">
          <button 
            className="nav-arrow-btn"
            onClick={onPrevSlide}
            disabled={currentIndex <= 0}
            title="Previous Slide (Left Arrow)"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="slide-counter-badge">
            <span className="current-num">{currentIndex + 1}</span>
            <span className="slash">/</span>
            <span className="total-num">{totalSlides}</span>
          </div>

          <button 
            className="nav-arrow-btn"
            onClick={onNextSlide}
            disabled={currentIndex >= totalSlides - 1}
            title="Next Slide (Right Arrow)"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="stage-view-controls">
          <div className="stage-history-buttons">
            <button 
              className="btn btn-icon-subtle"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo last action (Ctrl+Z)"
            >
              <Undo2 size={13} />
            </button>
            <button 
              className="btn btn-icon-subtle"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo action (Ctrl+Y)"
            >
              <Redo2 size={13} />
            </button>
          </div>

          <button 
            className={`tool-toggle-btn ${showGuides ? 'active' : ''}`}
            onClick={() => setShowGuides(!showGuides)}
            title="Toggle 70px Safe Padding Guides"
          >
            <Grid size={15} />
            <span>Safe Guides</span>
          </button>

          <div className="zoom-button-group">
            <button 
              className={`zoom-btn ${zoomMode === 'fit' ? 'active' : ''}`}
              onClick={() => setZoomMode('fit')}
            >
              Fit
            </button>
            <button 
              className={`zoom-btn ${zoomMode === 0.5 ? 'active' : ''}`}
              onClick={() => setZoomMode(0.5)}
            >
              50%
            </button>
            <button 
              className={`zoom-btn ${zoomMode === 0.75 ? 'active' : ''}`}
              onClick={() => setZoomMode(0.75)}
            >
              75%
            </button>
            <button 
              className={`zoom-btn ${zoomMode === 1.0 ? 'active' : ''}`}
              onClick={() => setZoomMode(1.0)}
            >
              100%
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div className="stage-viewport-area">
        <div className={`canvas-scaler-wrapper mode-${zoomMode}`} style={{
          transform: zoomMode !== 'fit' ? `scale(${zoomMode})` : undefined
        }}>
          <div className="canvas-shadow-box">
            <canvas 
              ref={canvasRef} 
              width={CANVAS_SIZE} 
              height={CANVAS_SIZE} 
              className="main-preview-canvas"
            />
            
            {/* 70px Safe Area Overlay Guide */}
            {showGuides && (
              <div 
                className="safe-guides-overlay"
                style={{
                  top: `${(PADDING / CANVAS_SIZE) * 100}%`,
                  left: `${(PADDING / CANVAS_SIZE) * 100}%`,
                  right: `${(PADDING / CANVAS_SIZE) * 100}%`,
                  bottom: `${(PADDING / CANVAS_SIZE) * 100}%`,
                }}
              >
                <div className="guide-tag">70px Safe Margin</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="stage-bottom-bar">
        <div className="bar-left-info">
          <span className="dim-spec-text">1080 &times; 1080 px &bull; High Resolution PNG</span>
        </div>

        <div className="bar-center-actions">
          <button 
            className="btn btn-action-copy"
            onClick={handleCopyClipboard}
            title="Copy 1080x1080 PNG directly to clipboard for pasting"
          >
            {isCopied ? <Check size={16} className="text-lime" /> : <Copy size={16} />}
            <span>{isCopied ? 'Copied to Clipboard!' : 'Copy PNG'}</span>
          </button>

          <button 
            className="btn btn-action-download"
            onClick={handleDownloadPNG}
            disabled={isDownloading}
            title="Download this slide as 1080x1080 PNG"
          >
            <Download size={16} />
            <span>{isDownloading ? 'Rendering...' : 'Download PNG'}</span>
          </button>
        </div>

        <div className="bar-right-actions">
          <button 
            className="btn btn-subtle-action"
            onClick={() => onDuplicateSlide(currentIndex)}
            title="Duplicate this slide"
          >
            <Layers size={14} />
            <span>Duplicate</span>
          </button>
        </div>
      </div>
    </section>
  );
}
