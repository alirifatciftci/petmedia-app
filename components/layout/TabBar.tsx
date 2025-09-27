import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Home, 
  Map, 
  Plus, 
  MessageCircle, 
  User 
} from 'lucide-react-native';
import { theme } from '../../theme';

const icons = {
  index: Home,
  map: Map,
  add: Plus,
  messages: MessageCircle,
  profile: User,
};

export const TabBar: React.FC<BottomTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation 
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0 }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,1)']}
        style={styles.gradient}
      >
        <View style={styles.tabContainer}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel || options.title || route.name;
            const isFocused = state.index === index;
            const IconComponent = icons[route.name as keyof typeof icons];

            // Special handling for Add button
            if (route.name === 'add') {
              return (
                <TouchableOpacity
                  key={route.key}
                  style={styles.addButton}
                  onPress={() => navigation.navigate(route.name)}
                >
                  <LinearGradient
                    colors={[theme.colors.cards.orange, '#ff8c42']}
                    style={styles.addGradient}
                  >
                    <Plus size={24} color={theme.colors.text.inverse} strokeWidth={3} />
                  </LinearGradient>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={route.key}
                style={styles.tabButton}
                onPress={() => navigation.navigate(route.name)}
                activeOpacity={0.7}
              >
                {IconComponent && (
                  <IconComponent
                    size={22}
                    color={isFocused ? theme.colors.primary[500] : theme.colors.text.tertiary}
                    strokeWidth={isFocused ? 2.5 : 2}
                  />
                )}
                <Text 
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? theme.colors.primary[500] : theme.colors.text.tertiary }
                  ]}
                >
                  {typeof label === 'string' ? label : route.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  gradient: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xs : theme.spacing.sm,
    height: 70,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.body,
    textAlign: 'center',
  },
  addButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.cards.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});