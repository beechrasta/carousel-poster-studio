import React, { useState } from 'react';
import { 
  Palette, 
  Dices, 
  Type, 
  ImageIcon, 
  Sliders, 
  Layers, 
  Check, 
  Sparkles, 
  Tag, 
  RotateCcw, 
  Trash2, 
  ListOrdered, 
  Shuffle, 
  Eye, 
  SlidersHorizontal, 
  Wand2,
  Layout,
  Stamp,
  ShieldCheck,
  EyeOff
} from 'lucide-react';
import { 
  POSTER_THEMES, 
  THEME_KEYS, 
  POSTER_LAYOUT_TEMPLATES, 
  TEMPLATE_KEYS 
} from '../utils/canvasRenderer';

export default function DeckGlobalEditor({
  slidesCount,
  globalSettings,
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
  const [showCustomColors, setShowCustomColors] = useState(false);
  const [customBgType, setCustomBgType] = useState('solid'); // 'solid' | 'gradient'
  const [customGradientAngle, setCustomGradientAngle] = useState(135);

  const activeMode = globalSettings?.themeMode || 'uniform';
  const activeGlobalThemeId = globalSettings?.globalThemeId || 'dark_lime';
  const activeSecondaryThemeId = globalSettings?.secondaryThemeId || 'neon_cyber';
  const activeTemplateId = globalSettings?.globalTemplateId || 'classic_studio';

  const handleSelectThemeMode = (mode) => {
    onUpdateGlobalSettings({ themeMode: mode });
    if (mode === 'random') {
      showToast('Deck set to dynamic random theme variations.');
    } else if (mode === 'uniform') {
      showToast('All slides synced to uniform deck theme.');
    } else if (mode === 'alternating') {
      showToast('Deck set to alternating two-theme cycle.');
    } else if (mode === 'rainbow') {
      showToast('Deck set to 7-theme rainbow spectrum flow.');
    } else if (mode === 'individual') {
      showToast('Deck set to individual slide customization mode.');
    }
  };

  const handleChooseUniformTheme = (themeId) => {
    onUpdateGlobalSettings({
      globalThemeId: themeId,
      themeMode: 'uniform',
      customBgColor: undefined,
      customAccentColor: undefined,
      customHeadlineColor: undefined,
      customSubtextColor: undefined,
      customBgType: undefined,
      customBgGradient: undefined,
    });
    if (onApplyThemeToAllSlides) {
      onApplyThemeToAllSlides(themeId);
    }
    showToast(`Applied ${POSTER_THEMES[themeId]?.name || 'theme'} to all ${slidesCount} slides!`);
  };

  const handleSelectTemplate = (templateKey) => {
    onUpdateGlobalSettings({ globalTemplateId: templateKey });
    showToast(`Applied "${POSTER_LAYOUT_TEMPLATES[templateKey]?.name}" layout to entire deck.`);
  };

  const handleShuffleDice = () => {
    if (onRandomizeAllThemes) {
      onRandomizeAllThemes();
      showToast(`🎲 Shuffled random vibrant themes across all ${slidesCount} slides!`);
    }
  };

  const handleApplyCustomColors = () => {
    const bgVal = globalSettings?.customBgColor || '#0B0B0B';
    const accentVal = globalSettings?.customAccentColor || '#CDFF3C';
    const headVal = globalSettings?.customHeadlineColor || '#FFFFFF';
    const subVal = globalSettings?.customSubtextColor || '#D8D8D8';

    const updates = {
      themeMode: 'uniform',
      customBgColor: bgVal,
      customAccentColor: accentVal,
      customHeadlineColor: headVal,
      customSubtextColor: subVal,
    };

    if (customBgType === 'gradient') {
      updates.customBgType = 'gradient';
      updates.customBgGradient = {
        from: bgVal,
        to: globalSettings?.customGradientTo || '#1F0C38',
        angle: customGradientAngle,
      };
    } else {
      updates.customBgType = 'solid';
      updates.customBgGradient = undefined;
    }

    onUpdateGlobalSettings(updates);
    showToast(`Custom color palette applied to all ${slidesCount} slides!`);
  };

  return (
    <div className="deck-global-editor-panel">
      {/* Quick Hero Banner */}
      <div className="global-hero-banner">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-xs font-bold text-pure uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-lime" />
              <span>Bulk Deck Controls</span>
            </h4>
            <span className="text-xs text-muted">Editing all {slidesCount} cards together</span>
          </div>
          <button 
            className="btn btn-batch-hero btn-sm"
            onClick={handleShuffleDice}
            title="Randomize themes & colors across all slides"
          >
            <Dices size={14} className="text-lime" />
            <span>Roll Random Themes</span>
          </button>
        </div>
      </div>

      {/* Section 1: Poster Design Layout Templates */}
      <div className="editor-section">
        <div className="section-title">
          <Layout size={14} className="text-accent" />
          <span>POSTER DESIGN TEMPLATES (LAYOUT STYLE)</span>
        </div>

        <div className="template-cards-grid">
          {Object.values(POSTER_LAYOUT_TEMPLATES).map((tpl) => {
            const isSelected = activeTemplateId === tpl.id;
            return (
              <div 
                key={tpl.id}
                className={`template-selector-card ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectTemplate(tpl.id)}
              >
                <div className="template-card-header">
                  <span className="template-card-name">{tpl.name}</span>
                  <span className="template-card-badge">{tpl.badge}</span>
                </div>
                <p className="template-card-desc">{tpl.desc}</p>
                {isSelected && (
                  <div className="template-selected-indicator">
                    <Check size={12} />
                    <span>Active Deck Layout</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Deck Theme Synchronization Mode */}
      <div className="editor-section">
        <div className="section-title">
          <Palette size={14} className="text-accent" />
          <span>CARD THEME &amp; COLOR MODE</span>
        </div>

        <div className="theme-mode-pill-grid">
          <button 
            className={`mode-btn ${activeMode === 'uniform' ? 'active' : ''}`}
            onClick={() => handleSelectThemeMode('uniform')}
            title="Apply the exact same theme across all cards"
          >
            <span className="mode-btn-title">Same Theme</span>
            <span className="mode-btn-sub">Uniform for all</span>
          </button>

          <button 
            className={`mode-btn ${activeMode === 'random' ? 'active' : ''}`}
            onClick={() => handleSelectThemeMode('random')}
            title="Randomize vibrant themes across all cards"
          >
            <span className="mode-btn-title">Random Colors</span>
            <span className="mode-btn-sub">Vibrant mix</span>
          </button>

          <button 
            className={`mode-btn ${activeMode === 'alternating' ? 'active' : ''}`}
            onClick={() => handleSelectThemeMode('alternating')}
            title="Alternate between 2 selected themes across the deck"
          >
            <span className="mode-btn-title">Alternating</span>
            <span className="mode-btn-sub">2-theme loop</span>
          </button>

          <button 
            className={`mode-btn ${activeMode === 'rainbow' ? 'active' : ''}`}
            onClick={() => handleSelectThemeMode('rainbow')}
            title="Cycle through 7 themes sequentially"
          >
            <span className="mode-btn-title">Rainbow Flow</span>
            <span className="mode-btn-sub">7-theme cycle</span>
          </button>

          <button 
            className={`mode-btn ${activeMode === 'individual' ? 'active' : ''}`}
            onClick={() => handleSelectThemeMode('individual')}
            title="Configure themes individually per slide"
          >
            <span className="mode-btn-title">Individual</span>
            <span className="mode-btn-sub">Per-slide styles</span>
          </button>
        </div>

        {/* Preset Theme Swatches */}
        {activeMode === 'uniform' && (
          <div className="mt-3">
            <label className="input-label mb-2 block">
              Pick Deck-Wide Theme (Instantly applies to all {slidesCount} cards)
            </label>
            <div className="theme-chips-grid">
              {Object.values(POSTER_THEMES).map((th) => {
                const isSelected = activeGlobalThemeId === th.id;
                return (
                  <button
                    key={th.id}
                    className={`theme-chip-card ${isSelected ? 'active' : ''}`}
                    onClick={() => handleChooseUniformTheme(th.id)}
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
          </div>
        )}

        {/* Custom Deck Colors Toggle */}
        <div className="mt-3">
          <button 
            className="btn btn-secondary btn-xs w-full justify-center"
            onClick={() => setShowCustomColors(!showCustomColors)}
          >
            <Sliders size={12} />
            <span>{showCustomColors ? 'Hide Custom Deck Palette' : 'Custom Palette (All Cards)'}</span>
          </button>
        </div>

        {/* Global Custom Palette Pickers */}
        {showCustomColors && (
          <div className="custom-colors-box space-y-2 mt-2 p-2.5 border border-border rounded-lg bg-surface">
            <div className="flex justify-between items-center">
              <label className="text-xs text-muted">Card Background</label>
              <input 
                type="color" 
                value={globalSettings?.customBgColor || '#0B0B0B'}
                onChange={(e) => onUpdateGlobalSettings({ customBgColor: e.target.value, themeMode: 'uniform' })}
                className="color-picker-input"
              />
            </div>
            <div className="flex justify-between items-center">
              <label className="text-xs text-muted">Accent Color (Rule &amp; Frame)</label>
              <input 
                type="color" 
                value={globalSettings?.customAccentColor || '#CDFF3C'}
                onChange={(e) => onUpdateGlobalSettings({ customAccentColor: e.target.value, themeMode: 'uniform' })}
                className="color-picker-input"
              />
            </div>
            <div className="flex justify-between items-center">
              <label className="text-xs text-muted">Headline Color</label>
              <input 
                type="color" 
                value={globalSettings?.customHeadlineColor || '#FFFFFF'}
                onChange={(e) => onUpdateGlobalSettings({ customHeadlineColor: e.target.value, themeMode: 'uniform' })}
                className="color-picker-input"
              />
            </div>
            <div className="flex justify-between items-center">
              <label className="text-xs text-muted">Subtext Color</label>
              <input 
                type="color" 
                value={globalSettings?.customSubtextColor || '#D8D8D8'}
                onChange={(e) => onUpdateGlobalSettings({ customSubtextColor: e.target.value, themeMode: 'uniform' })}
                className="color-picker-input"
              />
            </div>

            <button 
              className="btn btn-primary btn-xs w-full justify-center mt-2"
              onClick={handleApplyCustomColors}
            >
              <Check size={12} />
              <span>Apply Custom Colors to All Cards</span>
            </button>
          </div>
        )}
      </div>

      {/* Section 3: Global Frame & Optional Label Formatting */}
      <div className="editor-section">
        <div className="section-title">
          <Tag size={14} className="text-accent" />
          <span>FRAME NUMBERS &amp; LABELS</span>
        </div>

        {/* Optional Frame Label Switch */}
        <div className="flex justify-between items-center p-2.5 rounded bg-subtle border border-border mb-3">
          <div>
            <span className="text-xs font-semibold text-pure block">Show Frame Numbers on Cards</span>
            <span className="text-xs text-muted">Optional: toggle off for clean, unnumbered posters</span>
          </div>
          <input 
            type="checkbox" 
            checked={globalSettings?.globalShowFrameLabel !== false && globalSettings?.globalFrameFormat !== 'none'}
            onChange={(e) => {
              onUpdateGlobalSettings({ 
                globalShowFrameLabel: e.target.checked,
                globalFrameFormat: e.target.checked ? (globalSettings?.globalFrameFormat === 'none' ? 'frame' : globalSettings?.globalFrameFormat) : 'none'
              });
              showToast(e.target.checked ? 'Frame labels enabled.' : 'Frame labels hidden across deck.');
            }}
            className="accent-checkbox"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Frame Label Pattern</label>
          <div className="toggle-pill-group">
            <button 
              className={`pill-btn ${(globalSettings?.globalFrameFormat === 'none' || globalSettings?.globalShowFrameLabel === false) ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalFrameFormat: 'none', globalShowFrameLabel: false });
                showToast('Frame numbers hidden across deck.');
              }}
            >
              <EyeOff size={11} className="inline mr-1" />
              None (Hidden)
            </button>
            <button 
              className={`pill-btn ${(!globalSettings?.globalFrameFormat || globalSettings.globalFrameFormat === 'frame') && globalSettings?.globalShowFrameLabel !== false ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalFrameFormat: 'frame', globalShowFrameLabel: true });
                showToast('Frame format: FRAME 01, FRAME 02...');
              }}
            >
              FRAME 01
            </button>
            <button 
              className={`pill-btn ${globalSettings?.globalFrameFormat === 'count' ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalFrameFormat: 'count', globalShowFrameLabel: true });
                showToast(`Frame format: 01 / ${String(slidesCount).padStart(2, '0')}...`);
              }}
            >
              01 / {String(slidesCount).padStart(2, '0')}
            </button>
            <button 
              className={`pill-btn ${globalSettings?.globalFrameFormat === 'slide' ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalFrameFormat: 'slide', globalShowFrameLabel: true });
                showToast('Frame format: SLIDE 01...');
              }}
            >
              SLIDE 01
            </button>
            <button 
              className={`pill-btn ${globalSettings?.globalFrameFormat === 'news' ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalFrameFormat: 'news', globalShowFrameLabel: true });
                showToast('Frame format: NEWS #01...');
              }}
            >
              NEWS #01
            </button>
            <button 
              className={`pill-btn ${globalSettings?.globalFrameFormat === 'step' ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalFrameFormat: 'step', globalShowFrameLabel: true });
                showToast('Frame format: STEP 01...');
              }}
            >
              STEP 01
            </button>
          </div>
        </div>

        {/* Custom Frame Prefix */}
        <div className="input-group">
          <label className="input-label">Custom Frame Label Prefix (Optional)</label>
          <input 
            type="text" 
            className="text-input"
            placeholder="e.g. TECH DROP, STORY, ROUNDUP"
            value={globalSettings?.globalFramePrefix || ''}
            onChange={(e) => {
              onUpdateGlobalSettings({ 
                globalFramePrefix: e.target.value,
                globalFrameFormat: e.target.value ? 'prefix' : 'frame',
                globalShowFrameLabel: true
              });
            }}
          />
        </div>

        {/* Toggle Accent Rule Bar */}
        <div className="flex justify-between items-center mt-2 p-2 rounded bg-subtle border border-border">
          <span className="text-xs text-pure">Show 60px Accent Rule Line</span>
          <input 
            type="checkbox" 
            checked={globalSettings?.globalShowAccentRule !== false}
            onChange={(e) => {
              onUpdateGlobalSettings({ globalShowAccentRule: e.target.checked });
              showToast(e.target.checked ? 'Accent rule enabled.' : 'Accent rule hidden.');
            }}
            className="accent-checkbox"
          />
        </div>
      </div>

      {/* Section 4: Light Watermark & Brand Handle */}
      <div className="editor-section">
        <div className="section-title">
          <Stamp size={14} className="text-accent" />
          <span>LIGHT WATERMARK &amp; BRAND HANDLE</span>
        </div>

        <div className="input-group">
          <div className="flex justify-between items-center mb-1">
            <label className="input-label font-semibold">Watermark / Handle Text</label>
            <span className="text-xs text-muted">Subtle creator watermark</span>
          </div>
          <input 
            type="text" 
            className="text-input"
            placeholder="e.g. @yourhandle, CAROUSEL STUDIO, technews.ai"
            value={globalSettings?.watermarkText || ''}
            onChange={(e) => onUpdateGlobalSettings({ 
              watermarkText: e.target.value,
              watermarkEnabled: Boolean(e.target.value.trim())
            })}
          />
          <div className="flex gap-1 mt-1">
            <span className="text-xs text-muted mr-1">Presets:</span>
            <button 
              className="btn-preset-link"
              onClick={() => onUpdateGlobalSettings({ watermarkText: '@carouselstudio', watermarkEnabled: true })}
            >
              @carouselstudio
            </button>
            <button 
              className="btn-preset-link"
              onClick={() => onUpdateGlobalSettings({ watermarkText: 'TECH ROAST', watermarkEnabled: true })}
            >
              TECH ROAST
            </button>
            <button 
              className="btn-preset-link"
              onClick={() => onUpdateGlobalSettings({ watermarkText: '', watermarkEnabled: false })}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Watermark Position */}
        <div className="input-group">
          <label className="input-label">Watermark Position</label>
          <div className="toggle-pill-group">
            <button 
              className={`pill-btn ${(!globalSettings?.watermarkPosition || globalSettings.watermarkPosition === 'bottom_right') ? 'active' : ''}`}
              onClick={() => onUpdateGlobalSettings({ watermarkPosition: 'bottom_right' })}
            >
              Bottom Right
            </button>
            <button 
              className={`pill-btn ${globalSettings?.watermarkPosition === 'top_right' ? 'active' : ''}`}
              onClick={() => onUpdateGlobalSettings({ watermarkPosition: 'top_right' })}
            >
              Top Right
            </button>
            <button 
              className={`pill-btn ${globalSettings?.watermarkPosition === 'bottom_left' ? 'active' : ''}`}
              onClick={() => onUpdateGlobalSettings({ watermarkPosition: 'bottom_left' })}
            >
              Bottom Left
            </button>
            <button 
              className={`pill-btn ${globalSettings?.watermarkPosition === 'top_left' ? 'active' : ''}`}
              onClick={() => onUpdateGlobalSettings({ watermarkPosition: 'top_left' })}
            >
              Top Left
            </button>
            <button 
              className={`pill-btn ${globalSettings?.watermarkPosition === 'center_stamp' ? 'active' : ''}`}
              onClick={() => onUpdateGlobalSettings({ watermarkPosition: 'center_stamp' })}
            >
              Center Stamp
            </button>
          </div>
        </div>

        {/* Watermark Style & Opacity */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="input-label">Badge Style</label>
            <select 
              className="text-input text-xs w-full"
              value={globalSettings?.watermarkStyle || 'pill'}
              onChange={(e) => onUpdateGlobalSettings({ watermarkStyle: e.target.value })}
            >
              <option value="pill">Glass Pill Badge</option>
              <option value="text">Minimal Text Only</option>
              <option value="center_stamp">Diagonal Stamp</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="input-label">Opacity</label>
              <span className="text-xs font-mono text-muted">{Math.round((globalSettings?.watermarkOpacity ?? 0.28) * 100)}%</span>
            </div>
            <input 
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={globalSettings?.watermarkOpacity ?? 0.28}
              onChange={(e) => onUpdateGlobalSettings({ watermarkOpacity: parseFloat(e.target.value) })}
              className="w-full accent-lime"
            />
          </div>
        </div>
      </div>

      {/* Section 5: Global Typography & Casing */}
      <div className="editor-section">
        <div className="section-title">
          <Type size={14} className="text-accent" />
          <span>GLOBAL TYPOGRAPHY (ALL CARDS)</span>
        </div>

        <div className="input-group">
          <label className="input-label">Headline Font Style</label>
          <div className="toggle-pill-group">
            <button 
              className={`pill-btn ${(!globalSettings?.globalFontChoice || globalSettings.globalFontChoice === 'Anton') ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalFontChoice: 'Anton' });
                showToast('Set Anton font for all slides.');
              }}
            >
              Anton
            </button>
            <button 
              className={`pill-btn ${globalSettings?.globalFontChoice === 'Archivo Black' ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalFontChoice: 'Archivo Black' });
                showToast('Set Archivo Black font for all slides.');
              }}
            >
              Archivo Black
            </button>
            <button 
              className={`pill-btn ${globalSettings?.globalFontChoice === 'Space Mono' ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalFontChoice: 'Space Mono' });
                showToast('Set Space Mono font for all slides.');
              }}
            >
              Space Mono
            </button>
            <button 
              className={`pill-btn ${globalSettings?.globalFontChoice === 'Montserrat' ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalFontChoice: 'Montserrat' });
                showToast('Set Montserrat font for all slides.');
              }}
            >
              Montserrat
            </button>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Headline Text Casing</label>
          <div className="toggle-pill-group">
            <button 
              className={`pill-btn ${(!globalSettings?.globalHeadlineCase || globalSettings.globalHeadlineCase === 'normal') ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalHeadlineCase: 'normal' });
                showToast('Headline casing: Original.');
              }}
            >
              Original Casing
            </button>
            <button 
              className={`pill-btn ${globalSettings?.globalHeadlineCase === 'uppercase' ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalHeadlineCase: 'uppercase' });
                showToast('Headline casing: ALL UPPERCASE.');
              }}
            >
              ALL UPPERCASE
            </button>
            <button 
              className={`pill-btn ${globalSettings?.globalHeadlineCase === 'titlecase' ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalHeadlineCase: 'titlecase' });
                showToast('Headline casing: Title Case.');
              }}
            >
              Title Case
            </button>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Subtext Font Sizing</label>
          <div className="toggle-pill-group">
            <button 
              className={`pill-btn ${globalSettings?.globalSubtextSize === 'compact' ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalSubtextSize: 'compact' });
                showToast('Subtext size: Compact (30px).');
              }}
            >
              Compact
            </button>
            <button 
              className={`pill-btn ${(!globalSettings?.globalSubtextSize || globalSettings.globalSubtextSize === 'normal') ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalSubtextSize: 'normal' });
                showToast('Subtext size: Standard (36px).');
              }}
            >
              Standard
            </button>
            <button 
              className={`pill-btn ${globalSettings?.globalSubtextSize === 'large' ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalSubtextSize: 'large' });
                showToast('Subtext size: Large (42px).');
              }}
            >
              Large
            </button>
          </div>
        </div>
      </div>

      {/* Section 6: Global Image Fit & Credit Controls */}
      <div className="editor-section">
        <div className="section-title">
          <ImageIcon size={14} className="text-accent" />
          <span>GLOBAL IMAGE CONTROLS</span>
        </div>

        <div className="input-group">
          <label className="input-label">Default Image Fit (All Slides)</label>
          <div className="toggle-pill-group">
            <button 
              className={`pill-btn ${(!globalSettings?.globalImageFit || globalSettings.globalImageFit === 'cover') ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalImageFit: 'cover' });
                if (onSetGlobalImageFit) onSetGlobalImageFit('cover');
                showToast('Set Cover Fit (Crop Fill) for all slides.');
              }}
            >
              Cover (Crop Fill)
            </button>
            <button 
              className={`pill-btn ${globalSettings?.globalImageFit === 'contain' ? 'active' : ''}`}
              onClick={() => {
                onUpdateGlobalSettings({ globalImageFit: 'contain' });
                if (onSetGlobalImageFit) onSetGlobalImageFit('contain');
                showToast('Set Contain Fit for all slides.');
              }}
            >
              Contain (Full Image)
            </button>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Default Image Credit / Source (Applied to all slides)</label>
          <input 
            type="text" 
            className="text-input"
            placeholder="e.g. Photo: OpenAI / TechCrunch"
            value={globalSettings?.globalCredit || ''}
            onChange={(e) => onUpdateGlobalSettings({ globalCredit: e.target.value })}
          />
        </div>
      </div>

      {/* Section 7: Bulk Slide Actions & Reset Utilities */}
      <div className="editor-section">
        <div className="section-title">
          <Layers size={14} className="text-accent" />
          <span>BULK DECK UTILITIES &amp; RESET</span>
        </div>

        <div className="space-y-2">
          <button 
            className="btn btn-secondary btn-xs w-full justify-center"
            onClick={() => {
              if (onResetAllFocalPoints) onResetAllFocalPoints();
              showToast('Reset all focal points to 50% Center.');
            }}
          >
            <RotateCcw size={12} />
            <span>Reset All Image Focal Points to 50%</span>
          </button>

          <button 
            className="btn btn-secondary btn-xs w-full justify-center"
            onClick={() => {
              if (onForceSyncAllSlides) onForceSyncAllSlides();
              showToast('Wiped individual overrides; all slides synced to deck settings.');
            }}
            title="Reset individual slide color & font overrides to match project global settings"
          >
            <Wand2 size={12} />
            <span>Force Sync All Slides to Deck Defaults</span>
          </button>

          <button 
            className="btn btn-secondary btn-xs w-full justify-center"
            onClick={() => {
              if (onResetAllFrameLabels) onResetAllFrameLabels();
              showToast('Reset all custom slide frame labels to sequence.');
            }}
          >
            <ListOrdered size={12} />
            <span>Reset All Frame Labels to Auto Sequence</span>
          </button>

          <button 
            className="btn btn-secondary btn-xs w-full justify-center"
            onClick={() => {
              if (onResetPreferences) onResetPreferences();
            }}
            title="Reset all themes, layout templates, typography, watermarks, and frame settings back to clean defaults"
          >
            <RotateCcw size={12} className="text-lime" />
            <span>Reset All Preferences to Defaults</span>
          </button>

          <button 
            className="btn btn-subtle-danger btn-xs w-full justify-center"
            onClick={() => {
              if (confirm('Remove all attached images from this deck (pure text posters)?')) {
                if (onClearAllImages) onClearAllImages();
                showToast('Cleared all images across deck.');
              }
            }}
          >
            <Trash2 size={12} />
            <span>Clear All Images (Pure Text Mode)</span>
          </button>

          <button 
            className="btn btn-subtle-danger btn-xs w-full justify-center"
            onClick={() => {
              if (confirm('Clear the entire deck and start fresh with 1 blank slide? (You can undo with Ctrl+Z)')) {
                if (onResetDeckToBlank) onResetDeckToBlank();
              }
            }}
            title="Wipe all slides in this deck and start fresh with 1 blank slide"
          >
            <Trash2 size={12} />
            <span>Clear All (Reset to Fresh Blank Slide)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
