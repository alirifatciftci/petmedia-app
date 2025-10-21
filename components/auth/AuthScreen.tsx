import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { SuccessScreen } from './SuccessScreen';
import { theme } from '../../theme';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const switchToRegister = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);
  const handleSuccessComplete = () => setShowSuccess(false);
  const handleLoginSuccess = () => setShowSuccess(true);

  console.log('AuthScreen rendering, isLogin:', isLogin, 'showSuccess:', showSuccess);

  try {
    if (showSuccess) {
      return <SuccessScreen onComplete={handleSuccessComplete} />;
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.debugText}>AuthScreen Debug - isLogin: {isLogin ? 'true' : 'false'}</Text>
          {isLogin ? (
            <LoginForm 
              onSwitchToRegister={switchToRegister} 
              onLoginSuccess={handleLoginSuccess}
            />
          ) : (
            <RegisterForm onSwitchToLogin={switchToLogin} />
          )}
        </View>
      </SafeAreaView>
    );
  } catch (error) {
    console.error('AuthScreen error:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>AuthScreen Error: {String(error)}</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
  },
  debugText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    padding: 10,
    backgroundColor: 'yellow',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});
