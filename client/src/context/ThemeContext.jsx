import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEME_WALLPAPERS = [
  { id: 'obsidian', name: 'Deep Obsidian', class: 'bg-theme-obsidian', color: '#6366F1' },
  { id: 'saffron', name: 'Saffron Amber', class: 'bg-theme-saffron', color: '#F59E0B' },
  { id: 'kashmir', name: 'Kashmir Emerald', class: 'bg-theme-emerald', color: '#10B981' },
  { id: 'sangam', name: 'Midnight Sangam', class: 'bg-theme-midnight', color: '#8B5CF6' },
  { id: 'cyberpunk', name: 'Cyber Glow', class: 'bg-theme-cyberpunk', color: '#D946EF' },
];

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('securechat_theme_mode') || 'dark');
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem('securechat_wallpaper') || 'obsidian');
  const [brightness, setBrightness] = useState(() => parseInt(localStorage.getItem('securechat_brightness'), 10) || 100);

  useEffect(() => {
    localStorage.setItem('securechat_theme_mode', themeMode);
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('securechat_wallpaper', wallpaper);
  }, [wallpaper]);

  useEffect(() => {
    localStorage.setItem('securechat_brightness', brightness);
    document.documentElement.style.filter = `brightness(${brightness}%)`;
  }, [brightness]);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const activeWallpaperClass =
    themeMode === 'light'
      ? 'bg-slate-100 text-slate-900'
      : THEME_WALLPAPERS.find((w) => w.id === wallpaper)?.class || 'bg-theme-obsidian';

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        toggleThemeMode,
        wallpaper,
        setWallpaper,
        brightness,
        setBrightness,
        activeWallpaperClass,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
