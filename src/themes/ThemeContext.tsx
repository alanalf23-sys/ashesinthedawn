/**
 * Theme Context Provider
 * Manages global theme state and theme switching
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme, ThemeConfig } from './types';
import { codette_dark, codette_light, codette_graphite, codette_neon } from './presets';

interface ThemeContextType {
  currentTheme: Theme;
  themes: Record<string, Theme>;
  switchTheme: (themeId: string) => void;
  createCustomTheme: (theme: Theme) => void;
  updateCustomTheme: (themeId: string, updates: Partial<Theme>) => void;
  deleteCustomTheme: (themeId: string) => void;
  exportTheme: (themeId: string) => string;
  importTheme: (themeJson: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_THEMES = {
  'codette-dark': codette_dark,
  'codette-light': codette_light,
  'codette-graphite': codette_graphite,
  'codette-neon': codette_neon,
};

const STORAGE_KEY = 'corelogic_theme_config';

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: string;
}

export function ThemeProvider({ children, initialTheme = 'codette-graphite' }: ThemeProviderProps) {
  const [themes, setThemes] = useState<Record<string, Theme>>(DEFAULT_THEMES);
  const [currentThemeId, setCurrentThemeId] = useState(initialTheme);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load themes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config: ThemeConfig = JSON.parse(stored);
        setCurrentThemeId(config.currentTheme);
        
        if (config.customThemes) {
          setThemes(prev => ({
            ...prev,
            ...config.customThemes,
          }));
        }
      }
    } catch (error) {
      console.warn('Failed to load theme config from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // Save theme config to localStorage
  useEffect(() => {
    if (!isHydrated) return;

    try {
      const customThemes: Record<string, Theme> = {};
      Object.entries(themes).forEach(([id, theme]) => {
        if (theme.isCustom) {
          customThemes[id] = theme;
        }
      });

      const config: ThemeConfig = {
        currentTheme: currentThemeId,
        customThemes,
        autoSaveTheme: true,
        enableThemeTransitions: true,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save theme config to localStorage:', error);
    }
  }, [currentThemeId, themes, isHydrated]);

  // Apply theme CSS variables to root
  useEffect(() => {
    const theme = themes[currentThemeId] || codette_graphite;
    applyThemeToDOM(theme);
  }, [currentThemeId, themes]);

  const currentTheme = themes[currentThemeId] || codette_graphite;

  const switchTheme = (themeId: string) => {
    if (themes[themeId]) {
      setCurrentThemeId(themeId);
    }
  };

  const createCustomTheme = (theme: Theme) => {
    const customTheme = {
      ...theme,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setThemes(prev => ({
      ...prev,
      [theme.id]: customTheme,
    }));
  };

  const updateCustomTheme = (themeId: string, updates: Partial<Theme>) => {
    if (themes[themeId]?.isCustom) {
      setThemes(prev => ({
        ...prev,
        [themeId]: {
          ...prev[themeId],
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      }));
    }
  };

  const deleteCustomTheme = (themeId: string) => {
    if (themes[themeId]?.isCustom) {
      setThemes(prev => {
        const updated = { ...prev };
        delete updated[themeId];
        return updated;
      });

      if (currentThemeId === themeId) {
        setCurrentThemeId('reaper-default');
      }
    }
  };

  const exportTheme = (themeId: string): string => {
    const theme = themes[themeId];
    if (!theme) throw new Error(`Theme ${themeId} not found`);
    return JSON.stringify(theme, null, 2);
  };

  const importTheme = (themeJson: string) => {
    try {
      const theme = JSON.parse(themeJson) as Theme;
      createCustomTheme(theme);
    } catch (error) {
      console.error('Failed to import theme:', error);
      throw new Error('Invalid theme JSON');
    }
  };

  const value: ThemeContextType = {
    currentTheme,
    themes,
    switchTheme,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    exportTheme,
    importTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

/**
 * Apply theme colors to DOM as CSS custom properties
 */
function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;

  // Colors
  Object.entries(theme.colors.bg).forEach(([key, value]) => {
    root.style.setProperty(`--color-bg-${key}`, value);
  });

  Object.entries(theme.colors.text).forEach(([key, value]) => {
    root.style.setProperty(`--color-text-${key}`, value);
  });

  Object.entries(theme.colors.border).forEach(([key, value]) => {
    root.style.setProperty(`--color-border-${key}`, value);
  });

  Object.entries(theme.colors.ui).forEach(([key, value]) => {
    root.style.setProperty(`--color-ui-${key}`, value);
  });

  Object.entries(theme.colors.meter).forEach(([key, value]) => {
    root.style.setProperty(`--color-meter-${key}`, value);
  });

  Object.entries(theme.colors.fader).forEach(([key, value]) => {
    root.style.setProperty(`--color-fader-${key}`, value);
  });

  Object.entries(theme.colors.waveform).forEach(([key, value]) => {
    root.style.setProperty(`--color-waveform-${key}`, value);
  });

  Object.entries(theme.colors.track).forEach(([key, value]) => {
    root.style.setProperty(`--color-track-${key}`, value);
  });

  Object.entries(theme.colors.automation).forEach(([key, value]) => {
    root.style.setProperty(`--color-automation-${key}`, value);
  });

  // Fonts
  root.style.setProperty('--font-family-ui', theme.fonts.family.ui);
  root.style.setProperty('--font-family-mono', theme.fonts.family.mono);

  Object.entries(theme.fonts.size).forEach(([key, value]) => {
    root.style.setProperty(`--font-size-${key}`, `${value}px`);
  });

  Object.entries(theme.fonts.weight).forEach(([key, value]) => {
    root.style.setProperty(`--font-weight-${key}`, value.toString());
  });

  // Layout
  root.style.setProperty('--tcp-width', `${theme.layout.tcp.width}px`);
  root.style.setProperty('--mcp-min-height', `${theme.layout.mcp.minHeight}px`);
  root.style.setProperty('--transport-height', `${theme.layout.transport.height}px`);

  Object.entries(theme.layout.spacing).forEach(([key, value]) => {
    root.style.setProperty(`--spacing-${key}`, `${value}px`);
  });

  Object.entries(theme.layout.radius).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, `${value}px`);
  });

  Object.entries(theme.layout.shadow).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value);
  });
}
