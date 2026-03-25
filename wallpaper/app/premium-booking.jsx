import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Star,
  Users,
  TrendingUp
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../utils/constants';

import moment from "moment";

export default function PremiumBookingScreen() {
  const [categories] = useState(["Premium", "Standard", "VIP"]);
  const [selectedCategory, setSelectedCategory] = useState("Premium");

  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [dates, setDates] = useState([]);   // 🔹 store generated dates
  const [dateRange, setDateRange] = useState({ start: 0, end: 10 });

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Generate next 7 days
  const generateNextDays = (start = 0, end = 7) => {
    return Array.from({ length: end - start }, (_, i) => {
      const date = moment().add(start + i, "days");
      return {
        key: date.format("YYYY-MM-DD"),
        label: date.format("MMM D"),
        day: date.format("ddd"),
      };
    });
  };
  useEffect(() => {
    const nextDays = generateNextDays(dateRange.start, dateRange.end); // next 10 days
    setDates(nextDays);
  }, []);
  // 🔹 Load more dates on scroll
  const loadMoreDates = () => {
    const newEnd = dateRange.end + 7;
    const moreDates = generateNextDays(dateRange.end, newEnd);
    setDates((prev) => [...prev, ...moreDates]);
    setDateRange({ start: dateRange.start, end: newEnd });
  };

  const getToken = async () => {
    const authToken = await AsyncStorage.getItem("authToken");
    if (authToken) return authToken;

    // fallback to anonymous token
    const anonymousToken = await AsyncStorage.getItem("anonymousToken");
    return anonymousToken || null;
  };

  // 🔹 Fetch slots from API
  const fetchSlots = async (date) => {
    try {
      setLoading(true);

      const token = await getToken();
      if (!token) {
        console.log("No token found");
        return;
      }

      const res = await fetch(`${BASE_URL}/v1/slot?date=${date}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      console.log("response from premium slots",data);
      if (data.success && Array.isArray(data.slots)) {
        const premiumOnly = data.slots
          .filter((s) => s.isPremium)
          .map((s, idx) => ({
            id: idx + 1,
            time: `${s.startTime} - ${s.endTime}`,
            price: 100, // 👈 add logic if price comes from backend
            category: 'Premium',
            popularity: 'High', // 👈 adjust if backend has this
            available: !s.isBooked,
          }));
        setSlots(premiumOnly);
      } else {
        setSlots([]);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };
  // 🔹 Refetch slots whenever selectedDate changes
  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

  // 🔹 Handle category (just toggles UI for now)
  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
  };

  const getPopularityColor = (popularity) => {
    switch (popularity) {
      case 'Medium': return '#10B981';
      case 'High': return '#F59E0B';
      case 'Very High': return '#EF4444';
      case 'Extreme': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getPopularityIcon = (popularity) => {
    switch (popularity) {
      case 'Medium': return <Users size={12} color="#10B981" />;
      case 'High': return <TrendingUp size={12} color="#F59E0B" />;
      case 'Very High': return <Star size={12} color="#EF4444" />;
      case 'Extreme': return <Star size={12} color="#8B5CF6" fill="#8B5CF6" />;
      default: return <Users size={12} color="#6B7280" />;
    }
  };

  const SlotCard = ({ slot }) => {
    const scaleValue = useSharedValue(1);
    const isSelected = selectedSlot?.id === slot.id;

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));

    const onPressIn = () => {
      scaleValue.value = withSpring(0.98);
    };

    const onPressOut = () => {
      scaleValue.value = withSpring(1);
    };

    const handlePress = () => {
      if (slot.available) {
        setSelectedSlot(slot);
      }
    };

    return (
      <Animated.View style={[styles.slotCard, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={slot.available ? 0.7 : 1}
          onPressIn={slot.available ? onPressIn : undefined}
          onPressOut={slot.available ? onPressOut : undefined}
          onPress={handlePress}
          style={[
            styles.slotContent,
            !slot.available && styles.unavailableSlot,
            isSelected && styles.selectedSlot,
          ]}
        >
          <View style={styles.slotHeader}>
            <View style={styles.timeContainer}>
              <Clock size={16} color={!slot.available ? '#9CA3AF' : '#1F2937'} />
              <Text style={[
                styles.timeText,
                !slot.available && styles.unavailableText
              ]}>
                {slot.time}
              </Text>
            </View>

            <View style={styles.popularityContainer}>
              {getPopularityIcon(slot.popularity)}
              <Text style={[
                styles.popularityText,
                { color: getPopularityColor(slot.popularity) }
              ]}>
                {slot.popularity}
              </Text>
            </View>
          </View>

          <Text style={[
            styles.categoryText,
            !slot.available && styles.unavailableText
          ]}>
            {slot.category}
          </Text>

          <View style={styles.slotFooter}>
            <View style={styles.priceContainer}>
              {/* <DollarSign size={18} color={!slot.available ? '#9CA3AF' : '#1F2937'} /> */}
              <Text style={[
                styles.priceText,
                !slot.available && styles.unavailableText
              ]}>
                {slot.price}
              </Text>
            </View>

            {!slot.available && (
              <Text style={styles.soldOutText}>SOLD OUT</Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleBookSlot = () => {
    if (selectedSlot) {
      router.push(`/payment/${selectedSlot.id}?date=${selectedDate}`);
    }
  };

  // const availableDates = Object.keys(premiumSlots);
  // const currentSlots = premiumSlots[selectedDate] || [];
   const renderDateItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.dateCard, selectedDate === item.key && styles.selectedDateCard]}
      onPress={() => setSelectedDate(item.key)}
    >
      <Text style={[styles.dateText, selectedDate === item.key && styles.selectedDateText]}>
        {item.day} {item.label}
      </Text>
    </TouchableOpacity>
  );
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Premium Slots</Text>

        <View style={styles.headerSpacer} />

      </View>

      <ScrollView>
        {/* ✅ Date Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Date</Text>
          <FlatList
            data={dates}
            renderItem={renderDateItem}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            onEndReached={loadMoreDates}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.dateScrollContent}
          />
        </View>

        {/* ✅ Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Time Slots</Text>
          <Text style={styles.sectionSubtitle}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          {loading ? (
            <ActivityIndicator size="large" color="#8B5CF6" />
          ) : slots.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#6B7280' }}>
              No premium slots available
            </Text>
          ) : (
            <View style={styles.slotsGrid}>
              {slots.map(slot => <SlotCard key={slot.id} slot={slot} />)}
            </View>
          )}
        </View>
      </ScrollView>
      {/* Selection Summary */}
      {selectedSlot && (
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>
                {new Date(selectedDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>{selectedSlot.time}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Category:</Text>
              <Text style={styles.summaryValue}>{selectedSlot.category}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price:</Text>
              <Text style={styles.summaryPrice}>{selectedSlot.price}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookSlot}
          >
            <Text style={styles.bookButtonText}>
              Book for {selectedSlot.price}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </View >
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 12,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  dateScroll: {
    paddingBottom: 20,
  },
  dateScrollContent: {
    paddingHorizontal: 20,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    gap: 8,
  },
  selectedDateCard: {
    backgroundColor: '#8B5CF6',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedDateText: {
    color: 'white',
  },
  slotsGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  slotCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  slotContent: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  unavailableSlot: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  selectedSlot: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  popularityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  unavailableText: {
    color: '#9CA3AF',
  },
  slotFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  soldOutText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  summarySection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  summaryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  bookButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});