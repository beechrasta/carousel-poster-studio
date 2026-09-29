import React, { useEffect, useRef } from 'react';
import { Plus, Copy, Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { renderSlideToCanvas, resolveFrameLabel } from '../utils/canvasRenderer';

function SlideThumbnail({ 
  slide, 
  index, 
  totalSlides, 
  isActive, 
  globalSettings, 
  onSelect, 
  onDuplicate, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  isFirst, 
  isLast 
}) {
  const canvasRef = useRef(null);
  const frameText = resolveFrameLabel(slide, index, totalSlides, globalSettings);

  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderSlideToCanvas(slide, index, null, globalSettings, totalSlides).then((fullCanvas) => {
      if (!active || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, 220, 220);
      ctx.drawImage(fullCanvas, 0, 0, 220, 220);
    }).catch(err => {
      console.warn('Thumbnail render error:', err);
    });

    return () => { active = false; };
  }, [slide, index, globalSettings, totalSlides]);

  return (
    <div 
      className={`slide-card ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(index)}
    >
      <div className="card-preview-wrapper">
        <canvas ref={canvasRef} width={220} height={220} className="card-canvas" />
        {frameText && (
          <div className="card-frame-badge">
            {frameText}
          </div>
        )}
      </div>

      <div className="card-footer" onClick={(e) => e.stopPropagation()}>
        <div className="card-info">
          <span className="card-index-pill">#{index + 1}</span>
          <span className="card-headline-preview" title={slide.headline || 'Untitled Slide'}>
            {slide.headline ? (slide.headline.slice(0, 26) + (slide.headline.length > 26 ? '...' : '')) : 'Empty Headline'}
          </span>
        </div>

        <div className="card-actions">
          {!isFirst && (
            <button 
              className="action-btn"
              onClick={() => onMoveUp(index)}
              title="Move Up"
            >
              <ArrowUp size={13} />
            </button>
          )}
          {!isLast && (
            <button 
              className="action-btn"
              onClick={() => onMoveDown(index)}
              title="Move Down"
            >
              <ArrowDown size={13} />
            </button>
          )}
          <button 
            className="action-btn"
            onClick={() => onDuplicate(index)}
            title="Duplicate Slide"
          >
            <Copy size={13} />
          </button>
          <button 
            className="action-btn action-danger"
            onClick={() => onDelete(index)}
            title="Delete Slide"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeckSidebar({
  slides,
  currentIndex,
  globalSettings,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
}) {
  const handleMoveUp = (index) => {
    if (index > 0) onMoveSlide(index, index - 1);
  };

  const handleMoveDown = (index) => {
    if (index < slides.length - 1) onMoveSlide(index, index + 1);
  };

  return (
    <aside className="deck-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <span className="sidebar-title">CAROUSEL DECK</span>
          <span className="sidebar-count">{slides.length} {slides.length === 1 ? 'Slide' : 'Slides'}</span>
        </div>
      </div>

      <div className="slide-list-scroll">
        {slides.map((slide, idx) => (
          <SlideThumbnail 
            key={slide.id || idx}
            slide={slide}
            index={idx}
            totalSlides={slides.length}
            isActive={idx === currentIndex}
            globalSettings={globalSettings}
            onSelect={onSelectSlide}
            onDuplicate={onDuplicateSlide}
            onDelete={onDeleteSlide}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            isFirst={idx === 0}
            isLast={idx === slides.length - 1}
          />
        ))}

        <button 
          className="btn-add-slide"
          onClick={onAddSlide}
          title="Add a new blank slide to the deck"
        >
          <Plus size={18} />
          <span>Add New Slide</span>
        </button>
      </div>
    </aside>
  );
}
