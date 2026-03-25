import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,

} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Heart, Trash2, Flag } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../utils/constants';

// Background images for different comment threads
const backgroundImages = {
  1: 'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920',
  2: 'https://images.pexels.com/photos/1172253/pexels-photo-1172253.jpeg?auto=compress&cs=tinysrgb&w=1920',
  3: 'https://images.pexels.com/photos/956999/milky-way-starry-sky-night-sky-star-956999.jpeg?auto=compress&cs=tinysrgb&w=1920',
  default: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=1920'
};


export default function CommentsScreen() {
  const { id } = useLocalSearchParams();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newComment, setNewComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const scrollViewRef = useRef(null);

  const sendButtonScale = useSharedValue(1);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Add user profile state
  const [userData, setUserData] = useState(null);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);

  // Get dynamic background image based on id
  const backgroundImage = backgroundImages[id] || backgroundImages.default;
  console.log("slot id", id);

  const sendButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  // Fetch user profile data
  const fetchUserProfile = async (userId) => {
    if (!userId) return;
    
    try {
      setLoadingUserProfile(true);
      
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.log("No token found for profile fetch");
        return;
      }

      const response = await fetch(`${BASE_URL}/v1/users/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();
      
      if (json.success && json.data) {
        setUserData(json.data);
        console.log("User profile loaded in comments:", json.data);
      } else {
        console.error("Profile API error:", json);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoadingUserProfile(false);
    }
  };

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      setCurrentUserId(id);
      
      // Fetch user profile when userId is available
      if (id) {
        fetchUserProfile(id);
      }
    };
    fetchUserId();
  }, []);

  // 🔹 Fetch API comments
  useEffect(() => {
    const fetchComments = async () => {
      const token = await AsyncStorage.getItem("authToken");
      const userId = await AsyncStorage.getItem("userId"); // fetch here
      setCurrentUserId(userId);

      if (!token) {
        console.log("No token found");
        return;
      }
      try {

        const response = await fetch(`${BASE_URL}/v1/comment?slotId=${id}&page=1&limit=10`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();

        const mapped = result.data.map(item => {
          const isOwn = item.user._id === userId;  // 👈 compare with logged in user
          console.log("API Comment:", item.text, "by", item.user.fullName, "| isOwn:", isOwn);
          return {
            id: item._id,
            username: isOwn ? "You" : item.user.fullName,
            userImage:
              item.user.avatar ||
              "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            message: item.text,
            timestamp: new Date(item.createdAt).toLocaleString(),
            likes: 0,
            isLiked: false,
            isOwn,
          };
        });

        setComments(mapped);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [id]);

  // Helper function to get current user's avatar
  const getCurrentUserAvatar = () => {
    return userData?.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    sendButtonScale.value = withSpring(1.2, {}, () => {
      sendButtonScale.value = withSpring(1);
    });

    try {
      const token = await AsyncStorage.getItem("authToken");
      const userId = await AsyncStorage.getItem("userId");

      if (!token || !userId) {
        Alert.alert("Error", "You must be logged in to comment.");
        return;
      }

      // 🔹 Send comment to backend
      const response = await fetch(`${BASE_URL}/v1/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slot: id,      // slotId from useLocalSearchParams()
          text: newComment.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Comment failed:", result);
        Alert.alert("Error", result.message || "Failed to post comment");
        return;
      }

      // 🔹 Append to UI
      // Use actual user data for the new comment
      const newCommentObj = {
        id: result._id,
        username: "You", 
        userImage: getCurrentUserAvatar(), // Use real user avatar
        message: result.text,
        timestamp: new Date(result.createdAt).toLocaleString(),
        likes: 0,
        isLiked: false,
        isOwn: result.user === userId, // compare userId string
      };

      setComments(prev => [newCommentObj, ...prev]);
      setNewComment("");
      // Scroll to top to show new comment
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    } catch (error) {
      console.error("Error posting comment:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleLikeComment = (commentId) => {
    setComments(prev => prev.map(comment =>
      comment.id === commentId
        ? {
          ...comment,
          isLiked: !comment.isLiked,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
        }
        : comment
    ));
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setComments(prev => prev.filter(comment => comment.id !== commentId));
          }
        }
      ]
    );
  };

  const handleReportComment = (commentId) => {
    Alert.alert(
      'Report Comment',
      'Why are you reporting this comment?',
      [
        { text: 'Cancel' },
        { text: 'Spam' },
        { text: 'Inappropriate Content' },
        { text: 'Harassment' }
      ]
    );
  };

  const CommentItem = ({ comment }) => {
    const likeScale = useSharedValue(1);

    const likeAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: likeScale.value }],
    }));

    const onLike = () => {
      likeScale.value = withSpring(1.3, {}, () => {
        likeScale.value = withSpring(1);
      });
      handleLikeComment(comment.id);
    };

    return (
      <View style={styles.commentItem}>
        <Image source={{ uri: comment.userImage }} style={styles.userImage} />

        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.username}>{comment.username}</Text>
            <Text style={styles.timestamp}>{comment.timestamp}</Text>
          </View>

          <Text style={styles.commentMessage}>{comment.message}</Text>

          <View style={styles.commentActions}>
            <Animated.View style={likeAnimatedStyle}>
              <TouchableOpacity
                style={styles.likeButton}
                onPress={onLike}
              >
                <Heart
                  size={16}
                  color={comment.isLiked ? '#EC4899' : '#6B7280'}
                  fill={comment.isLiked ? '#EC4899' : 'none'}
                />
                <Text style={[
                  styles.likeText,
                  comment.isLiked && styles.likedText
                ]}>
                  {comment.likes}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            
          </View>
        </View>
      </View>
    );
  };

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);

  return (
    <ImageBackground
      source={{ uri: backgroundImage }}
      style={styles.backgroundImage}
      blurRadius={8}
    >
      <View style={styles.overlay}>
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

            <Text style={styles.headerTitle}>Chat ({comments.length})</Text>

            <View style={styles.headerSpacer} />
          </View>

          {/* Comments List */}
          {loading ? (
            <ActivityIndicator
              style={{ flex: 1, justifyContent: 'center' }}
              size="large"
              color="#8B5CF6"
            />
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.commentsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.commentsContent}
            >
              {displayedComments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))}

              {comments.length > 3 && !showAllComments && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setShowAllComments(true)}
                >
                  <Text style={styles.viewAllText}>
                    View all {comments.length} comments
                  </Text>
                </TouchableOpacity>
              )}

              {comments.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No comments yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Be the first to share your thoughts!
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Comment Input */}
          <View style={styles.inputContainer}>
            {loadingUserProfile ? (
              <View style={styles.inputUserImagePlaceholder}>
                <ActivityIndicator size="small" color="#8B5CF6" />
              </View>
            ) : (
              <Image
                source={{ uri: getCurrentUserAvatar() }}
                style={styles.inputUserImage}
                onError={(e) => {
                  console.log('User avatar load error in comments:', e.nativeEvent.error);
                }}
              />
            )}

            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
              autoCorrect={true}
              spellCheck={true}
              contextMenuHidden={false}
              enablesReturnKeyAutomatically={false}
            />

            <Animated.View style={sendButtonAnimatedStyle}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  newComment.trim() && styles.sendButtonActive
                ]}
                onPress={handleSendComment}
                disabled={!newComment.trim()}
              >
                <Send size={20} color={newComment.trim() ? 'white' : '#9CA3AF'} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 32,
  },
  commentsList: {
    flex: 1,
  },
  commentsContent: {
    padding: 16,
  },
  commentItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  commentMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 4,
  },
  likeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  likedText: {
    color: '#EC4899',
  },
  commentActionsRight: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
  },
  reportButton: {
    padding: 4,
  },
  viewAllButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  viewAllText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#E5E7EB',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
    gap: 12,
  },
  inputUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  inputUserImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(243, 244, 246, 0.9)',
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
    backgroundColor: 'rgba(243, 244, 246, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#8B5CF6',
  },
});