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
                  {photoURL && photoURL.trim() !== '' && !imageError ? (
                    <Image 
                      source={{ uri: photoURL }} 
                      style={styles.profileAvatar}
                      onError={() => {
                        // Silently handle image load errors - show placeholder instead
                        setImageError(true);
                      }}
                      onLoadStart={() => setImageError(false)}
                    />
                  ) : (
                    <LinearGradient
                      colors={[theme.colors.primary[500], theme.colors.primary[600]]}
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
                          onPress={() => {}}
                          onFavoritePress={() => {}}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    marginTop: 100,
    borderTopLeftRadius: theme.borderRadius['2xl'],
    borderTopRightRadius: theme.borderRadius['2xl'],
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.secondary,
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
    paddingBottom: theme.spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: theme.spacing.md,
    borderWidth: 4,
    borderColor: theme.colors.primary[200],
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.primary[200],
  },
  avatarText: {
    fontSize: 48,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: 'white',
  },
  displayName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  bioContainer: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
  },
  bioText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
    textAlign: 'center',
  },
  petsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
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

