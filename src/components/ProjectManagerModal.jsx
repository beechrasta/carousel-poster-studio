import React, { useState } from 'react';
import { FolderKanban, Plus, Copy, Trash2, Edit2, Check, X, Layers, Clock } from 'lucide-react';

export default function ProjectManagerModal({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDuplicateProject,
  onDeleteProject,
  showToast,
}) {
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim());
    setNewProjectName('');
    setIsCreating(false);
    showToast(`Created project "${newProjectName.trim()}"`);
  };

  const handleStartRename = (proj, e) => {
    e.stopPropagation();
    setEditingId(proj.id);
    setEditName(proj.name);
  };

  const handleSaveRename = (id, e) => {
    e?.stopPropagation();
    if (editName.trim()) {
      onRenameProject(id, editName.trim());
      showToast('Project renamed.');
    }
    setEditingId(null);
  };

  const handleDuplicate = (id, e) => {
    e.stopPropagation();
    onDuplicateProject(id);
    showToast('Project duplicated.');
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    try {
      onDeleteProject(id);
      showToast('Project deleted.');
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container project-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-badge-icon">
              <FolderKanban size={18} className="text-lime" />
            </div>
            <div>
              <h2 className="modal-title">Project Manager</h2>
              <p className="modal-subtitle">Organize and switch between multiple carousel poster decks.</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Top Create bar */}
          <div className="project-create-bar mb-4">
            {isCreating ? (
              <form onSubmit={handleCreate} className="flex gap-2 w-full">
                <input 
                  type="text" 
                  className="text-input flex-1"
                  placeholder="Enter project name..."
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Check size={14} /> Create
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button 
                className="btn btn-primary w-full justify-center"
                onClick={() => setIsCreating(true)}
              >
                <Plus size={15} />
                <span>Create New Poster Project</span>
              </button>
            )}
          </div>

          {/* Project List */}
          <div className="projects-grid-list space-y-2">
            {projects.map((proj) => {
              const isActive = proj.id === activeProjectId;
              const isEditing = editingId === proj.id;
              const formattedDate = new Date(proj.updatedAt || proj.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={proj.id}
                  className={`project-list-card ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectProject(proj.id);
                      onClose();
                    }
                  }}
                >
                  <div className="project-card-main">
                    {isEditing ? (
                      <div className="flex gap-2 items-center flex-1" onClick={e => e.stopPropagation()}>
                        <input 
                          type="text" 
                          className="text-input text-sm py-1 px-2 flex-1"
                          value={editName}
                          autoFocus
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(proj.id, e)}
                        />
                        <button 
                          className="btn btn-primary btn-xs"
                          onClick={(e) => handleSaveRename(proj.id, e)}
                        >
                          Save
                        </button>
                        <button 
                          className="btn btn-secondary btn-xs"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="project-title-info">
                        <div className="flex items-center gap-2">
                          <h4 className="project-card-name">{proj.name}</h4>
                          {isActive && <span className="active-tag">CURRENT ACTIVE</span>}
                        </div>
                        <div className="project-card-meta">
                          <span className="flex items-center gap-1">
                            <Layers size={11} /> {proj.slides?.length || 0} slides
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {formattedDate}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="project-card-actions" onClick={e => e.stopPropagation()}>
                      <button 
                        className="btn-proj-action"
                        onClick={(e) => handleStartRename(proj, e)}
                        title="Rename Project"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        className="btn-proj-action"
                        onClick={(e) => handleDuplicate(proj.id, e)}
                        title="Duplicate Project"
                      >
                        <Copy size={13} />
                      </button>
                      {projects.length > 1 && (
                        <button 
                          className="btn-proj-action action-danger"
                          onClick={(e) => handleDelete(proj.id, e)}
                          title="Delete Project"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
