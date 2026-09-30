import React, { act } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Undo, Redo, Reset Preferences, and Clear All Features', () => {
  beforeEach(() => {
    localStorage.clear();
    // Stub window.confirm to auto-approve for testing
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  const renderStudio = async () => {
    await act(async () => {
      render(<App />);
    });
    const studioBtn = screen.getByTitle(/Go to Canvas Poster Studio Editor/i);
    await act(async () => {
      fireEvent.click(studioBtn);
    });
  };

  it('renders Undo and Redo buttons in the header and stage with disabled state initially', async () => {
    await renderStudio();

    const undoBtns = screen.getAllByTitle(/Undo last action/i);
    const redoBtns = screen.getAllByTitle(/Redo action/i);

    expect(undoBtns.length).toBeGreaterThanOrEqual(1);
    expect(redoBtns.length).toBeGreaterThanOrEqual(1);
    expect(undoBtns[0]).toBeDisabled();
    expect(redoBtns[0]).toBeDisabled();
  });

  it('enables undo button when a slide is added, and undos back to previous state', async () => {
    await renderStudio();

    const undoBtns = screen.getAllByTitle(/Undo last action/i);
    expect(undoBtns[0]).toBeDisabled();

    // Initial starter project has 3 slides
    expect(screen.getByText(/3 slides/i)).toBeInTheDocument();

    // Add a slide
    const addSlideBtn = screen.getByText(/Add New Slide/i);
    await act(async () => {
      fireEvent.click(addSlideBtn);
    });

    expect(screen.getByText(/4 slides/i)).toBeInTheDocument();
    expect(undoBtns[0]).not.toBeDisabled();

    // Click Undo
    await act(async () => {
      fireEvent.click(undoBtns[0]);
    });

    // Should be back to 3 slides
    expect(screen.getByText(/3 slides/i)).toBeInTheDocument();

    // Redo should now be enabled
    const redoBtns = screen.getAllByTitle(/Redo action/i);
    expect(redoBtns[0]).not.toBeDisabled();

    // Click Redo
    await act(async () => {
      fireEvent.click(redoBtns[0]);
    });

    // Should be back to 4 slides
    expect(screen.getByText(/4 slides/i)).toBeInTheDocument();
  });

  it('handles Ctrl+Z and Ctrl+Y keyboard shortcuts for undo and redo', async () => {
    await renderStudio();

    // Add a slide
    const addSlideBtn = screen.getByText(/Add New Slide/i);
    await act(async () => {
      fireEvent.click(addSlideBtn);
    });
    expect(screen.getByText(/4 slides/i)).toBeInTheDocument();

    // Press Ctrl+Z
    await act(async () => {
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    });
    expect(screen.getByText(/3 slides/i)).toBeInTheDocument();

    // Press Ctrl+Y
    await act(async () => {
      fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
    });
    expect(screen.getByText(/4 slides/i)).toBeInTheDocument();
  });

  it('resets all preferences to clean defaults via Actions menu', async () => {
    await renderStudio();

    // Open Actions dropdown in header
    const actionsBtn = screen.getByTitle(/Deck Actions/i);
    await act(async () => {
      fireEvent.click(actionsBtn);
    });

    const resetPrefsBtn = screen.getByText(/Reset All Preferences/i);
    expect(resetPrefsBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(resetPrefsBtn);
    });

    expect(screen.getByText(/Reset all preferences and deck settings/i)).toBeInTheDocument();
  });

  it('clears all slides and resets to 1 fresh blank slide, with ability to undo', async () => {
    await renderStudio();

    expect(screen.getByText(/3 slides/i)).toBeInTheDocument();

    // Open Actions dropdown in header
    const actionsBtn = screen.getByTitle(/Deck Actions/i);
    await act(async () => {
      fireEvent.click(actionsBtn);
    });

    const clearAllBtn = screen.getByText(/Clear All \(Fresh Blank Slide\)/i);
    expect(clearAllBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(clearAllBtn);
    });

    // Deck should now have 1 slide (e.g. "1 slide" or badge)
    expect(screen.getByText(/1 slide\b/i)).toBeInTheDocument();

    // Undo should restore all slides
    const undoBtns = screen.getAllByTitle(/Undo last action/i);
    await act(async () => {
      fireEvent.click(undoBtns[0]);
    });

    expect(screen.getByText(/3 slides/i)).toBeInTheDocument();
  });

  it('renders Bulk Deck Utilities in Global Settings tab with reset and clear buttons', async () => {
    await renderStudio();

    // Switch to Global Settings tab
    const globalTabBtn = screen.getByTitle(/Edit project-wide themes/i);
    await act(async () => {
      fireEvent.click(globalTabBtn);
    });

    expect(screen.getByText(/BULK DECK UTILITIES & RESET/i)).toBeInTheDocument();
    expect(screen.getByText(/Reset All Preferences to Defaults/i)).toBeInTheDocument();
    expect(screen.getByText(/Clear All \(Reset to Fresh Blank Slide\)/i)).toBeInTheDocument();
  });
});
