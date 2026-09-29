/**
 * Project Management Store for Carousel Poster Studio
 * Handles multiple project workspaces, persistence, switching, duplication, and renaming.
 */

const STORAGE_KEY_PROJECTS = 'cps_projects_registry_v1';
const STORAGE_KEY_ACTIVE_PROJECT = 'cps_active_project_id_v1';

export function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

export function getDefaultStarterSlides() {
  return [
    {
      id: uid(),
      headline: "OpenAI just killed its own model before launch",
      subtext: "GPT-6.1 'Astra' got scrapped for being too deceptive in testing. The AI was literally too shady to ship, a day before DevDay. We are so back (to the safety meetings).",
      image: null,
      images: [],
      layout: 'full_bleed',
      fit: 'cover',
      focal: 50,
      credit: '',
      fontChoice: 'Anton',
      themeId: 'clean_light',
    },
    {
      id: uid(),
      headline: "Nvidia wants to be the seatbelt of the AI world",
      subtext: "New Open Agent Safety Platform, 100+ companies signed on, claims it would've stopped the Hugging Face breach. Plus a casual $150B buyback. Jensen stays winning.",
      image: null,
      images: [],
      layout: 'full_bleed',
      fit: 'cover',
      focal: 50,
      credit: '',
      fontChoice: 'Anton',
      themeId: 'clean_light',
    },
    {
      id: uid(),
      headline: "Congress finally discovered AI exists",
      subtext: "Florida wants OpenAI in court, Sanders and AOC want to ban superintelligence, and Trump wants an 'AI Force' branch. Everyone has a plan. None of them agree.",
      image: null,
      images: [],
      layout: 'full_bleed',
      fit: 'cover',
      focal: 50,
      credit: '',
      fontChoice: 'Anton',
      themeId: 'clean_light',
    }
  ];
}

/**
 * Migrates old single-image slide to new multi-image schema.
 * Safe to call on already-migrated slides.
 */
export function migrateSlide(slide) {
  if (slide.images) return slide; // already new schema
  return {
    ...slide,
    images: slide.image ? [{ url: slide.image, fit: slide.fit || 'cover', focal: slide.focal != null ? slide.focal : 50, credit: slide.credit || '' }] : [],
    layout: slide.layout || 'full_bleed',
  };
}

export function createNewBlankSlide() {
  return {
    id: uid(),
    headline: '',
    subtext: '',
    // Legacy single-image field (kept for compat, renderer prefers images[])
    image: null,
    images: [],           // Multi-slot image array
    layout: 'full_bleed', // Layout type
    fit: 'cover',
    focal: 50,
    credit: '',
    fontChoice: 'Anton',
    themeId: 'clean_light',
  };
}

export function createNewProjectObject(name = 'Untitled Project', slides = null) {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: name.trim() || 'Untitled Project',
    createdAt: now,
    updatedAt: now,
    slides: slides && slides.length ? slides : [createNewBlankSlide()],
    currentIndex: 0,
    globalSettings: {
      themeMode: 'uniform',
      globalThemeId: 'clean_light',
      secondaryThemeId: 'dark_lime',
      globalFontChoice: 'Anton',
      globalHeadlineCase: 'normal',
      globalSubtextSize: 'normal',
      globalFrameFormat: 'frame',
      globalFramePrefix: 'FRAME',
      globalShowAccentRule: true,
      globalImageFit: 'cover',
      globalCredit: '',
      randomSeed: 0,
    }
  };
}

/**
 * Loads all saved projects from localStorage.
 */
export function getAllProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading projects registry:', e);
  }

  // Fallback: Check if legacy project exists
  try {
    const legacy = localStorage.getItem('cps-project-v2') || localStorage.getItem('cps-project');
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (parsedLegacy && Array.isArray(parsedLegacy.slides) && parsedLegacy.slides.length) {
        const migrated = createNewProjectObject('My First Poster Deck', parsedLegacy.slides);
        saveAllProjects([migrated]);
        setActiveProjectId(migrated.id);
        return [migrated];
      }
    }
  } catch (e) {}

  // Create initial demo project on fresh launch
  const defaultProj = createNewProjectObject('AI News Highlights (Demo)', getDefaultStarterSlides());
  saveAllProjects([defaultProj]);
  setActiveProjectId(defaultProj.id);
  return [defaultProj];
}

/**
 * Saves all projects array to localStorage.
 */
export function saveAllProjects(projects) {
  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects to localStorage (exceeded quota):', e);
  }
}

/**
 * Gets the active project ID.
 */
export function getActiveProjectId() {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_PROJECT) || '';
}

/**
 * Sets the active project ID.
 */
export function setActiveProjectId(id) {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_PROJECT, id);
  } catch (e) {}
}

/**
 * Saves or updates an individual project.
 */
export function saveCurrentProject(updatedProject) {
  const projects = getAllProjects();
  const index = projects.findIndex(p => p.id === updatedProject.id);
  const toSave = {
    ...updatedProject,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    projects[index] = toSave;
  } else {
    projects.push(toSave);
  }

  saveAllProjects(projects);
  setActiveProjectId(toSave.id);
  return toSave;
}

/**
 * Creates a new project and sets it active.
 */
export function createProject(name = 'New Project', slides = null) {
  const newProject = createNewProjectObject(name, slides);
  const projects = getAllProjects();
  projects.unshift(newProject);
  saveAllProjects(projects);
  setActiveProjectId(newProject.id);
  return newProject;
}

/**
 * Duplicates an existing project.
 */
export function duplicateProject(projectId) {
  const projects = getAllProjects();
  const source = projects.find(p => p.id === projectId);
  if (!source) return null;

  const clone = {
    ...JSON.parse(JSON.stringify(source)),
    id: uid(),
    name: `${source.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  projects.unshift(clone);
  saveAllProjects(projects);
  setActiveProjectId(clone.id);
  return clone;
}

/**
 * Renames an existing project.
 */
export function renameProject(projectId, newName) {
  const projects = getAllProjects();
  const proj = projects.find(p => p.id === projectId);
  if (!proj) return null;

  proj.name = newName.trim() || 'Untitled Project';
  proj.updatedAt = new Date().toISOString();
  saveAllProjects(projects);
  return proj;
}

/**
 * Deletes a project. If the active project is deleted, switches to the first remaining.
 */
export function deleteProject(projectId) {
  let projects = getAllProjects();
  if (projects.length <= 1) {
    throw new Error('You must keep at least one project.');
  }

  projects = projects.filter(p => p.id !== projectId);
  saveAllProjects(projects);

  const activeId = getActiveProjectId();
  let nextActive = projects[0];
  if (activeId === projectId) {
    setActiveProjectId(nextActive.id);
  } else {
    nextActive = projects.find(p => p.id === activeId) || projects[0];
  }

  return { remaining: projects, activeProject: nextActive };
}
