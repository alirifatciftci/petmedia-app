import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Heart, Home, Users, Droplets } from 'lucide-react-native';
import { theme } from '../../theme';

interface BeautifulModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const BeautifulModal: React.FC<BeautifulModalProps> = ({
  visible,
  onClose,
  title,
  description,
  icon,
  onConfirm,
  confirmText = "Devam Et",
  cancelText = "İptal"
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={styles.modalContent}
          >
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>

            {/* Icon */}
            <View style={styles.iconContainer}>
              {icon}
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Description */}
            <Text style={styles.description}>{description}</Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                <LinearGradient
                  colors={[theme.colors.primary[500], theme.colors.primary[600]]}
                  style={styles.confirmGradient}
                >
                  <Text style={styles.confirmText}>{confirmText}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalContent: {
    padding: 32,
    alignItems: 'center',
    minWidth: 320,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.inverse,
  },
});
