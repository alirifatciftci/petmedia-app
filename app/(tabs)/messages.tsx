import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Modal, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import { MessageCircle, User, Plus, X, Search } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { UserService, MessageService } from '../../services/firebase';

export default function MessagesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usersError, setUsersError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('Loading conversations for user:', user.id);
      const userChats = await MessageService.getUserConversations(user.id);
      console.log('Loaded chats:', userChats.length);
      
      // Map chats to conversations with other user info from chat data
      const conversationsWithUsers = userChats.map((chat) => {
        // Determine which user is the other user
        const isUser1 = chat.user1Id === user.id;
        const otherUser = {
          id: isUser1 ? chat.user2Id : chat.user1Id,
          displayName: isUser1 ? chat.user2Name : chat.user1Name,
          photoURL: isUser1 ? chat.user2Photo : chat.user1Photo,
          email: '', // Email is not stored in chat, but we have displayName
        };
        
        return {
          ...chat,
          otherUser,
        };
      });
      
      console.log('Setting conversations:', conversationsWithUsers.length);
      setConversations(conversationsWithUsers);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Ekran focus olduğunda chat'leri yenile (yeni chat oluşturulduğunda görünsün)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadConversations();
      }
    }, [user?.id, loadConversations])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadConversations();
  }, [loadConversations]);

  const handleNewMessagePress = async () => {
    setShowNewMessageModal(true);
    setSearchQuery('');
    setUsersError(null);
    setAllUsers([]);
    setLoadingUsers(true);
    
    try {
      console.log('Loading users for user:', user?.id);
      if (!user?.id) {
        throw new Error('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      }
      
      const users = await UserService.getAllUsers(user.id);
      console.log('Loaded users:', users.length, users);
      setAllUsers(users);
      
      if (users.length === 0) {
        console.warn('No users found in Firestore');
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      const errorMessage = error?.message || error?.toString() || 'Kullanıcılar yüklenirken bir hata oluştu';
      setUsersError(errorMessage);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = (selectedUser: any) => {
    setShowNewMessageModal(false);
    setSearchQuery('');
    router.push({
      pathname: '/chat',
      params: {
        userId: selectedUser.id,
        userName: selectedUser.displayName || selectedUser.email || 'Kullanıcı',
        userPhoto: selectedUser.photoURL || '',
      },
    });
  };

  const handleConversationPress = (conversation: any) => {
    const otherUser = conversation.otherUser;
    router.push({
      pathname: '/chat',
      params: {
        userId: otherUser.id,
        userName: otherUser.displayName || otherUser.email || 'Kullanıcı',
        userPhoto: otherUser.photoURL || '',
      },
    });
  };

  const filteredUsers = allUsers.filter(user => {
    const name = (user.displayName || user.email || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const renderConversationItem = ({ item }: { item: any }) => {
    if (!item.otherUser) return null;
    
    const otherUser = item.otherUser;
    const displayName = otherUser.displayName || otherUser.email || 'Kullanıcı';
    const initials = displayName.charAt(0).toUpperCase();
    const lastMessage = item.lastMessage || 'Henüz mesaj yok';

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {otherUser.photoURL ? (
            <Image 
              source={{ uri: otherUser.photoURL }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
        </View>
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>{displayName}</Text>
            {item.lastMessageAt && (
              <Text style={styles.conversationTime}>
                {formatTime(item.lastMessageAt)}
              </Text>
            )}
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderUserItem = ({ item }: { item: any }) => {
    const displayName = item.displayName || item.email || 'Kullanıcı';
    const initials = displayName.charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.photoURL ? (
            <Image 
              source={{ uri: item.photoURL }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          {item.city && (
            <Text style={styles.userCity}>{item.city}</Text>
          )}
        </View>
        <MessageCircle size={20} color={theme.colors.primary[500]} />
      </TouchableOpacity>
    );
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = date instanceof Date ? date : new Date(date);
    const diff = now.getTime() - messageDate.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dk önce`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} saat önce`;

    const day = messageDate.getDate();
    const month = messageDate.getMonth() + 1;
    return `${day}/${month}`;
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('navigation.messages')}</Text>
          <TouchableOpacity
            style={styles.newMessageButton}
            onPress={handleNewMessagePress}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[theme.colors.primary[500], theme.colors.primary[600]]}
              style={styles.newMessageButtonGradient}
            >
              <Plus size={22} color="white" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('navigation.messages')}</Text>
        <TouchableOpacity
          style={styles.newMessageButton}
          onPress={handleNewMessagePress}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[theme.colors.primary[500], theme.colors.primary[600]]}
            style={styles.newMessageButtonGradient}
          >
            <Plus size={22} color="white" strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <MessageCircle 
              size={64} 
              color={theme.colors.text.tertiary} 
              strokeWidth={1}
            />
            <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
            <Text style={styles.emptySubtitle}>
              Yeni mesaj oluştur butonuna tıklayarak diğer kullanıcılarla mesajlaşmaya başlayın
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={handleNewMessagePress}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[theme.colors.primary[500], theme.colors.primary[600]]}
                style={styles.emptyStateButtonGradient}
              >
                <Plus size={20} color="white" strokeWidth={2.5} />
                <Text style={styles.emptyStateButtonText}>Yeni Mesaj</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary[500]]}
            />
          }
        />
      )}

      {/* New Message Modal */}
      <Modal
        visible={showNewMessageModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowNewMessageModal(false);
          setSearchQuery('');
        }}
      >
        <BlurView intensity={20} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Yeni Mesaj</Text>
                {!loadingUsers && allUsers.length > 0 && (
                  <Text style={styles.modalSubtitle}>
                    {searchQuery 
                      ? `${filteredUsers.length} kullanıcı bulundu` 
                      : `${allUsers.length} kullanıcı`}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowNewMessageModal(false);
                  setSearchQuery('');
                }}
              >
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={theme.colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Kullanıcı ara..."
                placeholderTextColor={theme.colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {loadingUsers ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                <Text style={styles.loadingText}>Kullanıcılar yükleniyor...</Text>
              </View>
            ) : usersError ? (
              <View style={styles.modalEmptyContainer}>
                <User size={48} color={theme.colors.text.tertiary} />
                <Text style={styles.modalEmptyText}>{usersError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleNewMessagePress}
                >
                  <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                </TouchableOpacity>
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={styles.modalEmptyContainer}>
                <User size={48} color={theme.colors.text.tertiary} />
                <Text style={styles.modalEmptyText}>
                  {searchQuery ? 'Kullanıcı bulunamadı' : 'Henüz kullanıcı yok'}
                </Text>
                {!searchQuery && (
                  <Text style={styles.modalEmptySubtext}>
                    Diğer kullanıcıların uygulamaya kayıt olması gerekiyor
                  </Text>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalListContent}
                showsVerticalScrollIndicator={true}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={10}
              />
            )}
          </View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}

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
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  newMessageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  newMessageButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  emptyStateButton: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyStateButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: 'white',
  },
  listContent: {
    padding: theme.spacing.md,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.sm,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  conversationName: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  conversationTime: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing.sm,
  },
  lastMessage: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.sm,
  },
  avatarContainer: {
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.primary[700],
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  userCity: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    marginTop: 100,
    borderTopLeftRadius: theme.borderRadius['2xl'],
    borderTopRightRadius: theme.borderRadius['2xl'],
    paddingTop: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  modalEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  modalEmptyText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  modalEmptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary[500],
  },
  retryButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodySemiBold,
    color: 'white',
  },
  modalListContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
});