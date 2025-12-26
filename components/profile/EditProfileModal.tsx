import React, { useState, useEffect, useRef } from 'react';
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
import { X, Camera, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { UserProfileService, FirebaseStorage } from '../../services/firebase';
import { theme } from '../../theme';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);
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
      Alert.alert(t('common.error'), t('editProfile.nameRequired'));
      return;
    }

    setIsLoading(true);
    try {
      console.log('💾 EditProfileModal: Saving profile for user:', user!.id);

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
      Alert.alert(t('editProfile.success'), t('editProfile.profileUpdated'));
      onClose();
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert(t('common.error'), `${error instanceof Error ? error.message : t('common.error')}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(t('common.error'), t('editProfile.galleryPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingPhoto(true);
        setImageError(false);

        try {
          const imagePath = `profiles/${user!.id}/profile_${Date.now()}.jpg`;
          const downloadURL = await FirebaseStorage.uploadImage(imagePath, result.assets[0].uri);

          setProfileImage(downloadURL);
          setImageError(false);
          Alert.alert(t('editProfile.success'), t('editProfile.photoUploaded'));
        } catch (storageError) {
          console.error('Image conversion failed:', storageError);
          Alert.alert(t('common.error'), t('editProfile.photoError'));
        }
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert(t('common.error'), t('editProfile.photoError'));
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>{t('editProfile.title')}</Text>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
              ) : (
                <Text style={styles.saveText}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Profile Photo Section */}
            <View style={styles.photoSection}>
              <View style={styles.photoContainer}>
                {profileImage && !imageError ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                    onError={() => {
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
                      {profileImage ? t('editProfile.changePhoto') : t('editProfile.addPhoto')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('editProfile.name')} *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.displayName}
                  onChangeText={(text) => setFormData({ ...formData, displayName: text })}
                  placeholder={t('editProfile.namePlaceholder')}
                  placeholderTextColor={theme.colors.text.secondary}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 200, animated: true });
                    }, 300);
                  }}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('editProfile.city')}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  placeholder={t('editProfile.cityPlaceholder')}
                  placeholderTextColor={theme.colors.text.secondary}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 280, animated: true });
                    }, 300);
                  }}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('editProfile.aboutMe')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.bio}
                  onChangeText={(text) => setFormData({ ...formData, bio: text })}
                  placeholder={t('editProfile.aboutMePlaceholder')}
                  placeholderTextColor={theme.colors.text.secondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                />
              </View>
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
  scrollContent: {
    paddingBottom: 150,
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
});
