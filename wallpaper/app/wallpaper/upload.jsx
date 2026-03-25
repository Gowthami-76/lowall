import React, { useState,useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  FlatList, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Camera as CameraIcon, Image as ImageIcon, Upload as UploadIcon, User as User2, ChevronLeft, ChevronRight, CircleCheck as CheckCircle, Clock, Calendar as CalendarIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../utils/constants';


const occasionOptions = ['Birthday', 'Anniversary', 'Motivation', 'Love'];

const Calendar = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const today = new Date();
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = selectedDate === dateKey;
      const isPast = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedCalendarDay,
            isPast && styles.pastDay
          ]}
          onPress={() => !isPast && onDateSelect(dateKey)}
          disabled={isPast}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.selectedCalendarDayText,
            isPast && styles.pastDayText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButton}>
          <ChevronLeft size={20} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButton}>
          <ChevronRight size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysContainer}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {renderCalendarDays()}
      </View>
    </View>
  );
};

export default function UploadScreen() {
  // State for upload step
  const [image, setImage] = useState(null);
  const [imageHeight, setImageHeight] = useState(200); // default view height

  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState(null);

  // State for scheduling step
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  // const [fullName, setFullName] = useState('');

  // State for workflow management
  const [currentStep, setCurrentStep] = useState('upload'); // 'upload', 'pending', 'approved', 'schedule'
  const [loading, setLoading] = useState(false);


  const currentDisabledSlots = selectedDate ? (disabledSlotsByDate[selectedDate] || []) : [];

const pickFromGallery = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Denied', 'Media library access is required to choose an image.');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  });

  if (!result.canceled && result.assets?.length > 0) {
    const uri = result.assets[0].uri;

    // Get real image size
    Image.getSize(uri, (width, height) => {
      const screenWidth = Dimensions.get('window').width - 32; // adjust based on your padding
      const scaledHeight = (height / width) * screenWidth;
      setImageHeight(scaledHeight);  // <-- This adjusts your view height
    });

    setImage(uri);
  }
};
useEffect(() => {
    const loadName = async () => {
      try {
        const userName = await AsyncStorage.getItem('userName');

      
          setName(`${userName || ''} `.trim());
        
      } catch (err) {
        console.log('Error loading name:', err);
      }
    };

    loadName();
  }, []);
 
  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePhotoSubmit = async () => {
    if (!image || !message ) {
      Alert.alert("Validation", "Please fill in all required fields.");
      return;
    }

    try {

      setLoading(true);  // show loader
      setCurrentStep("pending");


      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Error", "No token found. Please login again.");
        return;
      }

      // Step 1: prepare file details
      const fileName = `photo_${Date.now()}.jpg`;
      const mimeType = "image/jpeg";

      // Step 2: request signed URL
      const signedRes = await fetch(
        `${BASE_URL}/v1/file/signed-url?fileName=${encodeURIComponent(fileName)}&mimeType=${encodeURIComponent(mimeType)}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const signedData = await signedRes.json();
      console.log("upload response", signedData);

      if (!signedData?.url || !signedData?.key) {
        Alert.alert("Error", "Failed to get signed URL");
        setCurrentStep("rejected");
        // setApprovalStatus('rejected');
        return;
      }
      const { key, url } = signedData;


      const fileResponse = await fetch(image); // "image" is the local uri from picker
      const fileBlob = await fileResponse.blob();

      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "image/jpeg",
        },
        body: fileBlob,
      });

      if (!uploadRes.ok) {
        // setApprovalStatus('rejected');

        setCurrentStep("rejected");
        throw new Error(`Upload failed with status ${uploadRes.status}`);
      }
      console.log("✅ File uploaded successfully!");

      // STEP 3: Call create post API after upload success
      const postRes = await fetch(`${BASE_URL}/v1/post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: name,
          content: message,
          mediaUrl: key, // save the S3 key, not signed url
           tags: selectedOccasion ? [selectedOccasion] : [],
        }),
      });
      console.log("📌 Create Post Response:", name,message,selectedOccasion);

      const postData = await postRes.json();
      console.log("📌 Create Post Response:", postData);
      setCurrentStep('pending');
      // setApprovalStatus('pending');
      setSelectedOccasion(null);

      setImage(null);
      setMessage('');
      setName('');

      setTimeout(() => {
        setCurrentStep('upload');

        //  router.push({
        //                 pathname: "/CreateSlotScreen",
        //                 params: { postId: postData._id }   // 👈 send postId here
        //             })
        router.push("/(tabs)");
      }, 5000);     // Alert.alert("Success", "File uploaded & post created!");

    } catch (err) {
      console.error("Photo submit error:", err);
      Alert.alert("Error", "Something went wrong. Try again.");
      setCurrentStep("rejected");
      // setApprovalStatus('rejected');


    } finally {
      setLoading(false);
    }
  };

  const proceedToScheduling = () => {
    setCurrentStep('schedule');
  };
  
   const proceedToSchedulingNew = () => {
     if (!image || !message ) {
      Alert.alert("Validation", "Please fill in all required fields.");
      return;
    }

     router.push({
                        pathname: "/CreateSlotScreen",
                        params: {
      image: image,
      message: message,
      occassion:selectedOccasion
    }
                          // 👈 send postId here
                    })
    // setCurrentStep('schedule');
  };

  const handleScheduleSubmit = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Validation', 'Please select both date and time.');
      return;
    }

    Alert.alert('Success!', `Your wallpaper has been scheduled for ${selectedDate} at ${selectedTime}`);

    // Reset all state
    setImage(null);
    setMessage('');
    setName('');
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedOccasion(null);
    setCurrentStep('upload');
    // setApprovalStatus('pending');

    router.push('/(tabs)');
  };

  const resetToUpload = () => {
    setCurrentStep('upload');
    // setApprovalStatus('pending');
    setImage(null);
    setMessage('');
    setName('');
    setSelectedOccasion(null);
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, currentStep !== 'upload' && styles.completedStep]}>
          <Text style={[styles.stepNumber, currentStep !== 'upload' && styles.completedStepText]}>1</Text>
        </View>
        <Text style={styles.stepLabel}>Upload</Text>
      </View>

      <View style={[styles.stepLine, currentStep === 'schedule' && styles.completedStepLine]} />

      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, currentStep === 'schedule' && styles.activeStep]}>
          <Text style={[styles.stepNumber, currentStep === 'schedule' && styles.activeStepText]}>2</Text>
        </View>
        <Text style={styles.stepLabel}>Schedule</Text>
      </View>
    </View>
  );

  // Render pending approval screen
  // if (currentStep === 'pending') {
  //   return (
  //     <SafeAreaProvider>
  //       <View style={styles.centerContainer}>
  //         <View style={styles.statusCard}>
  //           <Clock size={48} color="#F59E0B" />
  //           <Text style={styles.statusTitle}>Pending Approval</Text>
  //           <Text style={styles.statusMessage}>
  //             Your wallpaper has been submitted for admin review. You'll be notified once it's approved.
  //           </Text>
  //           <View style={styles.loadingIndicator}>
  //             <View style={styles.loadingDot} />
  //             <View style={[styles.loadingDot, { animationDelay: '0.2s' }]} />
  //             <View style={[styles.loadingDot, { animationDelay: '0.4s' }]} />
  //           </View>
  //         </View>
  //       </View>
  //     </SafeAreaProvider>
  //   );
  // }
  if (currentStep === 'pending') {
    return (
      <SafeAreaProvider>
        <View style={styles.centerContainer}>
          <View style={styles.statusCard}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={[styles.statusTitle, { marginTop: 12 }]}>
                  Uploading...
                </Text>
                <Text style={styles.statusMessage}>
                  Please wait while your wallpaper is being uploaded securely.
                </Text>
              </>
            ) : (
              <>
                <Clock size={48} color="#F59E0B" />
                <Text style={styles.statusTitle}>Pending Approval</Text>
                <Text style={styles.statusMessage}>
                  Your wallpaper has been submitted for admin review. You'll be
                  notified once it's approved.
                </Text>
                <View style={styles.loadingIndicator}>
                  <View style={styles.loadingDot} />
                  <View style={[styles.loadingDot, { animationDelay: '0.2s' }]} />
                  <View style={[styles.loadingDot, { animationDelay: '0.4s' }]} />
                </View>
              </>
            )}
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  // Render rejection screen
  if (currentStep === 'rejected') {
    return (
      <SafeAreaProvider>
        <View style={styles.centerContainer}>
          <View style={styles.statusCard}>
            <View style={styles.rejectionIcon}>
              <Text style={styles.rejectionX}>✕</Text>
            </View>
            <Text style={styles.statusTitle}>Rejected</Text>
            <Text style={styles.statusMessage}>
              Sorry, your wallpaper didn't meet our guidelines. Please review our content policy and try uploading a different image.
            </Text>
            <TouchableOpacity style={styles.tryAgainButton} onPress={resetToUpload}>
              <UploadIcon size={18} color="white" />
              <Text style={styles.tryAgainButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  // Render approval success screen
  if (currentStep === 'approved') {
    return (
      <SafeAreaProvider>
        <View style={styles.centerContainer}>
          <View style={styles.statusCard}>
            <CheckCircle size={48} color="#10B981" />
            <Text style={styles.statusTitle}>Approved!</Text>
            <Text style={styles.statusMessage}>
              Great! Your wallpaper has been approved. Now you can schedule when it goes live.
            </Text>
            <TouchableOpacity style={styles.proceedButton} onPress={proceedToScheduling}>
              <CalendarIcon size={18} color="white" />
              <Text style={styles.proceedButtonText}>Proceed to Scheduling</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={resetToUpload}>
              <Text style={styles.backButtonText}>Upload New Wallpaper</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  // Render scheduling step
  if (currentStep === 'schedule') {
    return (
      <SafeAreaProvider>
        <ScrollView contentContainerStyle={styles.container}>
          {renderStepIndicator()}

          <Text style={styles.title}>Schedule Your Wallpaper</Text>
          <Text style={styles.subtitle}>Choose when your approved wallpaper goes live</Text>

          {/* Show uploaded image preview */}
          <View style={styles.imagePreview}>
            <Image source={{ uri: image }} style={styles.previewImage} />
            <View style={styles.previewOverlay}>
              <Text style={styles.previewLabel}>Approved Wallpaper</Text>
            </View>
          </View>

          <Text style={styles.label}>Select Date</Text>
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setSelectedTime(null);
            }}
          />

          {selectedDate && (
            <>
              <Text style={styles.label}>Available Time Slots</Text>
              <FlatList
                data={timeSlots}
                numColumns={3}
                key={selectedDate}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.timeGrid}
                renderItem={({ item }) => {
                  const isDisabled = currentDisabledSlots.includes(item);
                  const isSelected = selectedTime === item;

                  return (
                    <TouchableOpacity
                      disabled={isDisabled}
                      style={[
                        styles.timeBox,
                        isSelected && styles.selectedTimeBox,
                        isDisabled && styles.disabledBox
                      ]}
                      onPress={() => setSelectedTime(item)}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          isSelected && styles.selectedTimeText,
                          isDisabled && styles.disabledText
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />

              {currentDisabledSlots.length === timeSlots.length && (
                <Text style={styles.noSlotsText}>
                  No time slots available for this date
                </Text>
              )}
            </>
          )}

          <View style={styles.scheduleButtonsContainer}>
            <TouchableOpacity style={styles.backScheduleButton} onPress={resetToUpload}>
              <Text style={styles.backScheduleButtonText}>Back to Upload</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scheduleSubmitButton} onPress={handleScheduleSubmit}>
              <CalendarIcon size={18} color="white" />
              <Text style={styles.scheduleSubmitButtonText}>Schedule Wallpaper</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaProvider>
    );
  }

  // Default upload step
  return (
    <SafeAreaProvider>
      <ScrollView contentContainerStyle={styles.container}>
        {renderStepIndicator()}

        <Text style={styles.title}>Upload Wallpaper</Text>
        <Text style={styles.subtitle}>Share your message with the world</Text>

        <View style={styles.charCountContainer}>
          <Text style={styles.charCount}>{message.length}/200</Text>
        </View>

        {/* <TouchableOpacity 
  style={[styles.imageBox, { height: image ? imageHeight : 200 }]}
        onPress={pickFromGallery}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} resizeMode="cover"/>
          ) : (
            <View style={styles.imagePlaceholder}>
              <ImageIcon size={32} color="gray" />
              <Text style={styles.placeholderText}>Select Image</Text>
            </View>
          )}
        </TouchableOpacity> */}

        <TouchableOpacity 
  style={[styles.imageBox, { height: image ? imageHeight : 200 }]}
  onPress={pickFromGallery}
>
  {image ? (
    <Image 
      source={{ uri: image }} 
      style={styles.image} 
      resizeMode="contain"   // <-- FIX
    />
  ) : (
    <View style={styles.imagePlaceholder}>
      <ImageIcon size={32} color="gray" />
      <Text style={styles.placeholderText}>Select Image</Text>
    </View>
  )}
</TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={openCamera}>
            <CameraIcon size={18} color="white" />
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={pickFromGallery}>
            <ImageIcon size={18} color="white" />
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputWithIcon}>
  <User2 size={18} color="#6B7280" />
  <TextInput
    style={styles.input}
    placeholder="Sender Name"
    value={name}          // ← set the full name here
    editable={false}          // ← user cannot edit
    selectTextOnFocus={false} // ← optional: prevents selecting text
  />
</View>

        <TextInput
          style={[styles.input, { height: 100, marginBottom: 16 }]}
          placeholder="Write your message"
          value={message}
          onChangeText={(text) => {
            if (text.length <= 200) setMessage(text);
          }}
          multiline
        />

        <Text style={styles.label}>Occasion</Text>
        <View style={styles.tagsContainer}>
          {occasionOptions.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.tag, selectedOccasion === item && styles.selectedTag]}
              onPress={() => setSelectedOccasion(item)}
            >
              <Text
                style={[styles.tagText, selectedOccasion === item && styles.selectedTagText]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

<View style={styles.buttonRow}>
<TouchableOpacity style={styles.proceedButtonNew} onPress={proceedToSchedulingNew}>
              <CalendarIcon size={18} color="white" />
              <Text style={styles.proceedButtonText}>Proceed to Scheduling</Text>
            </TouchableOpacity>
             <TouchableOpacity style={styles.proceedButtonNew} onPress={handlePhotoSubmit}>
              <Text style={styles.proceedButtonText}>Upload  Wallpaper</Text>
            </TouchableOpacity>
            </View>
        {/* <TouchableOpacity style={styles.submit} onPress={handlePhotoSubmit}>
          <UploadIcon size={18} color="white" />
          <Text style={styles.submitText}>Submit for Approval</Text>
        </TouchableOpacity> */}
      </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 120,
    backgroundColor: '#FAFAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFB',
    padding: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeStep: {
    backgroundColor: '#8B5CF6',
  },
  completedStep: {
    backgroundColor: '#10B981',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeStepText: {
    color: 'white',
  },
  completedStepText: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  completedStepLine: {
    backgroundColor: '#10B981',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  imageBox: {
      width: '100%',          // added for proper fit

    height: 200,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  placeholderText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  buttonRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10, // space between buttons
  width: '100%',
},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    flex: 1,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  subLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
  },
  selectedTag: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  tagText: {
    fontSize: 13,
    color: '#374151',
  },
  selectedTagText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submit: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 320,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  loadingIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
    opacity: 0.3,
  },
  proceedButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  proceedButtonNew: {
  flex: 1, // 👈 Add this to make buttons equal width
  flexDirection: 'row',
  backgroundColor: '#8B5CF6',
  paddingVertical: 14,
  paddingHorizontal: 24,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center', // 👈 Add this to center content
  gap: 8,
  // marginBottom: 12, // 👈 Remove this
},
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  imagePreview: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  previewLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    width: 32,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: '14.28%',
    height: 40,
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedCalendarDay: {
    backgroundColor: '#8B5CF6',
  },
  pastDay: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectedCalendarDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pastDayText: {
    color: '#9CA3AF',
  },
  timeGrid: {
    paddingBottom: 20,
  },
  timeBox: {
    flex: 1,
    margin: 4,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 44,
  },
  selectedTimeBox: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  disabledBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1.5,
  },
  timeText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 12,
    textAlign: 'center',
  },
  selectedTimeText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledText: {
    color: '#EF4444',
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  noSlotsText: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  scheduleButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backScheduleButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  backScheduleButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleSubmitButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  scheduleSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectionX: {
    fontSize: 24,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  tryAgainButton: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tryAgainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});