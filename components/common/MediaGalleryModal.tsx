import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Play, Camera, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { theme } from '../../theme';
import { Pet } from '../../types';
import { FirebaseStorage } from '../../services/firebase';

interface MediaGalleryModalProps {
  visible: boolean;
  onClose: () => void;
  pet: Pet | null;
}

const { width, height } = Dimensions.get('window');

export const MediaGalleryModal: React.FC<MediaGalleryModalProps> = ({
  visible,
  onClose,
  pet,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaURLs, setMediaURLs] = useState<{ [key: number]: string }>({});
  const flatListRef = useRef<FlatList>(null);

  if (!pet) return null;

  // Ensure photos and videos are arrays
  const photos = Array.isArray(pet.photos) ? pet.photos : [];
  const videos = Array.isArray(pet.videos) ? pet.videos : [];

  const allMedia = [
    ...photos.map((photo, index) => ({ type: 'photo' as const, path: photo, index })),
    ...videos.map((video, index) => ({ type: 'video' as const, path: video, index: photos.length + index }))
  ];

  // Convert base64 strings to data URLs
  useEffect(() => {
    const convertBase64ToURLs = () => {
      const urlMap: { [key: number]: string } = {};
      
      for (const media of allMedia) {
        if (media.path) {
          try {
            // If it's already a URL, use it directly
            if (media.path.startsWith('http://') || media.path.startsWith('https://')) {
              urlMap[media.index] = media.path;
            } else if (media.path.startsWith('data:')) {
              // It's already a data URL
              urlMap[media.index] = media.path;
            } else {
              // Already a URL, use it directly
              urlMap[media.index] = media.path;
            }
          } catch (error) {
            console.error('Error converting base64 to URL:', error);
            // Use placeholder if conversion fails
            urlMap[media.index] = 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg';
          }
        }
      }
      
      setMediaURLs(urlMap);
    };

    if (allMedia.length > 0) {
      convertBase64ToURLs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet?.photos?.length, pet?.videos?.length]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const goToPrevious = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };

  const goToNext = () => {
    if (currentIndex < allMedia.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const renderMediaItem = ({ item, index }: { item: any; index: number }) => {
    const mediaURL = mediaURLs[item.index] || 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg';
    
    return (
      <View style={styles.mediaItem}>
        {item.type === 'photo' ? (
          <Image source={{ uri: mediaURL }} style={styles.mediaImage} resizeMode="cover" />
        ) : (
          <View style={styles.videoContainer}>
            <Image 
              source={{ uri: mediaURL }} 
              style={styles.mediaImage} 
              resizeMode="cover"
            />
            <View style={styles.videoOverlay}>
              <TouchableOpacity style={styles.playButton}>
                <Play size={40} color="white" fill="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <BlurView intensity={20} style={styles.overlay}>
        <StatusBar hidden />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {pet.name} - Medya Galerisi
          </Text>
          <View style={styles.mediaCounter}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {allMedia.length}
            </Text>
          </View>
        </View>

        {/* Media Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={allMedia}
            renderItem={renderMediaItem}
            keyExtractor={(item, index) => `${item.type}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
          />

          {/* Navigation Buttons */}
          {currentIndex > 0 && (
            <TouchableOpacity style={[styles.navButton, styles.prevButton]} onPress={goToPrevious}>
              <ChevronLeft size={24} color="white" />
            </TouchableOpacity>
          )}
          
          {currentIndex < allMedia.length - 1 && (
            <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={goToNext}>
              <ChevronRight size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Media Type Indicator */}
        <View style={styles.mediaTypeIndicator}>
          <View style={styles.typeContainer}>
            <Camera size={16} color="white" />
            <Text style={styles.typeText}>{photos.length} Fotoğraf</Text>
          </View>
          <View style={styles.typeContainer}>
            <Play size={16} color="white" />
            <Text style={styles.typeText}>{videos.length} Video</Text>
          </View>
        </View>

        {/* Thumbnail Strip */}
        <View style={styles.thumbnailStrip}>
          <FlatList
            data={allMedia}
            renderItem={({ item, index }) => {
              const mediaURL = mediaURLs[item.index] || 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg';
              
              return (
                <TouchableOpacity
                  style={[
                    styles.thumbnail,
                    currentIndex === index && styles.thumbnailActive
                  ]}
                  onPress={() => {
                    flatListRef.current?.scrollToIndex({ index, animated: true });
                  }}
                >
                  {item.type === 'photo' ? (
                    <Image source={{ uri: mediaURL }} style={styles.thumbnailImage} />
                  ) : (
                    <View style={styles.thumbnailVideo}>
                      <Image 
                        source={{ uri: mediaURL }} 
                        style={styles.thumbnailImage} 
                      />
                      <View style={styles.thumbnailPlayIcon}>
                        <Play size={12} color="white" />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item, index) => `thumb-${item.type}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailContainer}
          />
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: 'white',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  mediaCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  counterText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    color: 'white',
  },
  carouselContainer: {
    flex: 1,
    position: 'relative',
  },
  mediaItem: {
    width: width,
    height: '100%',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -25 }],
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  mediaTypeIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 30,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    color: 'white',
    marginLeft: 6,
  },
  thumbnailStrip: {
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  thumbnailContainer: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginHorizontal: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: theme.colors.primary[500],
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailVideo: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  thumbnailPlayIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
