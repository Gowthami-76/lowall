import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Save, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from '../../utils/constants';
import { useFocusEffect } from "@react-navigation/native";

export default function EditProfileScreen() {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    location: '',
    avatar: '',
  });

  // API states
  const [userId, setUserId] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [selectedImageUri, setSelectedImageUri] = useState(null); // Local image for preview

  // Check login status and get userId
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const id = await AsyncStorage.getItem("userId");

        if (token && id) {
          setUserId(id);
        } else {
          Alert.alert('Error', 'Please login to edit your profile');
          router.back();
        }
      } catch (err) {
        console.error("Error checking login:", err);
      }
    };

    checkLoginStatus();
  }, []);

  // Fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoadingProfile(true);
      setProfileError(null);
      
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
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
        const userData = json.data;
        setProfile({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          bio: userData.bio || '',
          location: userData.location || '',
          avatar: userData.avatar || '',
        });
        console.log("Profile data loaded for editing:", userData);
      } else {
        setProfileError("Failed to load profile data");
        console.error("Profile API error:", json);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfileError("Network error while loading profile");
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  // Update user profile
  const updateUserProfile = async () => {
    if (!userId) return;
    
    try {
      setSavingProfile(true);
      
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }

      // Step 1: Upload image first if there's a selected image
      let avatarKey = profile.avatar; // Keep existing avatar if no new image
      if (selectedImageUri) {
        console.log("Uploading new avatar image...");
        avatarKey = await uploadSelectedImage();
        if (!avatarKey) {
          throw new Error("Failed to upload avatar image");
        }
      }

      // Step 2: Prepare update data - include avatar key and other fields
      const updateData = {};
      if (profile.firstName.trim()) updateData.firstName = profile.firstName.trim();
      if (profile.lastName.trim()) updateData.lastName = profile.lastName.trim();
      if (profile.bio.trim()) updateData.bio = profile.bio.trim();
      if (profile.location.trim()) updateData.location = profile.location.trim();
      if (avatarKey) updateData.avatar = avatarKey; // Include avatar key

      console.log("Updating profile with data:", updateData);

      // Step 3: Update user profile with all data including avatar
      const response = await fetch(`${BASE_URL}/v1/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const json = await response.json();
      
      if (json.success) {
        // Clear selected image after successful save
        setSelectedImageUri(null);
        
        // Update profile state with new avatar key
        if (avatarKey) {
          setProfile(prev => ({ ...prev, avatar: avatarKey }));
        }

        Alert.alert(
          'Success', 
          'Profile updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', json.message || 'Failed to update profile');
        console.error("Profile update API error:", json);
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Load profile when userId is available
  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId, fetchUserProfile]);

  // Request camera and media library permissions
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        console.log('Permissions not granted for camera or media library');
      }
    };

    requestPermissions();
  }, []);

  // Refresh profile when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log("EditProfile screen focused, loading profile");
      if (userId) {
        fetchUserProfile();
      }
    }, [userId, fetchUserProfile])
  );

  // Image picker functions
  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickImage();
          }
        }
      );
    } else {
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Library', onPress: pickImage },
        ]
      );
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Set the selected image for preview (don't upload yet)
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Photo library permission is required to select images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Set the selected image for preview (don't upload yet)
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Upload selected image to S3 and return the key
  const uploadSelectedImage = async () => {
    if (!selectedImageUri) return null;
    
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Step 1: Prepare file details
      const fileName = `avatar_${userId}_${Date.now()}.jpg`;
      const mimeType = "image/jpeg";

      // Step 2: Request signed URL
      const signedRes = await fetch(
        `${BASE_URL}/v1/file/signed-url?fileName=${encodeURIComponent(fileName)}&mimeType=${encodeURIComponent(mimeType)}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const signedData = await signedRes.json();
      console.log("Avatar upload signed URL response", signedData);

      if (!signedData?.url || !signedData?.key) {
        throw new Error("Failed to get signed URL for avatar upload");
      }

      const { key, url } = signedData;

      // Step 3: Convert image to blob and upload to S3
      const fileResponse = await fetch(selectedImageUri);
      const fileBlob = await fileResponse.blob();

      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "image/jpeg",
        },
        body: fileBlob,
      });

      if (!uploadRes.ok) {
        throw new Error(`Avatar upload failed with status ${uploadRes.status}`);
      }

      console.log("✅ Avatar uploaded successfully!");
      return key; // Return the S3 key
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const handleSave = () => {
    // Basic validation
    if (!profile.firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return;
    }

    if (!profile.lastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required');
      return;
    }

    // Show confirmation
    Alert.alert(
      'Save Changes',
      'Are you sure you want to update your profile?',
      [
        { text: 'Cancel' },
        {
          text: 'Save',
          onPress: updateUserProfile
        }
      ]
    );
  };

  const getProfileImageUri = () => {
    // Show selected image for preview, fallback to current avatar, then default
    return selectedImageUri || profile.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200';
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

        <Text style={styles.headerTitle}>Edit Profile</Text>

        <TouchableOpacity
          style={[styles.saveButton, savingProfile && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={savingProfile || loadingProfile}
        >
          {savingProfile ? (
            <ActivityIndicator size={20} color="#8B5CF6" />
          ) : (
            <Save size={20} color="#8B5CF6" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loadingProfile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <>
            {/* Profile Photo */}
            <View style={styles.photoSection}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: getProfileImageUri() }}
                  style={styles.profileImage}
                  onError={(e) => {
                    console.log('Profile image load error:', e.nativeEvent.error);
                  }}
                />
                <TouchableOpacity 
                  style={styles.cameraButton}
                  onPress={showImagePickerOptions}
                  disabled={savingProfile}
                >
                  <Camera size={16} color="white" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={styles.changePhotoButton}
                onPress={showImagePickerOptions}
                disabled={savingProfile}
              >
                <Text style={[styles.changePhotoText, savingProfile && styles.disabledText]}>
                  {selectedImageUri ? 'Change Photo' : 'Add Photo'}
                </Text>
              </TouchableOpacity>
              {selectedImageUri && (
                <Text style={styles.imagePreviewText}>
                  New image selected. Save changes to upload.
                </Text>
              )}
            </View>

            {/* Error Display */}
            {profileError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{profileError}</Text>
                <TouchableOpacity onPress={fetchUserProfile} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={profile.firstName}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, firstName: text }))}
                  placeholder="Enter first name"
                  editable={!savingProfile}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={profile.lastName}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, lastName: text }))}
                  placeholder="Enter last name"
                  editable={!savingProfile}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={profile.email}
                  placeholder="Email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={false} // Email is typically not editable
                />
                <Text style={styles.helperText}>Email cannot be changed</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={profile.location}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
                  placeholder="Enter your location"
                  editable={!savingProfile}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={profile.bio}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
                  placeholder="Tell us about yourself"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!savingProfile}
                />
              </View>


            </View>

            <TouchableOpacity 
              style={[styles.saveButtonLarge, savingProfile && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={savingProfile || loadingProfile}
            >
              {savingProfile ? (
                <View style={styles.savingContainer}>
                  <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.saveButtonText}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <View style={styles.bottomPadding} />
          </>
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
  saveButton: {
    padding: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    marginBottom: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  imagePreviewText: {
    fontSize: 12,
    color: '#059669',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
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
  formSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  saveButtonLarge: {
    backgroundColor: '#8B5CF6',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bottomPadding: {
    height: 40,
  },
});