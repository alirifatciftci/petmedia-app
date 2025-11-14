import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { theme } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { MessageService } from '../services/firebase';
import { UserProfileModal } from '../components/profile/UserProfileModal';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const otherUserId = params.otherUserId as string || params.userId as string;
  const otherUserName = params.otherUserName as string || params.userName as string || 'Kullanıcı';
  const otherUserPhoto = params.otherUserPhoto as string || params.userPhoto as string || '';
  const chatIdParam = params.chatId as string;

  useEffect(() => {
    if (!user?.id || !otherUserId) return;

    const initializeChat = async () => {
      try {
        setLoading(true);
        
        // If chatId is provided, use it directly; otherwise get or create thread
        let newThreadId: string;
        if (chatIdParam) {
          console.log('ChatScreen: Using provided chatId:', chatIdParam);
          newThreadId = chatIdParam;
        } else {
          console.log('ChatScreen: Getting or creating thread for users:', user.id, otherUserId);
          newThreadId = await MessageService.getOrCreateThread(user.id, otherUserId);
          console.log('ChatScreen: Thread ID:', newThreadId);
        }
        
        setThreadId(newThreadId);

        // Load existing messages
        const existingMessages = await MessageService.getThreadMessages(newThreadId);
        setMessages(existingMessages);

        // Mark messages as read
        await MessageService.markAsRead(newThreadId, user.id);

        // Subscribe to real-time messages
        const unsubscribe = MessageService.subscribeToThreadMessages(
          newThreadId,
          (newMessages) => {
            setMessages(newMessages);
            // Mark new messages as read
            MessageService.markAsRead(newThreadId, user.id);
            // Scroll to bottom when new message arrives
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        );

        setLoading(false);

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing chat:', error);
        setLoading(false);
      }
    };

    const cleanup = initializeChat();
    return () => {
      cleanup.then((unsubscribe) => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [user?.id, otherUserId, chatIdParam]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !threadId || !user?.id || sending) return;

    const text = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      await MessageService.sendMessage(threadId, user.id, text);
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message text on error
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now.getTime() - messageDate.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dk önce`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} saat önce`;

    const day = messageDate.getDate();
    const month = messageDate.getMonth() + 1;
    return `${day}/${month}`;
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMyMessage = item.senderId === user?.id;
    const messageDate = item.createdAt instanceof Date 
      ? item.createdAt 
      : new Date(item.createdAt);

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
            ]}
          >
            {formatTime(messageDate)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerUserInfo}
            onPress={() => setShowUserProfile(true)}
            activeOpacity={0.7}
          >
            {otherUserPhoto && otherUserPhoto.trim() !== '' ? (
              <Image source={{ uri: otherUserPhoto }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarText}>
                  {otherUserName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.headerTitle}>{otherUserName}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
        
        {/* User Profile Modal */}
        <UserProfileModal
          visible={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userId={otherUserId}
          userName={otherUserName}
          userPhoto={otherUserPhoto}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
      
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerUserInfo}
          onPress={() => setShowUserProfile(true)}
          activeOpacity={0.7}
        >
          {otherUserPhoto && otherUserPhoto.trim() !== '' ? (
            <Image source={{ uri: otherUserPhoto }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarText}>
                {otherUserName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.headerTitle}>{otherUserName}</Text>
        </TouchableOpacity>
      </View>

      {/* User Profile Modal */}
      <UserProfileModal
        visible={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={otherUserId}
        userName={otherUserName}
        userPhoto={otherUserPhoto}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          onLayout={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Mesaj yazın..."
            placeholderTextColor={theme.colors.text.tertiary}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={theme.colors.background.primary} />
            ) : (
              <Send size={20} color={theme.colors.background.primary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backButton: {
    marginRight: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: theme.spacing.sm,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  headerAvatarText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.primary[700],
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bodyBold,
    color: theme.colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  messageContainer: {
    marginBottom: theme.spacing.sm,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
  },
  myMessageBubble: {
    backgroundColor: theme.colors.primary[500],
    borderBottomRightRadius: theme.borderRadius.sm,
  },
  otherMessageBubble: {
    backgroundColor: theme.colors.background.secondary,
    borderBottomLeftRadius: theme.borderRadius.sm,
  },
  messageText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  myMessageText: {
    color: theme.colors.background.primary,
  },
  otherMessageText: {
    color: theme.colors.text.primary,
  },
  messageTime: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.body,
  },
  myMessageTime: {
    color: theme.colors.primary[100],
  },
  otherMessageTime: {
    color: theme.colors.text.tertiary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.primary,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    maxHeight: 100,
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.primary[200],
    opacity: 0.5,
  },
});

