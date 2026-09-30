import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Settings, 
  Layers, 
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
  FolderOutput,
  ImageDown,
  Code,
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
  onOpenApiConnector,
  onOpenSettings,
  onSaveCurrentFrame,   // saves single current slide to folder
  onSaveAllFrames,      // saves all slides to folder
  isSaving,             // bool: export in progress
  opencodeAvailable,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onResetPreferences,
  onResetDeckToBlank,
}) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>slides</span>
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

        <button 
          className="btn btn-secondary btn-sm"
          onClick={onOpenApiConnector}
          title="API & ChatGPT Connector (OpenAPI, Vercel, cURL)"
        >
          <Code size={13} className="text-lime" />
          <span>API &amp; GPT</span>
        </button>
      </div>

      {/* Right Section: Theme Toggle, Settings, Actions Dropdown & Save Frames */}
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

        {/* Actions Dropdown: Reset only */}
        <div className="relative" ref={actionsMenuRef} style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setShowActionsMenu(!showActionsMenu)}
            title="Deck Actions &amp; Reset Preferences"
          >
            <SlidersHorizontal size={13} />
            <span>Actions</span>
            <ChevronDown size={11} className="text-muted" />
          </button>

          {showActionsMenu && (
            <div className="header-dropdown-menu">
              <div className="dropdown-section-label">RESET &amp; CLEAR</div>

              <button 
                className="dropdown-item"
                onClick={() => {
                  if (onResetPreferences) onResetPreferences();
                  setShowActionsMenu(false);
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
                    setShowActionsMenu(false);
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

        {/* Save Current Frame */}
        <button 
          className="btn btn-secondary btn-sm"
          onClick={onSaveCurrentFrame}
          disabled={isSaving || slidesCount === 0}
          title="Save this slide as PNG — pick where to save it"
        >
          <ImageDown size={14} />
          <span>{isSaving ? 'Saving...' : 'Save Frame'}</span>
        </button>

        {/* Save All Frames (primary action) */}
        <button 
          className="btn btn-primary btn-save-frames"
          onClick={onSaveAllFrames}
          disabled={isSaving || slidesCount === 0}
          title="Save all slides as PNGs — choose a folder"
        >
          <FolderOutput size={14} />
          <span>{isSaving ? 'Saving...' : `Save All (${slidesCount})`}</span>
        </button>
      </div>
    </header>
  );
}

