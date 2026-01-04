import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    FlatList,
    SafeAreaView,
} from 'react-native';
import { X, Search, MapPin, Check } from 'lucide-react-native';
import { theme } from '../../theme';

const TURKEY_CITIES = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
    'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
    'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
    'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta',
    'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
    'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
    'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop',
    'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van',
    'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak',
    'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

interface CityPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (city: string) => void;
    selectedCity?: string;
    placeholder?: string;
}

export const CityPicker: React.FC<CityPickerProps> = ({
    visible,
    onClose,
    onSelect,
    selectedCity,
    placeholder = 'Şehir ara...',
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCities = useMemo(() => {
        if (!searchQuery.trim()) return TURKEY_CITIES;
        const query = searchQuery.toLowerCase().trim();
        return TURKEY_CITIES.filter(city =>
            city.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const handleSelect = (city: string) => {
        onSelect(city);
        setSearchQuery('');
        onClose();
    };

    const renderCity = ({ item }: { item: string }) => {
        const isSelected = item === selectedCity;
        return (
            <TouchableOpacity
                style={[styles.cityItem, isSelected && styles.cityItemSelected]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
            >
                <View style={styles.cityLeft}>
                    <MapPin size={18} color={isSelected ? theme.colors.primary[500] : theme.colors.text.secondary} />
                    <Text style={[styles.cityText, isSelected && styles.cityTextSelected]}>{item}</Text>
                </View>
                {isSelected && <Check size={20} color={theme.colors.primary[500]} />}
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Şehir Seçin</Text>
                    <View style={styles.placeholder} />
                </View>

                <View style={styles.searchContainer}>
                    <Search size={20} color={theme.colors.text.secondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={placeholder}
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="words"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={18} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    data={filteredCities}
                    keyExtractor={(item) => item}
                    renderItem={renderCity}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Şehir bulunamadı</Text>
                        </View>
                    }
                />
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
    closeButton: {
        padding: theme.spacing.sm,
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        fontFamily: theme.typography.fontFamily.bodyBold,
        color: theme.colors.text.primary,
    },
    placeholder: {
        width: 40,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        marginHorizontal: theme.spacing.lg,
        marginVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderRadius: 12,
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
        borderRadius: 12,
        marginBottom: theme.spacing.xs,
    },
    cityItemSelected: {
        backgroundColor: theme.colors.primary[50],
    },
    cityLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    cityText: {
        fontSize: theme.typography.fontSize.base,
        fontFamily: theme.typography.fontFamily.body,
        color: theme.colors.text.primary,
    },
    cityTextSelected: {
        fontFamily: theme.typography.fontFamily.bodySemiBold,
        color: theme.colors.primary[600],
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
