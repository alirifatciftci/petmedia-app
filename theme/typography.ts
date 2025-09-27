/**
 * Typography system matching the design references
 * Using Playfair Display for headlines and Inter for body text
 */
export const typography = {
  fontFamily: {
    heading: 'PlayfairDisplay_700Bold', // For large playful headlines
    body: 'Inter_400Regular',
    bodySemiBold: 'Inter_600SemiBold',
    bodyBold: 'Inter_700Bold',
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  },

  letterSpacing: {
    tight: -0.05,
    normal: 0,
    wide: 0.05,
  },
} as const;

export const textStyles = {
  // Large playful headlines like in references
  hero: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.02,
  },
  
  // Card titles
  cardTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    lineHeight: 28,
  },

  // Body text
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },

  // Small captions
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
} as const;