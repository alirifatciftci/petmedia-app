import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { theme } from '../../theme';

interface TagPillProps {
  text: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'small' | 'medium';
}

export const TagPill: React.FC<TagPillProps> = ({
  text,
  variant = 'primary',
  size = 'medium',
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return theme.colors.success[50];
      case 'warning':
        return theme.colors.warning[50];
      case 'error':
        return theme.colors.error[50];
      case 'neutral':
        return theme.colors.background.tertiary;
      default:
        return theme.colors.primary[50];
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
        return theme.colors.success[600];
      case 'warning':
        return theme.colors.warning[600];
      case 'error':
        return theme.colors.error[600];
      case 'neutral':
        return theme.colors.text.secondary;
      default:
        return theme.colors.primary[600];
    }
  };

  const containerStyle = [
    styles.container,
    size === 'small' ? styles.containerSmall : styles.containerMedium,
    { backgroundColor: getBackgroundColor() },
  ];

  const textStyle = [
    styles.text,
    size === 'small' ? styles.textSmall : styles.textMedium,
    { color: getTextColor() },
  ];

  return (
    <Animated.View style={containerStyle}>
      <Text style={textStyle}>{text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  containerSmall: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
  },
  containerMedium: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  text: {
    fontFamily: theme.typography.fontFamily.bodySemiBold,
  },
  textSmall: {
    fontSize: theme.typography.fontSize.xs,
  },
  textMedium: {
    fontSize: theme.typography.fontSize.sm,
  },
});