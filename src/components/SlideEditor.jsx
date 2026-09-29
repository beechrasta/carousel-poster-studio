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
  Stamp,
  Search,
  Plus,
} from 'lucide-react';
import DeckGlobalEditor from './DeckGlobalEditor';
import ImagePickerModal from './ImagePickerModal';
import { fileToDataURL, urlToDataURL } from '../utils/exportEngine';
import { 
  POSTER_THEMES, 
  resolveSlideTheme, 
  resolveFrameLabel, 
  POSTER_LAYOUT_TEMPLATES,
  SLIDE_LAYOUTS,
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

  const [showCustomColors, setShowCustomColors] = useState(false);
  // Image Picker Modal state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlot, setPickerSlot] = useState(0); // which images[] index we're editing

  // Derived: active layout config
  const activeLayout = SLIDE_LAYOUTS[slide.layout || 'full_bleed'] || SLIDE_LAYOUTS.full_bleed;
  const imageSlots = activeLayout.imageSlots;

  // Helper: get images[] array, normalizing legacy single-image
  const getImages = () => {
    if (slide.images && slide.images.length > 0) return slide.images;
    if (slide.image) return [{ url: slide.image, fit: slide.fit || 'cover', focal: slide.focal != null ? slide.focal : 50, credit: slide.credit || '' }];
    return [];
  };

  // Update a specific image slot
  const handleSetSlotImage = (slotIdx, url, credit = '') => {
    const imgs = [...getImages()];
    while (imgs.length <= slotIdx) imgs.push({ url: null, fit: 'cover', focal: 50, credit: '' });
    imgs[slotIdx] = { ...imgs[slotIdx], url, credit: credit || imgs[slotIdx]?.credit || '' };
    onUpdateSlide(slideIndex, { images: imgs, image: imgs[0]?.url || null });
    showToast('Image attached.');
  };

  const handleRemoveSlotImage = (slotIdx) => {
    const imgs = [...getImages()];
    if (imgs[slotIdx]) imgs[slotIdx] = { ...imgs[slotIdx], url: null, credit: '' };
    onUpdateSlide(slideIndex, { images: imgs, image: imgs[0]?.url || null });
    showToast('Image removed.');
  };

  const handleUpdateSlotFocal = (slotIdx, val) => {
    const imgs = [...getImages()];
    while (imgs.length <= slotIdx) imgs.push({ url: null, fit: 'cover', focal: 50, credit: '' });
    imgs[slotIdx] = { ...imgs[slotIdx], focal: val };
    onUpdateSlide(slideIndex, { images: imgs });
  };

  const handleUpdateSlotCredit = (slotIdx, val) => {
    const imgs = [...getImages()];
    while (imgs.length <= slotIdx) imgs.push({ url: null, fit: 'cover', focal: 50, credit: '' });
    imgs[slotIdx] = { ...imgs[slotIdx], credit: val };
    onUpdateSlide(slideIndex, { images: imgs });
  };

  const openPicker = (slotIdx) => {
    setPickerSlot(slotIdx);
    setPickerOpen(true);
  };

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

            {/* Section 1: Layout + Images */}
            <div className="editor-section">
              <div className="section-title">
                <Layout size={14} className="text-accent" />
                <span>LAYOUT &amp; IMAGES</span>
              </div>

              {/* Layout Picker */}
              <div className="layout-picker-grid">
                {Object.values(SLIDE_LAYOUTS).map(layout => (
                  <button
                    key={layout.id}
                    className={`layout-pick-card ${(slide.layout || 'full_bleed') === layout.id ? 'active' : ''}`}
                    onClick={() => {
                      onUpdateSlide(slideIndex, { layout: layout.id });
                      showToast(`Layout: ${layout.name}`);
                    }}
                    title={layout.desc}
                  >
                    <span className="layout-pick-icon">{layout.icon}</span>
                    <span className="layout-pick-name">{layout.name}</span>
                    {layout.imageSlots > 0 && (
                      <span className="layout-pick-slots">{layout.imageSlots} photo{layout.imageSlots > 1 ? 's' : ''}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Image Slots */}
              {imageSlots === 0 ? (
                <div className="img-slot-notice">
                  <ImageIcon size={14} className="text-muted" />
                  <span className="text-xs text-muted">This layout uses no images — pure typography.</span>
                </div>
              ) : (
                <div className="img-slots-list">
                  {Array.from({ length: imageSlots }).map((_, slotIdx) => {
                    const imgs = getImages();
                    const slot = imgs[slotIdx];
                    const hasImg = !!slot?.url;
                    const slotLabel = imageSlots === 1 ? 'Background Image' :
                      slotIdx === 0 ? 'Primary Image' :
                      slotIdx === 1 ? 'Secondary Image' : `Image ${slotIdx + 1}`;
                    return (
                      <div key={slotIdx} className="img-slot-card">
                        <div className="img-slot-header">
                          <span className="text-xs font-semibold text-pure">{slotLabel}</span>
                          {hasImg && (
                            <button
                              className="btn-remove-img-xs"
                              onClick={() => handleRemoveSlotImage(slotIdx)}
                              title="Remove image"
                            >
                              <Trash2 size={11} /> Remove
                            </button>
                          )}
                        </div>

                        {hasImg ? (
                          <div className="img-slot-filled">
                            <img
                              src={slot.url}
                              alt="slot"
                              className="img-slot-thumb"
                              crossOrigin="anonymous"
                            />
                            <button
                              className="img-slot-change-btn"
                              onClick={() => openPicker(slotIdx)}
                            >
                              <Search size={12} /> Change Photo
                            </button>
                            {/* Focal point slider */}
                            <div className="input-group mt-1">
                              <div className="label-with-value">
                                <label className="input-label">Focal Point</label>
                                <span className="value-tag">{slot.focal != null ? slot.focal : 50}%</span>
                              </div>
                              <input
                                type="range"
                                min="0" max="100"
                                value={slot.focal != null ? slot.focal : 50}
                                onChange={e => handleUpdateSlotFocal(slotIdx, parseInt(e.target.value, 10))}
                                className="slider-input"
                              />
                            </div>
                            <div className="input-group mt-1">
                              <input
                                type="text"
                                className="text-input text-xs"
                                value={slot.credit || ''}
                                placeholder="Photo credit..."
                                onChange={e => handleUpdateSlotCredit(slotIdx, e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <button
                            className="img-slot-empty"
                            onClick={() => openPicker(slotIdx)}
                          >
                            <Search size={18} className="text-accent" />
                            <span className="text-sm text-pure font-semibold">Search &amp; Pick Photo</span>
                            <span className="text-xs text-muted">Unsplash · Upload · URL</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
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

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url, credit) => handleSetSlotImage(pickerSlot, url, credit)}
        slide={slide}
        slotLabel={
          activeLayout.imageSlots === 1 ? 'Background Image' :
          pickerSlot === 0 ? 'Primary Image' :
          pickerSlot === 1 ? 'Secondary Image' :
          `Image ${pickerSlot + 1}`
        }
      />
    </aside>
  );
}

