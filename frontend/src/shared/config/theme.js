// 🎨 DESIGN SYSTEM - THEME
// Sistema centralizado de colores, espaciado y tipografía

export const colors = {
  // Primary colors
  primary: {
    50: "#fef2f2",
    100: "#fee2e2",
    500: "#e74c3c", // Main brand color
    600: "#dc2626",
    700: "#b91c1c",
    900: "#7f1d1d",
  },

  // Secondary colors
  secondary: {
    50: "#f8fafc",
    100: "#f1f5f9",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    900: "#0f172a",
  },

  // Success colors
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    500: "#27ae60", // Success green
    600: "#16a085",
    700: "#059669",
    900: "#14532d",
  },

  // Warning colors
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    500: "#f39c12", // Warning orange
    600: "#d97706",
    700: "#b45309",
    900: "#78350f",
  },

  // Error colors
  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    500: "#e74c3c", // Error red (same as primary for brand consistency)
    600: "#dc2626",
    700: "#b91c1c",
    900: "#7f1d1d",
  },

  // Info colors
  info: {
    50: "#eff6ff",
    100: "#dbeafe",
    500: "#3498db", // Info blue
    600: "#2563eb",
    700: "#1d4ed8",
    900: "#1e3a8a",
  },

  // Neutral colors (grays)
  neutral: {
    50: "#f8f9fa",
    100: "#f1f2f6",
    200: "#ecf0f1",
    300: "#bdc3c7",
    400: "#95a5a6",
    500: "#7f8c8d",
    600: "#6c7b7d",
    700: "#5d6d6e",
    800: "#2c3e50",
    900: "#1a252f",
  },

  // Game-specific colors
  game: {
    bingo: {
      primary: "#e74c3c",
      secondary: "#3498db",
      ball: "#f39c12",
      card: "#ecf0f1",
      win: "#27ae60",
    },
    // Future games...
    // trivia: {...},
    // memory: {...},
  },

  // Common semantic colors
  background: "#f8f9fa",
  surface: "#ffffff",
  border: "#e9ecef",
  text: {
    primary: "#2c3e50",
    secondary: "#7f8c8d",
    disabled: "#bdc3c7",
    inverse: "#ffffff",
  },
  shadow: "#000000",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
};

export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
};

export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
  },

  // Font weights
  fontWeight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },

  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Font families (Montserrat ya está configurada)
  fontFamily: {
    regular: "Montserrat_400Regular",
    medium: "Montserrat_500Medium",
    semibold: "Montserrat_600SemiBold",
    bold: "Montserrat_700Bold",
  },
};

// Utility functions
export const getColor = (colorPath) => {
  const paths = colorPath.split(".");
  let result = colors;

  for (const path of paths) {
    result = result[path];
    if (!result) return colors.primary[500]; // fallback
  }

  return result;
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  getColor,
};
