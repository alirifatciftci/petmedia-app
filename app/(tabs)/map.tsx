import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
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
import { MapSpot } from '../../types';

// Mock data for map spots
const mockMapSpots: MapSpot[] = [
  {
    id: '1',
    creatorId: 'user1',
    type: 'both',
    title: 'Beşiktaş Dost Noktası',
    note: 'Her gün saat 18:00\'da mama ve su koyuyorum. Sokak kedileri için güvenli alan.',
    coords: {
      latitude: 41.0425,
      longitude: 29.0071,
    },
    contributorsCount: 12,
    lastUpdatedAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: '2',
    creatorId: 'user2',
    type: 'water',
    title: 'Kadıköy Su Noktası',
    note: 'Temiz su kabı burada. Yaz aylarında özellikle aktif.',
    coords: {
      latitude: 40.9897,
      longitude: 29.0252,
    },
    contributorsCount: 8,
    lastUpdatedAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: '3',
    creatorId: 'user3',
    type: 'food',
    title: 'Şişli Mama Noktası',
    note: 'Kuru mama ve konserve mama bulabilirsiniz. Hafta sonları daha çok var.',
    coords: {
      latitude: 41.0608,
      longitude: 28.9877,
    },
    contributorsCount: 15,
    lastUpdatedAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: '4',
    creatorId: 'user4',
    type: 'veterinary',
    title: 'Acıbadem Veteriner Kliniği',
    note: 'Sokak hayvanları için ücretsiz muayene. Acil durumlar için 7/24.',
    coords: {
      latitude: 40.8897,
      longitude: 29.3452,
    },
    contributorsCount: 3,
    lastUpdatedAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: '5',
    creatorId: 'user5',
    type: 'shelter',
    title: 'Pendik Hayvan Barınağı',
    note: 'Sokak hayvanları için geçici barınma. Sahiplendirme hizmetleri.',
    coords: {
      latitude: 40.8755,
      longitude: 29.2352,
    },
    contributorsCount: 25,
    lastUpdatedAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: '6',
    creatorId: 'user6',
    type: 'both',
    title: 'Üsküdar Dost Noktası',
    note: 'Mama ve su noktası. Çocuk parkı yanında, güvenli alan.',
    coords: {
      latitude: 41.0225,
      longitude: 29.0152,
    },
    contributorsCount: 18,
    lastUpdatedAt: new Date(),
    createdAt: new Date(),
  },
];

export default function MapScreen() {
  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 41.0082,
    longitude: 28.9784, // Istanbul default
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Konum İzni',
          'Harita özelliklerini kullanabilmek için konum izni gereklidir.',
          [{ text: 'Tamam' }]
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

  const handleAddSpot = () => {
    // TODO: Implement add new food/water spot
    Alert.alert(
      'Yeni Nokta Ekle',
      'Bu özellik yakında eklenecek. Sokaktaki dostlarımız için yeni bir mama/su noktası ekleyebileceksiniz.',
      [{ text: 'Tamam' }]
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

  const getMarkerColors = (type: string) => {
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
      onPress={() => {
        Alert.alert(
          spot.title,
          `${spot.note}\n\nKatkıda bulunan: ${spot.contributorsCount} kişi`,
          [{ text: 'Tamam' }]
        );
      }}
    >
      <View style={styles.markerContainer}>
        <LinearGradient
          colors={getMarkerColors(spot.type)}
          style={styles.marker}
        >
          {getMarkerIcon(spot.type)}
        </LinearGradient>
      </View>
    </Marker>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🐾 Dost Noktaları</Text>
        <Text style={styles.headerSubtitle}>
          Sokaktaki dostlarımız için mama, su ve yardım noktaları
        </Text>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          loadingEnabled={true}
        >
          {mockMapSpots.map(renderMarker)}
        </MapView>

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
            <Text style={styles.legendText}>Su</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.cards.orange }]} />
            <Text style={styles.legendText}>Mama</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
            <Text style={styles.legendText}>İkisi</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Veteriner</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Barınak</Text>
          </View>
        </View>
      </View>
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
});