import React from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Maximize2, 
  ArrowRight, 
  Layers, 
  Cpu, 
  Terminal, 
  ChevronUp,
  Zap
} from 'lucide-react';

export default function BackgroundTaskBar({
  task,
  onMaximize,
  onCancel,
  onApplyResults,
  onDismiss,
  onFallbackParse
}) {
  if (!task || task.status === 'idle') return null;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isRunning = task.status === 'running';
  const isCompleted = task.status === 'completed';
  const isError = task.status === 'error';

  return (
    <div className={`bg-task-dock ${task.status}`}>
      <div className="bg-task-inner">
        {/* Left Status & Pulse */}
        <div className="bg-task-left">
          <div className="bg-task-indicator">
            {isRunning && (
              <div className="pulse-beacon">
                <span className="pulse-dot"></span>
                <span className="pulse-ring"></span>
              </div>
            )}
            {isCompleted && <CheckCircle2 size={18} className="text-lime" />}
            {isError && <AlertTriangle size={18} className="text-danger" />}
          </div>

          <div className="bg-task-info">
            <div className="bg-task-title-row">
              <span className="bg-task-title">
                {isRunning && (task.type === 'batch_builder' ? 'AI Batch Story Builder' : 'AI Copy Generator')}
                {isCompleted && `✨ ${task.results?.length || 0} Slides Ready for Deck`}
                {isError && 'AI Task Failed'}
              </span>

              {isRunning && (
                <span className="bg-task-timer">
                  {formatTime(task.elapsedSeconds || 0)}
                </span>
              )}

              <span className="bg-task-badge">
                {task.provider === 'opencode' ? (task.model || 'opencode/default') : task.provider}
              </span>
            </div>

            <p className="bg-task-desc">
              {isRunning && (task.stepLabel || 'Generating viral carousel copy...')}
              {isCompleted && 'Slides parsed with headlines and subtexts. Click to review or insert.'}
              {isError && (task.error || 'Upstream provider error occurred.')}
            </p>
          </div>
        </div>

        {/* Progress Bar for Running state */}
        {isRunning && (
          <div className="bg-task-progress-wrap">
            <div 
              className="bg-task-progress-bar" 
              style={{ width: `${Math.max(15, task.progressPercent || 25)}%` }}
            >
              <div className="bg-task-progress-glow"></div>
            </div>
          </div>
        )}

        {/* Right Action Buttons */}
        <div className="bg-task-actions">
          {isRunning && (
            <>
              <button 
                className="btn btn-secondary btn-xs flex items-center gap-1"
                onClick={onMaximize}
                title="Open detailed view"
              >
                <Maximize2 size={12} />
                <span>View Live</span>
              </button>
              <button 
                className="btn btn-danger btn-xs"
                onClick={onCancel}
                title="Cancel generation"
              >
                Cancel
              </button>
            </>
          )}

          {isCompleted && (
            <>
              <button 
                className="btn btn-secondary btn-xs flex items-center gap-1"
                onClick={onMaximize}
              >
                <Maximize2 size={12} />
                <span>Review</span>
              </button>
              <button 
                className="btn btn-primary btn-xs flex items-center gap-1"
                onClick={() => onApplyResults(task.results)}
              >
                <Zap size={12} />
                <span>Insert All ({task.results?.length})</span>
              </button>
              <button 
                className="btn-icon-subtle"
                onClick={onDismiss}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </>
          )}

          {isError && (
            <>
              {task.newsInput && (
                <button 
                  className="btn btn-primary btn-xs flex items-center gap-1"
                  onClick={() => onFallbackParse(task.newsInput)}
                  title="Extract stories instantly without AI"
                >
                  <Zap size={12} />
                  <span>Instant Fallback Parser</span>
                </button>
              )}
              <button 
                className="btn btn-secondary btn-xs"
                onClick={onMaximize}
              >
                Details
              </button>
              <button 
                className="btn-icon-subtle"
                onClick={onDismiss}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
