import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { PawIcon } from './PawIcon';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';

interface AppHeaderProps {
  showLogin?: boolean;
  onLoginPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  showLogin = true,
  onLoginPress,
}) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <PawIcon 
          size={28} 
          color={theme.colors.primary[500]} 
          fill={theme.colors.primary[500]}
        />
        <Text style={styles.logoText}>{t('brand.name')}</Text>
      </View>

      {/* Login Button */}
      {showLogin && !isAuthenticated && (
        <TouchableOpacity onPress={onLoginPress} style={styles.loginButton}>
          <LinearGradient
            colors={[theme.colors.gradient.start, theme.colors.gradient.end]}
            style={styles.loginGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.loginText}>{t('common.login')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.primary,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  logoText: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    letterSpacing: 1,
  },
  loginButton: {
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  loginGradient: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  loginText: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    fontSize: theme.typography.fontSize.base,
  },
});