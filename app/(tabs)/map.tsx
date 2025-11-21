import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Navigation2, 
  Plus, 
  Droplets,
  MapPin,
  Heart,
  Home,
  Stethoscope,
  Shield
} from 'lucide-react-native';
import { theme } from '../../theme';
import { MapSpot, MapSpotType } from '../../types';
import { MapSpotService } from '../../services/firebase';
import { useAuthStore } from '../../stores/authStore';
import { AddMapSpotModal } from '../../components/map/AddMapSpotModal';

export default function MapScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 41.0082,
    longitude: 28.9784, // Istanbul default
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [mapSpots, setMapSpots] = useState<MapSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [addingMode, setAddingMode] = useState(false);

  useEffect(() => {
    getCurrentLocation();
    loadMapSpots();
    
    // Subscribe to real-time updates
    const unsubscribe = MapSpotService.subscribeToMapSpots(
      (spots) => {
        setMapSpots(spots as MapSpot[]);
        setLoading(false);
      },
      (error) => {
        console.error('Error in map spots subscription:', error);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadMapSpots = async () => {
    try {
      setLoading(true);
      const spots = await MapSpotService.getAllMapSpots();
      setMapSpots(spots as MapSpot[]);
    } catch (error) {
      console.error('Error loading map spots:', error);
      Alert.alert(t('map.error'), t('map.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('map.locationPermission'),
          t('map.locationPermissionMessage'),
          [{ text: t('common.cancel') }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation(location);
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.warn('Error getting location:', error);
    }
  };

  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleMapPress = (e: any) => {
    if (addingMode) {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setSelectedCoordinates({ latitude, longitude });
      setModalVisible(true);
      setAddingMode(false);
    }
  };

  const handleAddSpot = () => {
    if (!user) {
      Alert.alert(
        t('map.loginRequired'),
        t('map.loginRequiredMessage'),
        [{ text: t('common.cancel') }]
      );
      return;
    }
    setAddingMode(true);
    Alert.alert(
      t('map.selectLocation'),
      t('map.selectLocationMessage'),
      [{ text: t('common.cancel') }]
    );
  };

  const handleConfirmAddSpot = async (type: MapSpotType, title: string, note?: string) => {
    if (!user || !selectedCoordinates) {
      Alert.alert(t('map.error'), t('map.error'));
      return;
    }

    try {
      await MapSpotService.createMapSpot({
        creatorId: user.id,
        type,
        title,
        note,
        coords: selectedCoordinates,
      });
      
      setModalVisible(false);
      setSelectedCoordinates(null);
      Alert.alert(t('map.spotAdded'), '');
    } catch (error) {
      console.error('Error creating map spot:', error);
      Alert.alert(t('map.error'), t('map.errorCreating'));
    }
  };

  const handleMarkerPress = (spot: MapSpot) => {
    if (!user) {
      Alert.alert(spot.title, spot.note || '', [{ text: t('common.cancel') }]);
      return;
    }

    Alert.alert(
      spot.title,
      `${spot.note || ''}\n\n${t('map.contributors')}: ${spot.contributorsCount} ${t('map.people')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('map.contribute'),
          onPress: async () => {
            try {
              await MapSpotService.contributeToSpot(spot.id);
              Alert.alert(
                t('map.thankYou'),
                t('map.contributeMessage')
              );
            } catch (error) {
              console.error('Error contributing to spot:', error);
              Alert.alert(t('map.error'), t('map.errorContributing'));
            }
          },
        },
      ]
    );
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'water':
        return <Droplets size={16} color="white" fill="white" />;
      case 'food':
        return <Heart size={16} color="white" fill="white" />;
      case 'both':
        return <Home size={16} color="white" fill="white" />;
      case 'veterinary':
        return <Stethoscope size={16} color="white" fill="white" />;
      case 'shelter':
        return <Shield size={16} color="white" fill="white" />;
      default:
        return <MapPin size={16} color="white" fill="white" />;
    }
  };

  const getMarkerColors = (type: string): [string, string] => {
    switch (type) {
      case 'water':
        return ['#3b82f6', '#1d4ed8'];
      case 'food':
        return [theme.colors.cards.orange, '#ea580c'];
      case 'both':
        return ['#8b5cf6', '#7c3aed'];
      case 'veterinary':
        return ['#10b981', '#059669'];
      case 'shelter':
        return ['#f59e0b', '#d97706'];
      default:
        return ['#6b7280', '#4b5563'];
    }
  };

  const renderMarker = (spot: MapSpot) => (
    <Marker
      key={spot.id}
      coordinate={spot.coords}
      onPress={() => handleMarkerPress(spot)}
    >
      <View style={styles.markerContainer}>
        <LinearGradient
          colors={getMarkerColors(spot.type)}
          style={styles.marker}
        >
          {getMarkerIcon(spot.type)}
        </LinearGradient>
        {spot.contributorsCount > 1 && (
          <View style={styles.contributorBadge}>
            <Text style={styles.contributorText}>{spot.contributorsCount}</Text>
          </View>
        )}
      </View>
    </Marker>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🐾 {t('map.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('map.subtitle')}
        </Text>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
          loadingEnabled={true}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        >
          {mapSpots.map(renderMarker)}
        </MapView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Text style={styles.loadingText}>{t('map.loading')}</Text>
          </View>
        )}

        {addingMode && (
          <View style={styles.addingModeOverlay}>
            <View style={styles.addingModeCard}>
              <MapPin size={24} color={theme.colors.primary[500]} />
              <Text style={styles.addingModeText}>{t('map.tapToAdd')}</Text>
            </View>
          </View>
        )}

        {/* Floating Action Buttons */}
        <View style={styles.fabContainer}>
          {/* Center on user location */}
          <TouchableOpacity
            style={styles.fab}
            onPress={centerOnUserLocation}
          >
            <Navigation2 size={24} color={theme.colors.primary[500]} />
          </TouchableOpacity>

          {/* Add new spot */}
          <TouchableOpacity
            style={[styles.fab, styles.addFab]}
            onPress={handleAddSpot}
          >
            <LinearGradient
              colors={[theme.colors.cards.orange, '#ea580c']}
              style={styles.addFabGradient}
            >
              <Plus size={24} color="white" strokeWidth={3} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>{t('map.water')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.cards.orange }]} />
            <Text style={styles.legendText}>{t('map.food')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
            <Text style={styles.legendText}>{t('map.both')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>{t('map.veterinary')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>{t('map.shelter')}</Text>
          </View>
        </View>
      </View>

      {/* Add Map Spot Modal */}
      <AddMapSpotModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedCoordinates(null);
          setAddingMode(false);
        }}
        onConfirm={handleConfirmAddSpot}
        coordinates={selectedCoordinates}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabContainer: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  addFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'transparent',
  },
  addFabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    position: 'absolute',
    top: theme.spacing.lg,
    left: theme.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  legendText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  addingModeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  addingModeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  addingModeText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
  },
  contributorBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.primary[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  contributorText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: 'white',
  },
});