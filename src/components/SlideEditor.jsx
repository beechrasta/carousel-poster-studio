import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon, 
  Trash2, 
  MoveVertical, 
  Type, 
  Sliders, 
  Tag, 
  Palette,
  Check, 
  Sparkles,
  Layers,
  Globe,
  Focus,
  AlertCircle,
  RotateCcw,
  Zap,
  Layout,
  Stamp
} from 'lucide-react';
import DeckGlobalEditor from './DeckGlobalEditor';
import { fileToDataURL, urlToDataURL } from '../utils/exportEngine';
import { 
  POSTER_THEMES, 
  resolveSlideTheme, 
  resolveFrameLabel, 
  POSTER_LAYOUT_TEMPLATES 
} from '../utils/canvasRenderer';

export default function SlideEditor({
  slide,
  slideIndex,
  totalSlides,
  globalSettings,
  editorTab = 'slide',
  onSetEditorTab,
  onUpdateSlide,
  onApplyThemeToAll,
  onUpdateGlobalSettings,
  onRandomizeAllThemes,
  onApplyThemeToAllSlides,
  onSetGlobalImageFit,
  onResetAllFocalPoints,
  onForceSyncAllSlides,
  onClearAllImages,
  onResetAllFrameLabels,
  onResetPreferences,
  onResetDeckToBlank,
  showToast,
}) {
  const [internalTab, setInternalTab] = useState('slide');
  const activeTab = onSetEditorTab ? editorTab : internalTab;
  const setTab = onSetEditorTab ? onSetEditorTab : setInternalTab;

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showCustomColors, setShowCustomColors] = useState(false);

  if (!slide) {
    return (
      <aside className="slide-editor-sidebar empty-state">
        <p>No slide selected.</p>
      </aside>
    );
  }

  const currentTheme = resolveSlideTheme(slide, globalSettings, slideIndex, totalSlides);
  const resolvedFrame = resolveFrameLabel(slide, slideIndex, totalSlides, globalSettings);

  // Handle local image file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP, etc.)');
      return;
    }
    try {
      const dataUrl = await fileToDataURL(file);
      onUpdateSlide(slideIndex, { image: dataUrl });
      showToast('Image attached.');
    } catch (err) {
      showToast('Failed to read image file: ' + err.message);
    }
    e.target.value = '';
  };

  // Handle Drag and Drop Image File
  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const dataUrl = await fileToDataURL(file);
        onUpdateSlide(slideIndex, { image: dataUrl });
        showToast('Image attached from drop.');
      } catch (err) {
        showToast('Failed to attach image: ' + err.message);
      }
    }
  };

  // Handle Image URL Fetch
  const handleAttachUrl = async () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    try {
      setIsFetchingUrl(true);
      const dataUrl = await urlToDataURL(url);
      onUpdateSlide(slideIndex, { image: dataUrl });
      setImageUrlInput('');
      showToast('Image URL loaded and embedded.');
    } catch (err) {
      showToast('URL attach failed (' + err.message + '). If CORS is blocked, download and upload the file instead.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleSelectTheme = (themeId) => {
    onUpdateSlide(slideIndex, {
      themeId,
      customBgColor: undefined,
      customAccentColor: undefined,
      customHeadlineColor: undefined,
      customSubtextColor: undefined,
      customBgType: undefined,
      customBgGradient: undefined,
    });
  };

  const handleApplyCurrentToAll = () => {
    const themeToApply = {
      themeId: slide.themeId || globalSettings?.globalThemeId || 'dark_lime',
      customBgColor: slide.customBgColor,
      customAccentColor: slide.customAccentColor,
      customHeadlineColor: slide.customHeadlineColor,
      customSubtextColor: slide.customSubtextColor,
      customBgType: slide.customBgType,
      customBgGradient: slide.customBgGradient,
    };

    if (onApplyThemeToAll) {
      onApplyThemeToAll(themeToApply);
      showToast(`Applied Slide #${slideIndex + 1}'s theme to all ${totalSlides} slides in project!`);
    }
  };

  const handleSyncWithGlobal = () => {
    onUpdateSlide(slideIndex, {
      themeId: globalSettings?.globalThemeId || 'dark_lime',
      customBgColor: undefined,
      customAccentColor: undefined,
      customHeadlineColor: undefined,
      customSubtextColor: undefined,
      customBgType: undefined,
      customBgGradient: undefined,
    });
    showToast(`Slide #${slideIndex + 1} synced with project global theme.`);
  };

  const wordCount = slide.headline ? slide.headline.trim().split(/\s+/).filter(Boolean).length : 0;
  const isHeadlineLong = wordCount > 10;

  return (
    <aside className="slide-editor-sidebar">
      {/* Top Inspector Mode Tabs: Active Slide vs Deck Global Settings */}
      <div className="inspector-tab-header">
        <button 
          className={`inspector-tab-btn ${activeTab === 'slide' ? 'active' : ''}`}
          onClick={() => setTab('slide')}
          title="Edit active slide content, headline, and image"
        >
          <Focus size={14} />
          <span>Slide #{slideIndex + 1}</span>
        </button>

        <button 
          className={`inspector-tab-btn tab-global-highlight ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => setTab('global')}
          title="Edit project-wide themes, fonts, framing, and bulk settings"
        >
          <Globe size={14} className="text-lime" />
          <span>Global Settings (All {totalSlides})</span>
        </button>
      </div>

      {activeTab === 'global' ? (
        <div className="editor-scroll-area">
          <DeckGlobalEditor 
            slidesCount={totalSlides}
            globalSettings={globalSettings}
            onUpdateGlobalSettings={onUpdateGlobalSettings}
            onRandomizeAllThemes={onRandomizeAllThemes}
            onApplyThemeToAllSlides={onApplyThemeToAllSlides}
            onSetGlobalImageFit={onSetGlobalImageFit}
            onResetAllFocalPoints={onResetAllFocalPoints}
            onForceSyncAllSlides={onForceSyncAllSlides}
            onClearAllImages={onClearAllImages}
            onResetAllFrameLabels={onResetAllFrameLabels}
            onResetPreferences={onResetPreferences}
            onResetDeckToBlank={onResetDeckToBlank}
            showToast={showToast}
          />
        </div>
      ) : (
        <>
          <div className="editor-panel-header">
            <div className="editor-header-title">
              <span className="editor-badge">SLIDE #{slideIndex + 1}</span>
              <span className="editor-heading">INSPECTOR</span>
            </div>
            <span className="editor-frame-label">
              {resolvedFrame}
            </span>
          </div>

          <div className="editor-scroll-area">
            {/* Section 0: Poster Layout Design Template */}
            <div className="editor-section">
              <div className="section-title">
                <Layout size={14} className="text-accent" />
                <span>POSTER DESIGN TEMPLATE</span>
              </div>

              <div className="input-group">
                <select 
                  className="text-input text-xs w-full font-semibold"
                  value={slide.templateId || ''}
                  onChange={(e) => onUpdateSlide(slideIndex, { templateId: e.target.value || undefined })}
                >
                  <option value="">Inherit Deck Template ({POSTER_LAYOUT_TEMPLATES[globalSettings?.globalTemplateId || 'classic_studio']?.name})</option>
                  {Object.values(POSTER_LAYOUT_TEMPLATES).map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>{tpl.name} - {tpl.badge}</option>
                  ))}
                </select>
                <span className="text-xs text-muted mt-1 block">
                  {slide.templateId 
                    ? POSTER_LAYOUT_TEMPLATES[slide.templateId]?.desc 
                    : `Using deck default: ${POSTER_LAYOUT_TEMPLATES[globalSettings?.globalTemplateId || 'classic_studio']?.name}`}
                </span>
              </div>
            </div>

            {/* Section 1: Card / Poster Visual Theme */}
            <div className="editor-section">
              <div className="section-title">
                <Palette size={14} className="text-accent" />
                <span>CARD THEME &amp; GRADIENTS</span>
              </div>

              {/* Global Theme Mode Notice */}
              <div className="slide-theme-mode-notice">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">
                    Deck Mode: <strong className="text-pure uppercase">{globalSettings?.themeMode || 'uniform'}</strong>
                  </span>
                  <button 
                    className="text-accent underline text-xs hover:text-pure"
                    onClick={() => setTab('global')}
                  >
                    Edit All Slides &rarr;
                  </button>
                </div>
              </div>

              <div className="theme-chips-grid mt-2">
                {Object.values(POSTER_THEMES).map((th) => {
                  const isSelected = (!slide.themeId && th.id === (globalSettings?.globalThemeId || 'dark_lime')) || slide.themeId === th.id;
                  return (
                    <button
                      key={th.id}
                      className={`theme-chip-card ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectTheme(th.id)}
                      title={th.name}
                    >
                      <div 
                        className="theme-chip-swatch"
                        style={{
                          background: th.bgType === 'gradient' && th.bgGradient
                            ? `linear-gradient(${th.bgGradient.angle || 135}deg, ${th.bgGradient.from}, ${th.bgGradient.to})`
                            : th.bgColor
                        }}
                      >
                        <span 
                          className="theme-chip-dot" 
                          style={{ background: th.accentColor }} 
                        />
                      </div>
                      <span className="theme-chip-name">{th.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="theme-actions-row">
                <button 
                  className="btn btn-secondary btn-xs flex-1 justify-center"
                  onClick={() => setShowCustomColors(!showCustomColors)}
                >
                  <Sliders size={12} />
                  <span>{showCustomColors ? 'Hide Colors' : 'Custom Palette'}</span>
                </button>

                <button 
                  className="btn btn-primary btn-xs flex-1 justify-center"
                  onClick={handleApplyCurrentToAll}
                  title="Apply current theme & colors to all slides in deck"
                >
                  <Layers size={12} />
                  <span>Apply to All Cards</span>
                </button>
              </div>

              {/* Custom Palette Pickers */}
              {showCustomColors && (
                <div className="custom-colors-box space-y-2 mt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-muted">Card Background</label>
                    <input 
                      type="color" 
                      value={currentTheme.bgColor || '#0B0B0B'}
                      onChange={(e) => onUpdateSlide(slideIndex, { customBgColor: e.target.value, customBgType: 'solid' })}
                      className="color-picker-input"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-muted">Accent Color (Rule &amp; Frame)</label>
                    <input 
                      type="color" 
                      value={currentTheme.accentColor || '#CDFF3C'}
                      onChange={(e) => onUpdateSlide(slideIndex, { customAccentColor: e.target.value })}
                      className="color-picker-input"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-muted">Headline Color</label>
                    <input 
                      type="color" 
                      value={currentTheme.headlineColor || '#FFFFFF'}
                      onChange={(e) => onUpdateSlide(slideIndex, { customHeadlineColor: e.target.value })}
                      className="color-picker-input"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-muted">Subtext Color</label>
                    <input 
                      type="color" 
                      value={currentTheme.subtextColor || '#D8D8D8'}
                      onChange={(e) => onUpdateSlide(slideIndex, { customSubtextColor: e.target.value })}
                      className="color-picker-input"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 1: Image Panel Settings */}
            <div className="editor-section">
              <div className="section-title">
                <ImageIcon size={14} className="text-accent" />
                <span>IMAGE ATTACHMENT</span>
              </div>

              {slide.image ? (
                <div className="attached-image-container">
                  <div className="image-preview-card">
                    <img src={slide.image} alt="Slide preview" className="attached-img-thumb" />
                    <button 
                      className="btn-remove-img"
                      onClick={() => onUpdateSlide(slideIndex, { image: null })}
                      title="Remove Image"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </div>

                  {/* Fit Toggle */}
                  <div className="input-group">
                    <label className="input-label">Image Fit Mode</label>
                    <div className="toggle-pill-group">
                      <button 
                        className={`pill-btn ${(!slide.fit || slide.fit === 'cover') ? 'active' : ''}`}
                        onClick={() => onUpdateSlide(slideIndex, { fit: 'cover' })}
                      >
                        Cover (Crop Fill)
                      </button>
                      <button 
                        className={`pill-btn ${slide.fit === 'contain' ? 'active' : ''}`}
                        onClick={() => onUpdateSlide(slideIndex, { fit: 'contain' })}
                      >
                        Contain (Full Image)
                      </button>
                    </div>
                  </div>

                  {/* Focal Point Slider */}
                  {(!slide.fit || slide.fit === 'cover') && (
                    <div className="input-group">
                      <div className="label-with-value">
                        <label className="input-label">Vertical Focal Point</label>
                        <span className="value-tag">{slide.focal != null ? slide.focal : 50}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={slide.focal != null ? slide.focal : 50}
                        onChange={(e) => onUpdateSlide(slideIndex, { focal: parseInt(e.target.value, 10) })}
                        className="slider-input"
                      />
                      <div className="slider-hints">
                        <span>0% (Top)</span>
                        <span>50% (Center)</span>
                        <span>100% (Bottom)</span>
                      </div>
                    </div>
                  )}

                  {/* Image Credit */}
                  <div className="input-group">
                    <label className="input-label">Image Credit / Source</label>
                    <input 
                      type="text" 
                      value={slide.credit || ''} 
                      placeholder="e.g. Photo: OpenAI / TechCrunch"
                      onChange={(e) => onUpdateSlide(slideIndex, { credit: e.target.value })}
                      className="text-input"
                    />
                  </div>
                </div>
              ) : (
                <div className="image-uploader-block">
                  {/* Drop Zone */}
                  <label 
                    className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <Upload size={22} className="upload-icon" />
                    <span className="drop-main-text">Upload Image File</span>
                    <span className="drop-sub-text">Drag & drop or click to browse</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }} 
                    />
                  </label>

                  {/* URL Input */}
                  <div className="url-attach-row">
                    <div className="url-input-wrapper">
                      <LinkIcon size={14} className="url-icon" />
                      <input 
                        type="url" 
                        value={imageUrlInput}
                        placeholder="Or paste internet image URL (https://...)"
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAttachUrl()}
                        className="url-input"
                      />
                    </div>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={handleAttachUrl}
                      disabled={isFetchingUrl || !imageUrlInput.trim()}
                    >
                      {isFetchingUrl ? 'Fetching...' : 'Attach'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Headline Copy */}
            <div className="editor-section">
              <div className="section-title">
                <Type size={14} className="text-accent" />
                <span>HEADLINE COPY</span>
              </div>

              <div className="input-group">
                <div className="label-with-value">
                  <label className="input-label">Headline ({slide.fontChoice || globalSettings?.globalFontChoice || 'Anton'})</label>
                  <span className={`count-tag ${isHeadlineLong ? 'warning' : ''}`}>
                    {wordCount} words {isHeadlineLong ? '(recommended < 10)' : ''}
                  </span>
                </div>
                <textarea 
                  rows={3}
                  value={slide.headline || ''}
                  placeholder="Bold punchy headline under 10 words..."
                  onChange={(e) => onUpdateSlide(slideIndex, { headline: e.target.value })}
                  className="text-area headline-area"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Headline Font Style</label>
                <div className="toggle-pill-group">
                  <button 
                    className={`pill-btn ${(!slide.fontChoice || slide.fontChoice === 'Anton') ? 'active' : ''}`}
                    onClick={() => onUpdateSlide(slideIndex, { fontChoice: 'Anton' })}
                  >
                    Anton
                  </button>
                  <button 
                    className={`pill-btn ${slide.fontChoice === 'Archivo Black' ? 'active' : ''}`}
                    onClick={() => onUpdateSlide(slideIndex, { fontChoice: 'Archivo Black' })}
                  >
                    Archivo Black
                  </button>
                  <button 
                    className={`pill-btn ${slide.fontChoice === 'Space Mono' ? 'active' : ''}`}
                    onClick={() => onUpdateSlide(slideIndex, { fontChoice: 'Space Mono' })}
                  >
                    Space Mono
                  </button>
                  <button 
                    className={`pill-btn ${slide.fontChoice === 'Montserrat' ? 'active' : ''}`}
                    onClick={() => onUpdateSlide(slideIndex, { fontChoice: 'Montserrat' })}
                  >
                    Montserrat
                  </button>
                </div>
              </div>
            </div>

            {/* Section 3: Subtext Copy */}
            <div className="editor-section">
              <div className="section-title">
                <Type size={14} className="text-accent" />
                <span>SUBTEXT / ROAST</span>
              </div>

              <div className="input-group">
                <label className="input-label">Subtext (Inter Regular)</label>
                <textarea 
                  rows={4}
                  value={slide.subtext || ''}
                  placeholder="2-4 short lines summarizing the story with a joke or witty twist..."
                  onChange={(e) => onUpdateSlide(slideIndex, { subtext: e.target.value })}
                  className="text-area subtext-area"
                />
              </div>
            </div>

            {/* Section 4: Frame & Styling Options */}
            <div className="editor-section">
              <div className="section-title">
                <Tag size={14} className="text-accent" />
                <span>FRAME &amp; LABEL OVERRIDE</span>
              </div>

              {/* Per-Slide Frame Toggle */}
              <div className="flex justify-between items-center p-2 rounded bg-subtle border border-border mb-2">
                <span className="text-xs text-pure">Show Frame Number on this slide</span>
                <input 
                  type="checkbox" 
                  checked={slide.showFrameLabel !== false && (slide.showFrameLabel === true || globalSettings?.globalShowFrameLabel !== false)}
                  onChange={(e) => {
                    onUpdateSlide(slideIndex, { showFrameLabel: e.target.checked });
                    showToast(e.target.checked ? 'Frame label enabled for slide.' : 'Frame label hidden on this slide.');
                  }}
                  className="accent-checkbox"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Custom Frame Label (Overrides project global pattern)</label>
                <input 
                  type="text" 
                  value={slide.frameLabel || ''} 
                  placeholder={`e.g. ${resolvedFrame || 'INTRO, BONUS, etc.'}`}
                  onChange={(e) => onUpdateSlide(slideIndex, { frameLabel: e.target.value })}
                  className="text-input"
                />
              </div>
            </div>

            {/* Section 5: Watermark & Brand Override */}
            <div className="editor-section">
              <div className="section-title">
                <Stamp size={14} className="text-accent" />
                <span>SLIDE WATERMARK (OPTIONAL)</span>
              </div>

              <div className="input-group">
                <label className="input-label">Custom Slide Watermark Text</label>
                <input 
                  type="text" 
                  value={slide.watermarkText || ''} 
                  placeholder={globalSettings?.watermarkText ? `Default: ${globalSettings.watermarkText}` : 'e.g. @yourhandle'}
                  onChange={(e) => onUpdateSlide(slideIndex, { watermarkText: e.target.value })}
                  className="text-input"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
