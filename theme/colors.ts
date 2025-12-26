/**
 * PetMedia Color System
 * Pastel, friendly palette matching the design references
 */
export const colors = {
  // Primary brand colors from references
  primary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // Main purple/lilac
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },

  // Soft cream background from references
  background: {
    primary: '#ffffff', // White
    secondary: '#f8f9fa', // Light gray
    tertiary: '#f3f4f6', // Slightly darker gray
  },

  // Feature card colors from references
  cards: {
    purple: '#b8a9d9', // "Dostlarımıza Yuva"
    lightBlue: '#a8d0e6', // "Dostlarımıza Arkadaş" 
    orange: '#ff6b35', // "Bir kap mama / su"
  },

  // Gradient for login button
  gradient: {
    start: '#e879f9',
    end: '#c084fc',
  },

  // Semantic colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },

  // Text colors
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
  },

  // Border and divider colors
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    dark: '#9ca3af',
  },
} as const;