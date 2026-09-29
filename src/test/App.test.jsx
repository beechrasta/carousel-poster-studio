import React, { act } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Carousel Poster Studio Frontend App Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the header with app title, project button, and view switcher', async () => {
    await act(async () => {
      render(<App />);
    });
    
    expect(screen.getAllByText(/CAROUSEL POSTER STUDIO/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/1080/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/All-At-Once Builder/i)).toBeInTheDocument();
    expect(screen.getByText(/News → Slides/i)).toBeInTheDocument();
    expect(screen.getByText(/Download ZIP/i)).toBeInTheDocument();
  });

  it('switches to Home dashboard and displays featured poster templates', async () => {
    await act(async () => {
      render(<App />);
    });

    const homeBtn = screen.getByTitle(/Go to Home & Templates Dashboard/i);
    await act(async () => {
      fireEvent.click(homeBtn);
    });

    expect(screen.getByText(/Turn AI & Tech News Into/i)).toBeInTheDocument();
    expect(screen.getByText(/Featured Poster Templates/i)).toBeInTheDocument();
    expect(screen.getByText(/Tech Roast Weekly/i)).toBeInTheDocument();
  });

  it('toggles Light and Dark theme when theme button is clicked', async () => {
    await act(async () => {
      render(<App />);
    });

    // Default theme is light
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    const themeBtn = screen.getByTitle(/Switch to Light Mode|Switch to Dark Mode/i);
    expect(themeBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(themeBtn);
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    await act(async () => {
      fireEvent.click(themeBtn);
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('opens Project Manager modal when clicking project selector button', async () => {
    await act(async () => {
      render(<App />);
    });

    const projectTrigger = screen.getByTitle(/Switch, Create, or Manage Projects/i);
    await act(async () => {
      fireEvent.click(projectTrigger);
    });

    expect(screen.getByText(/Project Manager/i)).toBeInTheDocument();
    expect(screen.getByText(/Create New Poster Project/i)).toBeInTheDocument();
  });

  it('allows adding a new slide to the deck', async () => {
    await act(async () => {
      render(<App />);
    });

    const addSlideBtn = screen.getByText(/Add New Slide/i);
    await act(async () => {
      fireEvent.click(addSlideBtn);
    });

    // Initial 3 + 1 = 4 slides
    expect(screen.getByText(/4 slides/i)).toBeInTheDocument();
  });
});
