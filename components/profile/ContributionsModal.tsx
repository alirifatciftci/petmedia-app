import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, MapPin, Droplets, Heart, Home, Stethoscope, Shield } from 'lucide-react-native';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { MapSpotService } from '../../services/firebase';
import { MapSpot } from '../../types';

interface ContributionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ContributionsModal: React.FC<ContributionsModalProps> = ({ visible, onClose }) => {
  const { user } = useAuthStore();
  const [contributions, setContributions] = useState<MapSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && user?.id) {
      loadContributions();
    }
  }, [visible, user?.id]);

  const loadContributions = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const spots = await MapSpotService.getUserMapSpots(user.id);
      setContributions(spots as MapSpot[]);
    } catch (error) {
      console.error('Error loading contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSpotIcon = (type: string) => {
    switch (type) {
      case 'water':
        return <Droplets size={20} color="#3b82f6" />;
      case 'food':
        return <Heart size={20} color={theme.colors.cards.orange} />;
      case 'both':
        return <Home size={20} color="#8b5cf6" />;
      case 'veterinary':
        return <Stethoscope size={20} color="#10b981" />;
      case 'shelter':
        return <Shield size={20} color="#f59e0b" />;
      default:
        return <MapPin size={20} color={theme.colors.text.secondary} />;
    }
  };

  const getSpotTypeName = (type: string) => {
    switch (type) {
      case 'water': return 'Su Noktası';
      case 'food': return 'Mama Noktası';
      case 'both': return 'Su + Mama';
      case 'veterinary': return 'Veteriner';
      case 'shelter': return 'Barınak';
      default: return 'Diğer';
    }
  };

  const getSpotColor = (type: string) => {
    switch (type) {
      case 'water': return '#3b82f6';
      case 'food': return theme.colors.cards.orange;
      case 'both': return '#8b5cf6';
      case 'veterinary': return '#10b981';
      case 'shelter': return '#f59e0b';
      default: return theme.colors.text.secondary;
    }
  };

  const renderContributionItem = ({ item }: { item: MapSpot }) => (
    <View style={styles.contributionItem}>
      <View style={[styles.iconContainer, { backgroundColor: `${getSpotColor(item.type)}20` }]}>
        {getSpotIcon(item.type)}
      </View>
      <View style={styles.contributionInfo}>
        <Text style={styles.contributionTitle}>{item.title}</Text>
        <Text style={styles.contributionType}>{getSpotTypeName(item.type)}</Text>
        {item.note && (
          <Text style={styles.contributionNote} numberOfLines={2}>{item.note}</Text>
        )}
      </View>
      <View style={styles.contributorBadge}>
        <Text style={styles.contributorCount}>{item.contributorsCount}</Text>
        <Text style={styles.contributorLabel}>katkı</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Katkılarım</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        ) : contributions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MapPin size={64} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyTitle}>Henüz katkınız yok</Text>
            <Text style={styles.emptySubtitle}>
              Harita sekmesinden yeni yardım noktaları ekleyebilirsiniz
            </Text>
          </View>
        ) : (
          <FlatList
            data={contributions}
            renderItem={renderContributionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  contributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  contributionInfo: {
    flex: 1,
  },
  contributionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
  },
  contributionType: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  contributionNote: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  contributorBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  contributorCount: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.primary[600],
  },
  contributorLabel: {
    fontSize: 10,
    color: theme.colors.primary[500],
  },
});
