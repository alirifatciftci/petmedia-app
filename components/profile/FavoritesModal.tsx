import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { X, Heart } from 'lucide-react-native';
import { theme } from '../../theme';
import { PetService, UserProfileService } from '../../services/firebase';
import { PetCard } from '../common/PetCard';
import { Pet } from '../../types';
import { PetDetailModal } from '../common/PetDetailModal';
import { useAuthStore } from '../../stores/authStore';
import { usePetStore } from '../../stores/petStore';
import { useRouter } from 'expo-router';
import { MessageService, UserService } from '../../services/firebase';

interface FavoritesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { toggleFavorite } = usePetStore();
  const [favoritePets, setFavoritePets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [petDetailVisible, setPetDetailVisible] = useState(false);

  useEffect(() => {
    if (visible && user?.id) {
      loadFavoritePets();
    }
  }, [visible, user?.id]);

  const loadFavoritePets = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Get favorites from Firestore (most up-to-date)
      const profileData = await UserProfileService.getUserProfile(user.id);
      const favoriteIds = profileData?.favorites || user.favorites || [];

      console.log('FavoritesModal: Loading favorite pets, IDs:', favoriteIds);

      if (favoriteIds.length === 0) {
        setFavoritePets([]);
        setLoading(false);
        return;
      }

      // Fetch all favorite pets
      const petPromises = favoriteIds.map(async (petId: string) => {
        try {
          const pet = await PetService.getPet(petId);
          return pet as Pet;
        } catch (error) {
          console.error(`FavoritesModal: Error loading pet ${petId}:`, error);
          return null;
        }
      });

      const pets = await Promise.all(petPromises);
      const validPets = pets.filter((pet: Pet | null): pet is Pet => pet !== null);

      console.log('FavoritesModal: Loaded favorite pets:', validPets.length);
      setFavoritePets(validPets);
    } catch (error) {
      console.error('FavoritesModal: Error loading favorite pets:', error);
      setFavoritePets([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePetPress = (pet: Pet) => {
    setSelectedPet(pet);
    setPetDetailVisible(true);
  };

  const handleFavoriteToggle = async (petId: string) => {
    if (!user?.id) return;

    // Get current favorites from user (most up-to-date)
    const currentFavorites = user.favorites || [];
    const isCurrentlyFavorite = currentFavorites.includes(petId);
    const updatedFavorites = isCurrentlyFavorite
      ? currentFavorites.filter(id => id !== petId)
      : [...currentFavorites, petId];

    // Update local state
    toggleFavorite(petId);

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

      console.log('FavoritesModal: Favorites updated in Firestore:', updatedFavorites);

      // Reload favorites after toggle
      setTimeout(() => {
        loadFavoritePets();
      }, 300);
    } catch (error) {
      console.error('FavoritesModal: Error updating favorites in Firestore:', error);
      // Still reload to show current state
      setTimeout(() => {
        loadFavoritePets();
      }, 300);
    }
  };

  const handleContactPress = async (pet: Pet) => {
    if (!user?.id) return;

    if (pet.ownerId === user.id) {
      return;
    }

    try {
      const ownerInfo = await UserService.getUserById(pet.ownerId);
      const ownerName = (ownerInfo as any)?.displayName || (ownerInfo as any)?.email || 'İlan Sahibi';
      const ownerPhoto = (ownerInfo as any)?.photoURL || '';

      const chatId = await MessageService.getOrCreateThread(user.id, pet.ownerId);

      onClose();
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
      console.error('FavoritesModal: Error creating chat:', error);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <BlurView intensity={20} style={styles.overlay}>
          <View style={styles.modalContainer}>
            <SafeAreaView style={styles.safeArea}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Heart size={24} color={theme.colors.primary[500]} fill={theme.colors.primary[500]} />
                  <Text style={styles.headerTitle}>Beğenilerim</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                  <Text style={styles.loadingText}>Beğeniler yükleniyor...</Text>
                </View>
              ) : favoritePets.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Heart size={64} color={theme.colors.text.tertiary} strokeWidth={1} />
                  <Text style={styles.emptyTitle}>Henüz beğeni yok</Text>
                  <Text style={styles.emptySubtitle}>
                    Beğendiğiniz ilanlar burada görünecek
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={favoritePets}
                  renderItem={({ item }) => (
                    <View style={styles.petCardWrapper}>
                      <PetCard
                        pet={item}
                        isFavorite={true}
                        onPress={() => handlePetPress(item)}
                        onFavoritePress={() => handleFavoriteToggle(item.id)}
                      />
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={styles.petListColumnWrapper}
                  contentContainerStyle={styles.petListContent}
                  showsVerticalScrollIndicator={true}
                />
              )}
            </SafeAreaView>
          </View>
        </BlurView>
      </Modal>

      {/* Pet Detail Modal */}
      <PetDetailModal
        visible={petDetailVisible}
        onClose={() => {
          setPetDetailVisible(false);
          setSelectedPet(null);
        }}
        pet={selectedPet}
        isFavorite={selectedPet ? favoritePets.some(p => p.id === selectedPet.id) : false}
        onFavoritePress={() => {
          if (selectedPet) {
            handleFavoriteToggle(selectedPet.id);
          }
        }}
        currentUserId={user?.id || null}
        onContactPress={() => {
          if (selectedPet) {
            handleContactPress(selectedPet);
          }
        }}
        onPetUpdate={async () => {
          await loadFavoritePets();
          setPetDetailVisible(false);
          setSelectedPet(null);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '95%',
    height: '90%',
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius['2xl'],
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  petListContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  petListColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  petCardWrapper: {
    width: '48%',
  },
});

