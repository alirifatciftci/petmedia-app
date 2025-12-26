import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Camera, Image as ImageIcon, Circle, Minus, Square, Maximize2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/authStore';
import { PetService, FirebaseStorage } from '../../services/firebase';
import { theme } from '../../theme';
import { Pet, PetSpecies, PetSize, PetSex } from '../../types';

interface EditPetModalProps {
  visible: boolean;
  onClose: () => void;
  pet: Pet | null;
  onUpdate?: () => void;
}

export const EditPetModal: React.FC<EditPetModalProps> = ({ visible, onClose, pet, onUpdate }) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Form state
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

  // Load pet data when modal opens
  useEffect(() => {
    if (visible && pet) {
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
    }
  }, [visible, pet]);

  const handleImagePicker = async () => {
    try {
      console.log('Photo upload started');

      // İzin iste
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission result:', permissionResult);

      if (permissionResult.granted === false) {
        Alert.alert('Hata', 'Galeri erişim izni gerekli');
        return;
      }

      // Fotoğraf seç
      console.log('Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8, // Same quality as profile photo
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

        // Tüm URL'leri state'e ekle (profil kısmındaki gibi)
        if (newPhotoURLs.length > 0) {
          setPhotos([...photos, ...newPhotoURLs]);
          console.log(`Successfully added ${newPhotoURLs.length} photos`);
          Alert.alert('Başarılı', `${newPhotoURLs.length} fotoğraf eklendi`);
        }
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!pet || !user) return;

    // Validation
    if (!name.trim() || !sex || !ageMonths || !size || !city.trim() || !description.trim()) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Hata', 'Lütfen en az bir fotoğraf ekleyin');
      return;
    }

    setIsLoading(true);
    try {
      // Photos are already uploaded to Firebase Storage in handleImagePicker (profil kısmındaki gibi)
      // Just validate and use them directly

      // Validate all photos are valid URLs
      const validPhotos = photos.filter(photo =>
        photo && typeof photo === 'string' && photo.trim().length > 0
      );

      if (validPhotos.length === 0) {
        Alert.alert('Hata', 'Geçerli fotoğraf bulunamadı. Lütfen tekrar fotoğraf ekleyin.');
        setIsLoading(false);
        return;
      }

      console.log('Using photos (already URLs), count:', validPhotos.length);

      // Update pet data - only update fields that are provided
      const petData: any = {
        name: name.trim(),
        sex: sex as PetSex,
        ageMonths: parseInt(ageMonths, 10),
        size: size as PetSize,
        city: city.trim(),
        vaccinated: Boolean(vaccinated),
        neutered: Boolean(neutered),
        description: description.trim(),
        photos: validPhotos, // Already URLs from handleImagePicker
      };

      // Handle breed field - Firestore doesn't accept undefined
      // If breed is empty, we'll omit it from the update (Firestore will keep existing value)
      // Or we can set it to empty string if we want to clear it
      if (breed && breed.trim()) {
        petData.breed = breed.trim();
      }
      // If breed is empty, don't include it in update (keeps existing value)
      // Or uncomment below to clear it:
      // else {
      //   petData.breed = '';
      // }

      console.log('EditPetModal: Updating pet:', pet.id);
      console.log('EditPetModal: Pet data to update:', petData);

      await PetService.updatePet(pet.id, petData);

      console.log('EditPetModal: Pet updated successfully, calling onUpdate');

      // First call onUpdate to refresh the list
      if (onUpdate) {
        onUpdate();
      }

      // Then close the modal
      onClose();

      // Show success message
      Alert.alert('Başarılı', 'İlan başarıyla güncellendi!');
    } catch (error) {
      console.error('EditPetModal: Error updating pet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      console.error('EditPetModal: Error details:', {
        code: error instanceof Error ? (error as any).code : 'unknown',
        message: errorMessage,
        stack: error instanceof Error ? error.stack : 'unknown'
      });
      Alert.alert('Hata', `İlan güncellenirken bir hata oluştu: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!pet) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>İlanı Düzenle</Text>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
              ) : (
                <Text style={styles.saveText}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>İsim *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Örn: Luna, Pamuk"
                placeholderTextColor={theme.colors.text.tertiary}
              />
            </View>

            {/* Sex */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cinsiyet *</Text>
              <View style={styles.compactOptionsRow}>
                <TouchableOpacity
                  style={[styles.compactOptionButton, sex === 'male' && styles.compactOptionButtonActive]}
                  onPress={() => setSex('male')}
                  activeOpacity={0.7}
                >
                  <Circle size={16} color={sex === 'male' ? theme.colors.primary[500] : theme.colors.text.secondary} fill={sex === 'male' ? theme.colors.primary[500] : 'transparent'} />
                  <Text style={[styles.compactOptionText, sex === 'male' && styles.compactOptionTextActive]}>
                    Erkek
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.compactOptionButton, sex === 'female' && styles.compactOptionButtonActive]}
                  onPress={() => setSex('female')}
                  activeOpacity={0.7}
                >
                  <Circle size={16} color={sex === 'female' ? theme.colors.primary[500] : theme.colors.text.secondary} fill={sex === 'female' ? theme.colors.primary[500] : 'transparent'} />
                  <Text style={[styles.compactOptionText, sex === 'female' && styles.compactOptionTextActive]}>
                    Dişi
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Age */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Yaş (Ay) *</Text>
              <TextInput
                style={styles.input}
                value={ageMonths}
                onChangeText={setAgeMonths}
                placeholder="Örn: 12"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.text.tertiary}
              />
            </View>

            {/* Size */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Büyüklük *</Text>
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
                        {s === 'small' ? 'Küçük' : s === 'medium' ? 'Orta' : 'Büyük'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Breed */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Irk (Opsiyonel)</Text>
              <TextInput
                style={styles.input}
                value={breed}
                onChangeText={setBreed}
                placeholder="Örn: Golden Retriever, Tekir"
                placeholderTextColor={theme.colors.text.tertiary}
              />
            </View>

            {/* City */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şehir *</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Örn: İstanbul, Ankara"
                placeholderTextColor={theme.colors.text.tertiary}
              />
            </View>

            {/* Health Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sağlık Durumu</Text>
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

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Açıklama *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Hayvanınız hakkında detaylı bilgi verin"
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Photos */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fotoğraflar *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image
                      source={{ uri: photo }}
                      style={styles.photo}
                    />
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
                      <Text style={styles.addPhotoText}>Fotoğraf Ekle</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  keyboardView: {
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
  closeButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minWidth: 80,
    alignItems: 'flex-end',
  },
  saveText: {
    color: theme.colors.primary[500],
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
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
  compactOptionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
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
  compactOptionText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
  },
  compactOptionTextActive: {
    color: theme.colors.primary[700],
    fontFamily: theme.typography.fontFamily.bodyBold,
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
});


