import { useState ,useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { 
  Clock, 
  DollarSign, 
  MessageSquare, 
  Calendar,
  Star,
  TrendingUp
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { BASE_URL } from '../../utils/constants';
import AsyncStorage from "@react-native-async-storage/async-storage";



const categories = ['All', 'Prime Morning', 'Evening Peak', 'New Year Special', 'Afternoon'];

export default function MarketplaceScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  // const [filteredSlots, setFilteredSlots] = useState(premiumSlots);

  const [marketplaceSlots, setMarketplaceSlots] = useState([]);
const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
const [loadingMore, setLoadingMore] = useState(false);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    
  };



 const requestSlotAndFetchMessages = async (slot) => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      Alert.alert("Error", "No token found. Please login again.");
      return null;
    }
    console.log("Slot Request slotid:", slot._id);

    // 1️⃣ Slot Request API
   const reqRes = await fetch(
  `${BASE_URL}/v1/slot-request/${slot._id}/request`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post: String(slot.postId?._id),     // REQUIRED String
      message: "Requesting slot",         // or "" if nothing
    }),
  }
);

    const reqData = await reqRes.json();
    console.log("Slot Request Response:", reqData);

    if (!reqRes.ok || !reqData.success) {
      Alert.alert("Failed", reqData?.message || "Slot request failed");
      return null;
    }

    const slotRequestId = reqData?.slotRequest?._id;
    if (!slotRequestId) {
      Alert.alert("Error", "Slot request ID not returned");
      return null;
    }

    // 2️⃣ Slot Message API
    const msgRes = await fetch(
      `${BASE_URL}/v1/slot-message/${slotRequestId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const msgData = await msgRes.json();
    console.log("Slot Message Response:", msgData);

    if (!msgRes.ok) {
      Alert.alert("Failed", msgData?.message || "Unable to fetch messages");
      return null;
    }

    // Return slotRequestId for navigation
    return slotRequestId;

  } catch (err) {
    console.error("Slot Request Error:", err);
    Alert.alert("Error", "Something went wrong");
    return null;
  }
};
    const fetchMarketplaceSlots = async (pageNum = 1) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token){
           Alert.alert('Error', 'No token found. Please login again.');
      setMarketplaceSlots([]);    // <-- clear list
      return;
      } 

      const res = await fetch(`${BASE_URL}/v1/slot/marketplace?page=${pageNum}&limit=10`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      console.log("market place response",pageNum ,data);

      const data = await res.json();
      if (res.ok) {
       setMarketplaceSlots(prev =>
          pageNum === 1 ? data?.data : [...prev, ...data?.data]
        );
        setHasMore(data?.data?.length >= 10);
      } else {
        Alert.alert('Failed', data?.message || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Unable to fetch  slots');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketplaceSlots(1);
  }, []);

   const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchMarketplaceSlots(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMarketplaceSlots(nextPage);
    }
  };
     // Filter based on category
  const filteredData =
    selectedCategory === 'All'
      ? marketplaceSlots
      : marketplaceSlots.filter(slot => slot.postId?.title === selectedCategory);

  // Slot Card component
  const SlotCard = ({ slot }) => {
    const scaleValue = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scaleValue.value }] }));

    const onPressIn = () => { scaleValue.value = withSpring(0.98); };
    const onPressOut = () => { scaleValue.value = withSpring(1); };

    // const handleChatPress = () => router.push(`/comments/691e99ecc0a0e5082be8d348`);
    const handleChatPress = async (slot) => {
  setLoading(true);

  const slotRequestId = await requestSlotAndFetchMessages(slot);

  setLoading(false);

  if (slotRequestId) {
    router.push(`/comments/${slotRequestId}`);
  }
};
    const handleAcceptOffer = () => router.push(`/purchase/${slot._id}`);

    return (
      <Animated.View style={[styles.slotCard, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => router.push(`/slot-details/${slot._id}`)}
        >
          {/* Premium Badge */}
          {slot.salePrice && (
            <View style={styles.premiumBadge}>
              <Star size={12} color="white" fill="white" />
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          )}

          {/* Seller Info */}
          <View style={styles.sellerContainer}>
            <Image
      source={{ uri: slot.postId?.mediaUrl || 'https://via.placeholder.com/150' }} 
              style={styles.sellerImage}
            />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{slot.userId?.fullName || 'Unknown'}</Text>
              <Text style={styles.categoryText}>{slot.postId?.title || ''}</Text>
            </View>
          </View>

          {/* Time Slot Info */}
          <View style={styles.timeContainer}>
            <View style={styles.timeRow}>
              <Clock size={16} color="#8B5CF6" />
              <Text style={styles.timeSlotText}>{slot.startTime} - {slot.endTime}</Text>
            </View>
            <View style={styles.timeRow}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.dateText}>{slot.date}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.descriptionText}>{slot.saleDescription}</Text>

          {/* Pricing */}
          {slot.salePrice && (
            <View style={styles.pricingContainer}>
              <Text style={styles.askingPrice}>{slot.salePrice}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {/* <TouchableOpacity style={styles.chatButton} onPress={handleChatPress(slot._id)}> */}
            <TouchableOpacity
  style={styles.chatButton}
  onPress={() => handleChatPress(slot)}
>
              <MessageSquare size={16} color="#8B5CF6" />
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>

            {slot.salePrice && (
              <TouchableOpacity style={styles.buyButton} onPress={handleAcceptOffer}>
                {/* <DollarSign size={16} color="white" /> */}
                <Text style={styles.buyButtonText}>Buy Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  

  if (loading && page === 1) return <ActivityIndicator size="large" color="#8B5CF6" style={{ flex: 1 }} />;


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Slot Marketplace</Text>
        <Text style={styles.headerSubtitle}>Buy premium time slots from other users</Text>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipSelected
            ]}
            onPress={() => handleCategoryFilter(category)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category && styles.categoryChipTextSelected
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

       {/* Marketplace List */}
    <ScrollView
  style={styles.marketplaceList}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={styles.marketplaceContent}
  onScroll={({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    if (
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 100 &&
      !loadingMore &&
      hasMore
    ) {
      setLoadingMore(true);
      const nextPage = page + 1;
      fetchMarketplaceSlots(nextPage).then(() => {
        setPage(nextPage);
        setLoadingMore(false);
      });
    }
  }}
  scrollEventThrottle={16} // ensures smooth scroll detection
>
  {filteredData.map(slot => (
    <SlotCard key={slot._id} slot={slot} />
  ))}

  {loadingMore && (
    <ActivityIndicator size="small" color="#8B5CF6" style={{ marginVertical: 16 }} />
  )}
</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadMoreButton: {
  paddingVertical: 12,
  paddingHorizontal: 16,
  backgroundColor: '#8B5CF6',
  borderRadius: 12,
  alignItems: 'center',
  marginVertical: 16,
},
loadMoreText: {
  color: 'white',
  fontWeight: '600',
  fontSize: 14,
},
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryScroll: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#8B5CF6',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryChipTextSelected: {
    color: 'white',
  },
  marketplaceList: {
    flex: 1,
  },
  marketplaceContent: {
    padding: 16,
  },
  slotCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 1,
  },
  premiumBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sellerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  timeContainer: {
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  pricingContainer: {
    marginBottom: 16,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  askingPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  buyButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});