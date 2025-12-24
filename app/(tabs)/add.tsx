import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Camera, Image as ImageIcon, ArrowLeft, ArrowRight, Circle, Minus, Square, Maximize2, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { PetService, FirebaseStorage } from '../../services/firebase';
import { PetSpecies, PetSize, PetSex, Pet } from '../../types';

export default function AddScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ petId?: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [loadingPet, setLoadingPet] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [petId, setPetId] = useState<string | null>(params.petId || null);
  const isEditMode = !!petId;

  // Form state
  const [step, setStep] = useState(1);
  const [species, setSpecies] = useState<PetSpecies | ''>('');
  const [name, setName] = useState('');
  const [sex, setSex] = useState<PetSex | ''>('');
  const [ageMonths, setAgeMonths] = useState('');
  const [size, setSize] = useState<PetSize | ''>('');
  const [breed, setBreed] = useState('');
  const [city, setCity] = useState('');
  const [vaccinated, setVaccinated] = useState(false);
  const [neutered, setNeutered] = useState(false);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Load pet data if in edit mode
  useEffect(() => {
    if (isEditMode && petId && user?.id) {
      loadPetData();
    }
  }, [isEditMode, petId, user?.id]);

  const loadPetData = async () => {
    if (!petId) return;

    setLoadingPet(true);
    try {
      const pet = await PetService.getPet(petId) as Pet;

      // Check if user owns this pet
      if (pet.ownerId !== user?.id) {
        Alert.alert(t('common.error'), t('addPet.noPermission'));
        router.back();
        return;
      }

      // Populate form with pet data
      setSpecies(pet.species);
      setName(pet.name);
      setSex(pet.sex);
      setAgeMonths(pet.ageMonths.toString());
      setSize(pet.size);
      setBreed(pet.breed || '');
      setCity(pet.city);
      setVaccinated(pet.vaccinated);
      setNeutered(pet.neutered);
      setDescription(pet.description);
      setPhotos(pet.photos || []);
    } catch (error) {
      console.error('Error loading pet:', error);
      Alert.alert(t('common.error'), t('addPet.loadError'));
      router.back();
    } finally {
      setLoadingPet(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
        <View style={styles.content}>
          <Text style={styles.title}>{t('addPet.loginRequired')}</Text>
          <Text style={styles.subtitle}>
            {isEditMode ? t('addPet.loginRequiredEditDesc') : t('addPet.loginRequiredDesc')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadingPet) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.subtitle}>{t('addPet.loadingPet')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleImagePicker = async () => {
    try {
      console.log('Photo upload started');

      // İzin iste
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission result:', permissionResult);

      if (permissionResult.granted === false) {
        Alert.alert(t('common.error'), t('addPet.galleryPermission'));
        return;
      }

      // Fotoğraf seç
      console.log('Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.6,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets) {
        console.log(`Selected ${result.assets.length} images`);
        setIsUploadingPhoto(true);

        // Her fotoğrafı işle (profil kısmındaki gibi - Firebase Storage'a yükle, başarısız olursa local URI kullan)
        const newPhotoURLs: string[] = [];

        for (let i = 0; i < result.assets.length; i++) {
          const asset = result.assets[i];
          console.log(`Processing image ${i + 1}:`, asset.uri);

          try {
            // Firebase Storage'a yükle
            const imagePath = `pets/${user!.id}/photo_${Date.now()}_${i}.jpg`;
            const downloadURL = await FirebaseStorage.uploadImage(imagePath, asset.uri);

            if (!downloadURL || downloadURL.trim().length === 0) {
              throw new Error('Invalid download URL received');
            }

            newPhotoURLs.push(downloadURL);
            console.log(`Image ${i + 1} uploaded successfully, URL: ${downloadURL}`);
          } catch (storageError) {
            console.error('Storage upload failed, using local URI:', storageError);
            // Geçici çözüm: Local URI kullan (profil kısmındaki gibi)
            newPhotoURLs.push(asset.uri);
            console.log(`Image ${i + 1} using local URI: ${asset.uri}`);
          }
        }

        // Tüm URL'leri state'e ekle
        if (newPhotoURLs.length > 0) {
          setPhotos([...photos, ...newPhotoURLs]);
          console.log(`Successfully added ${newPhotoURLs.length} photos`);
        }
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert(t('common.error'), t('addPet.photoError'));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!species) {
        Alert.alert(t('common.error'), t('addPet.selectSpecies'));
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!name || !sex || !ageMonths || !size) {
        Alert.alert(t('common.error'), t('addPet.fillRequired'));
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!city || !description) {
        Alert.alert(t('common.error'), t('addPet.fillCityDesc'));
        return;
      }
      if (photos.length === 0) {
        Alert.alert(t('common.error'), t('addPet.addPhotoRequired'));
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Photos are already converted to base64 in handleImagePicker (profil kısmındaki gibi)
      // Just validate and use them directly
      if (photos.length === 0) {
        Alert.alert(t('common.error'), t('addPet.addPhotoRequired'));
        setLoading(false);
        return;
      }

      // Validate all photos are valid base64 strings
      const validPhotos = photos.filter(photo =>
        photo && typeof photo === 'string' && photo.trim().length > 0
      );

      if (validPhotos.length === 0) {
        Alert.alert(t('common.error'), t('addPet.invalidPhotos'));
        setLoading(false);
        return;
      }

      console.log('Using photos (already base64), count:', validPhotos.length);
      console.log('First photo base64 length:', validPhotos[0]?.length || 0);

      // Create pet data
      const petData: any = {
        ownerId: user.id,
        species: species as PetSpecies,
        name,
        sex: sex as PetSex,
        ageMonths: parseInt(ageMonths),
        size: size as PetSize,
        city,
        vaccinated,
        neutered,
        description,
        photos: validPhotos, // Already base64 strings from handleImagePicker
        videos: [],
        tags: [],
        status: 'available' as const,
      };

      // Only add breed if it's not empty (Firestore doesn't accept undefined)
      if (breed && breed.trim()) {
        petData.breed = breed.trim();
      }

      if (isEditMode && petId) {
        // Update existing pet
        await PetService.updatePet(petId, petData);
        Alert.alert(t('addPet.success'), t('addPet.updateSuccess'), [
          {
            text: t('common.save'),
            onPress: () => {
              router.back();
            },
          },
        ]);
      } else {
        // Create new pet
        await PetService.addPet(petData);
        Alert.alert(t('addPet.success'), t('addPet.addSuccess'), [
          {
            text: t('common.save'),
            onPress: () => {
              // Reset form
              setStep(1);
              setSpecies('');
              setName('');
              setSex('');
              setAgeMonths('');
              setSize('');
              setBreed('');
              setCity('');
              setVaccinated(false);
              setNeutered(false);
              setDescription('');
              setPhotos([]);
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error saving pet:', error);
      Alert.alert(t('common.error'), isEditMode ? t('addPet.updateError') : t('addPet.addError'));
    } finally {
      setLoading(false);
    }
  };

  const getSpeciesImage = (species: PetSpecies) => {
    // Her hayvan türü için sabit fotoğraf URL'leri
    switch (species) {
      case 'cat':
        return 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=300&h=300';
      case 'dog':
        return 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300';
      case 'bird':
        return 'https://images.pexels.com/photos/1661179/pexels-photo-1661179.jpeg?auto=compress&cs=tinysrgb&w=300&h=300';
      case 'rabbit':
        return 'https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=300&h=300';
      default:
        return 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300';
    }
  };

  const getSpeciesLabel = (species: PetSpecies) => {
    return t(`addPet.species.${species}`);
  };

  const getSpeciesEmoji = (species: PetSpecies) => {
    switch (species) {
      case 'cat':
        return '🐱';
      case 'dog':
        return '🐶';
      case 'bird':
        return '🐦';
      case 'rabbit':
        return '🐰';
      default:
        return '🐾';
    }
  };

  const handleImageError = (species: string) => {
    setImageErrors(prev => ({ ...prev, [species]: true }));
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('addPet.speciesTitle')}</Text>
      <Text style={styles.stepDescription}>{t('addPet.speciesDesc')}</Text>

      <View style={styles.optionsGrid}>
        {(['cat', 'dog', 'bird', 'rabbit', 'other'] as PetSpecies[]).map((s) => {
          const hasError = imageErrors[s];
          return (
            <TouchableOpacity
              key={s}
              style={[styles.optionButton, species === s && styles.optionButtonActive]}
              onPress={() => setSpecies(s)}
            >
              {hasError ? (
                <View style={styles.emojiContainer}>
                  <Text style={styles.emojiText}>{getSpeciesEmoji(s)}</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: getSpeciesImage(s) }}
                  style={styles.optionImage}
                  contentFit="cover"
                  onError={() => handleImageError(s)}
                />
              )}
              {species === s && (
                <View style={styles.optionOverlay}>
                  <View style={styles.checkmarkContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                </View>
              )}
              <View style={styles.labelOverlay}>
                <Text style={[styles.optionText, species === s && styles.optionTextActive]}>
                  {getSpeciesLabel(s)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('addPet.basicInfoTitle')}</Text>
      <Text style={styles.stepDescription}>{t('addPet.basicInfoDesc')}</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('addPet.name')} *</Text>
        <TextInput
          style={styles.input}
          placeholder={t('addPet.namePlaceholder')}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('addPet.gender')} *</Text>
        <View style={styles.compactOptionsRow}>
          <TouchableOpacity
            style={[styles.compactOptionButton, sex === 'male' && styles.compactOptionButtonActive]}
            onPress={() => setSex('male')}
            activeOpacity={0.7}
          >
            <Circle size={16} color={sex === 'male' ? theme.colors.primary[500] : theme.colors.text.secondary} fill={sex === 'male' ? theme.colors.primary[500] : 'transparent'} />
            <Text style={[styles.compactOptionText, sex === 'male' && styles.compactOptionTextActive]}>
              {t('addPet.male')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.compactOptionButton, sex === 'female' && styles.compactOptionButtonActive]}
            onPress={() => setSex('female')}
            activeOpacity={0.7}
          >
            <Circle size={16} color={sex === 'female' ? theme.colors.primary[500] : theme.colors.text.secondary} fill={sex === 'female' ? theme.colors.primary[500] : 'transparent'} />
            <Text style={[styles.compactOptionText, sex === 'female' && styles.compactOptionTextActive]}>
              {t('addPet.female')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('addPet.age')} *</Text>
        <TextInput
          style={styles.input}
          placeholder={t('addPet.agePlaceholder')}
          value={ageMonths}
          onChangeText={setAgeMonths}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('addPet.size')} *</Text>
        <View style={styles.compactOptionsRow}>
          {(['small', 'medium', 'large'] as PetSize[]).map((s) => {
            const IconComponent = s === 'small' ? Minus : s === 'medium' ? Square : Maximize2;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.compactOptionButton, size === s && styles.compactOptionButtonActive]}
                onPress={() => setSize(s)}
                activeOpacity={0.7}
              >
                <IconComponent size={18} color={size === s ? theme.colors.primary[500] : theme.colors.text.secondary} />
                <Text style={[styles.compactOptionText, size === s && styles.compactOptionTextActive]}>
                  {t(`addPet.${s}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('addPet.breed')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('addPet.breedPlaceholder')}
          value={breed}
          onChangeText={setBreed}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('addPet.detailsTitle')}</Text>
      <Text style={styles.stepDescription}>{t('addPet.detailsDesc')}</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('addPet.city')} *</Text>
        <TextInput
          style={styles.input}
          placeholder={t('addPet.cityPlaceholder')}
          value={city}
          onChangeText={setCity}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('addPet.description')} *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('addPet.descriptionPlaceholder')}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('addPet.healthInfo')}</Text>
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setVaccinated(!vaccinated)}
          >
            <View style={[styles.checkboxBox, vaccinated && styles.checkboxBoxChecked]}>
              {vaccinated && <Text style={styles.checkboxCheckmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>{t('addPet.vaccinated')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setNeutered(!neutered)}
          >
            <View style={[styles.checkboxBox, neutered && styles.checkboxBoxChecked]}>
              {neutered && <Text style={styles.checkboxCheckmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>{t('addPet.neutered')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('addPet.photos')} * ({t('addPet.photosMin')})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoItem}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => removePhoto(index)}
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.addPhotoButton, isUploadingPhoto && styles.addPhotoButtonDisabled]}
            onPress={handleImagePicker}
            disabled={isUploadingPhoto}
          >
            {isUploadingPhoto ? (
              <ActivityIndicator size="small" color={theme.colors.primary[500]} />
            ) : (
              <>
                <ImageIcon size={24} color={theme.colors.primary[500]} />
                <Text style={styles.addPhotoText}>{t('addPet.addPhoto')}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (step > 1) {
                  setStep(step - 1);
                } else {
                  router.back();
                }
              }}
            >
              <ArrowLeft size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditMode ? t('addPet.editTitle') : t('addPet.title')}</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
          <Text style={styles.stepIndicator}>{t('addPet.step')} {step}/3</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>

        <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
          <View style={styles.footer}>
            {step > 1 && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  if (step > 1) {
                    setStep(step - 1);
                  } else {
                    router.back();
                  }
                }}
                disabled={loading}
                activeOpacity={0.7}
              >
                <ArrowLeft size={20} color={theme.colors.text.primary} />
                <Text style={styles.buttonSecondaryText}>{t('addPet.back')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                step === 1 && styles.buttonFull,
                loading && styles.buttonDisabled
              ]}
              onPress={handleNext}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonPrimaryText}>
                    {step === 3 ? (isEditMode ? t('addPet.update') : t('addPet.publish')) : t('addPet.next')}
                  </Text>
                  {step === 3 ? (
                    <Check size={20} color="white" style={styles.buttonIcon} />
                  ) : (
                    <ArrowRight size={20} color="white" style={styles.buttonIcon} />
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border.light,
    borderRadius: 2,
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary[500],
    borderRadius: 2,
  },
  stepIndicator: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  stepContainer: {
    width: '100%',
  },
  stepTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  stepDescription: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  compactOptionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  optionButton: {
    width: '48%',
    height: 180,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: theme.spacing.md,
  },
  optionButtonActive: {
    borderColor: theme.colors.primary[500],
    borderWidth: 3,
  },
  compactOptionButton: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1.5,
    borderColor: theme.colors.border.light,
  },
  compactOptionButtonActive: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
    borderWidth: 2,
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  optionImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  emojiContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.tertiary,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  emojiText: {
    fontSize: 64,
  },
  optionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(168, 85, 247, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  checkmark: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  labelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    alignItems: 'center',
  },
  optionText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  optionTextActive: {
    color: 'white',
  },
  compactOptionText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
  },
  compactOptionTextActive: {
    color: theme.colors.primary[700],
    fontFamily: theme.typography.fontFamily.bodyBold,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  checkboxCheckmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
  },
  photosContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
  },
  photoItem: {
    position: 'relative',
    marginRight: theme.spacing.sm,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.lg,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.error[500],
    borderRadius: theme.borderRadius.full,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.secondary,
  },
  addPhotoButtonDisabled: {
    opacity: 0.6,
  },
  addPhotoText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.primary[500],
    marginTop: theme.spacing.xs,
  },
  footerContainer: {
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md + 2,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    minHeight: 52,
  },
  buttonFull: {
    flex: 1,
  },
  buttonHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary[500],
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1.5,
    borderColor: theme.colors.border.medium,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPrimaryText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.inverse,
    letterSpacing: 0.3,
  },
  buttonSecondaryText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
  },
  buttonIcon: {
    marginLeft: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

