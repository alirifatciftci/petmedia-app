import React, { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { X, Camera, Image as ImageIcon, ArrowLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { PetService, FirebaseStorage } from '../../services/firebase';
import { PetSpecies, PetSize, PetSex } from '../../types';

export default function AddScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
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

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
        <View style={styles.content}>
          <Text style={styles.title}>Giriş Yapın</Text>
          <Text style={styles.subtitle}>
            Yeni ilan eklemek için giriş yapmanız gerekiyor
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Hata', 'Galeri erişim izni gerekli');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => asset.uri);
        setPhotos([...photos, ...newPhotos]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!species) {
        Alert.alert('Hata', 'Lütfen hayvan türünü seçin');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!name || !sex || !ageMonths || !size) {
        Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!city || !description) {
        Alert.alert('Hata', 'Lütfen şehir ve açıklama bilgilerini girin');
        return;
      }
      if (photos.length === 0) {
        Alert.alert('Hata', 'Lütfen en az bir fotoğraf ekleyin');
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Upload photos to Firebase Storage
      const uploadedPhotos: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        try {
          const imagePath = `pets/${user.id}/${Date.now()}_${i}.jpg`;
          const downloadURL = await FirebaseStorage.uploadImage(imagePath, photos[i]);
          uploadedPhotos.push(downloadURL);
        } catch (error) {
          console.error('Photo upload error:', error);
          // Continue with local URI if upload fails
          uploadedPhotos.push(photos[i]);
        }
      }

      // Create pet data
      const petData = {
        ownerId: user.id,
        species: species as PetSpecies,
        name,
        sex: sex as PetSex,
        ageMonths: parseInt(ageMonths),
        size: size as PetSize,
        breed: breed || undefined,
        city,
        vaccinated,
        neutered,
        description,
        photos: uploadedPhotos,
        videos: [],
        tags: [],
        status: 'available' as const,
      };

      await PetService.addPet(petData);

      Alert.alert('Başarılı', 'Hayvan ilanı başarıyla eklendi!', [
        {
          text: 'Tamam',
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
    } catch (error) {
      console.error('Error adding pet:', error);
      Alert.alert('Hata', 'İlan eklenirken bir hata oluştu');
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
    switch (species) {
      case 'cat':
        return 'Kedi';
      case 'dog':
        return 'Köpek';
      case 'bird':
        return 'Kuş';
      case 'rabbit':
        return 'Tavşan';
      default:
        return 'Diğer';
    }
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
      <Text style={styles.stepTitle}>Hayvan Türü</Text>
      <Text style={styles.stepDescription}>Sahiplendirmek istediğiniz hayvanın türünü seçin</Text>
      
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
      <Text style={styles.stepTitle}>Temel Bilgiler</Text>
      <Text style={styles.stepDescription}>Hayvanınız hakkında temel bilgileri girin</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>İsim *</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn: Luna, Pamuk"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Cinsiyet *</Text>
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[styles.optionButton, sex === 'male' && styles.optionButtonActive]}
            onPress={() => setSex('male')}
          >
            <Text style={[styles.optionText, sex === 'male' && styles.optionTextActive]}>Erkek</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, sex === 'female' && styles.optionButtonActive]}
            onPress={() => setSex('female')}
          >
            <Text style={[styles.optionText, sex === 'female' && styles.optionTextActive]}>Dişi</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Yaş (Ay) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn: 12"
          value={ageMonths}
          onChangeText={setAgeMonths}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Büyüklük *</Text>
        <View style={styles.optionsRow}>
          {(['small', 'medium', 'large'] as PetSize[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.optionButton, size === s && styles.optionButtonActive]}
              onPress={() => setSize(s)}
            >
              <Text style={[styles.optionText, size === s && styles.optionTextActive]}>
                {s === 'small' ? 'Küçük' : s === 'medium' ? 'Orta' : 'Büyük'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Irk (Opsiyonel)</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn: Golden Retriever, Tekir"
          value={breed}
          onChangeText={setBreed}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Detaylar ve Fotoğraflar</Text>
      <Text style={styles.stepDescription}>Şehir, açıklama ve fotoğrafları ekleyin</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Şehir *</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn: İstanbul, Ankara"
          value={city}
          onChangeText={setCity}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Açıklama *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Hayvanınız hakkında detaylı bilgi verin..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sağlık Bilgileri</Text>
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setVaccinated(!vaccinated)}
          >
            <View style={[styles.checkboxBox, vaccinated && styles.checkboxBoxChecked]}>
              {vaccinated && <Text style={styles.checkboxCheckmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Aşılı</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setNeutered(!neutered)}
          >
            <View style={[styles.checkboxBox, neutered && styles.checkboxBoxChecked]}>
              {neutered && <Text style={styles.checkboxCheckmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Kısırlaştırılmış</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Fotoğraflar * (En az 1)</Text>
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
          <TouchableOpacity style={styles.addPhotoButton} onPress={handleImagePicker}>
            <ImageIcon size={24} color={theme.colors.primary[500]} />
            <Text style={styles.addPhotoText}>Fotoğraf Ekle</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
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
            <Text style={styles.headerTitle}>Yeni İlan Ekle</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
          <Text style={styles.stepIndicator}>Adım {step}/3</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, step === 1 && styles.buttonHidden]}
            onPress={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                router.back();
              }
            }}
            disabled={loading}
          >
            <Text style={styles.buttonSecondaryText}>Geri</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, step === 1 && styles.buttonFull]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonPrimaryText}>
                {step === 3 ? 'İlanı Yayınla' : 'İleri'}
              </Text>
            )}
          </TouchableOpacity>
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
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
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
  addPhotoText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.primary[500],
    marginTop: theme.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  buttonSecondary: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  buttonPrimaryText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.inverse,
  },
  buttonSecondaryText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
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
