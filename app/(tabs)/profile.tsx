import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, 
  Heart,
  FileText,
  MapPin,
  Settings,
  LogOut
} from 'lucide-react-native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { UserProfileService, PetService } from '../../services/firebase';
import { PetCard } from '../../components/common/PetCard';
import { Pet } from '../../types';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, setUser } = useAuthStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);

  const loadUserPets = useCallback(async () => {
    if (!user?.id) return;
    
    setLoadingPets(true);
    try {
      const pets = await PetService.getUserPets(user.id);
      setUserPets(pets as Pet[]);
    } catch (error) {
      console.error('Error loading user pets:', error);
    } finally {
      setLoadingPets(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserPets();
    }
  }, [isAuthenticated, user?.id, loadUserPets]);

  // Ekran focus olduğunda pet'leri yenile
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?.id) {
        loadUserPets();
      }
    }, [isAuthenticated, user?.id, loadUserPets])
  );

  const onRefresh = async () => {
    if (!user?.id) return;
    
    setRefreshing(true);
    try {
      console.log('Refreshing profile data for user:', user.id);
      
      // Firestore'dan güncel profil verilerini çek
      const profileData = await UserProfileService.getUserProfile(user.id);
      
      if (profileData) {
        // Güncel verilerle user state'ini güncelle
        const updatedUser = {
          ...user,
          displayName: profileData.displayName || user.displayName,
          photoURL: (profileData.photoURL && profileData.photoURL.startsWith('http')) ? profileData.photoURL : user.photoURL,
          city: profileData.city || user.city,
          bio: profileData.bio || user.bio,
          updatedAt: profileData.updatedAt || user.updatedAt,
        };
        
        setUser(updatedUser);
        console.log('Profile data refreshed:', updatedUser);
        
        // Pet'leri de yenile
        await loadUserPets();
        
        // Başarı popup'ı göster
        Alert.alert('✅ Güncellendi', 'Profil bilgileriniz başarıyla güncellendi!');
      } else {
        Alert.alert('ℹ️ Bilgi', 'Güncellenecek yeni veri bulunamadı.');
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      Alert.alert('❌ Hata', 'Profil bilgileri güncellenirken bir hata oluştu.');
    } finally {
      setRefreshing(false);
    }
  };

  const profileOptions = [
    {
      id: 'listings',
      title: t('profile.myListings'),
      icon: FileText,
      count: userPets.length,
      onPress: () => console.log('My listings'),
    },
    {
      id: 'saved',
      title: t('profile.saved'),
      icon: Heart,
      count: 8,
      onPress: () => console.log('Saved pets'),
    },
    {
      id: 'contributions',
      title: t('profile.contributions'),
      icon: MapPin,
      count: 12,
      onPress: () => console.log('Map contributions'),
    },
  ];

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
        
        <View style={styles.content}>
          <View style={styles.loginPrompt}>
            <LinearGradient
              colors={[theme.colors.primary[100], theme.colors.primary[50]]}
              style={styles.loginCard}
            >
              <User size={64} color={theme.colors.primary[500]} strokeWidth={1} />
              <Text style={styles.loginTitle}>Profilinizi görüntüleyin</Text>
              <Text style={styles.loginSubtitle}>
                Favorilerinizi, ilanlarınızı ve katkılarınızı görmek için giriş yapın
              </Text>
              
              <TouchableOpacity style={styles.loginButton}>
                <LinearGradient
                  colors={[theme.colors.gradient.start, theme.colors.gradient.end]}
                  style={styles.loginGradient}
                >
                  <Text style={styles.loginButtonText}>Giriş Yap</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary[500]]}
            tintColor={theme.colors.primary[500]}
            title="Profil güncelleniyor..."
            titleColor={theme.colors.text.secondary}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.profileAvatar} />
          ) : (
            <LinearGradient
              colors={[theme.colors.primary[500], theme.colors.primary[600]]}
              style={styles.avatar}
            >
              <User size={32} color="white" />
            </LinearGradient>
          )}
          
          <Text style={styles.displayName}>
            {user?.displayName || user?.email?.split('@')[0] || 'Pet Lover'}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.city && (
            <View style={styles.locationContainer}>
              <MapPin size={16} color={theme.colors.text.secondary} />
              <Text style={styles.location}>{user.city}</Text>
            </View>
          )}
          {user?.bio && (
            <View style={styles.bioContainer}>
              <Text style={styles.bio}>{user.bio}</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => {
              console.log('Edit profile button pressed');
              setShowEditModal(true);
            }}
          >
            <Text style={styles.editProfileText}>Profil Bilgilerini Düzenle</Text>
          </TouchableOpacity>
        </View>

        {/* User's Pets */}
        {userPets.length > 0 && (
          <View style={styles.petsSection}>
            <Text style={styles.sectionTitle}>İlanlarım ({userPets.length})</Text>
            <View style={styles.petsGrid}>
              {userPets.map((pet) => (
                <View key={pet.id} style={styles.petCardWrapper}>
                  <PetCard
                    pet={pet as Pet}
                    isFavorite={false}
                    onPress={() => console.log('Pet pressed:', pet.id)}
                    onFavoritePress={() => {}}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Profile Options */}
        <View style={styles.optionsContainer}>
          {profileOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={option.onPress}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                  <option.icon size={24} color={theme.colors.primary[500]} />
                </View>
                <Text style={styles.optionTitle}>{option.title}</Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.optionCount}>{option.count}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Settings */}
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => console.log('Settings')}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIcon}>
                <Settings size={24} color={theme.colors.text.secondary} />
              </View>
              <Text style={styles.optionTitle}>{t('profile.settings')}</Text>
            </View>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.optionItem, styles.logoutItem]}
            onPress={logout}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIcon}>
                <LogOut size={24} color={theme.colors.error[500]} />
              </View>
              <Text style={[styles.optionTitle, styles.logoutText]}>
                {t('common.logout')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <EditProfileModal 
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: {
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
  },
  loginCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius['2xl'],
    marginHorizontal: theme.spacing.lg,
  },
  loginTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  loginButton: {
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  loginGradient: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  loginButtonText: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    fontSize: theme.typography.fontSize.base,
  },
  profileHeader: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.secondary,
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  displayName: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  location: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  optionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100, // Account for tab bar
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  optionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
  },
  optionRight: {},
  optionCount: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.full,
    minWidth: 24,
    textAlign: 'center',
  },
  logoutItem: {
    marginTop: theme.spacing.lg,
    borderColor: theme.colors.error[500],
    borderWidth: 1,
  },
  logoutText: {
    color: theme.colors.error[500],
  },
  editProfileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 25,
    marginTop: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  editProfileText: {
    color: theme.colors.primary[600],
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodyBold,
    textAlign: 'center',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
  },
  bioContainer: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  bio: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  petsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  petsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  petCardWrapper: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
});