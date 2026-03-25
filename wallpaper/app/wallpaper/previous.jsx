import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  Dimensions,
  Modal,
    ActivityIndicator,

} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Filter,
  Heart,
  MessageCircle,
  Download,
  X,
} from 'lucide-react-native';
import { Calendar as CalendarPicker } from 'react-native-calendars';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../utils/constants';

const { width } = Dimensions.get('window');



export default function PreviousScreen() {
  const [wallpapers, setWallpapers] = useState([]);
  const [filteredWallpapers, setFilteredWallpapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);
  
const getToken = async () => {
  const authToken = await AsyncStorage.getItem("authToken");
  if (authToken) return authToken;

  // fallback to anonymous token
  const anonymousToken = await AsyncStorage.getItem("anonymousToken");
  return anonymousToken || null;
};
 // Fetch API data
  useEffect(() => {
    fetchPreviousSlots();
  }, []);

const fetchPreviousSlots = async (pageNum = 1) => {
     if (!hasMore && pageNum !== 1) return; // stop if no more data
  if (pageNum === 1) setLoading(true);
  else setLoadingMore(true);

    try {
      const token = await getToken(); 
      if (!token) {
        console.log("No token found");
        return;
      }

            // Get current date and time
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`; // Format: HH:MM

    // Build query parameters
    const queryParams = new URLSearchParams({
      date: currentDate,
      time: currentTime
    });
        const response = await fetch(`${BASE_URL}/v1/slot/old?page=1&limit=10?${queryParams.toString()}`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
      const json = await response.json();
        console.log("Response.....",json.data);

      if (json.success) {
        const data = json.data.map((item) => ({
          id: item._id,
          image: item.postId?.mediaUrl || 'https://via.placeholder.com/150', // use mediaUrl

          message: item.postId?.content || '',
          sender: item.userId?.fullName || 'Unknown',
          occasion: item.postId?.title || 'General',
          date: item.date,
          likes: item.likes?.length || 0,
          comments: item.dislikes?.length || 0,
          expired: true,
        }));

       setWallpapers(prev => pageNum === 1 ? data : [...prev, ...data]);
      setFilteredWallpapers(prev => pageNum === 1 ? data : [...prev, ...data]);

      setPage(pageNum);
      setHasMore(pageNum < json.totalPages);
      }
    } catch (error) {
      console.log('API fetch error:', error);
    } finally {
      setLoading(false);
          setLoadingMore(false);

    }
  };

 // Calendar marking
  const getMarkedDates = () => {
    const marked = {};
    wallpapers.forEach((item) => {
      marked[item.date] = { marked: true, dotColor: '#8B5CF6' };
    });
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#8B5CF6',
        selectedTextColor: 'white',
      };
    }
    return marked;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

const filterByDate = (date) => {
    const filtered = wallpapers.filter((item) => item.date === date);
    setFilteredWallpapers(filtered);
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const clearFilter = () => {
    setSelectedDate('');
    setFilteredWallpapers(wallpapers);
  };

  const renderWallpaperItem = ({ item }) => (
    <TouchableOpacity style={styles.wallpaperCard}>
      <Image source={{ uri: item.image }} style={styles.wallpaperImage} />
      {item.expired && (
        <View style={styles.expiredOverlay}>
          <Text style={styles.expiredText}>EXPIRED</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.occasionBadge}>
            <Text style={styles.occasionText}>{item.occasion}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        </View>

        <Text style={styles.messageText} numberOfLines={2}>
          {item.message}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.senderText}>From {item.sender}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Heart size={16} color="#EF4444" />
              <Text style={styles.statText}>{item.likes}</Text>
            </View>
            <View style={styles.stat}>
              <MessageCircle size={16} color="#6B7280" />
              <Text style={styles.statText}>{item.comments}</Text>
            </View>
            <TouchableOpacity style={styles.downloadButton}>
              <Download size={16} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Previous Wallpapers</Text>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterOptions(true)}
        >
          <Filter size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {/* Date Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowCalendar(true)}
        >
          <Calendar size={20} color="#8B5CF6" />
          <Text style={styles.datePickerText}>
            {selectedDate ? formatDate(selectedDate) : 'Select Date'}
          </Text>
        </TouchableOpacity>

        {selectedDate && (
          <TouchableOpacity style={styles.clearButton} onPress={clearFilter}>
            <X size={16} color="#EF4444" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredWallpapers.length} wallpaper{filteredWallpapers.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Wallpapers List */}
     {loading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 40 }} />
      ) : (
          <FlatList
          data={filteredWallpapers}
          renderItem={renderWallpaperItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.row}
          onEndReached={() => {
            if (!loadingMore && hasMore) fetchPreviousSlots(page + 1);
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color="#8B5CF6" style={{ marginVertical: 16 }} /> : null
          }
        />
      )}

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarContainer}>
              <CalendarPicker
                onDayPress={(day) => {
                  filterByDate(day.dateString);
                }}
                markedDates={getMarkedDates()}
                theme={{
                  backgroundColor: '#ffffff',
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#b6c1cd',
                  selectedDayBackgroundColor: '#8B5CF6',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#8B5CF6',
                  dayTextColor: '#2d4150',
                  textDisabledColor: '#d9e1e8',
                  dotColor: '#8B5CF6',
                  selectedDotColor: '#ffffff',
                  arrowColor: '#8B5CF6',
                  disabledArrowColor: '#d9e1e8',
                  monthTextColor: '#2d4150',
                  indicatorColor: '#8B5CF6',
                  textDayFontFamily: 'System',
                  textMonthFontFamily: 'System',
                  textDayHeaderFontFamily: 'System',
                  textDayFontWeight: '500',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '500',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14
                }}
                enableSwipeMonths={true}
                maxDate={'2025-01-26'}
                minDate={'2024-01-01'}
              />
            </View>

            <View style={styles.calendarActions}>
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={() => {
                  setSelectedDate('');
                  setFilteredWallpapers(wallpapers);
                  setShowCalendar(false);
                }}
              >
                <Text style={styles.clearAllText}>Show All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Options Modal */}
      <Modal
        visible={showFilterOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Options</Text>
              <TouchableOpacity onPress={() => setShowFilterOptions(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptions}>
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Most Liked</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Most Commented</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Recent First</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Oldest First</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filterButton: {
    padding: 8,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flex: 1,
  },
  datePickerText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  clearText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  wallpaperCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  wallpaperImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  expiredOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  expiredText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  occasionBadge: {
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  occasionText: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  messageText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 18,
  },
  cardFooter: {
    gap: 8,
  },
  senderText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  downloadButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '85%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calendarContainer: {
    padding: 20,
  },
  calendarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  clearAllButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  selectedDateText: {
    color: '#8B5CF6',
    fontWeight: 'bold',
  },
  filterOptions: {
    padding: 20,
  },
  filterOption: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
});