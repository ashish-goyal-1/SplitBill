import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider as MUIThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import { lightPalette, darkPalette } from './palette';
import typography from './typography';
import componentsOverride from './overrides';
import shadows, { customShadows, darkCustomShadows } from './shadows';

// Create Theme Context
const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => { },
});

// Hook to use theme context
export const useThemeMode = () => useContext(ThemeContext);

// Theme Provider Component
export default function ThemeProvider({ children }) {
  // Get initial mode from localStorage or default to light
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Create theme based on mode
  const themeOptions = useMemo(
    () => ({
      palette: darkMode ? darkPalette : lightPalette,
      shape: { borderRadius: 8 },
      typography,
      shadows: darkMode ? shadows : shadows,
      customShadows: darkMode ? darkCustomShadows : customShadows,
    }),
    [darkMode]
  );

  const theme = createTheme(themeOptions);
  theme.components = componentsOverride(theme);

  const contextValue = useMemo(
    () => ({ darkMode, toggleDarkMode }),
    [darkMode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <StyledEngineProvider injectFirst>
        <MUIThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </MUIThemeProvider>
      </StyledEngineProvider>
    </ThemeContext.Provider>
  );
}
