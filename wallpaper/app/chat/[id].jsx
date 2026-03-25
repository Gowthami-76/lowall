import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Phone, Video, MoveVertical as MoreVertical, DollarSign, Calendar, Clock, Flag, UserX } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// Mock chat data
const chatData = {
  1: {
    sellerId: 'alex_thompson',
    sellerName: 'Alex Thompson',
    sellerImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    slotDetails: {
      timeSlot: '8:00 AM - 8:30 AM',
      date: 'Tomorrow',
      price: 20,
      category: 'Prime Morning',
    },
    messages: [
      {
        id: 1,
        senderId: 'alex_thompson',
        message: 'Hi! Thanks for your interest in my premium slot.',
        timestamp: '10:30 AM',
        isOwn: false,
      },
      {
        id: 2,
        senderId: 'me',
        message: 'Hello! Is the price negotiable?',
        timestamp: '10:32 AM',
        isOwn: true,
      },
      {
        id: 3,
        senderId: 'alex_thompson',
        message: 'I can do $18 if you\'re ready to buy now.',
        timestamp: '10:35 AM',
        isOwn: false,
      },
      {
        id: 4,
        senderId: 'me',
        message: 'That sounds good! How do we proceed?',
        timestamp: '10:36 AM',
        isOwn: true,
      },
      {
        id: 5,
        senderId: 'alex_thompson',
        message: 'Perfect! I\'ll send you the payment details. Once confirmed, the slot will be transferred to you.',
        timestamp: '10:38 AM',
        isOwn: false,
      },
    ],
  },
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [chatInfo, setChatInfo] = useState(chatData[id]);
  const [messages, setMessages] = useState(chatInfo?.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [showSlotDetails, setShowSlotDetails] = useState(true);
  const scrollViewRef = useRef(null);

  const sendButtonScale = useSharedValue(1);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const sendButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    sendButtonScale.value = withSpring(1.2, {}, () => {
      sendButtonScale.value = withSpring(1);
    });

    const message = {
      id: Date.now(),
      senderId: 'me',
      message: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleAcceptOffer = () => {
    Alert.alert(
      'Accept Offer',
      `Accept the offer for $${chatInfo.slotDetails.price}?`,
      [
        { text: 'Cancel' },
        { 
          text: 'Accept', 
          onPress: () => {
            router.push(`/purchase/${id}`);
          }
        }
      ]
    );
  };

  const handleReportUser = () => {
    Alert.alert(
      'Report User',
      'Why are you reporting this user?',
      [
        { text: 'Cancel' },
        { text: 'Spam' },
        { text: 'Inappropriate Behavior' },
        { text: 'Fraud/Scam' }
      ]
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? You won\'t receive messages from them.',
      [
        { text: 'Cancel' },
        { 
          text: 'Block', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('User Blocked', 'You have blocked this user.');
            router.back();
          }
        }
      ]
    );
  };

  const showMoreOptions = () => {
    Alert.alert(
      'More Options',
      'Choose an action',
      [
        { text: 'Cancel' },
        { text: 'Report User', onPress: handleReportUser },
        { text: 'Block User', onPress: handleBlockUser, style: 'destructive' }
      ]
    );
  };

  const MessageBubble = ({ message }) => (
    <View style={[
      styles.messageBubble,
      message.isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      <Text style={[
        styles.messageText,
        message.isOwn ? styles.ownMessageText : styles.otherMessageText
      ]}>
        {message.message}
      </Text>
      <Text style={[
        styles.messageTime,
        message.isOwn ? styles.ownMessageTime : styles.otherMessageTime
      ]}>
        {message.timestamp}
      </Text>
    </View>
  );

  if (!chatInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Chat not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Image source={{ uri: chatInfo.sellerImage }} style={styles.headerImage} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{chatInfo.sellerName}</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Phone size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Video size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={showMoreOptions}
          >
            <MoreVertical size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Slot Details Card */}
      {showSlotDetails && (
        <View style={styles.slotDetailsCard}>
          <View style={styles.slotDetailsHeader}>
            <Text style={styles.slotDetailsTitle}>Premium Slot Details</Text>
            <TouchableOpacity 
              onPress={() => setShowSlotDetails(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.slotDetailsContent}>
            <View style={styles.slotDetailRow}>
              <Calendar size={16} color="#8B5CF6" />
              <Text style={styles.slotDetailText}>{chatInfo.slotDetails.date}</Text>
            </View>
            <View style={styles.slotDetailRow}>
              <Clock size={16} color="#8B5CF6" />
              <Text style={styles.slotDetailText}>{chatInfo.slotDetails.timeSlot}</Text>
            </View>
            <View style={styles.slotDetailRow}>
              {/* <DollarSign size={16} color="#10B981" /> */}
              <Text style={styles.slotDetailPrice}>${chatInfo.slotDetails.price}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.acceptOfferButton}
            onPress={handleAcceptOffer}
          >
            <Text style={styles.acceptOfferButtonText}>Accept Offer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ScrollView>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
        />
        
        <Animated.View style={sendButtonAnimatedStyle}>
          <TouchableOpacity 
            style={[
              styles.sendButton,
              newMessage.trim() && styles.sendButtonActive
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Send size={20} color={newMessage.trim() ? 'white' : '#9CA3AF'} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerStatus: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  slotDetailsCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  slotDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  slotDetailsContent: {
    gap: 8,
    marginBottom: 16,
  },
  slotDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  slotDetailPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  acceptOfferButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptOfferButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    marginBottom: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#8B5CF6',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
  },
});