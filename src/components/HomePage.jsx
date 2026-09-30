import React from 'react';
import { 
  Sparkles, 
  Zap, 
  Plus, 
  Layers, 
  FolderKanban, 
  FolderOutput, 
  Sun, 
  Moon, 
  ArrowRight, 
  Copy, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Terminal, 
  Palette,
  Layout,
  ExternalLink
} from 'lucide-react';
import { PRESET_TEMPLATES, getTemplateSlideCount } from '../utils/presetTemplates';
import { POSTER_THEMES, POSTER_LAYOUT_TEMPLATES } from '../utils/canvasRenderer';
import TemplateMiniPreview from './TemplateMiniPreview';

/**
 * Featured template card.
 * The preview is a real scaled down render of the composition, not a mock,
 * so the palette swatches and the poster itself always agree.
 */
function TemplateCard({ tpl, onLoad }) {
  const theme = POSTER_THEMES[tpl.themeId] || POSTER_THEMES.dark_lime;
  const layout = POSTER_LAYOUT_TEMPLATES[tpl.templateId];
  const slideCount = getTemplateSlideCount(tpl);

  return (
    <div
      className="template-card"
      role="button"
      tabIndex={0}
      aria-label={`Use template ${tpl.name}`}
      title={tpl.coverTitle}
      onClick={() => onLoad(tpl)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onLoad(tpl);
        }
      }}
    >
      <div className="template-card-frame">
        <TemplateMiniPreview
          template={{
            theme,
            templateId: tpl.templateId,
            fontChoice: tpl.fontChoice,
            deckSettings: tpl.deckSettings,
            slide: tpl.slides[0],
            totalSlides: slideCount,
            headline: tpl.slides[0]?.headline || tpl.coverTitle,
          }}
        />

        <div className="tpl-card-overlay">
          <span className="tpl-card-badge" style={{ background: theme.accentColor, color: theme.id === 'clean_light' ? '#FFFFFF' : '#000000' }}>
            {tpl.badge}
          </span>
          <span className="tpl-card-layout" style={{ borderColor: theme.accentColor, color: theme.accentColor }}>
            {layout?.name || 'Classic Studio'}
          </span>
        </div>

        <span className="tpl-card-cta" style={{ background: theme.accentColor, color: theme.id === 'clean_light' ? '#FFFFFF' : '#000000' }}>
          Use This Template
        </span>
      </div>

      <div className="template-card-body">
        <div className="template-card-title-row">
          <h3 className="template-name">{tpl.name}</h3>
          <span className="template-category">{tpl.category}</span>
        </div>

        <p className="template-tagline">{tpl.tagline}</p>

        <ul className="tpl-highlights">
          {tpl.highlights.map((h) => (
            <li key={h}>
              <span className="tpl-highlight-dot" style={{ background: theme.accentColor }} />
              {h}
            </li>
          ))}
        </ul>

        <div className="template-card-footer">
          <span className="tpl-meta-chip">{slideCount} slides</span>
          <span className="tpl-meta-chip">{POSTER_THEMES[tpl.themeId]?.name || tpl.themeId}</span>
          <span className="tpl-meta-chip">{tpl.fontChoice}</span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage({
  projects,
  activeProjectId,
  theme,
  onToggleTheme,
  onOpenStudio,
  onSelectProject,
  onCreateProject,
  onLoadTemplate,
  onOpenBatchBuilder,
  onDuplicateProject,
  onDeleteProject,
}) {
  return (
    <div className="home-dashboard-root">
      {/* Top Navbar */}
      <header className="home-navbar">
        <div className="nav-left">
          <div className="logo-group">
            <div className="logo-icon">
              <span className="logo-accent"></span>
            </div>
            <div className="logo-titles">
              <h1 className="logo-text">CAROUSEL POSTER STUDIO</h1>
              <span className="logo-sub">VIRAL TECH &amp; AI POSTER MAKER</span>
            </div>
          </div>
        </div>

        <div className="nav-right">
          <button 
            className="btn btn-icon theme-toggle-btn"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={15} className="text-accent" /> : <Moon size={15} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          <button 
            className="btn btn-secondary"
            onClick={() => onCreateProject('New Poster Deck')}
          >
            <Plus size={14} />
            <span>New Project</span>
          </button>

          <button 
            className="btn btn-primary"
            onClick={onOpenStudio}
          >
            <Layout size={15} />
            <span>Open Studio</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Main Home Scroll Area */}
      <main className="home-main-content">
        {/* Hero Section */}
        <section className="hero-banner">
          <div className="hero-content">
            <div className="hero-pill-badge">
              <Sparkles size={13} className="text-lime" />
              <span>LOCAL-FIRST SOCIAL CAROUSEL ENGINE</span>
            </div>

            <h1 className="hero-heading">
              Turn AI &amp; Tech News Into <span className="text-lime-gradient">Viral Carousel Posters</span>
            </h1>

            <p className="hero-subtext">
              Transform breaking news and snarky commentary into pixel-perfect <strong>1080 &times; 1080 px</strong> posters sized for Instagram &amp; Threads. 100% local, zero AI-hallucinated images, with instant direct-to-folder exports.
            </p>

            <div className="hero-cta-group">
              <button 
                className="btn btn-primary btn-hero-lg"
                onClick={onOpenStudio}
              >
                <Layout size={18} />
                <span>Launch Poster Studio</span>
                <ArrowRight size={16} />
              </button>

              <button 
                className="btn btn-batch-hero btn-hero-lg"
                onClick={onOpenBatchBuilder}
              >
                <Zap size={18} className="text-lime" />
                <span>All-At-Once Builder</span>
              </button>
            </div>
          </div>
        </section>

        {/* Preset Templates Showcase */}
        <section className="dashboard-section">
          <div className="section-header-row">
            <div>
              <h2 className="section-title-large">✨ Featured Poster Templates</h2>
              <p className="section-subtitle">
                Every card below is a live render of the real 1080 &times; 1080 composition &mdash;
                palette, type scale and framing included. Pick one and it drops straight into the studio.
              </p>
            </div>
            <span className="badge badge-dim">{PRESET_TEMPLATES.length} templates</span>
          </div>

          <div className="templates-grid">
            {PRESET_TEMPLATES.map((tpl) => (
              <TemplateCard key={tpl.id} tpl={tpl} onLoad={onLoadTemplate} />
            ))}
          </div>
        </section>

        {/* Your Saved Projects Section */}
        <section className="dashboard-section">
          <div className="section-header-row">
            <div>
              <h2 className="section-title-large">📁 Your Saved Projects ({projects.length})</h2>
              <p className="section-subtitle">Switch, manage, and edit your saved carousel decks.</p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => onCreateProject('New Poster Deck')}
            >
              <Plus size={14} />
              <span>Create Project</span>
            </button>
          </div>

          <div className="projects-dashboard-grid">
            {projects.map((proj) => {
              const isActive = proj.id === activeProjectId;
              const formattedDate = new Date(proj.updatedAt || proj.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              const firstSlide = proj.slides?.[0];

              return (
                <div 
                  key={proj.id}
                  className={`project-dashboard-card ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectProject(proj.id)}
                >
                  <div className="proj-card-top">
                    <div className="flex items-center gap-2">
                      <FolderKanban size={16} className="text-lime" />
                      <h3 className="proj-card-title">{proj.name}</h3>
                    </div>
                    {isActive && <span className="active-tag">ACTIVE</span>}
                  </div>

                  <div className="proj-card-content-preview">
                    <p className="proj-headline-snippet">
                      "{firstSlide?.headline || 'Untitled First Slide'}"
                    </p>
                  </div>

                  <div className="proj-card-footer">
                    <div className="proj-meta-group">
                      <span className="flex items-center gap-1">
                        <Layers size={12} /> {proj.slides?.length || 0} slides
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {formattedDate}
                      </span>
                    </div>

                    <div className="proj-actions-row" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="btn-proj-dash-action"
                        onClick={() => onDuplicateProject(proj.id)}
                        title="Duplicate Project"
                      >
                        <Copy size={13} />
                      </button>
                      {projects.length > 1 && (
                        <button 
                          className="btn-proj-dash-action action-danger"
                          onClick={() => onDeleteProject(proj.id)}
                          title="Delete Project"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <button 
                        className="btn btn-primary btn-xs"
                        onClick={() => onSelectProject(proj.id)}
                      >
                        <span>Open Studio</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="dashboard-section feature-highlights-section">
          <h2 className="section-title-large text-center mb-6">Designed For Speed, Accuracy &amp; Reach</h2>
          
          <div className="features-grid">
            <div className="feature-box">
              <div className="feature-icon-wrap">
                <CheckCircle2 size={20} className="text-lime" />
              </div>
              <h3 className="feature-title">1080 &times; 1080 Pixel-Perfect</h3>
              <p className="feature-desc">Standard square portrait format crafted for Instagram carousels and Threads image grids.</p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrap">
                <Terminal size={20} className="text-lime" />
              </div>
              <h3 className="feature-title">Local Opencode &amp; API Bridge</h3>
              <p className="feature-desc">Integrates seamlessly with local Opencode CLI, OpenAI-compatible APIs, and local Ollama.</p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrap">
                <Palette size={20} className="text-lime" />
              </div>
              <h3 className="feature-title">Card Themes &amp; Gradients</h3>
              <p className="feature-desc">7 distinct card color palettes, smooth linear gradients, and full custom color picker controls.</p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrap">
                <FolderOutput size={20} className="text-lime" />
              </div>
              <h3 className="feature-title">Direct Folder Export</h3>
              <p className="feature-desc">Save all slides or selected frames named in order (slide-01.png, slide-02.png, ...) directly into your chosen directory.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
