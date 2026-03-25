import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Search as SearchIcon, 
  Filter,
  Heart,
  MessageCircle,
  Download,
  Clock,
  X
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// Mock search data
const searchResults = [
  {
    id: 1,
    image: 'https://images.pexels.com/photos/1308881/pexels-photo-1308881.jpeg?auto=compress&cs=tinysrgb&w=400',
    message: 'Good morning! Make today amazing! ✨',
    sender: 'Sarah Johnson',
    occasion: 'Motivation',
    category: 'motivation',
    timestamp: '5 mins ago',
    likes: 42,
    comments: 8,
    timeRemaining: 25 * 60,
  },
  {
    id: 2,
    image: 'https://images.pexels.com/photos/1323712/pexels-photo-1323712.jpeg?auto=compress&cs=tinysrgb&w=400',
    message: 'Happy Birthday! Hope your day is filled with joy! 🎉',
    sender: 'Mike Chen',
    occasion: 'Birthday',
    category: 'birthday',
    timestamp: '12 mins ago',
    likes: 78,
    comments: 15,
    timeRemaining: 18 * 60,
  },
  {
    id: 3,
    image: 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=400',
    message: 'Love you to the moon and back! 💕',
    sender: 'Emma Wilson',
    occasion: 'Love',
    category: 'love',
    timestamp: '1 hour ago',
    likes: 156,
    comments: 23,
    timeRemaining: 2 * 60,
  },
];

const categories = ['All', 'Motivation', 'Birthday', 'Love', 'Friendship', 'Success'];
const recentSearches = ['motivation', 'birthday wishes', 'love quotes', 'good morning'];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredResults, setFilteredResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [recentSearchesList, setRecentSearchesList] = useState(recentSearches);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = searchResults.filter(item => 
        item.message.toLowerCase().includes(query.toLowerCase()) ||
        item.sender.toLowerCase().includes(query.toLowerCase()) ||
        item.occasion.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredResults(filtered);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    if (category === 'All') {
      setFilteredResults(searchResults);
    } else {
      setFilteredResults(searchResults.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      ));
    }
    setShowResults(true);
  };

  const addToRecentSearches = (query) => {
    if (query.trim() && !recentSearchesList.includes(query)) {
      setRecentSearchesList(prev => [query, ...prev.slice(0, 9)]);
    }
  };

  const removeRecentSearch = (searchToRemove) => {
    setRecentSearchesList(prev => prev.filter(search => search !== searchToRemove));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const WallpaperCard = ({ wallpaper }) => {
    const scaleValue = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));

    const onPressIn = () => {
      scaleValue.value = withSpring(0.98);
    };

    const onPressOut = () => {
      scaleValue.value = withSpring(1);
    };

    return (
      <Animated.View style={[styles.wallpaperCard, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => router.push(`/wallpaper/${wallpaper.id}`)}
        >
          <View style={styles.imageContainer}>
            <Image source={{ uri: wallpaper.image }} style={styles.wallpaperImage} />
            <View style={styles.timerBadge}>
              <Clock size={12} color="white" />
              <Text style={styles.timerText}>
                {formatTime(wallpaper.timeRemaining)}
              </Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{wallpaper.occasion}</Text>
            </View>
          </View>
          
          <View style={styles.contentContainer}>
            <Text style={styles.messageText}>{wallpaper.message}</Text>
            
            <View style={styles.metadataContainer}>
              <Text style={styles.senderText}>From {wallpaper.sender}</Text>
              <Text style={styles.timestampText}>{wallpaper.timestamp}</Text>
            </View>
            
            <View style={styles.actionsContainer}>
              <View style={styles.actionButton}>
                <Heart size={16} color="#EC4899" />
                <Text style={styles.actionText}>{wallpaper.likes}</Text>
              </View>
              
              <View style={styles.actionButton}>
                <MessageCircle size={16} color="#6B7280" />
                <Text style={styles.actionText}>{wallpaper.comments}</Text>
              </View>
              
              <View style={styles.actionButton}>
                <Download size={16} color="#6B7280" />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
        
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search wallpapers, messages, users..."
            value={searchQuery}
            onChangeText={handleSearch}
            onSubmitEditing={() => addToRecentSearches(searchQuery)}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setShowResults(false);
              }}
            >
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#6B7280" />
        </TouchableOpacity>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!showResults ? (
          /* Recent Searches */
          <View style={styles.recentSearchesContainer}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            {recentSearchesList.map((search, index) => (
              <View key={index} style={styles.recentSearchItem}>
                <TouchableOpacity 
                  style={styles.recentSearchButton}
                  onPress={() => handleSearch(search)}
                >
                  <SearchIcon size={16} color="#9CA3AF" />
                  <Text style={styles.recentSearchText}>{search}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => removeRecentSearch(search)}
                  style={styles.removeSearchButton}
                >
                  <X size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}
            
            {recentSearchesList.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No recent searches</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start searching to see your recent searches here
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Search Results */
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              {filteredResults.length} results for "{searchQuery}"
            </Text>
            
            {filteredResults.map(wallpaper => (
              <WallpaperCard key={wallpaper.id} wallpaper={wallpaper} />
            ))}
            
            {filteredResults.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No results found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try adjusting your search terms or filters
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    padding: 8,
  },
  categoryScroll: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  content: {
    flex: 1,
  },
  recentSearchesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentSearchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  recentSearchText: {
    fontSize: 16,
    color: '#1F2937',
  },
  removeSearchButton: {
    padding: 16,
  },
  resultsContainer: {
    padding: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  wallpaperCard: {
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
  },
  imageContainer: {
    position: 'relative',
  },
  wallpaperImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  timerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  contentContainer: {
    padding: 16,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  senderText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  timestampText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});