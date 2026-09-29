import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getAllProjects, 
  createProject, 
  duplicateProject, 
  renameProject, 
  deleteProject, 
  saveAllProjects 
} from '../utils/projectStore';

describe('Project Management Store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with a default project if storage is empty', () => {
    const projects = getAllProjects();
    expect(projects.length).toBeGreaterThanOrEqual(1);
    expect(projects[0].slides.length).toBe(3);
  });

  it('creates a new project and saves it in registry', () => {
    const created = createProject('My Tech News');
    expect(created.name).toBe('My Tech News');
    expect(created.slides).toBeDefined();
    expect(created.slides.length).toBe(1);
    expect(created.slides[0].headline).toBe('');

    const all = getAllProjects();
    expect(all.some(p => p.id === created.id)).toBe(true);
  });

  it('duplicates an existing project with independent ID', () => {
    const original = createProject('Original Deck');
    const clone = duplicateProject(original.id);

    expect(clone).not.toBeNull();
    expect(clone.id).not.toBe(original.id);
    expect(clone.name).toContain('Original Deck (Copy)');
    expect(clone.slides.length).toBe(original.slides.length);
  });

  it('renames an existing project', () => {
    const proj = createProject('Old Name');
    const renamed = renameProject(proj.id, 'Brand New Name');

    expect(renamed.name).toBe('Brand New Name');
    const all = getAllProjects();
    const found = all.find(p => p.id === proj.id);
    expect(found.name).toBe('Brand New Name');
  });

  it('prevents deleting the last project in the system', () => {
    localStorage.clear();
    const projects = getAllProjects();
    expect(projects.length).toBe(1);

    expect(() => {
      deleteProject(projects[0].id);
    }).toThrow('You must keep at least one project.');
  });
});
