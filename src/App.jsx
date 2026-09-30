import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import DeckSidebar from './components/DeckSidebar';
import PreviewStage from './components/PreviewStage';
import SlideEditor from './components/SlideEditor';
import BatchBuilderModal from './components/BatchBuilderModal';
import NewsGeneratorModal from './components/NewsGeneratorModal';
import SettingsModal from './components/SettingsModal';
import ProjectManagerModal from './components/ProjectManagerModal';
import ExportProgressModal from './components/ExportProgressModal';
import BackgroundTaskBar from './components/BackgroundTaskBar';
import ApiConnectorModal from './components/ApiConnectorModal';
import AppLockScreen, { isStudioAuthenticated, lockStudio } from './components/AppLockScreen';

import { ensureFontsReady, POSTER_THEMES, THEME_KEYS } from './utils/canvasRenderer';
import { saveSlidesToFolder } from './utils/exportEngine';
import { 
  DEFAULT_SETTINGS, 
  checkOpencodeStatus, 
  generateCopyFromNews, 
  parseStoriesFromResponse, 
  extractStoriesHeuristic 
} from './utils/apiServices';
import { 
  getAllProjects, 
  getActiveProjectId, 
  setActiveProjectId, 
  saveCurrentProject, 
  createProject, 
  duplicateProject, 
  renameProject, 
  deleteProject,
  createNewBlankSlide,
  uid 
} from './utils/projectStore';

const STORAGE_KEY_SETTINGS = 'cps-settings-v2';
const STORAGE_KEY_THEME = 'cps-theme';

export const DEFAULT_GLOBAL_SETTINGS = {
  themeMode: 'uniform', // 'uniform' | 'random' | 'alternating' | 'rainbow' | 'individual'
  globalThemeId: 'clean_light',
  secondaryThemeId: 'dark_lime',
  globalTemplateId: 'classic_studio', // 'classic_studio' | 'headline_first' | 'hero_fullbleed' | 'editorial_split' | 'card_frame' | 'minimal_quote'
  globalFontChoice: 'Anton',
  globalHeadlineCase: 'normal',
  globalSubtextSize: 'normal',
  globalShowFrameLabel: true,
  globalFrameFormat: 'frame',
  globalFramePrefix: 'FRAME',
  globalShowAccentRule: true,
  globalImageFit: 'cover',
  globalCredit: '',
  watermarkEnabled: false,
  watermarkText: '',
  watermarkPosition: 'bottom_right',
  watermarkOpacity: 0.28,
  watermarkStyle: 'pill',
  randomSeed: 0,
};

export default function App() {
  // Navigation view: 'home' | 'studio'
  const [currentView, setCurrentView] = useState('home');

  // Inspector tab mode: 'slide' | 'global'
  const [editorTab, setEditorTab] = useState('slide');

  // Theme state: 'light' by default
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_THEME) || 'light';
  });

  // Projects Registry state
  const [projects, setProjects] = useState(() => getAllProjects());
  const [activeProjectId, setActiveId] = useState(() => {
    const savedId = getActiveProjectId();
    const found = projects.find(p => p.id === savedId);
    return found ? found.id : (projects[0]?.id || '');
  });

  // Active Project object
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  // Slides, Current Index, and Global Settings for the active project
  const slides = activeProject?.slides || [];
  const currentIndex = activeProject?.currentIndex != null ? Math.min(activeProject.currentIndex, Math.max(0, slides.length - 1)) : 0;
  const globalSettings = { ...DEFAULT_GLOBAL_SETTINGS, ...(activeProject?.globalSettings || {}) };

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  const [opencodeAvailable, setOpencodeAvailable] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isApiConnectorOpen, setIsApiConnectorOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => isStudioAuthenticated());
  const [zipProgress, setZipProgress] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Undo & Redo History Stacks (Snapshots of { slides, currentIndex, globalSettings, description })
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Global Background AI Task State
  const [aiTask, setAiTask] = useState({
    status: 'idle', // 'idle' | 'running' | 'completed' | 'error'
    type: 'batch_builder', // 'batch_builder' | 'news_generator'
    provider: 'opencode',
    model: '',
    startTime: null,
    elapsedSeconds: 0,
    step: 1,
    stepLabel: '',
    progressPercent: 0,
    newsInput: '',
    uploadedImages: [],
    results: [],
    error: null,
    logs: [],
  });

  // Background Task Timer
  useEffect(() => {
    let timer = null;
    if (aiTask.status === 'running') {
      timer = setInterval(() => {
        setAiTask((prev) => {
          if (prev.status !== 'running' || !prev.startTime) return prev;
          const elapsed = Math.floor((Date.now() - prev.startTime) / 1000);
          return { ...prev, elapsedSeconds: elapsed };
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [aiTask.status]);

  // Start Asynchronous Background AI Generation
  const handleStartAITask = async ({ type, newsInput, uploadedImages = [], settings: taskSettings }) => {
    const currentSettings = taskSettings || settings;
    const modelName = currentSettings.provider === 'opencode'
      ? (currentSettings.opencodeModel || 'Default Model')
      : (currentSettings.provider === 'openai' ? currentSettings.openaiModel : currentSettings.ollamaModel);

    const initialLogs = [
      `[${new Date().toLocaleTimeString()}] Task started with ${currentSettings.provider} (${modelName})`,
      `[${new Date().toLocaleTimeString()}] Ingesting story text and preparing prompt payload...`
    ];

    setAiTask({
      status: 'running',
      type,
      provider: currentSettings.provider,
      model: modelName,
      startTime: Date.now(),
      elapsedSeconds: 0,
      step: 1,
      stepLabel: 'Sanitizing and parsing story text...',
      progressPercent: 20,
      newsInput,
      uploadedImages,
      results: [],
      error: null,
      logs: initialLogs,
    });

    try {
      // Step 2: Connection
      setTimeout(() => {
        setAiTask((prev) => prev.status === 'running' ? ({
          ...prev,
          step: 2,
          stepLabel: `Querying ${prev.provider} engine (${modelName})...`,
          progressPercent: 40,
          logs: [...(prev.logs || []), `[${new Date().toLocaleTimeString()}] Dispatched request to AI backend...`]
        }) : prev);
      }, 300);

      // Step 3: Call generation
      const rawOutput = await generateCopyFromNews(newsInput, currentSettings);

      setAiTask((prev) => prev.status === 'running' ? ({
        ...prev,
        step: 3,
        stepLabel: 'Parsing punchy headlines and roast subtexts...',
        progressPercent: 75,
        logs: [...(prev.logs || []), `[${new Date().toLocaleTimeString()}] Response received. Parsing structured slides...`]
      }) : prev);

      // Step 4: Parse & match
      const stories = parseStoriesFromResponse(rawOutput);
      if (!stories.length) {
        throw new Error('No valid slide headlines/subtexts could be parsed from AI response.');
      }

      const combined = stories.map((s, idx) => ({
        headline: s.headline,
        subtext: s.subtext,
        image: uploadedImages[idx]?.dataUrl || null,
        fit: 'cover',
        focal: 50,
        credit: s.credit || ''
      }));

      setAiTask({
        status: 'completed',
        type,
        provider: currentSettings.provider,
        model: modelName,
        startTime: null,
        elapsedSeconds: 0,
        step: 4,
        stepLabel: 'Deck complete!',
        progressPercent: 100,
        newsInput,
        uploadedImages,
        results: combined,
        error: null,
        logs: [
          ...initialLogs,
          `[${new Date().toLocaleTimeString()}] Successfully parsed and mapped ${combined.length} slides.`
        ]
      });

      showToast(`✨ AI Generated ${combined.length} slides ready for your deck!`);
    } catch (err) {
      console.error('AI Background Task Error:', err);
      setAiTask((prev) => ({
        ...prev,
        status: 'error',
        error: err.message || 'AI generation failed',
        logs: [...(prev.logs || []), `[${new Date().toLocaleTimeString()}] Error: ${err.message}`]
      }));
      showToast(`AI Task Error: ${err.message}`);
    }
  };

  const handleCancelAITask = () => {
    setAiTask((prev) => ({
      ...prev,
      status: 'idle',
      error: null,
    }));
    showToast('AI Task cancelled.');
  };

  const handleClearAITask = () => {
    setAiTask((prev) => ({
      ...prev,
      status: 'idle',
      error: null,
    }));
  };

  const handleApplyTaskResults = (resultsToApply) => {
    if (!resultsToApply || !resultsToApply.length) return;
    handleBatchBuild(resultsToApply, 'append');
    handleClearAITask();
    showToast(`Added ${resultsToApply.length} slides to active deck.`);
  };

  const handleFallbackParseTask = (text) => {
    const stories = extractStoriesHeuristic(text);
    if (!stories.length) {
      showToast('Could not extract stories with local parser.');
      return;
    }
    const combined = stories.map((s, idx) => ({
      headline: s.headline,
      subtext: s.subtext,
      image: aiTask.uploadedImages?.[idx]?.dataUrl || null,
      fit: 'cover',
      focal: 50,
      credit: s.credit || ''
    }));
    handleBatchBuild(combined, 'append');
    handleClearAITask();
    showToast(`⚡ Extracted ${combined.length} slides with Local Parser!`);
  };

  const handleMaximizeTask = () => {
    if (aiTask.type === 'news_generator') {
      setIsNewsOpen(true);
    } else {
      setIsBatchOpen(true);
    }
  };

  // Apply Theme attribute to root document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Show Toast
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
  }, []);

  // Check Opencode CLI availability on mount
  useEffect(() => {
    checkOpencodeStatus().then(res => {
      setOpencodeAvailable(res.available);
    });
    ensureFontsReady();
  }, []);

  // Autosave settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  // Update current project helper with undo checkpoint support
  const updateActiveProjectData = useCallback((updates, recordUndo = true, actionDesc = '') => {
    if (!activeProject) return;

    if (recordUndo) {
      const snapshot = {
        slides: JSON.parse(JSON.stringify(activeProject.slides || [])),
        currentIndex: activeProject.currentIndex || 0,
        globalSettings: JSON.parse(JSON.stringify(activeProject.globalSettings || DEFAULT_GLOBAL_SETTINGS)),
        description: actionDesc
      };
      setUndoStack(prev => [...prev.slice(-35), snapshot]);
      setRedoStack([]);
    }

    const updated = {
      ...activeProject,
      ...updates,
    };
    saveCurrentProject(updated);
    setProjects(getAllProjects());
  }, [activeProject]);

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (!undoStack.length || !activeProject) return;
    
    const previousSnapshot = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    
    const currentSnapshot = {
      slides: JSON.parse(JSON.stringify(activeProject.slides || [])),
      currentIndex: activeProject.currentIndex || 0,
      globalSettings: JSON.parse(JSON.stringify(activeProject.globalSettings || DEFAULT_GLOBAL_SETTINGS)),
      description: 'Current State'
    };
    
    setRedoStack(prev => [...prev.slice(-35), currentSnapshot]);
    setUndoStack(newUndoStack);
    
    const updatedProject = {
      ...activeProject,
      slides: previousSnapshot.slides,
      currentIndex: Math.min(previousSnapshot.currentIndex, Math.max(0, previousSnapshot.slides.length - 1)),
      globalSettings: previousSnapshot.globalSettings,
    };
    
    saveCurrentProject(updatedProject);
    setProjects(getAllProjects());
    showToast(previousSnapshot.description ? `↶ Undone: ${previousSnapshot.description}` : '↶ Undone');
  }, [undoStack, activeProject, showToast]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (!redoStack.length || !activeProject) return;
    
    const nextSnapshot = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    
    const currentSnapshot = {
      slides: JSON.parse(JSON.stringify(activeProject.slides || [])),
      currentIndex: activeProject.currentIndex || 0,
      globalSettings: JSON.parse(JSON.stringify(activeProject.globalSettings || DEFAULT_GLOBAL_SETTINGS)),
      description: 'Current State'
    };
    
    setUndoStack(prev => [...prev.slice(-35), currentSnapshot]);
    setRedoStack(newRedoStack);
    
    const updatedProject = {
      ...activeProject,
      slides: nextSnapshot.slides,
      currentIndex: Math.min(nextSnapshot.currentIndex, Math.max(0, nextSnapshot.slides.length - 1)),
      globalSettings: nextSnapshot.globalSettings,
    };
    
    saveCurrentProject(updatedProject);
    setProjects(getAllProjects());
    showToast(nextSnapshot.description ? `↷ Redone: ${nextSnapshot.description}` : '↷ Redone');
  }, [redoStack, activeProject, showToast]);

  // Reset All Preferences to Defaults
  const handleResetAllPreferences = useCallback(() => {
    const cleanedSlides = slides.map(s => ({
      ...s,
      customBgColor: undefined,
      customAccentColor: undefined,
      customHeadlineColor: undefined,
      customSubtextColor: undefined,
      customBgType: undefined,
      customBgGradient: undefined,
      fontChoice: undefined,
      templateOverride: undefined,
      watermarkText: undefined,
      showFrameLabel: undefined,
    }));

    updateActiveProjectData({
      slides: cleanedSlides,
      globalSettings: { ...DEFAULT_GLOBAL_SETTINGS }
    }, true, 'Reset All Preferences');

    showToast('✨ Reset all preferences and deck settings to clean defaults.');
  }, [slides, updateActiveProjectData, showToast]);

  // Clear All Slides & Reset to Blank
  const handleClearAllSlides = useCallback(() => {
    const blankSlide = createNewBlankSlide();
    updateActiveProjectData({
      slides: [blankSlide],
      currentIndex: 0,
      globalSettings: { ...DEFAULT_GLOBAL_SETTINGS }
    }, true, 'Clear Deck (Blank Slide)');

    showToast('🗑️ Cleared deck — started fresh with 1 blank slide (Ctrl+Z to undo).');
  }, [updateActiveProjectData, showToast]);

  // Global Deck Settings Handler
  const handleUpdateGlobalSettings = (updates) => {
    const newGlobal = { ...globalSettings, ...updates };
    updateActiveProjectData({
      globalSettings: newGlobal,
    }, true, 'Update Global Settings');
  };

  // Randomize Themes across all slides in deck
  const handleRandomizeAllThemes = () => {
    const newSeed = Math.floor(Math.random() * 1000) + 1;
    const themeKeys = THEME_KEYS;
    const updatedSlides = slides.map((s, idx) => {
      const randomKey = themeKeys[(idx * 2 + newSeed) % themeKeys.length];
      return {
        ...s,
        themeId: randomKey,
        customBgColor: undefined,
        customAccentColor: undefined,
        customHeadlineColor: undefined,
        customSubtextColor: undefined,
        customBgType: undefined,
        customBgGradient: undefined,
      };
    });

    updateActiveProjectData({
      slides: updatedSlides,
      globalSettings: {
        ...globalSettings,
        themeMode: 'random',
        randomSeed: newSeed,
      }
    }, true, 'Randomize Themes');
  };

  // Apply Theme to All Slides in Deck
  const handleApplyThemeToAllSlides = (themeId) => {
    const updatedSlides = slides.map((s) => ({
      ...s,
      themeId,
      customBgColor: undefined,
      customAccentColor: undefined,
      customHeadlineColor: undefined,
      customSubtextColor: undefined,
      customBgType: undefined,
      customBgGradient: undefined,
    }));

    updateActiveProjectData({
      slides: updatedSlides,
      globalSettings: {
        ...globalSettings,
        globalThemeId: themeId,
        themeMode: 'uniform',
        customBgColor: undefined,
        customAccentColor: undefined,
        customHeadlineColor: undefined,
        customSubtextColor: undefined,
      }
    }, true, `Apply Theme (${POSTER_THEMES[themeId]?.name || themeId})`);
  };

  // Force sync all slides to deck defaults (clears per-slide overrides)
  const handleForceSyncAllSlides = () => {
    const targetTheme = globalSettings.globalThemeId || 'dark_lime';
    const updatedSlides = slides.map((s) => ({
      ...s,
      themeId: targetTheme,
      customBgColor: undefined,
      customAccentColor: undefined,
      customHeadlineColor: undefined,
      customSubtextColor: undefined,
      customBgType: undefined,
      customBgGradient: undefined,
      fontChoice: undefined,
      templateOverride: undefined,
      watermarkText: undefined,
      showFrameLabel: undefined,
    }));

    updateActiveProjectData({
      slides: updatedSlides,
    }, true, 'Force Sync Defaults');
  };

  // Clear all images across deck (pure text mode)
  const handleClearAllImages = () => {
    const updatedSlides = slides.map((s) => ({
      ...s,
      image: null,
    }));
    updateActiveProjectData({
      slides: updatedSlides,
    }, true, 'Clear All Images');
  };

  // Reset all frame labels to auto-sequence
  const handleResetAllFrameLabels = () => {
    const updatedSlides = slides.map((s) => ({
      ...s,
      frameLabel: undefined,
      showFrameLabel: undefined,
    }));
    updateActiveProjectData({
      slides: updatedSlides,
    }, true, 'Reset Frame Labels');
  };

  // Apply Global Image Fit to all slides
  const handleSetGlobalImageFit = (fit) => {
    const updatedSlides = slides.map((s) => ({
      ...s,
      fit,
    }));
    updateActiveProjectData({
      slides: updatedSlides,
      globalSettings: {
        ...globalSettings,
        globalImageFit: fit,
      }
    }, true, `Set Image Fit (${fit})`);
  };

  // Reset all image focal points to 50%
  const handleResetAllFocalPoints = () => {
    const updatedSlides = slides.map((s) => ({
      ...s,
      focal: 50,
    }));
    updateActiveProjectData({
      slides: updatedSlides,
    }, true, 'Reset Focal Points');
  };

  // Open Global Settings from anywhere
  const handleOpenGlobalSettings = () => {
    setCurrentView('studio');
    setEditorTab('global');
  };

  // Slide CRUD actions
  const handleAddSlide = () => {
    const newSlide = {
      id: uid(),
      headline: '',
      subtext: '',
      image: null,
      fit: globalSettings.globalImageFit || 'cover',
      focal: 50,
      credit: globalSettings.globalCredit || '',
      fontChoice: globalSettings.globalFontChoice || 'Anton',
      themeId: globalSettings.globalThemeId || slides[0]?.themeId || 'clean_light',
    };
    const newSlides = [...slides, newSlide];
    updateActiveProjectData({
      slides: newSlides,
      currentIndex: newSlides.length - 1,
    }, true, 'Add Slide');
    showToast('New slide added.');
  };

  const handleDuplicateSlide = (index) => {
    const source = slides[index];
    if (!source) return;
    const duplicated = {
      ...JSON.parse(JSON.stringify(source)),
      id: uid(),
    };
    const updatedSlides = [...slides];
    updatedSlides.splice(index + 1, 0, duplicated);
    updateActiveProjectData({
      slides: updatedSlides,
      currentIndex: index + 1,
    }, true, `Duplicate Slide #${index + 1}`);
    showToast(`Slide #${index + 1} duplicated.`);
  };

  const handleDeleteSlide = (index) => {
    if (slides.length <= 1) {
      showToast('A deck must have at least one slide.');
      return;
    }
    const updatedSlides = slides.filter((_, i) => i !== index);
    const newIndex = currentIndex >= updatedSlides.length ? updatedSlides.length - 1 : currentIndex;
    updateActiveProjectData({
      slides: updatedSlides,
      currentIndex: newIndex,
    }, true, `Delete Slide #${index + 1}`);
    showToast(`Slide #${index + 1} deleted.`);
  };

  const handleMoveSlide = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= slides.length) return;
    const updatedSlides = [...slides];
    const [moved] = updatedSlides.splice(fromIndex, 1);
    updatedSlides.splice(toIndex, 0, moved);
    updateActiveProjectData({
      slides: updatedSlides,
      currentIndex: toIndex,
    }, true, 'Reorder Slide');
  };

  const handleUpdateSlide = (index, updates) => {
    const updatedSlides = slides.map((s, idx) => idx === index ? { ...s, ...updates } : s);
    // If updates contain image, fit, focal, theme, template, record undo snapshot
    const isMajorChange = updates.image !== undefined || updates.themeId !== undefined || updates.templateOverride !== undefined;
    updateActiveProjectData({
      slides: updatedSlides,
    }, isMajorChange, isMajorChange ? `Edit Slide #${index + 1}` : '');
  };

  const handleApplyThemeToAll = (themeProps) => {
    const updatedSlides = slides.map((s) => ({
      ...s,
      ...themeProps,
    }));
    updateActiveProjectData({
      slides: updatedSlides,
      globalSettings: {
        ...globalSettings,
        globalThemeId: themeProps.themeId || globalSettings.globalThemeId,
        customBgColor: themeProps.customBgColor,
        customAccentColor: themeProps.customAccentColor,
        customHeadlineColor: themeProps.customHeadlineColor,
        customSubtextColor: themeProps.customSubtextColor,
        customBgType: themeProps.customBgType,
        customBgGradient: themeProps.customBgGradient,
        themeMode: 'uniform',
      }
    }, true, 'Apply Theme to All');
  };

  const handleSelectSlide = (idx) => {
    updateActiveProjectData({ currentIndex: idx }, false);
    setEditorTab('slide');
  };

  // Project Management Actions
  const handleSelectProject = (id) => {
    setUndoStack([]);
    setRedoStack([]);
    setActiveId(id);
    setActiveProjectId(id);
    setCurrentView('studio');
    showToast(`Switched project.`);
  };

  const handleCreateProject = (name = 'New Project') => {
    setUndoStack([]);
    setRedoStack([]);
    const newProj = createProject(name);
    setProjects(getAllProjects());
    setActiveId(newProj.id);
    setCurrentView('studio');
    showToast(`Created project "${name}".`);
  };

  const handleLoadTemplate = (template) => {
    setUndoStack([]);
    setRedoStack([]);
    const newProj = createProject(template.name, template.slides);
    newProj.globalSettings = {
      ...DEFAULT_GLOBAL_SETTINGS,
      globalThemeId: template.themeId || 'clean_light',
      themeMode: 'uniform',
    };
    saveCurrentProject(newProj);
    setProjects(getAllProjects());
    setActiveId(newProj.id);
    setCurrentView('studio');
    showToast(`Loaded template "${template.name}".`);
  };

  const handleDuplicateProject = (id) => {
    const cloned = duplicateProject(id);
    if (cloned) {
      setUndoStack([]);
      setRedoStack([]);
      setProjects(getAllProjects());
      setActiveId(cloned.id);
      showToast('Project duplicated.');
    }
  };

  const handleRenameProject = (id, newName) => {
    renameProject(id, newName);
    setProjects(getAllProjects());
    showToast('Project renamed.');
  };

  const handleDeleteProject = (id) => {
    setUndoStack([]);
    setRedoStack([]);
    const res = deleteProject(id);
    setProjects(res.remaining);
    setActiveId(res.activeProject.id);
    showToast('Project deleted.');
  };

  // Keyboard navigation & shortcuts (Undo: Ctrl+Z, Redo: Ctrl+Y / Ctrl+Shift+Z, Arrows)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable;
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl && !e.altKey) {
        if (e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            if (!isInput) {
              e.preventDefault();
              handleRedo();
            }
          } else {
            if (!isInput) {
              e.preventDefault();
              handleUndo();
            }
          }
        } else if (e.key.toLowerCase() === 'y') {
          if (!isInput) {
            e.preventDefault();
            handleRedo();
          }
        }
      }

      if (isInput || isBatchOpen || isNewsOpen || isSettingsOpen || isProjectManagerOpen || currentView === 'home') {
        return;
      }

      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) handleSelectSlide(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < slides.length - 1) handleSelectSlide(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, currentIndex, isBatchOpen, isNewsOpen, isSettingsOpen, isProjectManagerOpen, currentView, handleUndo, handleRedo]);

  // Batch builder deck submission
  const handleBatchBuild = (newCards, mode = 'replace') => {
    const defaultTheme = globalSettings.globalThemeId || slides[0]?.themeId || 'dark_lime';
    const prepared = newCards.map(c => ({
      id: uid(),
      headline: c.headline || '',
      subtext: c.subtext || '',
      image: c.image || null,
      fit: globalSettings.globalImageFit || c.fit || 'cover',
      focal: c.focal != null ? c.focal : 50,
      credit: c.credit || globalSettings.globalCredit || '',
      fontChoice: globalSettings.globalFontChoice || 'Anton',
      themeId: defaultTheme,
    }));

    if (mode === 'replace') {
      updateActiveProjectData({
        slides: prepared,
        currentIndex: 0,
      });
      showToast(`Deck rebuilt with ${prepared.length} slides.`);
    } else {
      updateActiveProjectData({
        slides: [...slides, ...prepared],
        currentIndex: slides.length,
      });
      showToast(`Appended ${prepared.length} slides to deck.`);
    }
    setCurrentView('studio');
  };

  // News Generator submission
  const handleAddGenerated = (generatedSlides, mode = 'append') => {
    const defaultTheme = globalSettings.globalThemeId || slides[0]?.themeId || 'dark_lime';
    const prepared = generatedSlides.map(s => ({ ...s, themeId: defaultTheme }));

    if (mode === 'replace') {
      updateActiveProjectData({
        slides: prepared,
        currentIndex: 0,
      });
    } else {
      updateActiveProjectData({
        slides: [...slides, ...prepared],
        currentIndex: slides.length,
      });
    }
    setCurrentView('studio');
  };

  // Save all slides to a user-chosen folder
  const handleSaveAllFrames = async () => {
    if (!slides.length) return;
    try {
      setZipProgress({ current: 0, total: slides.length, percent: 0 });
      const result = await saveSlidesToFolder(
        slides,
        null, // all slides
        globalSettings,
        (progress) => setZipProgress(progress)
      );
      if (!result.cancelled) {
        showToast(`Saved ${result.saved} frames!`);
      }
    } catch (err) {
      showToast('Save failed: ' + err.message);
    } finally {
      setTimeout(() => setZipProgress(null), 600);
    }
  };

  // Save only the current slide
  const handleSaveCurrentFrame = async () => {
    if (!currentSlide) return;
    try {
      setZipProgress({ current: 0, total: 1, percent: 0 });
      const result = await saveSlidesToFolder(
        slides,
        [currentIndex],
        globalSettings,
        (progress) => setZipProgress(progress)
      );
      if (!result.cancelled) {
        showToast(`Saved slide ${currentIndex + 1}!`);
      }
    } catch (err) {
      showToast('Save failed: ' + err.message);
    } finally {
      setTimeout(() => setZipProgress(null), 600);
    }
  };

  const currentSlide = slides[currentIndex] || slides[0];

  if (!isAuthenticated) {
    return <AppLockScreen onUnlock={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="studio-app-root">
      {/* Top Studio Header */}
      <Header 
        slidesCount={slides.length}
        activeProjectName={activeProject?.name || 'Untitled Project'}
        theme={theme}
        currentView={currentView}
        onToggleView={(view) => setCurrentView(view)}
        onToggleTheme={handleToggleTheme}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onOpenBatchBuilder={() => setIsBatchOpen(true)}
        onOpenNewsGenerator={() => setIsNewsOpen(true)}
        onOpenGlobalSettings={handleOpenGlobalSettings}
        onOpenApiConnector={() => setIsApiConnectorOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLockStudio={() => {
          lockStudio();
          setIsAuthenticated(false);
        }}
        onSaveAllFrames={handleSaveAllFrames}
        onSaveCurrentFrame={handleSaveCurrentFrame}
        isSaving={zipProgress !== null}
        opencodeAvailable={opencodeAvailable}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onResetPreferences={handleResetAllPreferences}
        onResetDeckToBlank={handleClearAllSlides}
      />

      {/* Main View: Homepage vs Studio Workspace */}
      {currentView === 'home' ? (
        <HomePage 
          projects={projects}
          activeProjectId={activeProjectId}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenStudio={() => setCurrentView('studio')}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onLoadTemplate={handleLoadTemplate}
          onOpenBatchBuilder={() => setIsBatchOpen(true)}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
        />
      ) : (
        <main className="studio-workspace-grid">
          {/* Left: Deck Management & Thumbnails */}
          <DeckSidebar 
            slides={slides}
            currentIndex={currentIndex}
            globalSettings={globalSettings}
            onSelectSlide={handleSelectSlide}
            onAddSlide={handleAddSlide}
            onDuplicateSlide={handleDuplicateSlide}
            onDeleteSlide={handleDeleteSlide}
            onMoveSlide={handleMoveSlide}
          />

          {/* Center: Live 1080x1080 Canvas Viewport */}
          <PreviewStage 
            currentSlide={currentSlide}
            currentIndex={currentIndex}
            totalSlides={slides.length}
            globalSettings={globalSettings}
            onPrevSlide={() => handleSelectSlide(Math.max(0, currentIndex - 1))}
            onNextSlide={() => handleSelectSlide(Math.min(slides.length - 1, currentIndex + 1))}
            onDuplicateSlide={handleDuplicateSlide}
            onDeleteSlide={handleDeleteSlide}
            onUpdateGlobalSettings={handleUpdateGlobalSettings}
            onRandomizeAllThemes={handleRandomizeAllThemes}
            onApplyThemeToAllSlides={handleApplyThemeToAllSlides}
            onOpenGlobalSettings={handleOpenGlobalSettings}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            showToast={showToast}
          />

          {/* Right: Active Slide Inspector + Deck Global Settings */}
          <SlideEditor 
            slide={currentSlide}
            slideIndex={currentIndex}
            totalSlides={slides.length}
            globalSettings={globalSettings}
            editorTab={editorTab}
            onSetEditorTab={setEditorTab}
            onUpdateSlide={handleUpdateSlide}
            onApplyThemeToAll={handleApplyThemeToAll}
            onUpdateGlobalSettings={handleUpdateGlobalSettings}
            onRandomizeAllThemes={handleRandomizeAllThemes}
            onApplyThemeToAllSlides={handleApplyThemeToAllSlides}
            onSetGlobalImageFit={handleSetGlobalImageFit}
            onResetAllFocalPoints={handleResetAllFocalPoints}
            onForceSyncAllSlides={handleForceSyncAllSlides}
            onClearAllImages={handleClearAllImages}
            onResetAllFrameLabels={handleResetAllFrameLabels}
            onResetPreferences={handleResetAllPreferences}
            onResetDeckToBlank={handleClearAllSlides}
            showToast={showToast}
          />
        </main>
      )}

      {/* Project Manager Modal */}
      <ProjectManagerModal 
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDuplicateProject={handleDuplicateProject}
        onDeleteProject={handleDeleteProject}
        showToast={showToast}
      />

      {/* All-At-Once Batch Builder Modal */}
      <BatchBuilderModal 
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onBuildDeck={handleBatchBuild}
        settings={settings}
        showToast={showToast}
        aiTask={aiTask}
        onStartAITask={handleStartAITask}
        onCancelAITask={handleCancelAITask}
        onClearAITask={handleClearAITask}
      />

      {/* News Generator Modal */}
      <NewsGeneratorModal 
        isOpen={isNewsOpen}
        onClose={() => setIsNewsOpen(false)}
        onAddGeneratedSlides={handleAddGenerated}
        settings={settings}
        showToast={showToast}
        aiTask={aiTask}
        onStartAITask={handleStartAITask}
        onCancelAITask={handleCancelAITask}
        onClearAITask={handleClearAITask}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        showToast={showToast}
      />

      {/* API & ChatGPT Connector Modal */}
      <ApiConnectorModal 
        isOpen={isApiConnectorOpen}
        onClose={() => setIsApiConnectorOpen(false)}
      />

      {/* ZIP Export Progress Modal */}
      <ExportProgressModal 
        isOpen={zipProgress !== null}
        progress={zipProgress}
      />

      {/* Global Floating Background Task Bar */}
      <BackgroundTaskBar 
        task={aiTask}
        onMaximize={handleMaximizeTask}
        onCancel={handleCancelAITask}
        onApplyResults={handleApplyTaskResults}
        onDismiss={handleClearAITask}
        onFallbackParse={handleFallbackParseTask}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="studio-toast" onAnimationEnd={() => setToastMessage(null)}>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
