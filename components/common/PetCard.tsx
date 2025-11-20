import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { Heart, MapPin } from 'lucide-react-native';
import { theme } from '../../theme';
import { Pet } from '../../types';
import { TagPill } from './TagPill';

interface PetCardProps {
  pet: Pet;
  isFavorite?: boolean;
  onPress?: () => void;
  onFavoritePress?: () => void;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const PetCard: React.FC<PetCardProps> = ({
  pet,
  isFavorite = false,
  onPress,
  onFavoritePress,
}) => {
  const scale = useSharedValue(1);
  
  // Get first photo URL
  const imageURL = pet.photos && Array.isArray(pet.photos) && pet.photos.length > 0 
    ? pet.photos[0] 
    : null;
  
  // Debug logging
  useEffect(() => {
    console.log('PetCard: Pet ID:', pet.id);
    console.log('PetCard: Photos array:', pet.photos);
    console.log('PetCard: Image URL:', imageURL ? `${imageURL.substring(0, 50)}...` : 'null');
  }, [pet.id, pet.photos, imageURL]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getAgeText = (ageMonths: number) => {
    if (ageMonths < 12) {
      return `${ageMonths} ay`;
    }
    const years = Math.floor(ageMonths / 12);
    const remainingMonths = ageMonths % 12;
    if (remainingMonths === 0) {
      return `${years} yaş`;
    }
    return `${years}y ${remainingMonths}ay`;
  };

  return (
    <AnimatedTouchable
      style={[styles.container, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      activeOpacity={1}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ 
            uri: imageURL || 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'
          }}
          style={styles.image}
          contentFit="cover"
        />
        
        {/* Favorite Button */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onFavoritePress}
        >
          <Heart
            size={20}
            color={isFavorite ? theme.colors.error[500] : theme.colors.text.tertiary}
            fill={isFavorite ? theme.colors.error[500] : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {pet.name}
          </Text>
          <Text style={styles.age}>
            {getAgeText(pet.ageMonths)}
          </Text>
        </View>

        <View style={styles.locationContainer}>
          <MapPin size={12} color={theme.colors.text.secondary} />
          <Text style={styles.location} numberOfLines={1}>
            {pet.city}
          </Text>
        </View>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          <TagPill 
            text={pet.sex === 'male' ? 'Erkek' : 'Dişi'} 
            variant="neutral" 
            size="small"
          />
          {pet.vaccinated && (
            <TagPill 
              text="Aşılı" 
              variant="success" 
              size="small"
            />
          )}
        </View>
      </View>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: theme.spacing.md,
  },
  imageContainer: {
    position: 'relative',
    height: cardWidth * 0.7,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  favoriteButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    padding: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  name: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  age: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  location: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
});