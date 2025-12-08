import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  FlatList,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, MapPin, Calendar, Heart, Shield, User, Play, Camera, Video, Edit, MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { Pet } from '../../types';
import { MediaGalleryModal } from './MediaGalleryModal';
import { EditPetModal } from '../pet/EditPetModal';

interface PetDetailModalProps {
  visible: boolean;
  onClose: () => void;
  pet: Pet | null;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  currentUserId?: string | null;
  onContactPress?: () => void;
  onPetUpdate?: () => void;
}

export const PetDetailModal: React.FC<PetDetailModalProps> = ({
  visible,
  onClose,
  pet,
  onFavoritePress,
  isFavorite = false,
  currentUserId = null,
  onContactPress,
  onPetUpdate
}) => {
  const router = useRouter();
  const [mediaGalleryVisible, setMediaGalleryVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Get first photo URL
  const imageURL = pet?.photos && Array.isArray(pet.photos) && pet.photos.length > 0
    ? pet.photos[0]
    : null;

  if (!pet) return null;

  const isOwner = currentUserId && pet.ownerId === currentUserId;

  const allMedia = [
    ...pet.photos.map(photo => ({ type: 'photo' as const, url: photo })),
    ...pet.videos.map(video => ({ type: 'video' as const, url: video }))
  ];

  const getSpeciesEmoji = (species: string) => {
    switch (species) {
      case 'dog': return '🐕';
      case 'cat': return '🐱';
      default: return '🐾';
    }
  };

  const getSizeText = (size: string) => {
    switch (size) {
      case 'small': return 'Küçük';
      case 'medium': return 'Orta';
      case 'large': return 'Büyük';
      default: return size;
    }
  };

  const getSexText = (sex: string) => {
    return sex === 'male' ? 'Erkek' : 'Dişi';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.content}>
            {/* Header with Image */}
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri: imageURL || 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'
                }}
                style={styles.petImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.imageGradient}
              />

              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={22} color={theme.colors.text.primary} />
              </TouchableOpacity>

              {/* Favorite Button */}
              <TouchableOpacity style={styles.favoriteButton} onPress={onFavoritePress}>
                <Heart
                  size={22}
                  color={isFavorite ? '#EF4444' : theme.colors.text.secondary}
                  fill={isFavorite ? '#EF4444' : 'transparent'}
                />
              </TouchableOpacity>

              {/* Pet Name Overlay */}
              <View style={styles.nameOverlay}>
                <Text style={styles.petName}>
                  {getSpeciesEmoji(pet.species)} {pet.name}
                </Text>
                <Text style={styles.petBreed}>{pet.breed}</Text>
              </View>

            </View>

            {/* Content */}
            <View style={styles.contentArea}>
              {/* Media Gallery Button */}
              <TouchableOpacity style={styles.mediaGalleryButton} onPress={() => {
                setMediaGalleryVisible(true);
              }}>
                <View style={styles.mediaGalleryButtonContent}>
                  <Camera size={24} color={theme.colors.primary[500]} />
                  <View style={styles.mediaGalleryButtonTextContainer}>
                    <Text style={styles.mediaGalleryButtonTitle}>Medya Galerisi</Text>
                    <Text style={styles.mediaGalleryButtonSubtitle}>
                      {pet.photos.length} fotoğraf, {pet.videos.length} video
                    </Text>
                  </View>
                  <View style={styles.mediaGalleryButtonArrow}>
                    <Text style={styles.mediaGalleryButtonArrowText}>›</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Basic Info */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Calendar size={20} color={theme.colors.primary[500]} />
                    <Text style={styles.infoLabel}>Yaş</Text>
                    <Text style={styles.infoValue}>{pet.ageMonths} ay</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <User size={20} color={theme.colors.primary[500]} />
                    <Text style={styles.infoLabel}>Cinsiyet</Text>
                    <Text style={styles.infoValue}>{getSexText(pet.sex)}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Shield size={20} color={theme.colors.primary[500]} />
                    <Text style={styles.infoLabel}>Boyut</Text>
                    <Text style={styles.infoValue}>{getSizeText(pet.size)}</Text>
                  </View>
                </View>
              </View>

              {/* Location */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Konum</Text>
                <View style={styles.locationContainer}>
                  <MapPin size={20} color={theme.colors.primary[500]} />
                  <Text style={styles.locationText}>{pet.city}</Text>
                </View>
              </View>

              {/* Health Status */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Sağlık Durumu</Text>
                <View style={styles.healthGrid}>
                  <View style={[styles.healthItem, pet.vaccinated && styles.healthItemActive]}>
                    <Text style={[styles.healthText, pet.vaccinated && styles.healthTextActive]}>
                      {pet.vaccinated ? '✅' : '❌'} Aşılı
                    </Text>
                  </View>
                  <View style={[styles.healthItem, pet.neutered && styles.healthItemActive]}>
                    <Text style={[styles.healthText, pet.neutered && styles.healthTextActive]}>
                      {pet.neutered ? '✅' : '❌'} Kısırlaştırılmış
                    </Text>
                  </View>
                </View>
              </View>

              {/* Description */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Hakkında</Text>
                <Text style={styles.description}>{pet.description}</Text>
              </View>

              {/* Tags */}
              {pet.tags && pet.tags.length > 0 && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Özellikler</Text>
                  <View style={styles.tagsContainer}>
                    {pet.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {isOwner ? (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setEditModalVisible(true);
                    }}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary[500], theme.colors.primary[600]]}
                      style={styles.editGradient}
                    >
                      <Edit size={20} color="white" style={styles.buttonIcon} />
                      <Text style={styles.editText}>İlanı Düzenle</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => {
                      if (onContactPress) {
                        onContactPress();
                      }
                      onClose();
                    }}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary[500], theme.colors.primary[600]]}
                      style={styles.contactGradient}
                    >
                      <MessageCircle size={20} color="white" style={styles.buttonIcon} />
                      <Text style={styles.contactText}>İletişime Geç</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </BlurView>

      {/* Media Gallery Modal */}
      <MediaGalleryModal
        visible={mediaGalleryVisible}
        onClose={() => setMediaGalleryVisible(false)}
        pet={pet}
      />

      {/* Edit Pet Modal */}
      <EditPetModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        pet={pet}
        onUpdate={() => {
          if (onPetUpdate) onPetUpdate();
          setEditModalVisible(false);
        }}
      />
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    height: '92%',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: theme.colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: height * 0.28,
    position: 'relative',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  petName: {
    fontSize: 26,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  petBreed: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.body,
    color: 'rgba(255, 255, 255, 0.95)',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  contentArea: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background.primary,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.background.primary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    marginTop: 6,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  locationText: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    marginLeft: 10,
  },
  healthGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  healthItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.background.primary,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  healthItemActive: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
  },
  healthText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  healthTextActive: {
    color: theme.colors.primary[600],
    fontFamily: theme.typography.fontFamily.bodySemiBold,
  },
  description: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
    backgroundColor: theme.colors.background.primary,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.primary[600],
  },
  actionButtons: {
    marginTop: 16,
    paddingBottom: 8,
  },
  contactButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  contactGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  contactText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: 'white',
  },
  editButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  editGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  editText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: 'white',
  },
  buttonIcon: {
    marginRight: 0,
  },
  // Media Gallery Button
  mediaGalleryButton: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  mediaGalleryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  mediaGalleryButtonTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  mediaGalleryButtonTitle: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  mediaGalleryButtonSubtitle: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  mediaGalleryButtonArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaGalleryButtonArrowText: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.primary[500],
  },
});
