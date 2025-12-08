import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
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
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { FavoritesModal } from '../../components/profile/FavoritesModal';
import { UserProfileService, PetService, MapSpotService } from '../../services/firebase';
import { PetCard } from '../../components/common/PetCard';
import { Pet } from '../../types';

// Fotoğraf URL'sinin geçerli ve kalıcı olup olmadığını kontrol et
const isValidPhotoURL = (url: string | null | undefined): boolean => {
  if (!url || url.trim() === '') return false;
  if (url.startsWith('file://')) return false;
  return url.startsWith('data:image') || url.startsWith('http://') || url.startsWith('https://');
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, setUser } = useAuthStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [contributionsCount, setContributionsCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  const photoURL = user?.photoURL || '';
  const [imageError, setImageError] = useState(false);

  // Log photoURL changes
  useEffect(() => {
    console.log('📸 ProfileScreen: photoURL changed:', {
      photoURL: photoURL,
      length: photoURL.length,
      type: typeof photoURL,
      isEmpty: photoURL.trim() === '',
      isFile: photoURL.startsWith('file://'),
      isHttp: photoURL.startsWith('http://') || photoURL.startsWith('https://'),
      userPhotoURL: user?.photoURL,
      imageError: imageError,
    });
  }, [photoURL, user?.photoURL, imageError]);

  const loadUserPets = useCallback(async () => {
    if (!user?.id) return;

    setLoadingPets(true);
    try {
      const pets = await PetService.getUserPets(user.id);
      setUserPets(pets as Pet[]);
    } catch (error) {
      console.error('Error loading user pets:', error);
    } finally {
      setLoadingPets(false);
    }
  }, [user?.id]);

  const loadProfileCounts = useCallback(async () => {
    if (!user?.id) return;

    setLoadingCounts(true);
    try {
      // Get fresh user profile from Firestore to get updated favorites
      const profileData = await UserProfileService.getUserProfile(user.id);
      const favorites = profileData?.favorites || user.favorites || [];

      // Get saved count from user favorites
      const savedCountValue = Array.isArray(favorites) ? favorites.length : 0;
      setSavedCount(savedCountValue);

      // Get contributions count from map spots
      const contributionsCountValue = await MapSpotService.getMapSpotsCount(user.id);
      setContributionsCount(contributionsCountValue);

      console.log('ProfileScreen: Loaded counts:', {
        saved: savedCountValue,
        contributions: contributionsCountValue,
        favoritesFromDB: favorites,
      });
    } catch (error) {
      console.error('Error loading profile counts:', error);
      // Fallback to user.favorites if Firestore fails
      const savedCountValue = user.favorites?.length || 0;
      setSavedCount(savedCountValue);
      setContributionsCount(0);
    } finally {
      setLoadingCounts(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserPets();
      loadProfileCounts();
    }
    // Reset image error when photoURL changes
    if (user?.photoURL) {
      setImageError(false);
    }
  }, [isAuthenticated, user?.id, user?.photoURL, loadUserPets, loadProfileCounts]);

  // Ekran focus olduğunda profil verilerini ve pet'leri yenile
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?.id) {
        // Profil verilerini Firestore'dan yeniden yükle
        const refreshProfile = async () => {
          try {
            const profileData = await UserProfileService.getUserProfile(user.id);
            if (profileData) {
              // photoURL kontrolü
              console.log('👁️ ProfileScreen: Focus effect - refreshing profile...');
              console.log('👁️ ProfileScreen: Current user photoURL:', user.photoURL);
              console.log('👁️ ProfileScreen: Firestore profileData photoURL:', profileData.photoURL);

              let photoURL = user.photoURL || '';
              if (profileData.photoURL && typeof profileData.photoURL === 'string' && profileData.photoURL.trim() !== '') {
                photoURL = profileData.photoURL;
                console.log('👁️ ProfileScreen: Using Firestore photoURL:', photoURL);
              } else {
                console.log('👁️ ProfileScreen: Keeping current photoURL:', photoURL);
              }

              const updatedUser = {
                ...user,
                displayName: profileData.displayName || user.displayName,
                photoURL: photoURL,
                city: profileData.city || user.city,
                bio: profileData.bio || user.bio,
                updatedAt: profileData.updatedAt || user.updatedAt,
              };

              setUser(updatedUser);
              console.log('✅ ProfileScreen: Profile refreshed on focus:', {
                photoURL: updatedUser.photoURL,
                photoURLLength: updatedUser.photoURL.length,
                photoURLIsFile: updatedUser.photoURL.startsWith('file://'),
                photoURLIsHttp: updatedUser.photoURL.startsWith('http://') || updatedUser.photoURL.startsWith('https://'),
              });
            }
          } catch (error) {
            console.error('Error refreshing profile on focus:', error);
          }
        };

        refreshProfile();
        loadUserPets();
        loadProfileCounts();
      }
    }, [isAuthenticated, user?.id, loadUserPets, loadProfileCounts, setUser])
  );

  const onRefresh = async () => {
    if (!user?.id) return;

    setRefreshing(true);
    try {
      console.log('Refreshing profile data for user:', user.id);

      // Firestore'dan güncel profil verilerini çek
      const profileData = await UserProfileService.getUserProfile(user.id);

      if (profileData) {
        // photoURL kontrolü: Firestore'dan gelen varsa onu kullan
        console.log('🔄 ProfileScreen: Refreshing profile data...');
        console.log('🔄 ProfileScreen: Current user photoURL:', user.photoURL);
        console.log('🔄 ProfileScreen: Firestore profileData photoURL:', profileData.photoURL);

        let photoURL = user.photoURL || '';
        if (profileData.photoURL && typeof profileData.photoURL === 'string' && profileData.photoURL.trim() !== '') {
          photoURL = profileData.photoURL;
          console.log('🔄 ProfileScreen: Using Firestore photoURL:', photoURL);
        } else {
          console.log('🔄 ProfileScreen: Keeping current photoURL:', photoURL);
        }

        // Güncel verilerle user state'ini güncelle
        const updatedUser = {
          ...user,
          displayName: profileData.displayName || user.displayName,
          photoURL: photoURL,
          city: profileData.city || user.city,
          bio: profileData.bio || user.bio,
          updatedAt: profileData.updatedAt || user.updatedAt,
        };

        setUser(updatedUser);
        console.log('✅ ProfileScreen: Profile data refreshed:', {
          displayName: updatedUser.displayName,
          photoURL: updatedUser.photoURL,
          photoURLLength: updatedUser.photoURL.length,
          photoURLType: typeof updatedUser.photoURL,
          photoURLIsFile: updatedUser.photoURL.startsWith('file://'),
          photoURLIsHttp: updatedUser.photoURL.startsWith('http://') || updatedUser.photoURL.startsWith('https://'),
        });

        // Pet'leri ve sayıları da yenile
        await loadUserPets();
        await loadProfileCounts();

        // Başarı popup'ı göster
        Alert.alert('✅ Güncellendi', 'Profil bilgileriniz başarıyla güncellendi!');
      } else {
        Alert.alert('ℹ️ Bilgi', 'Güncellenecek yeni veri bulunamadı.');
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      Alert.alert('❌ Hata', 'Profil bilgileri güncellenirken bir hata oluştu.');
    } finally {
      setRefreshing(false);
    }
  };

  const profileOptions = [
    {
      id: 'listings',
      title: t('profile.myListings'),
      icon: FileText,
      count: userPets.length,
      onPress: () => console.log('My listings'),
    },
    {
      id: 'saved',
      title: 'Beğenilerim',
      icon: Heart,
      count: loadingCounts ? 0 : savedCount,
      onPress: () => setShowFavoritesModal(true),
    },
    {
      id: 'contributions',
      title: t('profile.contributions'),
      icon: MapPin,
      count: loadingCounts ? 0 : contributionsCount,
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

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary[500]]}
            tintColor={theme.colors.primary[500]}
            title="Profil güncelleniyor..."
            titleColor={theme.colors.text.secondary}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {isValidPhotoURL(photoURL) && !imageError ? (
            <Image
              source={{ uri: photoURL }}
              style={styles.profileAvatar}
              onError={() => setImageError(true)}
              onLoadStart={() => setImageError(false)}
            />
          ) : (
            <LinearGradient
              colors={[theme.colors.primary[400], theme.colors.primary[500]]}
              style={styles.avatar}
            >
              <User size={44} color="white" />
            </LinearGradient>
          )}

          <Text style={styles.displayName}>
            {user?.displayName || user?.email?.split('@')[0] || 'Pet Lover'}
          </Text>

          {user?.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoEmoji}>📧</Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>
          )}

          {user?.city && (
            <View style={styles.infoRow}>
              <Text style={styles.infoEmoji}>📍</Text>
              <Text style={styles.location}>{user.city}</Text>
            </View>
          )}

          {user?.bio && (
            <View style={styles.bioContainer}>
              <Text style={styles.bioLabel}>💬 Hakkımda</Text>
              <Text style={styles.bio}>{user.bio}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => {
              console.log('Edit profile button pressed');
              setShowEditModal(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.editProfileText}>✏️ Profil Bilgilerini Düzenle</Text>
          </TouchableOpacity>
        </View>

        {/* User's Pets */}
        {userPets.length > 0 && (
          <View style={styles.petsSection}>
            <Text style={styles.sectionTitle}>İlanlarım ({userPets.length})</Text>
            <View style={styles.petsGrid}>
              {userPets.map((pet) => (
                <View key={pet.id} style={styles.petCardWrapper}>
                  <PetCard
                    pet={pet as Pet}
                    isFavorite={false}
                    onPress={() => console.log('Pet pressed:', pet.id)}
                    onFavoritePress={() => { }}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Profile Options */}
        <View style={styles.optionsContainer}>
          <View style={styles.optionsCard}>
            {profileOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionItem,
                  index === profileOptions.length - 1 && styles.optionItemLast
                ]}
                onPress={option.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.optionIcon}>
                    <option.icon size={22} color={theme.colors.primary[500]} strokeWidth={2} />
                  </View>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                </View>
                <View style={styles.optionRight}>
                  <View style={styles.countBadge}>
                    <Text style={styles.optionCount}>{option.count}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Settings & Logout */}
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => console.log('Settings')}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, styles.settingsIcon]}>
                  <Settings size={22} color={theme.colors.text.secondary} strokeWidth={2} />
                </View>
                <Text style={styles.optionTitle}>{t('profile.settings')}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingsItem}
              onPress={logout}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, styles.logoutIcon]}>
                  <LogOut size={22} color={theme.colors.error[500]} strokeWidth={2} />
                </View>
                <Text style={[styles.optionTitle, styles.logoutText]}>
                  {t('common.logout')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      <FavoritesModal
        visible={showFavoritesModal}
        onClose={() => {
          setShowFavoritesModal(false);
          // Reload counts when modal closes
          loadProfileCounts();
        }}
      />
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
    borderRadius: 24,
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
  },
  loginTitle: {
    fontSize: 22,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 50,
    overflow: 'hidden',
  },
  loginGradient: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: 50,
  },
  loginButtonText: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    fontSize: theme.typography.fontSize.base,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 3,
    borderColor: theme.colors.primary[300],
  },
  displayName: {
    fontSize: 24,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  infoEmoji: {
    fontSize: 16,
  },
  email: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  location: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  optionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: 100,
  },
  optionsCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 20,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  optionItemLast: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  settingsIcon: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  logoutIcon: {
    backgroundColor: theme.colors.error[50],
  },
  optionTitle: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  optionRight: {
    marginLeft: theme.spacing.sm,
  },
  countBadge: {
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCount: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.primary[600],
  },
  settingsCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 20,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginHorizontal: theme.spacing.lg,
  },
  logoutText: {
    color: theme.colors.error[500],
  },
  editProfileButton: {
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 50,
    marginTop: theme.spacing.lg,
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  editProfileText: {
    color: 'white',
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    textAlign: 'center',
  },
  profileAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: theme.colors.primary[300],
    marginBottom: theme.spacing.lg,
  },
  bioContainer: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    width: '100%',
  },
  bioLabel: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  bio: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 22,
  },
  petsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  petsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  petCardWrapper: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
});