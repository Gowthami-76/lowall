import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Share,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import {
  Settings,
  Bell,
  Calendar,
  Image as ImageIcon,
  Clock,
  Heart,
  Star,
  MessageCircle,
  CircleCheck as CheckCircle,
  Circle as XCircle,
  CircleAlert as AlertCircle,
  Share2,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from '../../utils/constants';
import { useFocusEffect } from "@react-navigation/native";

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('wallpapers');
  const [userWallpapers, setUserWallpapers] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsPage, setSlotsPage] = useState(1);
  const [hasMoreSlots, setHasMoreSlots] = useState(true);

  // Add new state for user profile data
  const [userData, setUserData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // Add new state for user stats data
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const id = await AsyncStorage.getItem("userId");

        if (token && id) {
          setIsLoggedIn(true);
          setUserId(id);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("Error checking login:", err);
      }
    };

    checkLoginStatus();
  }, []);

  // New function to fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoadingProfile(true);
      setProfileError(null);
      
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
        console.log("Profile data fetched:", json.data);
      } else {
        setProfileError("Failed to fetch profile data");
        console.error("Profile API error:", json);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfileError("Network error while fetching profile");
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  // New function to fetch user stats
  const fetchUserStats = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoadingStats(true);
      setStatsError(null);
      
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.log("No token found for stats fetch");
        return;
      }

      const response = await fetch(`${BASE_URL}/v1/users/stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();
      
      if (json.success && json.data) {
        setUserStats(json.data);
        console.log("User stats fetched:", json.data);
      } else {
        setStatsError("Failed to fetch user stats");
        console.error("Stats API error:", json);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
      setStatsError("Network error while fetching stats");
    } finally {
      setLoadingStats(false);
    }
  }, [userId]);

  // Combined function to fetch both profile and stats
  const fetchUserData = useCallback(async () => {
    if (!userId) return;
    
    // Fetch both profile and stats concurrently
    await Promise.all([
      fetchUserProfile(),
      fetchUserStats()
    ]);
  }, [userId, fetchUserProfile, fetchUserStats]);

  // Fetch profile and stats when user is logged in and userId is available
  useEffect(() => {
    if (isLoggedIn && userId) {
      fetchUserData();
    }
  }, [isLoggedIn, userId, fetchUserData]);

  // Refresh API when Profile tab is focused
  useFocusEffect(
    useCallback(() => {
      console.log("Profile screen focused, refreshing:", activeTab);

      if (activeTab === "wallpapers") {
        fetchWallpapers(1, true);
      } else if (activeTab === "slots") {
        fetchSlots(1, true);
      }
      
      // Also refresh profile data and stats
      if (isLoggedIn && userId) {
        fetchUserData();
      }
    }, [activeTab, userId, isLoggedIn, fetchUserData])
  );

  const fetchWallpapers = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      console.log("fetch wall paper");
      if (loading) return;
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("authToken");
        const id = await AsyncStorage.getItem("userId");

        if (!token) {
          console.log("No token found");
          return;
        }

        console.log("fetch wall paper 111", userId);

        const res = await fetch(`${BASE_URL}/v1/post?page=${pageNum}&limit=${limit}&createdBy=${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const json = await res.json();

        console.log("response", json.data);
        if (isRefresh) {
          setUserWallpapers(json.data);
        } else {
          setUserWallpapers((prev) => [...prev, ...json.data]);
        }

        setHasMore(json.data.length > 0);
      } catch (e) {
        console.error("Error fetching wallpapers", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loading, limit]
  );

  const handleRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);

    // Refresh profile data and stats along with tab content
    fetchUserData();

    if (activeTab === "wallpapers") {
      setPage(1);
      await fetchWallpapers(1, true);
    } else if (activeTab === "slots") {
      console.log("refresh");
      await fetchSlots(1, true);
    }
  };

  const loadMore = () => {
    if (activeTab === 'wallpapers' && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchWallpapers(nextPage);
    } else if (activeTab === 'slots' && !loadingSlots && hasMoreSlots) {
      console.log("loadmore");
      const nextPage = slotsPage + 1;
      setSlotsPage(nextPage);
      fetchSlots(nextPage, true);
    }
  };

  const fetchSlots = async (page = 1, isRefresh = false) => {
    if (!userId) return;
    if (loadingSlots) return;
    try {
      setLoadingSlots(true);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.log("No token found");
        return;
      }

      const res = await fetch(
        `${BASE_URL}/v1/slot/${userId}?page=${page}&limit=10`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const json = await res.json();
      console.log("Slots API Response:", res.url);
      console.log("Slots API Response:", json);

      const slotData = Array.isArray(json.slots) ? json.slots : [];

      if (slotData.length > 0) {
        if (isRefresh) {
          setSlots(slotData);
          setSlotsPage(1);
        } else {
          setSlots((prev) => [...prev, ...slotData]);
          setSlotsPage(page);
        }
        setHasMoreSlots(true);
      } else {
        setHasMoreSlots(false);
      }

      setHasMoreSlots(slotData.length > 0);
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoadingSlots(false);
      setRefreshing(false);
    }
  };

  const handleRefreshSlots = () => {
    setRefreshing(true);
    fetchSlots(1, true);
  };

  const loadMoreSlots = () => {
    if (!loadingSlots && hasMoreSlots) {
      fetchSlots(slotsPage + 1);
    }
  };

  // Initial load
  useEffect(() => {
    if (!isLoggedIn) return;

    console.log("activetab", activeTab);
    if (activeTab === "wallpapers" && userWallpapers.length === 0) {
      fetchWallpapers(1, true);
    } else if (activeTab === "slots" && slots.length === 0) {
      fetchSlots(1, true);
    }
  }, [isLoggedIn, activeTab]);

  // Simple login function for demo
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("userId");
    setIsLoggedIn(false);
    setUserData(null); // Clear profile data
    setUserStats(null); // Clear stats data
    setActiveTab('wallpapers');
  };

  // Share app function
  const handleShareApp = async () => {
    try {
      const result = await Share.share({
        message: 'Check out Lowall - The best app for beautiful wallpapers and custom messages! Download it now and make your phone screen amazing! 🎨✨',
        title: 'Share Lowall App',
        url: 'https://lowall.app',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared via:', result.activityType);
        } else {
          console.log('App shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share the app. Please try again.');
      console.error('Share error:', error);
    }
  };

  // Helper function to get user's join date
  const getJoinDate = (createdAt) => {
    if (!createdAt) return 'Recently';
    const date = new Date(createdAt);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Helper function to get display name
  const getDisplayName = (userData) => {
    if (!userData) return 'Loading...';
    return userData.fullName || userData.firstName + ' ' + userData.lastName || 'User';
  };

  const StatCard = ({ icon: Icon, title, value, color = '#8B5CF6' }) => {
    const scaleValue = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));
    const onPress = () => {
      scaleValue.value = withSpring(0.95, {}, () => {
        scaleValue.value = withSpring(1);
      });
    };
    return (
      <Animated.View style={[styles.statCard, animatedStyle]}>
        <TouchableOpacity onPress={onPress}>
          <Icon size={24} color={color} />
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return {
          icon: <CheckCircle size={14} color="#10B981" />,
          text: "Approved",
          bg: "#D1FAE5",
          color: "#065F46"
        };
      case "pending":
        return {
          icon: <AlertCircle size={14} color="#F59E0B" />,
          text: "Pending",
          bg: "#FEF3C7",
          color: "#92400E"
        };
      case "rejected":
        return {
          icon: <XCircle size={14} color="#EF4444" />,
          text: "Rejected",
          bg: "#FEE2E2",
          color: "#991B1B"
        };
      default:
        return {
          icon: null,
          text: "Unknown",
          bg: "#E5E7EB",
          color: "#374151"
        };
    }
  };

  const WallpaperItem = ({ wallpaper }) => {
    const status = getStatusBadge(wallpaper.approveStatus);
    const formatDateTime = (isoString) => {
      const d = new Date(isoString);

      const date = d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const time = d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      return `${date} ${time}`;
    };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/wallpaper/${wallpaper._id}`)}
      >
        <Image
          source={{ uri: wallpaper.mediaUrl || "https://via.placeholder.com/100" }}
          style={styles.wallpaperImage}
        />

        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={1}>{wallpaper.title}</Text>

          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            {status.icon}
            <Text style={[styles.badgeText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>

          <View style={styles.row}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.text}>
              {formatDateTime(wallpaper.createdAt)}
            </Text>
          </View>

          <View style={styles.row}>
            <Heart size={16} color="#EF4444" />
            <Text style={styles.count}>{wallpaper.likes || 0} Likes</Text>
            <MessageCircle size={16} color="#3B82F6" style={{ marginLeft: 10 }} />
            <Text style={styles.count}>{wallpaper.comments || 0} Comments</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const PremiumSlotItem = ({ slot }) => {
    const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
    const isFutureSlot = slotDateTime > new Date();
    const isResellDisabled = slot.saleStatus === 'available';

    return (
      <View style={styles.slotItem}>
        <View style={styles.slotInfo}>
          <Text style={styles.slotDate}>{slot.date}</Text>
          <Text style={styles.slotTime}>{slot.startTime} - {slot.endTime}</Text>
          <Text style={styles.slotCategory}>{slot.isPremium ? 'Premium' : 'Standard'}</Text>
          <Text style={{ fontSize: 12, color: slot.isBooked ? 'red' : 'green' }}>
            {slot.isBooked ? 'Booked' : 'Available'}
          </Text>
        </View>
        <View style={styles.slotPrice}>
          <Text style={styles.priceText}>{slot.price || 0}</Text>
          {isFutureSlot && (
            <TouchableOpacity
              style={[styles.resellButton,
              isResellDisabled && { backgroundColor: '#F9FAFB' }
              ]}
              disabled={isResellDisabled}
              onPress={() =>
                router.push({
                  pathname: `/resell/[slot]`,
                  params: { slot: encodeURIComponent(JSON.stringify(slot)) },
                })
              }
            >
              <Text style={[
                styles.resellButtonText,
                isResellDisabled
                  ? { color: '#9CA3AF' }
                  : { color: '#ffffff' }
              ]}>Resell</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {isLoggedIn ? (
          <>
            <View style={styles.headerContent}>
              {loadingProfile ? (
                <View style={styles.profileImagePlaceholder}>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                </View>
              ) : (
                <Image 
                  source={{ 
                    uri: userData?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200' 
                  }} 
                  style={styles.profileImage} 
                  onError={(e) => {
                    console.log('Profile image load error:', e.nativeEvent.error);
                  }}
                />
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {getDisplayName(userData)}
                </Text>
                <Text style={styles.userEmail}>
                  {userData?.email || 'Loading...'}
                </Text>
                <Text style={styles.joinDate}>
                  Member since {getJoinDate(userData?.createdAt)}
                </Text>
                {userData?.location && (
                  <Text style={styles.userLocation}>📍 {userData.location}</Text>
                )}
              </View>
            </View>
            {(profileError || statsError) && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {profileError || statsError}
                </Text>
                <TouchableOpacity onPress={fetchUserData} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton} onPress={handleShareApp}>
                <Share2 size={24} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/notifications')}>
                <Bell size={24} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/settings')}>
                <Settings size={24} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View>
            <TouchableOpacity style={styles.loginCard} onPress={() => router.push('/auth/login')}>
              <Text style={styles.welcomeText}>Welcome to lowall</Text>
              <Text style={styles.subText}>Login to manage your wallpapers, profile and membership</Text>
              <View style={styles.loginButton}>
                <Text style={styles.loginButtonText}>Login / Register</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareAppButton} onPress={handleShareApp}>
              <Share2 size={20} color="#8B5CF6" />
              <Text style={styles.shareAppButtonText}>Share Lowall with Friends</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isLoggedIn && (
        <>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <StatCard 
              icon={ImageIcon} 
              title="Uploaded" 
              value={userStats?.posts || 0} 
              color="#8B5CF6" 
            />
            <StatCard 
              icon={CheckCircle} 
              title="Approved" 
              value={userStats?.approvedPosts || 0} 
              color="#10B981" 
            />
            <StatCard 
              icon={Star} 
              title="Premium" 
              value={userStats?.premiumSlots || 0} 
              color="#F59E0B" 
            />
            <StatCard 
              icon={Clock} 
              title="Likes" 
              value={userStats?.likes || 0} 
              color="#EC4899" 
            />
            {(loadingStats) && (
              <View style={styles.statsLoadingOverlay}>
                <ActivityIndicator size="small" color="#8B5CF6" />
              </View>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'wallpapers' && styles.activeTab]}
              onPress={() => setActiveTab('wallpapers')}
            >
              <Text style={[styles.tabText, activeTab === 'wallpapers' && styles.activeTabText]}>
                My Wallpapers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'slots' && styles.activeTab]}
              onPress={() => setActiveTab('slots')}
            >
              <Text style={[styles.tabText, activeTab === 'slots' && styles.activeTabText]}>
                Slots
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onMomentumScrollEnd={loadMore}
      >
        {!isLoggedIn && (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>Please login to access your profile</Text>
            <Text style={styles.loginPromptSubText}>
              View your wallpapers, manage premium slots, and track your stats
            </Text>
          </View>
        )}

        {isLoggedIn && activeTab === "wallpapers" && (
          <View style={styles.wallpapersList}>
            {userWallpapers.map((wallpaper) => (
              <WallpaperItem key={wallpaper._id} wallpaper={wallpaper} />
            ))}

            {loading && <ActivityIndicator style={{ margin: 20 }} />}
            {!hasMore && <Text style={styles.endText}>No more wallpapers</Text>}
          </View>
        )}

        {isLoggedIn && activeTab === 'slots' && (
          <View style={styles.slotsList}>
            <TouchableOpacity
              style={styles.bookSlotButton}
              onPress={() => router.push('/premium-booking')}
            >
              <Calendar size={20} color="white" />
              <Text style={styles.bookSlotButtonText}>Book New Premium Slot</Text>
            </TouchableOpacity>
            {slots.length === 0 && !loadingSlots ? (
              <Text style={{ textAlign: 'center', marginTop: 20 }}>No slots found</Text>
            ) : (
              <>
                {slots.map((slot) => (
                  <PremiumSlotItem key={slot._id} slot={slot} />
                ))}
                {loadingSlots && <ActivityIndicator style={{ marginVertical: 20 }} />}
                {!loadingSlots && !hasMoreSlots && slots.length > 0 && (
                  <Text style={styles.endText}>No more slots</Text>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  profileImage: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  profileImagePlaceholder: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    marginRight: 16, 
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  userEmail: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  joinDate: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  userLocation: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  headerButton: { padding: 8 },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  logoutButtonText: { color: 'white', fontSize: 12, fontWeight: '500' },
  loginCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  subText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  loginButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loginButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  shareAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  shareAppButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  loginPrompt: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginPromptText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginPromptSubText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
    backgroundColor: 'white',
    position: 'relative',
  },
  statsLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginTop: 8 },
  statTitle: { fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: '#8B5CF6' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  activeTabText: { color: '#8B5CF6', fontWeight: '600' },
  content: { flex: 1 },
  wallpapersList: { padding: 16 },
  wallpaperItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  wallpaperThumbnail: { width: 80, height: 80, borderRadius: 8, marginRight: 16 },
  wallpaperInfo: { flex: 1 },
  wallpaperMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  wallpaperStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusText: { fontSize: 12, fontWeight: '500' },
  scheduledTime: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  wallpaperStats: { flexDirection: 'row', gap: 16 },
  statText: { fontSize: 12, color: '#6B7280' },
  slotsList: { padding: 16 },
  bookSlotButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  bookSlotButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  slotItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  slotInfo: { flex: 1 },
  slotDate: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  slotTime: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  slotCategory: { fontSize: 12, color: '#8B5CF6', fontWeight: '500', marginTop: 4 },
  slotPrice: { alignItems: 'flex-end' },
  priceText: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  resellButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resellButtonText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  wallpaperImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  text: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  count: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  endText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 20,
    fontSize: 14,
  },
});