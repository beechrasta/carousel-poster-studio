import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Settings, 
  FileDown, 
  Upload, 
  Archive, 
  Layers, 
  Plus, 
  Zap,
  Terminal,
  FolderKanban,
  Sun,
  Moon,
  ChevronDown,
  Home,
  Layout,
  Globe,
  Undo2,
  Redo2,
  RotateCcw,
  Trash2,
  SlidersHorizontal,
  MoreVertical
} from 'lucide-react';

export default function Header({
  slidesCount,
  activeProjectName,
  theme,
  currentView, // 'home' | 'studio'
  onToggleView,
  onToggleTheme,
  onOpenProjectManager,
  onOpenBatchBuilder,
  onOpenNewsGenerator,
  onOpenGlobalSettings,
  onOpenSettings,
  onExportJSON,
  onImportJSON,
  onExportZIP,
  isGeneratingZIP,
  opencodeAvailable,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onResetPreferences,
  onResetDeckToBlank,
}) {
  const fileInputRef = useRef(null);
  const [showJsonMenu, setShowJsonMenu] = useState(false);
  const jsonMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (jsonMenuRef.current && !jsonMenuRef.current.contains(e.target)) {
        setShowJsonMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
      e.target.value = '';
      setShowJsonMenu(false);
    }
  };

  return (
    <header className="studio-header">
      {/* Left Section: Logo, View Pill, Project Selector & Quick Badges */}
      <div className="header-left">
        <div className="logo-group" onClick={() => onToggleView('home')} style={{ cursor: 'pointer' }} title="Go to Dashboard">
          <div className="logo-icon">
            <span className="logo-accent"></span>
          </div>
          <div className="logo-titles">
            <h1 className="logo-text">CAROUSEL POSTER STUDIO</h1>
            <span className="logo-sub">LOCAL POSTER ENGINE</span>
          </div>
        </div>

        {/* View Switcher: Home vs Studio */}
        <div className="view-switcher-pill">
          <button 
            className={`view-pill-btn ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => onToggleView('home')}
            title="Go to Home &amp; Templates Dashboard"
          >
            <Home size={13} />
            <span>Home</span>
          </button>
          <button 
            className={`view-pill-btn ${currentView === 'studio' ? 'active' : ''}`}
            onClick={() => onToggleView('studio')}
            title="Go to Canvas Poster Studio Editor"
          >
            <Layout size={13} />
            <span>Studio</span>
          </button>
        </div>

        {/* Project Selector Trigger */}
        <button 
          className="btn btn-project-trigger"
          onClick={onOpenProjectManager}
          title="Switch, Create, or Manage Projects"
        >
          <FolderKanban size={13} className="text-lime" />
          <span className="project-current-name">{activeProjectName || 'Default Project'}</span>
          <ChevronDown size={12} className="text-muted" />
        </button>

        {/* Undo & Redo Quick Buttons in Header */}
        {currentView === 'studio' && (
          <div className="undo-redo-btn-group">
            <button 
              className="btn btn-icon-subtle btn-undo"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo last action (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button 
              className="btn btn-icon-subtle btn-redo"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo action (Ctrl+Y)"
            >
              <Redo2 size={14} />
            </button>
          </div>
        )}

        <div className="header-badges">
          <span className="badge badge-dim" title={`${slidesCount} slides in current deck`}>
            <Layers size={11} className="badge-icon" />
            <strong className="badge-num">{slidesCount}</strong>
          </span>
          <span className="badge badge-accent" title="Canvas Resolution: 1080 x 1080 px">
            1080&times;1080
          </span>
          {opencodeAvailable && (
            <span className="badge badge-opencode" title="Opencode CLI detected locally">
              <Terminal size={11} className="badge-icon" />
              Opencode CLI
            </span>
          )}
        </div>
      </div>

      {/* Center Section: Primary Creation Actions */}
      <div className="header-center">
        <button 
          className="btn btn-batch-hero"
          onClick={onOpenBatchBuilder}
          title="Build deck all at once: paste stories + drop all images"
        >
          <Zap size={14} className="text-lime" />
          <span>All-At-Once Builder</span>
        </button>
        
        <button 
          className="btn btn-secondary btn-sm"
          onClick={onOpenNewsGenerator}
          title="Generate witty copy from news text using Opencode/Direct API/Ollama"
        >
          <Sparkles size={13} className="text-accent" />
          <span>News &rarr; Slides</span>
        </button>

        {currentView === 'studio' && (
          <button 
            className="btn btn-secondary btn-sm btn-bulk-nav"
            onClick={onOpenGlobalSettings}
            title="Edit all slide themes, fonts, framing, and images at once"
          >
            <Globe size={13} className="text-lime" />
            <span>Bulk Deck Settings</span>
          </button>
        )}
      </div>

      {/* Right Section: Theme Toggle, Settings, Actions Dropdown & Export ZIP */}
      <div className="header-right">
        {/* Light / Dark Mode Toggle */}
        <button 
          className="btn btn-icon theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={14} className="text-accent" /> : <Moon size={14} />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        <button 
          className="btn btn-icon"
          onClick={onOpenSettings}
          title="AI / LLM Settings (Opencode, Direct API, Ollama)"
        >
          <Settings size={14} />
          <span>Settings</span>
        </button>

        {/* Actions & JSON Dropdown Menu */}
        <div className="relative" ref={jsonMenuRef} style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setShowJsonMenu(!showJsonMenu)}
            title="Deck Actions, JSON Export/Import &amp; Reset Preferences"
          >
            <SlidersHorizontal size={13} />
            <span>Actions</span>
            <ChevronDown size={11} className="text-muted" />
          </button>

          {showJsonMenu && (
            <div className="header-dropdown-menu">
              <div className="dropdown-section-label">PROJECT FILE</div>
              <button 
                className="dropdown-item"
                onClick={() => {
                  onExportJSON();
                  setShowJsonMenu(false);
                }}
              >
                <FileDown size={13} />
                <span>Export Project JSON</span>
              </button>
              <button 
                className="dropdown-item"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
              >
                <Upload size={13} />
                <span>Import Project JSON</span>
              </button>

              <div className="dropdown-divider"></div>
              <div className="dropdown-section-label">RESET &amp; CLEAR</div>

              <button 
                className="dropdown-item"
                onClick={() => {
                  if (onResetPreferences) onResetPreferences();
                  setShowJsonMenu(false);
                }}
                title="Reset all themes, templates, watermarks, and typography back to defaults"
              >
                <RotateCcw size={13} className="text-lime" />
                <span>Reset All Preferences</span>
              </button>

              <button 
                className="dropdown-item text-danger"
                onClick={() => {
                  if (confirm('Clear the entire deck and start fresh with 1 blank slide? (You can undo with Ctrl+Z)')) {
                    if (onResetDeckToBlank) onResetDeckToBlank();
                    setShowJsonMenu(false);
                  }
                }}
                title="Clear all slides and start fresh with 1 blank slide"
              >
                <Trash2 size={13} />
                <span>Clear All (Fresh Blank Slide)</span>
              </button>
            </div>
          )}
        </div>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="application/json" 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />

        {/* Primary ZIP Export Button */}
        <button 
          className="btn btn-primary btn-zip"
          onClick={onExportZIP}
          disabled={isGeneratingZIP || slidesCount === 0}
          title="Download all slides as high-res 1080x1080 PNGs in a ZIP"
        >
          <Archive size={14} />
          <span>{isGeneratingZIP ? 'Exporting...' : 'Download ZIP'}</span>
        </button>
      </div>
    </header>
  );
}
