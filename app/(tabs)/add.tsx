import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

export default function AddScreen() {
  const { t } = useTranslation();

  React.useEffect(() => {
    // This screen opens modally when the add tab is pressed
    Alert.alert(
      'Yeni İlan Ekle',
      'Bu özellik yakında eklenecek. Sahiplenmek isteyen dostlarımız için yeni ilan ekleyebileceksiniz.',
      [
        { 
          text: 'Tamam',
          onPress: () => {
            // Navigate back to previous tab
          }
        }
      ]
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Yeni İlan Ekle</Text>
        <Text style={styles.subtitle}>
          Sahiplenmek isteyen dostlarımız için yeni bir ilan oluşturun
        </Text>
      </View>
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