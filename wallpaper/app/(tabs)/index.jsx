import { useState, useEffect } from 'react';

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
  NativeModules,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Download,
  Clock,
  Bell,
  Search,
  Heart,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../utils/constants';
import { useFocusEffect } from "@react-navigation/native";
import { useCallback ,useRef} from "react";
import BackgroundTimer from 'react-native-background-timer';
import { el } from 'react-native-paper-dates';


const { WallpaperModule } = NativeModules;
const { WallpaperScheduler } = NativeModules;

const { width, height } = Dimensions.get('window');

const wallpaper = {
  id: 1,
  image:
    'https://img.freepik.com/free-photo/photorealistic-view-tree-nature-with-branches-trunk_23-2151478092.jpg?t=st=1753692411~exp=1753696011~hmac=43fd18ba1526f72cf9bc328040697fcbec9834f25afb13b890b1b946187792c6&w=826',
  message: 'Make today amazing! ✨',
  sender: 'Suresh',
  occasion: 'Motivation',
  category: 'motivation',
  timestamp: '5 mins ago',
  date: '2025-01-26',
  likes: 42,
  dislikes: 3,
  comments: 8,
  hits: 15200,
  isLiked: false,
  isDisliked: false,
  isHit: false,
  timeRemaining: 25 * 60,
};

export default function HomeScreen() {
  const [wallpaperData, setWallpaperData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(wallpaper.timeRemaining);
  const [greeting, setGreeting] = useState('');
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
const [endDateTime, setEndDateTime] = useState(null);
const isFetchingRef = useRef(false);
const [downloading, setDownloading] = useState(false);
const [page, setPage] = useState(0);
const [hasMoreOldData, setHasMoreOldData] = useState(true);

const [loadingPage, setLoadingPage] = useState(false);
  const hasTriggeredFetchRef = useRef(false);
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };
  const BASE_URL = 'http://35.154.98.17:3000'; // Replace with your actual base URL

  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      setCurrentUserId(id);
    };
    fetchUserId();
  }, []);
  useEffect(() => {
    setGreeting(getGreeting());

    // Update greeting every minute
    const greetingInterval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);

    
    return () => {
      clearInterval(greetingInterval);
      // clearInterval(timerInterval);
    };
  }, []);

// useEffect(() => {
//     if (!endDateTime) {
//       console.log("⏳ No end time set yet, skipping timer");
//       return;
//     }

//     console.log("⏳ Starting device-synced countdown timer");
//     console.log("📅 Target end time:", endDateTime.toLocaleString());
    
//     // Reset the trigger flag when endDateTime changes
//     hasTriggeredFetchRef.current = false;

//     const timer = BackgroundTimer.runBackgroundTimer(() => {
//       // Calculate remaining time from actual device time
//       const now = new Date();
//       const diffMs = endDateTime.getTime() - now.getTime();
//       const remaining = Math.max(0, Math.floor(diffMs / 1000));
      
//       console.log(`⏱️ Device time: ${now.toLocaleTimeString()}, Remaining: ${remaining}s`);
      
//       setTimeRemaining(remaining);

//       // ✅ When timer reaches 0, fetch new wallpaper (only once)
//       if (remaining === 0 && !hasTriggeredFetchRef.current && !isFetchingRef.current) {
//         console.log("⏰ Timer reached 0 – preparing to fetch new wallpaper");
        
//         // Mark that we've triggered the fetch
//         hasTriggeredFetchRef.current = true;
        
//         // Stop the current timer immediately
//         BackgroundTimer.stopBackgroundTimer();
        
//         // Wait 20 seconds before fetching
//         console.log("⏳ Waiting 20 seconds before fetching...");
//         setTimeout(() => {
//           if (!isFetchingRef.current) {
//             console.log("🔄 Now fetching new wallpaper");
//             fetchWallpaper(true).catch(error => {
//               console.error("Failed to fetch/set wallpaper:", error);
//               isFetchingRef.current = false;
//             });
//           }
//         }, 20000); // 20 seconds delay
//       }
//     }, 1000);

//     // Cleanup function
//     return () => {
//       console.log("🛑 Stopping countdown timer");
//       BackgroundTimer.stopBackgroundTimer();
//     };
//   }, [endDateTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getToken = async () => {
    const authToken = await AsyncStorage.getItem("authToken");
    if (authToken) return authToken;

    // fallback to anonymous token
    const anonymousToken = await AsyncStorage.getItem("anonymousToken");
    return anonymousToken || null;
  };

  const handleHit = async (postId) => {
    setWallpaperData((prev) => ({
      ...prev,
      isHit: !prev.isHit,
      hits: prev.isHit ? prev.hits - 1 : prev.hits + 1,
    }));

    try {
      // call API
      const token = await getToken();
      if (!token) {
        console.log("No token found");
        return;
      }

      const res = await fetch(`${BASE_URL}/v1/slot/${postId}/view`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // parse response
      const data = await res.json();
      console.log("Hit (view) response:", data);

      if (res.ok && data.success) {
        // API success -> optionally sync state with server
        setWallpaperData((prev) => ({
          ...prev,
          hits: data?.slot?.views?.length ?? prev.hits,  // update from server if provided
          isHit: data?.slot?.views?.includes(currentUserId),
        }));
      } else {
        console.warn("Failed to update view:", data.message || data.error);
        // Optionally rollback local state
        setWallpaperData((prev) => ({
          ...prev,
          isHit: !prev.isHit, // revert toggle
          hits: prev.isHit ? prev.hits + 1 : prev.hits - 1,
        }));
      }
    } catch (err) {
      console.error("Error hitting view API:", err);
      // rollback local state on error
      setWallpaperData((prev) => ({
        ...prev,
        isHit: !prev.isHit,
        hits: prev.isHit ? prev.hits + 1 : prev.hits - 1,
      }));
    }
  };


  const handleDownloadOption = async (option) => {
    setShowDownloadDropdown(false);

    // Get auth token
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      Alert.alert('Error', 'You need to be logged in to perform this action.');
      console.log('Download blocked: No auth token');
      return;
    }

    console.log('Dropdown option pressed');

    // setTimeout(() => {
    //   Alert.alert('Success', `${option} completed successfully!`);
    // }, 300);
    // Alert.alert('Success', `${option} completed successfully!`);
    console.log('App loaded correctly', option);

    if (option === 'Save Live Wallpaper') {
      const imageUrl = wallpaperData?.image; // Use the current wallpaper image


      try {
        WallpaperModule.setWallpaperFromUrl(imageUrl);
        setTimeout(() => {
          Alert.alert('Success', 'Wallpaper set successfully!');
        }, 300);
      } catch (error) {
        Alert.alert('Error', 'Failed to set wallpaper.');
        console.error(error);
      }
    } else if (option === 'Save as Live Screen Saver') {
      const imageUrl = wallpaperData?.image; 

      try {
        WallpaperModule.setLockScreenFromUrl(imageUrl);
        setTimeout(() => {
          Alert.alert('Success', 'Live Wallpaper set successfully!');
        }, 300);
      } catch (error) {
        Alert.alert('Error', 'Failed to set wallpaper.');
        console.error(error);
      }
    } else if (option === 'Download') {
      console.log('Download  clicked');

      saveImage(wallpaperData.image);
    }else if (option === 'background') {
            const imageUrl = wallpaperData?.image; 
            console.log("image url","to  background........$ima  "+imageUrl);

const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );
      
      await Promise.race([
        WallpaperModule.setWallpaperFromUrlBack(imageUrl),
        timeoutPromise
      ]);
      
      // WallpaperModule.setWallpaperFromUrlBack(imageUrl);
      //   setTimeout(() => {
      //   }, 100);
    } else {
      setTimeout(() => {
        Alert.alert('Success', `${option} completed successfully!`);
      }, 300);
    }
  };
  async function saveImage(imageUrl) {
    if (!imageUrl) {
      console.error("No image URL provided");
      return;
    }
    const fileName = "wallpaper.png"; // can be jpg or png

    try {
          setDownloading(true); // 👈 start loader

      console.log("Image saved at:", imageUrl);

      const localPath = await WallpaperModule.downloadImageFromUrl(imageUrl, fileName);
          Alert.alert('Success', 'Wallpaper downloaded successfully ✅');

      console.log("Image saved at:", localPath);
      // You can now use the path to display the image or set as wallpaper
    } catch (error) {
      console.error("Download failed:", error);
          Alert.alert('Error', 'Download failed ❌');

    }finally {
    setDownloading(false); // 👈 stop loader
  }
  }
  const thumbsUpScale = useSharedValue(1);
  const thumbsDownScale = useSharedValue(1);
  const hitScale = useSharedValue(1);

  const thumbsUpAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thumbsUpScale.value }],
  }));

  const thumbsDownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thumbsDownScale.value }],
  }));

  const hitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hitScale.value }],
  }));

  const onLike = () => {
    thumbsUpScale.value = withSpring(1.3, {}, () => {
      thumbsUpScale.value = withSpring(1);
    });
    // optimistic UI update
    setWallpaperData((prev) => {
      const wasLiked = prev.isLiked;
      const wasDisliked = prev.isDisliked;

      let newLikes = prev.likes;
      let newDislikes = prev.dislikes;

      if (wasLiked) {
        newLikes = prev.likes - 1;
      } else {
        newLikes = prev.likes + 1;
        if (wasDisliked) {
          newDislikes = prev.dislikes - 1;
        }
      }

      // fire API request in background
      handleLikeApi(prev.id || prev.postId);

      return {
        ...prev,
        isLiked: !wasLiked,
        isDisliked: false,
        likes: newLikes,
        dislikes: newDislikes,
      };
    });
  };
  const handleLikeApi = async (postId) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error("No token found");
        return;
      }


      const res = await fetch(`${BASE_URL}/v1/slot/${postId}/like`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      console.log("Like API response:", data);
      const slot = data.slot;

      setWallpaperData((prev) => ({
        ...prev,
        likes: slot.likes.length,
        dislikes: slot.dislikes.length,
        isLiked: slot.likes.includes(currentUserId),
        isDisliked: slot.dislikes.includes(currentUserId),
      }));

    } catch (err) {
      console.error("Error liking post:", err);
    }
  };


  const onDislike = () => {
    thumbsDownScale.value = withSpring(1.3, {}, () => {
      thumbsDownScale.value = withSpring(1);
    });
    // optimistic UI update
    setWallpaperData((prev) => {
      const wasLiked = prev.isLiked;
      const wasDisliked = prev.isDisliked;

      let newLikes = prev.likes;
      let newDislikes = prev.dislikes;

      if (wasDisliked) {
        newDislikes = prev.dislikes - 1;
      } else {
        newDislikes = prev.dislikes + 1;
        if (wasLiked) {
          newLikes = prev.likes - 1;
        }
      }

      // fire API request in background
      handleDislikeApi(prev.id || prev.postId);

      return {
        ...prev,
        isLiked: false,
        isDisliked: !wasDisliked,
        likes: newLikes,
        dislikes: newDislikes,
      };
    });
  };
  const handleDislikeApi = async (postId) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error("No token found");
        return;
      }

      const res = await fetch(`${BASE_URL}/v1/slot/${postId}/dislike`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      console.log("Dislike API response:", data);
      const slot = data.slot;

      setWallpaperData((prev) => ({
        ...prev,
        likes: slot.likes.length,
        dislikes: slot.dislikes.length,
        isLiked: slot.likes.includes(currentUserId),
        isDisliked: slot.dislikes.includes(currentUserId),
      }));
    } catch (err) {
      console.error("Error disliking post:", err);
    }
  };

  const onHit = () => {
    hitScale.value = withSpring(1.3, {}, () => {
      hitScale.value = withSpring(1);
    });

    setWallpaperData((prev) => {
      // const wasLiked = prev.isLiked;
      // const wasDisliked = prev.isDisliked;

      // let newLikes = prev.likes;
      // let newDislikes = prev.dislikes;

      // if (wasDisliked) {
      //   newDislikes = prev.dislikes - 1;
      // } else {
      //   newDislikes = prev.dislikes + 1;
      //   if (wasLiked) {
      //     newLikes = prev.likes - 1;
      //   }
      // }

      // fire API request in background
      handleHit(prev.id || prev.postId);

      return {
        ...prev,
        
      };
    });
  };
const fetchWallpaperByPage = async (pageNumber) => {
  try {
    if (pageNumber <= 0) return;
    setLoadingPage(true);

  const token = await getToken();
      if (!token) {
        console.error("No token found");
        return;
      }
      
      const res = await fetch(`${BASE_URL}/v1/slot/old?page=${pageNumber}&limit=1`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  const data = await res.json();
      console.log("previous API response:", data);

    if (data.data?.length > 0) {

    const slot = data.data?.[0];
    if (!slot) {
      // ❌ No more old data
      setHasMoreOldData(false);
      return;
    }


        console.log("api response log",slot._id);

    // const signedImageUrl = await getSignedImageUrl(slot.postId?.image);

      // const signedImageUrl = fileData.signedUrls[mediaUrl];

      
    const mediaUrl = slot.postId.mediaUrl;
    console.log("media url", mediaUrl);
    
    // Preload image to avoid black flash
    await Image.prefetch(mediaUrl);

    setWallpaperData({
      id: slot._id,
      image: mediaUrl,
      title: slot.postId?.title || '',
      message: slot.postId?.title || '',
      sender: slot.postId?.createdBy?.fullName || '',
      occasion: slot.saleStatus || '',
      // category: 'motivation',
      // timestamp: 'Just now',
      date: slot.date,
      likes: slot.likes?.length || 0,
      dislikes: slot.dislikes?.length || 0,
      comments: slot.commentCount || 0,
      hits: slot.views?.length || 0,
      isLiked: slot.likes?.some(id => id?.toString() === cUser?.toString()),
      isDisliked: slot.dislikes?.some(id => id?.toString() === cUser?.toString()),
      isHit: slot.views?.some(id => id?.toString() === cUser?.toString()),
      timeRemaining,
    });

    console.log("api response set completed");
     setHasMoreOldData(true);
      setPage(pageNumber);
    }else{
  
      // ❌ No more old data
      setHasMoreOldData(false);
      // return;
    
    }

  } catch (e) {
    console.log('Wallpaper API error', e);
  } finally {
    setLoadingPage(false);
  }
};


  // ✅ UI Timer - Only updates the display, doesn't trigger fetching
  useEffect(() => {
    if (!endDateTime) {
      console.log("⏳ No end time set yet, skipping timer");
      return;
    }

    console.log("⏳ Starting UI countdown timer");
    console.log("📅 Target end time:", endDateTime.toLocaleString());

    const timer = setInterval(() => {
      const now = new Date();
      const diffMs = endDateTime.getTime() - now.getTime();
      const remaining = Math.max(0, Math.floor(diffMs / 1000));
      
      setTimeRemaining(remaining);

      // ✅ When timer reaches 0, just stop the timer
      // AlarmManager will handle the actual wallpaper update
      if (remaining === 0) {
        console.log("⏰ Timer reached 0 - AlarmManager will handle update");
        clearInterval(timer);
        fetchWallpaper(false);
      }
    }, 1000);

    return () => {
      console.log("🛑 Stopping UI countdown timer");
      clearInterval(timer);
    };
  }, [endDateTime]);

  
  useEffect(() => {
    console.log("🚀 Initial mount - fetching wallpaper");
    fetchWallpaper(false);
  }, []);

  // Fetch every time screen regains focus
  // useFocusEffect(
  //   useCallback(() => {
  //     fetchWallpaper();
  //   }, [fetchWallpaper])
  // );


  // const fetchWallpaper = useCallback(async (fromBackground = false) => {
  //   try {
  //     const token = await getToken();
  //     const cUser = await AsyncStorage.getItem("userId");
  //     console.log("current user", cUser);

  //     if (!token) {
  //       console.log('No token found');
  //       setLoading(false);
  //       return;
  //     }

  //      // Get current date and time
  //   const now = new Date();
  //   const currentDate = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  //   const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`; // Format: HH:MM

  //   // Build query parameters
  //   const queryParams = new URLSearchParams({
  //     date: currentDate,
  //     time: currentTime
  //   });
    
  //     const slotRes = await fetch(`${BASE_URL}/v1/slot/current?${queryParams.toString()}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     const slotData = await slotRes.json();
  //     console.log('API Response:', slotData);
  //     if (!slotData?.slot?.postId?.mediaUrl) {
  //       console.error('No mediaUrl found in ot data');
  //       return;
  //     }


  //     const mediaUrl = slotData.slot.postId.mediaUrl;
  //     console.log("media url", mediaUrl);
  //     const fileRes = await fetch(`${BASE_URL}/v1/file/get-signed-urls`, {
  //       method: 'POST',
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         urls: [mediaUrl],
  //       }),
  //     });
  //     const fileData = await fileRes.json();
  //     console.log("fileData url", fileData);
  //     const signedImageUrl = fileData.signedUrls[mediaUrl];
  //     if (!signedImageUrl) {
  //       console.error("No signed URL found");
  //       return;
  //     }

  //     // Preload image to avoid black flash
  //     await Image.prefetch(signedImageUrl);

  //     // if (fileData?.signedUrls?.[0]) {
  //     //   setWallpaperData({
  //     //     image: fileData.signedUrls[0], // signed image URL

  //     //   });
  //     // }
  //     if (slotData.success && slotData.slot) {
  //       const slot = slotData.slot;
  //       // ✅ Calculate time remaining from API endTime

  //       // ✅ Convert slot start & end times
  //       const slotDate = slot.date; // "2025-09-25"
  //       const endTime =slot.endTime; // "12:30"
  //       const now = new Date();

  //       // Combine date + endTime
  //       let endDateTime = null;

  //       if (slotDate && endTime) {
  //         const [hours, minutes] = endTime.split(":").map(Number);
  //         const [year, month, day] = slotDate.split("-").map(Number);

  //         // JS months are 0-indexed
  //         endDateTime = new Date(year, month - 1, day, hours, minutes, 0);
  //       }

  //             let calculatedEndDateTime = null;

  //       let timeRemaining = 0;

  //       if (endDateTime) {
  //         if (
  //           now.getFullYear() === endDateTime.getFullYear() &&
  //           now.getMonth() === endDateTime.getMonth() &&
  //           now.getDate() === endDateTime.getDate()
  //         ) {
  //           // ✅ Slot is today
  //           const diffMs = endDateTime.getTime() - now.getTime();
  //           timeRemaining = Math.max(0, Math.floor(diffMs / 1000));
  //           console.log( now.getHours(),"Time remaining (sec):", timeRemaining);
  //         } else {
  //           console.log("Slot date is not today, skipping countdown");
  //           timeRemaining = 0;
  //         }
  //       } else {
  //         console.log("No valid endTime or date, using fallback 25 mins");
  //         timeRemaining = 25 * 60;
  //       }
  //       setWallpaperData({
  //         id: slot._id,
  //         image: signedImageUrl,
  //         message: slot.postId?.title || '',
  //         sender: slot.postId?.createdBy?.fullName || '',
  //         occasion: slot.saleStatus || '',
  //         category: 'motivation', // can be mapped if available
  //         timestamp: 'Just now',
  //         date: slot.date,
  //         likes: slot.likes?.length || 0,
  //         dislikes: slot.dislikes?.length || 0,
  //         comments: slot.commentCount || 0,
  //         hits: slot.views?.length || 0,
  //         isLiked: slot.likes?.some(id => id.toString() === cUser?.toString()),
  //         isDisliked: slot.dislikes?.some(id => id.toString() === cUser?.toString()),
  //         isHit: slot.views?.some(id => id.toString() === cUser?.toString()),
  //         timeRemaining,
  //       });
  //             setTimeRemaining(timeRemaining);

     
  //   // ✅ Check last saved post ID from AsyncStorage
  //   const lastPostId = await AsyncStorage.getItem("lastWallpaperPostId");
    
  //   if (fromBackground && lastPostId !== slot._id) {
  //     handleDownloadOption("background");
  //     // Save the new post ID
  //     await AsyncStorage.setItem("lastWallpaperPostId", slot._id);
  //   }

  //   // Always save the first load post ID if not exists
  //   if (!lastPostId) {
  //     await AsyncStorage.setItem("lastWallpaperPostId", slot._id);
  //   }
  //       // setTimeRemaining(timeRemaining); // ✅ update timer state

  //     }
  //   } catch (err) {
  //     console.error('Fetch error:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  const goToPage = (targetPage) => {
  if (targetPage < 0) return;

  if (targetPage === 0) {
    fetchWallpaper();       // CURRENT API
    setPage(0);
  } else {
    fetchWallpaperByPage(targetPage); // OLD API
    setPage(targetPage);
  }
};

const getPreviousWallpaper = async () => {
  goToPage(page + 1);
};

const getNextWallpaper = async () => {
goToPage(page - 1);
  
};

// ✅ UPDATE fetchWallpaper to save endDateTime
const fetchWallpaper = useCallback(async (fromBackground = false) => {
  //  if (isFetchingRef.current) {
  //     console.log("⚠️ Fetch already in progress, skipping");
  //     return;
  //   }

    isFetchingRef.current = true;
  try {
    const token = await getToken();
    const cUser = await AsyncStorage.getItem("userId");
    console.log("current user", cUser);

    if (!token) {
      console.log('No token found');
      setLoading(false);
      return;
    }
        setPage(0);

    // Reset left arrow visibility
    setHasMoreOldData(true);


    // Get current date and time
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`; // Format: HH:MM

    // Build query parameters
    const queryParams = new URLSearchParams({
      date: currentDate,
      time: currentTime
    });
     if (WallpaperScheduler && typeof WallpaperScheduler.saveApiCredentials === 'function') {
      try {
        await WallpaperScheduler.saveApiCredentials(token, BASE_URL);
        console.log('✅ API credentials saved');
      } catch (err) {
        console.error('❌ Failed to save credentials:', err);
      }
    } else {
      console.warn('⚠️ WallpaperScheduler.saveApiCredentials not available');
    }
    const slotRes = await fetch(`${BASE_URL}/v1/slot/current?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const slotData = await slotRes.json();
    console.log('API Response:', slotData);
    
    if (!slotData?.slot?.postId?.mediaUrl) {
      console.error('No mediaUrl found in slot data');
      return;
    }

    const mediaUrl = slotData.slot.postId.mediaUrl;
    console.log("media url", mediaUrl);
    
    const fileRes = await fetch(`${BASE_URL}/v1/file/get-signed-urls`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [mediaUrl],
      }),
    });
    
    const fileData = await fileRes.json();
    console.log("fileData url", fileData);
    
    const signedImageUrl = fileData.signedUrls[mediaUrl];
    if (!signedImageUrl) {
      console.error("No signed URL found");
      return;
    }

    // Preload image to avoid black flash
    await Image.prefetch(signedImageUrl);
      // console.error("slot.signedImageUrl",signedImageUrl);

    if (slotData.success && slotData.slot) {
      const slot = slotData.slot;
      
      // ✅ Calculate target end time
      const slotDate = slot.date; // "2025-01-26"
      const endTime = slot.endTime; // "12:30"
      const currentTime = new Date();

      let calculatedEndDateTime = null;
      let timeRemaining = 0;

      if (slotDate && endTime) {
        const [hours, minutes] = endTime.split(":").map(Number);
        const [year, month, day] = slotDate.split("-").map(Number);

        // Create end datetime (JS months are 0-indexed)
        calculatedEndDateTime = new Date(year, month - 1, day, hours, minutes, 0);
        
        console.log("📅 Slot end time:", calculatedEndDateTime.toLocaleString());
        
        // Check if slot is today
        const isToday = (
          currentTime.getFullYear() === calculatedEndDateTime.getFullYear() &&
          currentTime.getMonth() === calculatedEndDateTime.getMonth() &&
          currentTime.getDate() === calculatedEndDateTime.getDate()
        );



        if (isToday) {
          // Calculate remaining 
          const diffMs = calculatedEndDateTime.getTime() - currentTime.getTime();
          timeRemaining = Math.max(0, Math.floor(diffMs / 1000));
          
          console.log(`⏱️ Time remaining: ${Math.floor(timeRemaining / 60)}m ${timeRemaining % 60}s`);
          
          // ✅ Save the target end time for 
          setEndDateTime(calculatedEndDateTime);
if (isToday && calculatedEndDateTime && WallpaperScheduler) {
  const endTimeMillis = calculatedEndDateTime.getTime();
  
  // WallpaperScheduler.scheduleWallpaperUpdate(endTimeMillis)
  //   .then(() => console.log('✅ Initial alarm scheduled (native will handle subsequent ones)'))
  //   .catch(err => console.error('❌ Failed to schedule alarm:', err));
}
        } else {
          console.log("❌ Slot date is not today, skipping countdown");
          timeRemaining = 0;
          setEndDateTime(null);
        }
      } else {
        console.log("⚠️ No valid endTime or date, using fallback 25 mins");
        timeRemaining = 25 * 60;
        
        // Calculate fallback end time
        const fallbackEnd = new Date(currentTime.getTime() + (25 * 60 * 1000));
        setEndDateTime(fallbackEnd);
      }
        // console.log("slot.signedImageUrl",slot.signedImageUrl);

      // Update wallpaper data
      setWallpaperData({
        id: slot._id,
        image: signedImageUrl,
        title:slot.postId?.title,
        message: slot.postId?.title || '',
        sender: slot.postId?.createdBy?.fullName || '',
        occasion: slot.saleStatus || '',
        category: 'motivation',
        timestamp: 'Just now',
        date: slot.date,
        likes: slot.likes?.length || 0,
        dislikes: slot.dislikes?.length || 0,
        comments: slot.commentCount || 0,
        hits: slot.views?.length || 0,
        isLiked: slot.likes?.some(id => id.toString() === cUser?.toString()),
        isDisliked: slot.dislikes?.some(id => id.toString() === cUser?.toString()),
        isHit: slot.views?.some(id => id.toString() === cUser?.toString()),
        timeRemaining,
      });
      
      setTimeRemaining(timeRemaining);

      // ✅ Handle background wallpaper setting
      const lastPostId = await AsyncStorage.getItem("lastWallpaperPostId");
                  console.log("image url"+slot._id,lastPostId+"to background.......  "+signedImageUrl);

      if (fromBackground && lastPostId !== slot._id) {
        
        console.log("🖼️ New wallpaper detected, setting as background");
        // handleDownloadOption("background");
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );
      
      await Promise.race([
        WallpaperModule.setWallpaperFromUrlBack(signedImageUrl),
        timeoutPromise
      ]);
        await AsyncStorage.setItem("lastWallpaperPostId", slot._id);
      }

      // Save first load post ID
      if (!lastPostId) {
        await AsyncStorage.setItem("lastWallpaperPostId", slot._id);
      }
    }
  } catch (err) {
    console.error('Fetch error:', err);
  } finally {
    setLoading(false);
  }
}, []);


  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!wallpaperData) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No data available</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fullscreenContainer}>

        <Image
          source={{ uri: wallpaperData.image }}
          style={styles.fullscreenImage}
          resizeMode="cover"
          />

  <View style={styles.arrowOverlay}>
    {/* Left Arrow */}
   {hasMoreOldData ? (
    <TouchableOpacity
      style={styles.leftArrow}
      onPress={getPreviousWallpaper}
    >
      <ArrowLeft size={32} color="white" />
    </TouchableOpacity>
  ) : (
    <View style={styles.arrowPlaceholder} />
  )}

  {/* RIGHT SLOT (arrow or placeholder) */}
  {page !== 0 ? (
    <TouchableOpacity
      style={styles.rightArrow}
      onPress={getNextWallpaper}
    >
      <ArrowRight size={32} color="white" />
    </TouchableOpacity>
  ) : (
    <View style={styles.arrowPlaceholder} />
  )}
  </View>

        {/* Gradient Overlay */}
        <View style={styles.gradientOverlay} />

        {/* Header with Dynamic Greeting */}
        <View style={styles.header}>
  <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.previousButton}
              onPress={() => router.push('/wallpaper/previous')}
            >
              <ArrowLeft size={20} color="white" />
              <Text style={styles.previousText}>Previous</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.headerTitle}>Lowall</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/postsscreen')}>
              {/* <Search size={24} color="white" /> */}
                <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>+</Text>

            </TouchableOpacity>
            
          </View>
        </View>

        {/* Dynamic Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>{wallpaperData.title}</Text>
        </View>

        {/* Top Badges */}
        <View style={styles.topBadges}>
          {/* <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{wallpaperData.occasion}</Text>
          </View> */}
          <View style={styles.timerBadge}>
            <Clock size={14} color="white" />
            <Text style={styles.timerText}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
        </View>
{downloading && (
  <View style={styles.loaderOverlay}>
    <ActivityIndicator size="large" color="#8B5CF6" />
    <Text style={{ marginTop: 10, color: 'white' }}>Downloading...</Text>
  </View>
)}
        {/* Bottom Content */}
        <View style={styles.bottomContent}>
          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={onLike}>
              <Animated.View style={thumbsUpAnimatedStyle}>
                <ThumbsUp
                  size={24}
                  color={wallpaperData.isLiked ? "#10B981" : "gray"}
                  fill={wallpaperData.isLiked ? "#10B981" : "none"}
                />
              </Animated.View>
              <Text
                style={[
                  styles.actionText,
                  wallpaperData.isLiked && styles.actionTextLiked
                ]}
              >
                {wallpaperData.likes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onDislike}>
              <Animated.View style={thumbsDownAnimatedStyle}>
                <ThumbsDown
                  size={24}
                  color={wallpaperData.isDisliked ? "#EF4444" : "gray"}
                  fill={wallpaperData.isDisliked ? "#EF4444" : "none"}
                />
              </Animated.View>
              <Text
                style={[
                  styles.actionText,
                  wallpaperData.isDisliked && styles.actionTextDisliked
                ]}
              >
                {wallpaperData.dislikes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onHit}>
              <Animated.View style={hitAnimatedStyle}>
                <Heart
                  size={24}
                  color={wallpaperData.isHit ? "red" : "gray"}
                  fill={wallpaperData.isHit ? "red" : "none"}
                />
              </Animated.View>
              <Text
                style={[
                  styles.actionText,
                  wallpaperData.isHit && styles.actionTextHit
                ]}
              >
                {wallpaperData.hits}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/comments/${wallpaperData.id}`)}
            >
              <MessageCircle size={24} color="gray" />
              <Text style={styles.actionText}>{wallpaperData.comments}</Text>
            </TouchableOpacity>

            <View style={styles.downloadContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowDownloadDropdown(!showDownloadDropdown)}
              >
                <Download size={24} color="gray" />
              </TouchableOpacity>

              {/* Download Dropdown */}
              {showDownloadDropdown && (
                <View style={styles.dropdown}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {

                      console.log('Dropdown option pressed');
                      handleDownloadOption('Save Live Wallpaper')
                    }}
                  >
                    <Text style={styles.dropdownText}>Save Live Wallpaper</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      console.log('Dropdown option 2 pressed');

                      handleDownloadOption('Save as Live Screen Saver')
                    }}
                  >
                    <Text style={styles.dropdownText}>Save as Live Screen Saver</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleDownloadOption('Download')}
                  >
                    <Text style={styles.dropdownText}>Download</Text>
                  </TouchableOpacity>
                </View>
              )}
             {/* Floating Action Button */}


            </View>
          </View>
        </View>

        {/* Invisible touchable area to close dropdown */}
        {showDownloadDropdown && (
          <TouchableOpacity
            style={styles.invisibleOverlay}
            activeOpacity={1}
            onPress={() => setShowDownloadDropdown(false)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenContainer: {
    flex: 1,
    position: 'relative',
  },
  loaderOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.3)',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
},
  fullscreenImage: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 60,
    paddingBottom: 20,
    zIndex: 10,
  },
 arrowOverlay: {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,

  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,

  zIndex: 100,        // 👈 VERY IMPORTANT
  elevation: 100,     // 👈 ANDROID
  pointerEvents: 'box-none',
},

leftArrow: {
  backgroundColor: 'rgba(0,0,0,0.35)',
  padding: 12,
  borderRadius: 30,
},

rightArrow: {
  backgroundColor: 'rgba(0,0,0,0.35)',
  padding: 12,
  borderRadius: 30,
},
  headerLeft: {
    width: 120, // fixed width for left section
  justifyContent: 'flex-start',
  },
  headerTitle: {
      position: 'absolute',

      left: 0,
  right: 0,
    textAlign: 'center',
      marginTop:-20,

    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
    justifyContent: 'flex-end',
  },
  previousButton: {

    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  previousText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  greetingContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    textAlign: 'center',
  },
  headerButton: {
   width: 44,
  height: 44,
  borderRadius: 22, // half of width/height
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  alignItems: 'center',
  justifyContent: 'center',
  },
  topBadges: {
    position: 'absolute',
    top: 180,
    right: 20,
    flexDirection: 'row',
    alignItems:'center',
      zIndex: 10,

  },
  categoryBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backdropFilter: 'blur(10px)',
  },
  categoryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  timerBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backdropFilter: 'blur(10px)',
  },
  timerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    zIndex: 10,
  },
  messageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    backdropFilter: 'blur(20px)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 26,
    textAlign: 'center',
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  timestampText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 20,
    backdropFilter: 'blur(20px)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '600',
  },
  actionTextLiked: {
    color: '#10B981',
  },
  actionTextDisliked: {
    color: '#EF4444',
  },
  actionTextHit: {
    color: '#F59E0B',
  },
  downloadContainer: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    bottom: 60,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  invisibleOverlay: {

  },
});