import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';

import tr from '../locales/tr.json';
import en from '../locales/en.json';

const LANGUAGE_KEY = 'user-language';

// Get saved language from secure store
const getSavedLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await SecureStore.getItemAsync(LANGUAGE_KEY);
    return savedLanguage || 'tr'; // Default to Turkish
  } catch {
    return 'tr';
  }
};

// Save language to secure store
export const saveLanguage = async (language: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(LANGUAGE_KEY, language);
  } catch (error) {
    console.warn('Failed to save language:', error);
  }
};

const initI18n = async () => {
  const savedLanguage = await getSavedLanguage();
  
  i18n
    .use(initReactI18next)
    .init({
      lng: savedLanguage,
      fallbackLng: 'tr',
      debug: __DEV__,
      
      resources: {
        tr: { translation: tr },
        en: { translation: en },
      },
      
      interpolation: {
        escapeValue: false,
      },
      
      react: {
        useSuspense: false,
      },
    });
};

// Initialize i18n
initI18n();

export default i18n;