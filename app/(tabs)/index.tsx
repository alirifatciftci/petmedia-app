import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Home as HomeIcon,
  Users,
  Droplets
} from 'lucide-react-native';
import { theme } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { FeatureCard } from '../../components/common/FeatureCard';
import { PetCard } from '../../components/common/PetCard';
import { BeautifulModal } from '../../components/common/BeautifulModal';
import { PetDetailModal } from '../../components/common/PetDetailModal';
import { PawIcon } from '../../components/common/PawIcon';
import { usePetStore } from '../../stores/petStore';
import { useAuthStore } from '../../stores/authStore';
import { Pet } from '../../types';
import { PetService, MessageService, UserService, UserProfileService } from '../../services/firebase';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'cat' | 'dog' | 'other'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    description: '',
    icon: null as React.ReactNode,
    onConfirm: () => { }
  });
  const [petDetailVisible, setPetDetailVisible] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);

  const { favorites, toggleFavorite } = usePetStore();

  const handleToggleFavorite = async (petId: string) => {
    if (!user?.id) return;

    // Update local state
    toggleFavorite(petId);

    // Get updated favorites
    const isCurrentlyFavorite = favorites.includes(petId);
    const updatedFavorites = isCurrentlyFavorite
      ? favorites.filter(id => id !== petId)
      : [...favorites, petId];

    // Update Firestore
    try {
      await UserProfileService.updateUserProfile(user.id, {
        favorites: updatedFavorites,
      });

      // Update user state
      if (user) {
        setUser({
          ...user,
          favorites: updatedFavorites,
        });
      }

      console.log('HomeScreen: Favorites updated in Firestore:', updatedFavorites);
    } catch (error) {
      console.error('HomeScreen: Error updating favorites in Firestore:', error);
    }
  };

  const handleContactPress = async (pet: Pet) => {
    if (!user?.id) {
      // User not logged in, show login prompt
      console.log('HomeScreen: User must be logged in to contact');
      return;
    }

    if (pet.ownerId === user.id) {
      // User is the owner, shouldn't happen but handle it
      console.log('HomeScreen: User is the owner, cannot contact themselves');
      return;
    }

    try {
      console.log('HomeScreen: Contacting pet owner:', {
        currentUserId: user.id,
        petOwnerId: pet.ownerId,
        petId: pet.id,
      });

      // Get owner info
      const ownerInfo = await UserService.getUserById(pet.ownerId);
      const ownerName = (ownerInfo as any)?.displayName || (ownerInfo as any)?.email || 'İlan Sahibi';
      const ownerPhoto = (ownerInfo as any)?.photoURL || '';

      console.log('HomeScreen: Owner info retrieved:', { ownerName, ownerPhoto });

      // Get or create chat thread (returns existing chat if exists, creates new if not)
      console.log('HomeScreen: Getting or creating chat thread...');
      const chatId = await MessageService.getOrCreateThread(user.id, pet.ownerId);
      console.log('HomeScreen: Chat thread ID:', chatId);

      // Navigate to chat screen with chatId and user info
      console.log('HomeScreen: Navigating to chat screen with params:', {
        chatId,
        otherUserId: pet.ownerId,
        otherUserName: ownerName,
        otherUserPhoto: ownerPhoto,
      });

      router.push({
        pathname: '/chat',
        params: {
          chatId: chatId,
          otherUserId: pet.ownerId,
          otherUserName: ownerName,
          otherUserPhoto: ownerPhoto,
        },
      });
    } catch (error) {
      console.error('HomeScreen: Error in handleContactPress:', error);
      Alert.alert('Hata', 'İletişim kurulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const loadPets = useCallback(async () => {
    setLoadingPets(true);
    try {
      let loadedPets: Pet[];
      if (selectedFilter === 'all') {
        loadedPets = await PetService.getAllPets() as Pet[];
      } else {
        loadedPets = await PetService.getPetsBySpecies(selectedFilter) as Pet[];
      }
      setPets(loadedPets);
    } catch (error) {
      console.error('Error loading pets:', error);
      setPets([]);
    } finally {
      setLoadingPets(false);
    }
  }, [selectedFilter]);

  React.useEffect(() => {
    loadPets();
  }, [loadPets]);

  // Ekran focus olduğunda pet'leri yenile
  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [loadPets])
  );

  const filteredPets = pets.filter(pet => {
    const matchesFilter = selectedFilter === 'all' || pet.species === selectedFilter;
    return matchesFilter;
  });

  const renderPetCard = ({ item }: { item: Pet }) => (
    <PetCard
      pet={item}
      isFavorite={favorites.includes(item.id)}
      onPress={() => {
        setSelectedPet(item);
        setPetDetailVisible(true);
      }}
      onFavoritePress={() => handleToggleFavorite(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />

      {/* Header */}
      <AppHeader
        showLogin={true}
        onLoginPress={() => console.log('Login pressed')}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Feature Cards */}
        <View style={styles.featuresContainer}>
          <FeatureCard
            title={t('features.findHome.title')}
            backgroundColor={theme.colors.cards.purple}
            icon={<HomeIcon size={32} color="white" />}
            onPress={() => {
              setModalContent({
                title: t('modal.findHomeTitle'),
                description: t('modal.findHomeDesc'),
                icon: <HomeIcon size={40} color={theme.colors.primary[500]} />,
                onConfirm: () => {
                  console.log('Find home pressed');
                  setModalVisible(false);
                }
              });
              setModalVisible(true);
            }}
          />

          <FeatureCard
            title={t('features.findFriend.title')}
            backgroundColor={theme.colors.cards.lightBlue}
            icon={<Users size={32} color="white" />}
            onPress={() => {
              setModalContent({
                title: t('modal.findFriendTitle'),
                description: t('modal.findFriendDesc'),
                icon: <Users size={40} color={theme.colors.primary[500]} />,
                onConfirm: () => {
                  console.log('Find friend pressed');
                  setModalVisible(false);
                }
              });
              setModalVisible(true);
            }}
          />

          <FeatureCard
            title={t('features.foodWater.title')}
            backgroundColor={theme.colors.cards.orange}
            icon={<Droplets size={32} color="white" />}
            onPress={() => {
              setModalContent({
                title: t('modal.foodWaterTitle'),
                description: t('modal.foodWaterDesc'),
                icon: <Droplets size={40} color={theme.colors.primary[500]} />,
                onConfirm: () => {
                  console.log('Food/water pressed');
                  setModalVisible(false);
                }
              });
              setModalVisible(true);
            }}
          />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#8B5CF6', '#A78BFA', '#C4B5FD']}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroIconContainer}>
                <PawIcon size={60} color="white" />
              </View>

              <Text style={styles.heroTitle}>
                {t('hero.title')}
              </Text>

              <Text style={styles.heroDescription}>
                {t('hero.description')}
              </Text>

              <View style={styles.heroStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>1000+</Text>
                  <Text style={styles.statLabel}>{t('hero.happyFamilies')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>500+</Text>
                  <Text style={styles.statLabel}>{t('hero.savedLives')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>24/7</Text>
                  <Text style={styles.statLabel}>{t('hero.support')}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>{t('home.title')}</Text>

          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            {[
              { key: 'all', label: t('home.filters.all') },
              { key: 'cat', label: t('home.filters.cats') },
              { key: 'dog', label: t('home.filters.dogs') },
              { key: 'other', label: t('home.filters.other') }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.key && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedFilter(filter.key as any)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter.key && styles.filterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pets Grid */}
        <View style={styles.petsContainer}>
          {loadingPets ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          ) : filteredPets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('common.noListings')}</Text>
            </View>
          ) : (
            <View style={styles.petsGrid}>
              {filteredPets.map((pet) => (
                <View key={pet.id} style={styles.petCardWrapper}>
                  {renderPetCard({ item: pet })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Beautiful Modal */}
      <BeautifulModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalContent.title}
        description={modalContent.description}
        icon={modalContent.icon}
        onConfirm={modalContent.onConfirm}
        confirmText={t('common.continue')}
        cancelText={t('common.cancel')}
      />

      {/* Pet Detail Modal */}
      <PetDetailModal
        visible={petDetailVisible}
        onClose={() => setPetDetailVisible(false)}
        pet={selectedPet}
        isFavorite={selectedPet ? favorites.includes(selectedPet.id) : false}
        onFavoritePress={() => {
          if (selectedPet) {
            handleToggleFavorite(selectedPet.id);
          }
        }}
        currentUserId={user?.id || null}
        onContactPress={() => {
          if (selectedPet) {
            handleContactPress(selectedPet);
          }
        }}
        onPetUpdate={async () => {
          // Reload pets after update
          await loadPets();
          // Close the detail modal to show updated list
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
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Account for tab bar
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  heroSection: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius['2xl'],
    overflow: 'hidden',
  },
  heroGradient: {
    padding: theme.spacing.lg,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIconContainer: {
    marginBottom: theme.spacing.md,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: theme.typography.fontFamily.bodyBold,
    textAlign: 'center',
    color: 'white',
    marginBottom: theme.spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroDescription: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: 'white',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: theme.spacing.xs,
  },
  searchSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  filterText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.secondary,
  },
  filterTextActive: {
    color: theme.colors.text.inverse,
  },
  petsContainer: {
    paddingHorizontal: theme.spacing.lg,
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
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
});