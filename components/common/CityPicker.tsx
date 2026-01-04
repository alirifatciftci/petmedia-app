import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ChevronDown, Search, Check } from 'lucide-react-native';
import { theme } from '../../theme';
import { TURKEY_CITIES } from '../../constants/cities';

interface CityPickerProps {
  value: string;
  onSelect: (city: string) => void;
  placeholder?: string;
}

export const CityPicker: React.FC<CityPickerProps> = ({
  value,
  onSelect,
  placeholder = 'Şehir seçin',
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredCities = TURKEY_CITIES.filter((city) =>
    city.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelect = (city: string) => {
    onSelect(city);
    setModalVisible(false);
    setSearchText('');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.pickerText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} color={theme.colors.text.secondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Şehir Seçin</Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setSearchText('');
              }}
              style={styles.closeButton}
            >
              <X size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Şehir ara..."
              placeholderTextColor={theme.colors.text.tertiary}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <X size={18} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.cityItem, value === item && styles.cityItemSelected]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cityText, value === item && styles.cityTextSelected]}>
                  {item}
                </Text>
                {value === item && (
                  <Check size={20} color={theme.colors.primary[500]} />
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Şehir bulunamadı</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    minHeight: 48,
  },
  pickerText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.text.tertiary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  cityItemSelected: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
    marginVertical: 2,
  },
  cityText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
  },
  cityTextSelected: {
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.primary[700],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
});
