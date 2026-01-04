import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  User,
  Heart,
  FileText,
  MapPin,
  LogOut,
  X,
  Droplets,
  Home,
  Stethoscope,
  Shield,
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

// Spot tipine göre ikon döndür
const getSpotIcon = (type: string, size: number = 20) => {
  switch (type) {
    case 'water':
      return <Droplets size={size} color="white" />;
    case 'food':
      return <Heart size={size} color="white" />;
    case 'both':
      return <Home size={size} color="white" />;
    case 'veterinary':
      return <Stethoscope size={size} color="white" />;
    case 'shelter':
      return <Shield size={size} color="white" />;
    default:
      return <MapPin size={size} color="white" />;
  }
};

// Spot tipine göre renk döndür
const getSpotColor = (type: string): string => {
  switch (type) {
    case 'water':
      return '#3b82f6';
    case 'food':
      return '#f97316';
    case 'both':
      return '#8b5cf6';
    case 'veterinary':
      return '#10b981';
    case 'shelter':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
};

// Spot tipine göre label döndür
const getSpotLabel = (type: string, t: any): string => {
  switch (type) {
    case 'water':
      return t('map.water');
    case 'food':
      return t('map.food');
    case 'both':
      return t('map.both');
    case 'veterinary':
      return t('map.veterinary');
    case 'shelter':
      return t('map.shelter');
    default:
      return t('map.spot');
  }
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, setUser } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const petsSectionY = useRef<number>(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContributionsModal, setShowContributionsModal] = useState(false);
  const [userContributions, setUserContributions] = useState<any[]>([]);
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

  const loadUserContributions = useCallback(async () => {
    if (!user?.id) return;
    try {
      const spots = await MapSpotService.getUserMapSpots(user.id);
      setUserContributions(spots);
    } catch (error) {
      console.error('Error loading contributions:', error);
    }
  }, [user?.id]);

  const scrollToListings = () => {
    if (petsSectionY.current > 0) {
      scrollViewRef.current?.scrollTo({ y: petsSectionY.current - 20, animated: true });
    }
  };

  const handleContributionsPress = async () => {
    await loadUserContributions();
    setShowContributionsModal(true);
  };

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
        ref={scrollViewRef}
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
            <TouchableOpacity style={styles.statCard} onPress={scrollToListings} activeOpacity={0.7}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary[100] }]}>
                <FileText size={24} color={theme.colors.primary[500]} />
              </View>
              <Text style={styles.statNumber}>{userPets.length}</Text>
              <Text style={styles.statLabel}>{t('profile.myListings')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard} onPress={() => setShowFavoritesModal(true)} activeOpacity={0.7}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Heart size={24} color="#EF4444" />
              </View>
              <Text style={styles.statNumber}>{loadingCounts ? 0 : savedCount}</Text>
              <Text style={styles.statLabel}>{t('profile.favorites')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard} onPress={handleContributionsPress} activeOpacity={0.7}>
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
          <View
            style={styles.petsSection}
            onLayout={(e) => { petsSectionY.current = e.nativeEvent.layout.y; }}
          >
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

        {/* Logout */}
        <View style={styles.settingsSection}>
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

      {/* Contributions Modal */}
      <Modal
        visible={showContributionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContributionsModal(false)}
      >
        <BlurView intensity={20} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <SafeAreaView style={styles.modalSafeArea}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <MapPin size={24} color="#10B981" />
                  <Text style={styles.modalHeaderTitle}>{t('profile.contributions')}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowContributionsModal(false)} style={styles.modalCloseButton}>
                  <X size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              {loadingPets ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#10B981" />
                  <Text style={styles.modalLoadingText}>{t('common.loading')}</Text>
                </View>
              ) : userContributions.length === 0 ? (
                <View style={styles.modalEmptyContainer}>
                  <MapPin size={64} color={theme.colors.text.tertiary} strokeWidth={1} />
                  <Text style={styles.modalEmptyTitle}>{t('profile.noContributions')}</Text>
                  <Text style={styles.modalEmptySubtitle}>
                    {t('profile.noContributionsDesc')}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={userContributions}
                  renderItem={({ item }) => (
                    <View style={styles.contributionItem}>
                      <View style={[styles.contributionIconContainer, { backgroundColor: getSpotColor(item.type) }]}>
                        {getSpotIcon(item.type, 20)}
                      </View>
                      <View style={styles.contributionInfo}>
                        <Text style={styles.contributionName}>{item.name || getSpotLabel(item.type, t)}</Text>
                        <Text style={[styles.contributionType, { color: getSpotColor(item.type) }]}>{getSpotLabel(item.type, t)}</Text>
                        {item.note && (
                          <Text style={styles.contributionAddress}>{item.note}</Text>
                        )}
                      </View>
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.contributionListContent}
                  showsVerticalScrollIndicator={true}
                />
              )}
            </SafeAreaView>
          </View>
        </BlurView>
      </Modal>
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '95%',
    height: '80%',
    backgroundColor: theme.colors.background.primary,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  modalLoadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  modalEmptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  modalEmptyTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  modalEmptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  contributionListContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  contributionItem: {
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
    elevation: 2,
  },
  contributionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  contributionInfo: {
    flex: 1,
  },
  contributionName: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  contributionType: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    marginBottom: 2,
  },
  contributionAddress: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
});