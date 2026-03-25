import { useState, useRef,useEffect  } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Upload, CircleCheck as CheckCircle, Monitor, Calendar, DollarSign, ArrowRight, SkipBack as Skip } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { BASE_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';


const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Share Your Message',
    subtitle: 'Upload beautiful wallpapers with personal messages, quotes, or wishes',
    image: 'https://images.pexels.com/photos/1308881/pexels-photo-1308881.jpeg?auto=compress&cs=tinysrgb&w=400',
    icon: Upload,
    color: '#8B5CF6',
  },
  {
    id: 2,
    title: 'Get Approved',
    subtitle: 'Our team reviews your submission to ensure quality and appropriateness',
    image: 'https://images.pexels.com/photos/1323712/pexels-photo-1323712.jpeg?auto=compress&cs=tinysrgb&w=400',
    icon: CheckCircle,
    color: '#10B981',
  },
  {
    id: 3,
    title: 'Go Live',
    subtitle: 'Your wallpaper appears on users\' screens for everyone to enjoy',
    image: 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=400',
    icon: Monitor,
    color: '#EC4899',
  },
  {
    id: 4,
    title: 'Book Premium Slots',
    subtitle: 'Get priority placement during peak hours for maximum visibility',
    image: 'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=400',
    icon: Calendar,
    color: '#F59E0B',
  },
  {
    id: 5,
    title: 'Resale Marketplace',
    subtitle: 'Buy and sell premium time slots with other users for the best deals',
    image: 'https://images.pexels.com/photos/3943716/pexels-photo-3943716.jpeg?auto=compress&cs=tinysrgb&w=400',
    icon: DollarSign,
    color: '#EF4444',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollX = useSharedValue(0);

        // console.log('onBoarding screen:');

    useEffect(() => {
    const signup = async () => {
      try {
            const deviceId = Application.androidId || Device.osInternalBuildId || "unknown_device";

        const alreadySignedUp = await AsyncStorage.getItem('anonymousToken');
        if (alreadySignedUp) return; // avoid duplicate calls

        const response = await fetch(`${BASE_URL}/auth/anonymous-signup`, {
          method: 'POST',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            anonymousId: deviceId, // replace with actual ID logic if needed
            deviceInfo: {
              deviceToken: 'string',
              deviceType: Device.osName?.toLowerCase() || "android",
            },
          }),
        });

        const data = await response.json();
        console.log('Signup Response:', data);

        // Store token or userId
        if (data?.token) {
          await AsyncStorage.setItem('anonymousToken', data.token);
        }
      } catch (error) {
        console.error('Anonymous signup failed:', error);
      }
    };

    signup();
  }, []);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

const handleGetStarted = async () => {
  try {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(tabs)'); // or just '/(tabs)' depending on your routing
  } catch (error) {
    console.error('Error saving onboarding status:', error);
  }
};

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollX.value = offsetX;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const OnboardingSlide = ({ item, index }) => {
    const Icon = item.icon;

    const slideAnimatedStyle = useAnimatedStyle(() => {
      const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
      
      const scale = interpolate(
        scrollX.value,
        inputRange,
        [0.8, 1, 0.8],
        Extrapolate.CLAMP
      );

      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0.3, 1, 0.3],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ scale }],
        opacity,
      };
    });

    return (
      <Animated.View style={[styles.slide, slideAnimatedStyle]}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.slideImage} />
          <View style={[styles.iconOverlay, { backgroundColor: item.color }]}>
            <Icon size={40} color="white" />
          </View>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        </View>
      </Animated.View>
    );
  };

  const PaginationDot = ({ index }) => {
    const dotAnimatedStyle = useAnimatedStyle(() => {
      const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
      
      const scale = interpolate(
        scrollX.value,
        inputRange,
        [0.8, 1.2, 0.8],
        Extrapolate.CLAMP
      );

      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0.3, 1, 0.3],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ scale }],
        opacity,
      };
    });

    return (
      <Animated.View 
        style={[
          styles.paginationDot,
          dotAnimatedStyle,
          currentIndex === index && styles.activePaginationDot
        ]} 
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Skip size={20} color="#6B7280" />
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Logo */}
    <View style={styles.logoContainer}>
      <Image
        source={require('../assets/images/logo1.png')} // update path
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => (
          <OnboardingSlide key={item.id} item={item} index={index} />
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Pagination */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <PaginationDot key={index} index={index} />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <ArrowRight size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
 logoContainer: {
   position: 'absolute',
  top: 90,      // 👈 below skip button
  alignSelf: 'center',
  zIndex: 1,
},

logo: {
  width: 70,
  height: 70,
},
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 170,
    paddingBottom: 0,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  slideImage: {
    width: 200,
    height: 200,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  iconOverlay: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  textContainer: {
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 40,
    paddingVertical: 40,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  activePaginationDot: {
    backgroundColor: '#8B5CF6',
  },
  nextButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    minWidth: 160,
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});