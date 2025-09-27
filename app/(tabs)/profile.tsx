import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, 
  Heart,
  FileText,
  MapPin,
  Settings,
  LogOut
} from 'lucide-react-native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();

  const profileOptions = [
    {
      id: 'listings',
      title: t('profile.myListings'),
      icon: FileText,
      count: 3,
      onPress: () => console.log('My listings'),
    },
    {
      id: 'saved',
      title: t('profile.saved'),
      icon: Heart,
      count: 8,
      onPress: () => console.log('Saved pets'),
    },
    {
      id: 'contributions',
      title: t('profile.contributions'),
      icon: MapPin,
      count: 12,
      onPress: () => console.log('Map contributions'),
    },
  ];

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
        
        <View style={styles.content}>
          <View style={styles.loginPrompt}>
            <LinearGradient
              colors={[theme.colors.primary[100], theme.colors.primary[50]]}
              style={styles.loginCard}
            >
              <User size={64} color={theme.colors.primary[500]} strokeWidth={1} />
              <Text style={styles.loginTitle}>Profilinizi görüntüleyin</Text>
              <Text style={styles.loginSubtitle}>
                Favorilerinizi, ilanlarınızı ve katkılarınızı görmek için giriş yapın
              </Text>
              
              <TouchableOpacity style={styles.loginButton}>
                <LinearGradient
                  colors={[theme.colors.gradient.start, theme.colors.gradient.end]}
                  style={styles.loginGradient}
                >
                  <Text style={styles.loginButtonText}>Giriş Yap</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
      
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={[theme.colors.primary[500], theme.colors.primary[600]]}
            style={styles.avatar}
          >
            <User size={32} color="white" />
          </LinearGradient>
          
          <Text style={styles.displayName}>
            {user?.displayName || 'Pet Lover'}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.city && (
            <View style={styles.locationContainer}>
              <MapPin size={16} color={theme.colors.text.secondary} />
              <Text style={styles.location}>{user.city}</Text>
            </View>
          )}
        </View>

        {/* Profile Options */}
        <View style={styles.optionsContainer}>
          {profileOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={option.onPress}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                  <option.icon size={24} color={theme.colors.primary[500]} />
                </View>
                <Text style={styles.optionTitle}>{option.title}</Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.optionCount}>{option.count}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Settings */}
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => console.log('Settings')}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIcon}>
                <Settings size={24} color={theme.colors.text.secondary} />
              </View>
              <Text style={styles.optionTitle}>{t('profile.settings')}</Text>
            </View>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.optionItem, styles.logoutItem]}
            onPress={() => console.log('Logout')}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIcon}>
                <LogOut size={24} color={theme.colors.error[500]} />
              </View>
              <Text style={[styles.optionTitle, styles.logoutText]}>
                {t('common.logout')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: {
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
  },
  loginCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius['2xl'],
    marginHorizontal: theme.spacing.lg,
  },
  loginTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  loginButton: {
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  loginGradient: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  loginButtonText: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    fontSize: theme.typography.fontSize.base,
  },
  profileHeader: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.secondary,
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  displayName: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  location: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  optionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100, // Account for tab bar
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  optionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
  },
  optionRight: {},
  optionCount: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.full,
    minWidth: 24,
    textAlign: 'center',
  },
  logoutItem: {
    marginTop: theme.spacing.lg,
    borderColor: theme.colors.error[500],
    borderWidth: 1,
  },
  logoutText: {
    color: theme.colors.error[500],
  },
});