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
import { PetDetailModal } from '../../components/common/PetDetailModal';
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
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [petDetailVisible, setPetDetailVisible] = useState(false);

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
        Alert.alert(`✅ ${t('common.updated')}`, t('common.profileUpdated'));
      } else {
        Alert.alert('ℹ️', t('common.noNewData'));
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      Alert.alert('❌', t('common.updateError'));
    } finally {
      setRefreshing(false);
    }
  };

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
              <Text style={styles.loginTitle}>{t('profile.viewProfile')}</Text>
              <Text style={styles.loginSubtitle}>
                {t('profile.loginToSee')}
              </Text>

              <TouchableOpacity style={styles.loginButton}>
                <LinearGradient
                  colors={[theme.colors.gradient.start, theme.colors.gradient.end]}
                  style={styles.loginGradient}
                >
                  <Text style={styles.loginButtonText}>{t('common.login')}</Text>
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
      <StatusBar style="light" backgroundColor={theme.colors.primary[500]} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary[500]]}
            tintColor={theme.colors.primary[500]}
            title={t('profile.updatingProfile')}
            titleColor={theme.colors.text.secondary}
          />
        }
      >
        {/* Profile Header with Gradient */}
        <LinearGradient
          colors={[theme.colors.primary[500], theme.colors.primary[400]]}
          style={styles.headerGradient}
        >
          <View style={styles.profileHeader}>
            {isValidPhotoURL(photoURL) && !imageError ? (
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: photoURL }}
                  style={styles.profileAvatar}
                  onError={() => setImageError(true)}
                  onLoadStart={() => setImageError(false)}
                />
              </View>
            ) : (
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <User size={48} color={theme.colors.primary[500]} />
                </View>
              </View>
            )}

            <Text style={styles.displayName}>
              {user?.displayName || user?.email?.split('@')[0] || 'Pet Lover'}
            </Text>

            {user?.email && (
              <Text style={styles.email}>{user.email}</Text>
            )}

            {user?.city && (
              <View style={styles.locationBadge}>
                <MapPin size={14} color="white" />
                <Text style={styles.locationText}>{user.city}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statCard} onPress={() => console.log('My listings')}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary[100] }]}>
                <FileText size={24} color={theme.colors.primary[500]} />
              </View>
              <Text style={styles.statNumber}>{userPets.length}</Text>
              <Text style={styles.statLabel}>{t('profile.myListings')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard} onPress={() => setShowFavoritesModal(true)}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Heart size={24} color="#EF4444" />
              </View>
              <Text style={styles.statNumber}>{loadingCounts ? 0 : savedCount}</Text>
              <Text style={styles.statLabel}>{t('profile.favorites')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard} onPress={() => console.log('Map contributions')}>
              <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
                <MapPin size={24} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>{loadingCounts ? 0 : contributionsCount}</Text>
              <Text style={styles.statLabel}>{t('profile.contributions')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio Section */}
        {user?.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.bioTitle}>{t('profile.aboutMe')}</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        )}

        {/* Edit Profile Button */}
        <View style={styles.editButtonContainer}>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.editProfileText}>{t('profile.editProfile')}</Text>
          </TouchableOpacity>
        </View>

        {/* User's Pets */}
        {userPets.length > 0 && (
          <View style={styles.petsSection}>
            <Text style={styles.sectionTitle}>{t('profile.myListings')}</Text>
            <View style={styles.petsGrid}>
              {userPets.map((pet) => (
                <View key={pet.id} style={styles.petCardWrapper}>
                  <PetCard
                    pet={pet as Pet}
                    isFavorite={false}
                    onPress={() => {
                      setSelectedPet(pet as Pet);
                      setPetDetailVisible(true);
                    }}
                    onFavoritePress={() => { }}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Settings & Logout */}
        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => console.log('Settings')}
            activeOpacity={0.7}
          >
            <View style={styles.settingsIconContainer}>
              <Settings size={22} color={theme.colors.text.secondary} />
            </View>
            <Text style={styles.settingsText}>{t('profile.settings')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutItem}
            onPress={logout}
            activeOpacity={0.7}
          >
            <View style={styles.logoutIconContainer}>
              <LogOut size={22} color={theme.colors.error[500]} />
            </View>
            <Text style={styles.logoutText}>{t('common.logout')}</Text>
          </TouchableOpacity>
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

      <PetDetailModal
        visible={petDetailVisible}
        onClose={() => setPetDetailVisible(false)}
        pet={selectedPet}
        isFavorite={false}
        currentUserId={user?.id || null}
        onPetUpdate={async () => {
          // Reload user pets after update
          if (user?.id) {
            const pets = await PetService.getUserPets(user.id);
            setUserPets(pets as Pet[]);
          }
          setPetDetailVisible(false);
          setSelectedPet(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  headerGradient: {
    paddingTop: theme.spacing.xl,
    paddingBottom: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  avatarContainer: {
    padding: 4,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'white',
  },
  displayName: {
    fontSize: 26,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: 'white',
    marginBottom: theme.spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  email: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: theme.spacing.sm,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: 'white',
  },
  statsContainer: {
    marginTop: -40,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: theme.spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  statNumber: {
    fontSize: 22,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  bioSection: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bioTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  bioText: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  editButtonContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  editProfileButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  editProfileText: {
    color: 'white',
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    textAlign: 'center',
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
  settingsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  settingsText: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.error[500],
  },
});