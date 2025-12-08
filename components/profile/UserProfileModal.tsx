import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, MapPin, User, Mail } from 'lucide-react-native';
import { theme } from '../../theme';
import { UserService, PetService } from '../../services/firebase';
import { PetCard } from '../common/PetCard';
import { Pet } from '../../types';

// Fotoğraf URL'sinin geçerli ve kalıcı olup olmadığını kontrol et
const isValidPhotoURL = (url: string | null | undefined): boolean => {
  if (!url || url.trim() === '') return false;
  if (url.startsWith('file://')) return false;
  return url.startsWith('data:image') || url.startsWith('http://') || url.startsWith('https://');
};

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  userPhoto?: string;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  onClose,
  userId,
  userName: initialUserName,
  userPhoto: initialUserPhoto,
}) => {
  const [user, setUser] = useState<any>(null);
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPets, setLoadingPets] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      loadUserProfile();
      setImageError(false);
    }
  }, [visible, userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await UserService.getUserById(userId);

      if (userData) {
        setUser(userData);
        // Load user's pets
        loadUserPets(userId);
      } else {
        // Fallback to initial data if user not found
        setUser({
          id: userId,
          displayName: initialUserName || 'Kullanıcı',
          photoURL: initialUserPhoto || '',
          email: '',
          city: '',
          bio: '',
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback to initial data
      setUser({
        id: userId,
        displayName: initialUserName || 'Kullanıcı',
        photoURL: initialUserPhoto || '',
        email: '',
        city: '',
        bio: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserPets = async (ownerId: string) => {
    try {
      setLoadingPets(true);
      const pets = await PetService.getUserPets(ownerId);
      setUserPets(pets as Pet[]);
    } catch (error) {
      console.error('Error loading user pets:', error);
      setUserPets([]);
    } finally {
      setLoadingPets(false);
    }
  };

  const displayName = user?.displayName || initialUserName || 'Kullanıcı';
  const photoURL = user?.photoURL || initialUserPhoto || '';
  const email = user?.email || '';
  const city = user?.city || '';
  const bio = user?.bio || '';
  const initials = displayName.charAt(0).toUpperCase();

  // Reset image error when photoURL changes
  useEffect(() => {
    if (photoURL) {
      setImageError(false);
    }
  }, [photoURL]);

  return (
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
              <Text style={styles.headerTitle}>Profil</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary[500]} />
              </View>
            ) : (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
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
                      style={styles.avatarPlaceholder}
                    >
                      <Text style={styles.avatarText}>{initials}</Text>
                    </LinearGradient>
                  )}

                  <Text style={styles.displayName}>{displayName}</Text>

                  {email && (
                    <View style={styles.infoRow}>
                      <Mail size={16} color={theme.colors.text.secondary} />
                      <Text style={styles.infoText}>{email}</Text>
                    </View>
                  )}

                  {city && (
                    <View style={styles.infoRow}>
                      <MapPin size={16} color={theme.colors.text.secondary} />
                      <Text style={styles.infoText}>{city}</Text>
                    </View>
                  )}

                  {bio && (
                    <View style={styles.bioContainer}>
                      <Text style={styles.bioText}>{bio}</Text>
                    </View>
                  )}
                </View>

                {/* User's Pets */}
                <View style={styles.petsSection}>
                  <Text style={styles.sectionTitle}>İlanları</Text>
                  {loadingPets ? (
                    <View style={styles.petsLoadingContainer}>
                      <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                    </View>
                  ) : userPets.length === 0 ? (
                    <View style={styles.emptyPetsContainer}>
                      <User size={32} color={theme.colors.text.tertiary} />
                      <Text style={styles.emptyPetsText}>Henüz ilan yok</Text>
                    </View>
                  ) : (
                    <View style={styles.petsGrid}>
                      {userPets.map((pet) => (
                        <PetCard
                          key={pet.id}
                          pet={pet}
                          isFavorite={false}
                          onPress={() => { }}
                          onFavoritePress={() => { }}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    marginTop: 80,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl * 2,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
  },
  profileAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: theme.spacing.lg,
    borderWidth: 3,
    borderColor: theme.colors.primary[400],
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 44,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: 'white',
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
    marginTop: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  bioContainer: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    width: '100%',
  },
  bioText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    lineHeight: 24,
    textAlign: 'center',
  },
  petsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  petsLoadingContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyPetsContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.background.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  emptyPetsText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  petsGrid: {
    gap: theme.spacing.md,
  },
});

