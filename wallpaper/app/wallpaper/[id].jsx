import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,  // 👈 add this
NativeModules,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  HeartOff,
  MessageCircle,
  Download,
  Share,
  Clock,
  User,
  Flag
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from '../../utils/constants';
const { WallpaperModule } = NativeModules;


const { width, height } = Dimensions.get('window');


export default function WallpaperDetailScreen() {
  const { id } = useLocalSearchParams();
  const [wallpaper, setWallpaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const heartScale = useSharedValue(1);
  const downloadScale = useSharedValue(1);

  useEffect(() => {
    const fetchWallpaper = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          console.log("No token found");
          return;
        }
        const res = await fetch(`${BASE_URL}/v1/post/${id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        console.log("data.....",data);
        setWallpaper(data);
        setTimeRemaining(25 * 60); // 👈 set default timer if needed
      } catch (error) {
        console.error("Error fetching wallpaper:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWallpaper();
  }, [id]);

  useEffect(() => {
    if (!timeRemaining) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const downloadAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: downloadScale.value }],
  }));

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLike = () => {
    heartScale.value = withSequence(withSpring(1.3), withSpring(1));
    setWallpaper(prev => ({
      ...prev,
      isLiked: !prev.isLiked,
      likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
    }));
  };

  const handleDownload = () => {
          saveImage( wallpaper.mediaUrl);

    
    // downloadScale.value = withSequence(withSpring(1.3), withSpring(1));
    Alert.alert("Download Complete", "Wallpaper saved to your gallery!");
  };
async function saveImage(imageUrl) {
  if (!imageUrl) {
    console.error("No image URL provided");
    return;
  }
   const fileName = "wallpaper.png"; // can be jpg or png

  try {
        console.log("Image saved at:", imageUrl);

    const localPath = await WallpaperModule.downloadImageFromUrl(imageUrl, fileName);
    console.log("Image saved at:", localPath);
    // You can now use the path to display the image or set as wallpaper
  } catch (error) {
    console.error("Download failed:", error);
  }
}
  if (loading) {
    return <ActivityIndicator size="large" color="#8B5CF6" style={{ flex: 1 }} />;
  }

  if (!wallpaper) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Wallpaper not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.timerContainer}>
          <Clock size={16} color="white" />
          <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
        </View>

        <TouchableOpacity style={styles.reportButton} onPress={() => Alert.alert("Report", "Report this wallpaper?")}>
          <Flag size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Wallpaper Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: wallpaper.mediaUrl }} style={styles.wallpaperImage} />

          {/* Overlay Actions */}
          <View style={styles.imageOverlay}>
            <View style={styles.actionButtons}>
              <Animated.View style={heartAnimatedStyle}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                  {wallpaper.isLiked ? (
                    <Heart size={24} color="#EC4899" fill="#EC4899" />
                  ) : (
                    <HeartOff size={24} color="white" />
                  )}
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/comments/${wallpaper._id}`)}>
                <MessageCircle size={24} color="white" />
              </TouchableOpacity>

              <Animated.View style={downloadAnimatedStyle}>
                <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
                  <Download size={24} color="white" />
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Share", "Share this wallpaper!")}>
                <Share size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.messageText}>{wallpaper.title}</Text>

          <View style={styles.senderContainer}>
            <User size={20} color="#8B5CF6" />
            <Text style={styles.senderText}>By {wallpaper.user?.name || "Unknown"}</Text>
            <View style={styles.occasionBadge}>
              <Text style={styles.occasionText}>{wallpaper.category || "General"}</Text>
            </View>
          </View>

          <Text style={styles.descriptionText}>{wallpaper.content || "No description available"}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Heart size={16} color="#EC4899" />
              <Text style={styles.statText}>{wallpaper.likes || 0} likes</Text>
            </View>
            <View style={styles.statItem}>
              <MessageCircle size={16} color="#8B5CF6" />
              <Text style={styles.statText}>{wallpaper.comments?.length || 0} comments</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.statText}>{new Date(wallpaper.createdAt).toLocaleString()}</Text>
            </View>
          </View>
        </View>

      </ScrollView>
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.commentButton}
          onPress={() => router.push(`/comments/${wallpaper._id}`)}
        >
          <MessageCircle size={20} color="#8B5CF6" />
          <Text style={styles.commentButtonText}>View Comments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownload}
        >
          <Download size={20} color="white" />
          <Text style={styles.downloadButtonText}>Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  timerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  reportButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: height * 0.6,
  },
  wallpaperImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
    minHeight: height * 0.5,
  },
  messageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    lineHeight: 32,
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  senderText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  occasionBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  occasionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  bottomActions: {
   flexDirection: "row",
  justifyContent: "space-around",
  padding: 15,
  backgroundColor: "white",   // optional for clarity
  borderTopWidth: 1,          // optional subtle border
  borderColor: "#E5E7EB",
  },
  commentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDE9FE",
    padding: 10,
    borderRadius: 8,
  },
  commentButtonText: { marginLeft: 5, color: "#8B5CF6", fontWeight: "600" },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    padding: 10,
    borderRadius: 8,
  },
  downloadButtonText: { marginLeft: 5, color: "white", fontWeight: "600" },




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