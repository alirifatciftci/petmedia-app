import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Droplets, 
  Heart, 
  Home, 
  Stethoscope, 
  Shield,
  MapPin
} from 'lucide-react-native';
import { theme } from '../../theme';
import { MapSpotType } from '../../types';

interface AddMapSpotModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (type: MapSpotType, title: string, note?: string) => void;
  coordinates: { latitude: number; longitude: number } | null;
}

export const AddMapSpotModal: React.FC<AddMapSpotModalProps> = ({
  visible,
  onClose,
  onConfirm,
  coordinates,
}) => {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<MapSpotType | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  const spotTypes = useMemo<Array<{
    type: MapSpotType;
    label: string;
    icon: React.ReactNode;
    colors: [string, string];
    description: string;
  }>>(() => [
    {
      type: 'water',
      label: t('map.water'),
      icon: <Droplets size={24} color="white" fill="white" />,
      colors: ['#3b82f6', '#1d4ed8'] as [string, string],
      description: t('map.waterDescription'),
    },
    {
      type: 'food',
      label: t('map.food'),
      icon: <Heart size={24} color="white" fill="white" />,
      colors: [theme.colors.cards.orange, '#ea580c'] as [string, string],
      description: t('map.foodDescription'),
    },
    {
      type: 'both',
      label: t('map.both'),
      icon: <Home size={24} color="white" fill="white" />,
      colors: ['#8b5cf6', '#7c3aed'] as [string, string],
      description: t('map.bothDescription'),
    },
    {
      type: 'shelter',
      label: t('map.shelter'),
      icon: <Shield size={24} color="white" fill="white" />,
      colors: ['#f59e0b', '#d97706'] as [string, string],
      description: t('map.shelterDescription'),
    },
    {
      type: 'veterinary',
      label: t('map.veterinary'),
      icon: <Stethoscope size={24} color="white" fill="white" />,
      colors: ['#10b981', '#059669'] as [string, string],
      description: t('map.veterinaryDescription'),
    },
  ], [t]);

  const handleTypeSelect = (type: MapSpotType) => {
    setSelectedType(type);
    // Eğer başlık boşsa, seçilen tipe göre otomatik başlık oluştur
    if (!title.trim()) {
      const selectedSpotType = spotTypes.find(st => st.type === type);
      if (selectedSpotType) {
        setTitle(`${selectedSpotType.label} Noktası`);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedType && title.trim()) {
      onConfirm(selectedType, title.trim(), note.trim() || undefined);
      // Reset form
      setSelectedType(null);
      setTitle('');
      setNote('');
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setTitle('');
    setNote('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <BlurView intensity={20} style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.modalContent}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <MapPin size={24} color={theme.colors.primary[500]} fill={theme.colors.primary[500]} />
                  <Text style={styles.headerTitle}>{t('map.addSpot')}</Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <X size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Type Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('map.selectType')}</Text>
                  <View style={styles.typeGrid}>
                    {spotTypes.map((spotType) => (
                      <TouchableOpacity
                        key={spotType.type}
                        style={[
                          styles.typeCard,
                          selectedType === spotType.type && styles.typeCardSelected,
                        ]}
                        onPress={() => handleTypeSelect(spotType.type)}
                      >
                        <LinearGradient
                          colors={spotType.colors}
                          style={styles.typeIconContainer}
                        >
                          {spotType.icon}
                        </LinearGradient>
                        <Text style={styles.typeLabel}>{spotType.label}</Text>
                        <Text style={styles.typeDescription}>{spotType.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Title Input */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('map.spotTitle')} *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: Beşiktaş Dost Noktası"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={50}
                  />
                </View>

                {/* Note Input */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('map.spotNote')}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Bu nokta hakkında bir not ekleyin..."
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={4}
                    maxLength={200}
                    textAlignVertical="top"
                  />
                </View>

                {/* Coordinates Info */}
                {coordinates && (
                  <View style={styles.coordsInfo}>
                    <Text style={styles.coordsText}>
                      📍 Konum: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                  <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    (!selectedType || !title.trim()) && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={!selectedType || !title.trim()}
                >
                  <LinearGradient
                    colors={
                      !selectedType || !title.trim()
                        ? ['#d1d5db', '#9ca3af']
                        : [theme.colors.cards.orange, '#ea580c']
                    }
                    style={styles.confirmGradient}
                  >
                    <Text style={styles.confirmText}>{t('map.add')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalContent: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  scrollView: {
    maxHeight: 500,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  typeCard: {
    width: '47%',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  typeLabel: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  typeDescription: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  textArea: {
    minHeight: 100,
    paddingTop: theme.spacing.sm,
  },
  coordsInfo: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  coordsText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.secondary,
  },
  confirmButton: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: 'white',
  },
});

