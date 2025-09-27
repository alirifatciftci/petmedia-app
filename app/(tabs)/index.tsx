import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Heart, 
  Search, 
  Home as HomeIcon,
  Users,
  Droplets
} from 'lucide-react-native';
import { theme } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { FeatureCard } from '../../components/common/FeatureCard';
import { PetCard } from '../../components/common/PetCard';
import { usePetStore } from '../../stores/petStore';
import { Pet } from '../../types';

const { width } = Dimensions.get('window');

// Mock data for pets
const mockPets: Pet[] = [
  {
    id: '1',
    ownerId: 'owner1',
    species: 'dog',
    name: 'Luna',
    sex: 'female',
    ageMonths: 24,
    size: 'medium',
    breed: 'Golden Retriever Mix',
    city: 'İstanbul',
    vaccinated: true,
    neutered: true,
    description: 'Çok sevimli ve oyuncu bir köpek. Çocuklarla çok iyi anlaşıyor.',
    photos: ['https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'],
    tags: ['arkadaş-canlısı', 'eğitilmiş'],
    status: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    ownerId: 'owner2',
    species: 'cat',
    name: 'Pamuk',
    sex: 'male',
    ageMonths: 8,
    size: 'small',
    breed: 'Van Kedisi',
    city: 'Ankara',
    vaccinated: true,
    neutered: false,
    description: 'Sakin ve sevecen bir kedi. Apartman hayatına uygun.',
    photos: ['https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg'],
    tags: ['sakin', 'ev-kedisi'],
    status: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    ownerId: 'owner3',
    species: 'dog',
    name: 'Karabaş',
    sex: 'male',
    ageMonths: 36,
    size: 'large',
    breed: 'Kangal',
    city: 'İzmir',
    vaccinated: true,
    neutered: true,
    description: 'Sadık ve koruyucu bir köpek. Geniş bahçeli ev arıyor.',
    photos: ['https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg'],
    tags: ['koruyucu', 'sadık'],
    status: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'cat' | 'dog' | 'other'>('all');
  
  const { favorites, toggleFavorite } = usePetStore();

  const filteredPets = mockPets.filter(pet => {
    const matchesSearch = pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pet.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || pet.species === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const renderPetCard = ({ item }: { item: Pet }) => (
    <PetCard
      pet={item}
      isFavorite={favorites.includes(item.id)}
      onPress={() => {
        // Navigate to pet detail
        console.log('Navigate to pet:', item.id);
      }}
      onFavoritePress={() => toggleFavorite(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
      
      {/* Header */}
      <AppHeader 
        showLogin={true}
        onLoginPress={() => console.log('Login pressed')}
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Feature Cards */}
        <View style={styles.featuresContainer}>
          <FeatureCard
            title={t('features.findHome.title')}
            backgroundColor={theme.colors.cards.purple}
            icon={<HomeIcon size={32} color="white" />}
            onPress={() => console.log('Find home pressed')}
          />
          
          <FeatureCard
            title={t('features.findFriend.title')}
            backgroundColor={theme.colors.cards.lightBlue}
            icon={<Users size={32} color="white" />}
            onPress={() => console.log('Find friend pressed')}
          />
          
          <FeatureCard
            title={t('features.foodWater.title')}
            backgroundColor={theme.colors.cards.orange}
            icon={<Droplets size={32} color="white" />}
            onPress={() => console.log('Food/water pressed')}
          />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#e0f2fe', '#f0f9ff']}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>
                {t('mission.headline')}
              </Text>
              <Text style={styles.heroDescription}>
                {t('mission.description')}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>{t('home.title')}</Text>
          
          <View style={styles.searchContainer}>
            <Search size={20} color={theme.colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('common.search')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>

          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            {['all', 'cat', 'dog', 'other'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  selectedFilter === filter && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedFilter(filter as any)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter && styles.filterTextActive,
                  ]}
                >
                  {t(`home.filters.${filter}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pets Grid */}
        <View style={styles.petsContainer}>
          <FlatList
            data={filteredPets}
            renderItem={renderPetCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 100, // Account for tab bar
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  heroSection: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius['2xl'],
    overflow: 'hidden',
  },
  heroGradient: {
    padding: theme.spacing.xl,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    ...theme.textStyles.hero,
    textAlign: 'center',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  heroDescription: {
    ...theme.textStyles.body,
    textAlign: 'center',
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  searchSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  filterText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.secondary,
  },
  filterTextActive: {
    color: theme.colors.text.inverse,
  },
  petsContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  row: {
    justifyContent: 'space-between',
  },
});