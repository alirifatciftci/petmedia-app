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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Camera, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/authStore';
import { UserProfileService, FirebaseStorage } from '../../services/firebase';
import { theme } from '../../theme';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose }) => {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    city: user?.city || '',
    bio: user?.bio || '',
  });
  const [profileImage, setProfileImage] = useState(user?.photoURL || '');
  const [imageError, setImageError] = useState(false);

  // Log profileImage changes
  useEffect(() => {
    console.log('📸 EditProfileModal: profileImage changed:', {
      profileImage: profileImage,
      length: profileImage.length,
      type: typeof profileImage,
      isEmpty: profileImage.trim() === '',
      isFile: profileImage.startsWith('file://'),
      isHttp: profileImage.startsWith('http://') || profileImage.startsWith('https://'),
      userPhotoURL: user?.photoURL,
      imageError: imageError,
    });
  }, [profileImage, user?.photoURL, imageError]);

  const handleSave = async () => {
    if (!formData.displayName.trim()) {
      Alert.alert('Hata', 'İsim alanı boş olamaz');
      return;
    }

    setIsLoading(true);
    try {
      console.log('💾 EditProfileModal: Saving profile for user:', user!.id);
      console.log('💾 EditProfileModal: Profile data to save:', {
        displayName: formData.displayName.trim(),
        city: formData.city.trim(),
        bio: formData.bio.trim(),
        photoURL: profileImage,
        photoURLLength: profileImage.length,
        photoURLType: typeof profileImage,
        photoURLIsFile: profileImage.startsWith('file://'),
        photoURLIsHttp: profileImage.startsWith('http://') || profileImage.startsWith('https://'),
      });

      // Firestore'a kaydet
      await UserProfileService.updateUserProfile(user!.id, {
        displayName: formData.displayName.trim(),
        city: formData.city.trim(),
        bio: formData.bio.trim(),
        photoURL: profileImage,
      });

      console.log('✅ EditProfileModal: Profile saved to Firestore successfully');

      const updatedUser = {
        ...user!,
        displayName: formData.displayName.trim(),
        city: formData.city.trim(),
        bio: formData.bio.trim(),
        photoURL: profileImage,
        updatedAt: new Date().toISOString(),
      };

      setUser(updatedUser);
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi ve Firestore\'a kaydedildi!');
      onClose();
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Hata', `Profil güncellenirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSave = async () => {
    console.log('Test save triggered');
    Alert.alert('Test', 'Firestore bağlantı testi başlatılıyor...');

    try {
      // Önce Firestore bağlantısını test et
      await UserProfileService.testFirestoreConnection();
      Alert.alert('Başarılı', 'Firestore bağlantısı çalışıyor! Şimdi profil kaydediliyor...');

      // Sonra profil kaydet
      await handleSave();
    } catch (error) {
      console.error('Test failed:', error);
      Alert.alert('Hata', `Firestore bağlantı hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  };

  const handleStorageTest = async () => {
    console.log('Storage test triggered');
    Alert.alert('Test', 'Firebase Storage bağlantı testi başlatılıyor...');

    try {
      // Test image upload
      const testImageUri = 'https://via.placeholder.com/150x150.jpg';
      const testPath = `test/connection_${Date.now()}.jpg`;

      const downloadURL = await FirebaseStorage.uploadImage(testPath, testImageUri);
      Alert.alert('Başarılı', `Storage çalışıyor! URL: ${downloadURL.substring(0, 50)}...`);
    } catch (error) {
      console.error('Storage test failed:', error);
      Alert.alert('Hata', `Storage bağlantı hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  };

  const handleCreateCollection = async () => {
    console.log('Create collection triggered');
    Alert.alert('Koleksiyon', 'Profiles koleksiyonu oluşturuluyor...');

    try {
      await UserProfileService.createProfilesCollection();
      Alert.alert('Başarılı', 'Profiles koleksiyonu oluşturuldu! Firebase Console\'da kontrol edin.');
    } catch (error) {
      console.error('Collection creation failed:', error);
      Alert.alert('Hata', `Koleksiyon oluşturma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  };

  const handlePhotoUpload = async () => {
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
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('Image selected:', result.assets[0].uri);
        setIsUploadingPhoto(true);
        setImageError(false);

        try {
          console.log('📤 EditProfileModal: Starting image upload to Firebase Storage...');
          console.log('📤 EditProfileModal: Local image URI:', result.assets[0].uri);

          // Firebase Storage'a yükle
          const imagePath = `profiles/${user!.id}/profile_${Date.now()}.jpg`;
          console.log('📤 EditProfileModal: Storage path:', imagePath);

          const downloadURL = await FirebaseStorage.uploadImage(imagePath, result.assets[0].uri);
          console.log('✅ EditProfileModal: Image uploaded successfully, downloadURL:', downloadURL);
          console.log('✅ EditProfileModal: downloadURL details:', {
            url: downloadURL,
            length: downloadURL.length,
            isHttp: downloadURL.startsWith('http://') || downloadURL.startsWith('https://'),
            isFile: downloadURL.startsWith('file://'),
          });

          setProfileImage(downloadURL);
          setImageError(false);
          Alert.alert('Başarılı', 'Profil fotoğrafı yüklendi');
        } catch (storageError) {
          console.error('❌ EditProfileModal: Image conversion failed:', storageError);
          const errorMessage = storageError instanceof Error ? storageError.message : 'Bilinmeyen hata';
          Alert.alert('Hata', `Fotoğraf işlenemedi: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Profil Düzenle</Text>
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

          {/* Test Buttons */}
          <TouchableOpacity
            onPress={handleTestSave}
            style={styles.testButton}
          >
            <Text style={styles.testText}>TEST: Firestore'a Kaydet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStorageTest}
            style={[styles.testButton, { backgroundColor: 'purple' }]}
          >
            <Text style={styles.testText}>TEST: Storage Bağlantısı</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCreateCollection}
            style={[styles.testButton, { backgroundColor: 'green' }]}
          >
            <Text style={styles.testText}>Koleksiyon Oluştur</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <View style={styles.photoContainer}>
              {profileImage && !imageError ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                  onError={() => {
                    // Silently handle image load errors - show placeholder instead
                    setImageError(true);
                  }}
                  onLoadStart={() => setImageError(false)}
                />
              ) : (
                <User size={60} color={theme.colors.primary[500]} />
              )}
            </View>
            <TouchableOpacity
              style={[styles.photoButton, isUploadingPhoto && styles.photoButtonDisabled]}
              onPress={handlePhotoUpload}
              disabled={isUploadingPhoto}
            >
              {isUploadingPhoto ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Camera size={20} color="white" />
                  <Text style={styles.photoButtonText}>
                    {profileImage ? 'Fotoğraf Değiştir' : 'Fotoğraf Ekle'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>İsim *</Text>
              <TextInput
                style={styles.input}
                value={formData.displayName}
                onChangeText={(text) => setFormData({ ...formData, displayName: text })}
                placeholder="Adınızı girin"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şehir</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="Şehrinizi girin"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hakkımda</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder="Kendiniz hakkında kısa bir açıklama yazın"
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
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
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
  },
  saveButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  saveText: {
    color: theme.colors.primary[500],
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 3,
    borderColor: theme.colors.primary[200],
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 25,
  },
  photoButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    marginLeft: theme.spacing.xs,
  },
  formSection: {
    padding: theme.spacing.lg,
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
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  textArea: {
    height: 100,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoButtonDisabled: {
    opacity: 0.6,
  },
  testButton: {
    backgroundColor: 'orange',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  testText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
