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
                <X size={24} color="white" />
              </TouchableOpacity>

              {/* Favorite Button */}
              <TouchableOpacity style={styles.favoriteButton} onPress={onFavoritePress}>
                <Heart 
                  size={24} 
                  color={isFavorite ? '#EF4444' : 'white'} 
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    height: '90%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: height * 0.25,
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
    height: 100,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  petName: {
    fontSize: 28,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  petBreed: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  contentArea: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    marginTop: 4,
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
    backgroundColor: theme.colors.background.secondary,
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  healthGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  healthItem: {
    flex: 1,
    padding: 8,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    alignItems: 'center',
  },
  healthItemActive: {
    backgroundColor: theme.colors.primary[50],
  },
  healthText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  healthTextActive: {
    color: theme.colors.primary[600],
  },
  description: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.primary[600],
  },
  actionButtons: {
    marginTop: 12,
  },
  contactButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  contactGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: 'white',
  },
  editButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  editGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mediaGalleryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  mediaGalleryButtonTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  mediaGalleryButtonTitle: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  mediaGalleryButtonSubtitle: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  mediaGalleryButtonArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
