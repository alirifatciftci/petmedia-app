import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { FirebaseAuth, UserProfileService } from '../../services/firebase';
import { theme } from '../../theme';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setUser, setLoading, isLoading } = useAuthStore();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  console.log('AuthProvider rendering, isLoading:', isLoading);

  useEffect(() => {
    const unsubscribe = FirebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in - Load profile data from Firestore
        try {
          console.log('Loading user profile from Firestore for:', firebaseUser.uid);
          const profileData = await UserProfileService.getUserProfile(firebaseUser.uid);
          
          if (profileData) {
            // Use Firestore data if available
            // photoURL kontrolü: Firestore'dan gelen varsa onu kullan, yoksa Firebase Auth'tan al
            let photoURL = '';
            if (profileData.photoURL && typeof profileData.photoURL === 'string' && profileData.photoURL.trim() !== '') {
              photoURL = profileData.photoURL;
            } else if (firebaseUser.photoURL && firebaseUser.photoURL.trim() !== '') {
              photoURL = firebaseUser.photoURL;
            }
            
            const user = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: profileData.displayName || firebaseUser.displayName || '',
              photoURL: photoURL,
              city: profileData.city || '',
              bio: profileData.bio || '',
              favorites: profileData.favorites || [],
              createdAt: profileData.createdAt || new Date().toISOString(),
              updatedAt: profileData.updatedAt || new Date().toISOString(),
            };
            console.log('Profile loaded from Firestore:', user);
            console.log('PhotoURL:', user.photoURL);
            setUser(user);
          } else {
            // Create default user if no profile exists
            const user = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              city: '',
              bio: '',
              favorites: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            console.log('No profile found, creating default user in Firestore:', user);
            
            // Create user profile in Firestore if it doesn't exist
            try {
              await UserProfileService.updateUserProfile(firebaseUser.uid, {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                city: user.city,
                bio: user.bio,
                favorites: user.favorites,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              });
              console.log('User profile created in Firestore');
            } catch (profileError) {
              console.error('Error creating user profile in Firestore:', profileError);
              // Continue even if Firestore update fails
            }
            
            setUser(user);
          }
        } catch (error) {
          console.error('Error loading profile from Firestore:', error);
          // Fallback to basic user data
          const user = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            city: '',
            bio: '',
            favorites: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setUser(user);
        }
      } else {
        // User is signed out
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (!isLoading) {
      // Fade in animation when loading is complete
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, fadeAnim, scaleAnim]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Animated.View 
          style={[
            styles.loadingContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>PetMedia'ya Hoş Geldiniz</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});
