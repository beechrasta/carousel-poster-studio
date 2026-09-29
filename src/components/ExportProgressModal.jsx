import React from 'react';
import { FolderOutput } from 'lucide-react';

export default function ExportProgressModal({ isOpen, progress }) {
  if (!isOpen) return null;

  const percent = progress?.percent || 0;
  const current = progress?.current || 0;
  const total = progress?.total || 0;

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div className="modal-container progress-export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-progress-content">
          <div className="progress-spinner-wrap">
            <FolderOutput size={32} className="text-lime animate-bounce" />
          </div>
          
          <h3 className="text-lg font-bold text-white mt-3">Saving Frames</h3>
          <p className="text-sm text-muted mt-1">
            Rendering high-resolution 1080×1080 PNGs ({current} of {total})
          </p>

          <div className="progress-track mt-4">
            <div 
              className="progress-fill"
              style={{ width: `${percent}%` }}
            ></div>
          </div>

          <span className="text-xs font-mono text-lime mt-2 font-bold">{percent}%</span>
        </div>
      </div>
    </div>
  );
}

