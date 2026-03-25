import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../utils/constants";


const CreateSlotScreen = () => {
  const router = useRouter();
  const { postId } = useLocalSearchParams(); // 👈 postId from route
  const [currentUserId, setCurrentUserId] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const { image, message, selectedOccasion } = useLocalSearchParams();
  const [name, setName] = useState('');


  // get userId from storage
  useEffect(() => {
    const fetchUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      setCurrentUserId(id);
      console.log("Current User ID:", id);
    };
    fetchUserId();
  }, []);
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


  // fetch slots when date changes
  useEffect(() => {
    if (!selectedDate || !currentUserId) return;
    console.log("fetch slots:");

    const fetchSlots = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          console.error("No token found");
          return;
        }


        const res = await fetch(`${BASE_URL}/v1/slot?date=${selectedDate}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();
        console.log("Like API response:", data);

        // const data = await res.json();

        if (data.success) {
          let filteredSlots = data.slots;

          // ✅ If the selected date is today, filter slots after current time
          const today = new Date().toISOString().split("T")[0];
          if (selectedDate === today) {
            const now = new Date();
            now.setHours(now.getHours() + 4);

            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            filteredSlots = filteredSlots.filter((slot) => {
              const [h, m] = slot.startTime.split(":").map(Number);
              const slotMinutes = h * 60 + m;
              return slotMinutes > currentMinutes;
            });
          }

          setSlots(filteredSlots);
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate, currentUserId]);

  const handleSchedule = async () => {
  console.log("post id", postId);

  // CASE 1: No postId exists - Create post first, then schedule
  if (!postId) {
    try {
      setLoading(true); // show loader

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Error", "No token found. Please login again.");
        setLoading(false);
        return;
      }

      // Step 1: Prepare file details
      const fileName = `photo_${Date.now()}.jpg`;
      const mimeType = "image/jpeg";

      console.log("image details", fileName);

      // Step 2: Request signed URL
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
        setLoading(false);
        return;
      }
      const { key, url } = signedData;

      // Step 3: Upload file to S3
      const fileResponse = await fetch(image);
      const fileBlob = await fileResponse.blob();

      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "image/jpeg",
        },
        body: fileBlob,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed with status ${uploadRes.status}`);
      }
      console.log("✅ File uploaded successfully!");

      // Step 4: Create post API
      const postRes = await fetch(`${BASE_URL}/v1/post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: name,
          content: message,
          mediaUrl: key,
          tags: selectedOccasion ? [selectedOccasion] : [],
        }),
      });

      console.log("📌 Create Post Response:", name, message, selectedOccasion);

      const postData = await postRes.json();
      console.log("📌 Create Post Response:", postData);
      const newPostId = postData._id;

      // Step 5: Now schedule the slot with the new postId
      if (!selectedDate || !selectedSlot) {
        Alert.alert("Error", "Please select a date and time slot");
        setLoading(false);
        return;
      }

      const payload = {
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        postId: newPostId,
      };

      console.log("Scheduling slot payload:", payload);

      const slotRes = await fetch(`${BASE_URL}/v1/slot`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const slotData = await slotRes.json();
      console.log("Schedule slot response:", slotData);

      setLoading(false);

      if (slotData.success) {
        Alert.alert(
          "Success",
          `Slot booked for ${selectedDate} (${selectedSlot.startTime} - ${selectedSlot.endTime})`,
          [
            {
              text: "OK",
              onPress: () => router.push("/(tabs)"),
            },
          ]
        );
      } else {
        Alert.alert("Error", slotData.message || "Failed to schedule slot");
      }
    } catch (err) {
      console.error("Photo submit error:", err);
      Alert.alert("Error", "Something went wrong. Try again.");
      setLoading(false);
    }
  } 
  // CASE 2: postId already exists - Just schedule the slot
  else {
    if (!selectedDate || !selectedSlot) {
      Alert.alert("Error", "Please select a date and time slot");
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Error", "No token found");
        setLoading(false);
        return;
      }

      const payload = {
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        postId: postId,
      };

      console.log("Scheduling slot payload:", payload);

      const res = await fetch(`${BASE_URL}/v1/slot`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Schedule slot response:", data);

      setLoading(false);

      if (data.success) {
        Alert.alert(
          "Success",
          `Slot booked for ${selectedDate} (${selectedSlot.startTime} - ${selectedSlot.endTime})`,
          [
            {
              text: "OK",
              onPress: () => router.push("/(tabs)"),
            },
          ]
        );
      } else {
        Alert.alert("Error", data.message || "Failed to schedule slot");
      }
    } catch (err) {
      setLoading(false);
      console.error("Error scheduling slot:", err);
      Alert.alert("Error", "Something went wrong while scheduling the slot");
    }
  }
};

  // const handleSchedule = async () => {


  //   console.log("post id", postId);

  //   if (!postId) {
  //     try {

  //       setLoading(true);  // show loader


  //       const token = await AsyncStorage.getItem("authToken");
  //       if (!token) {
  //         Alert.alert("Error", "No token found. Please login again.");
  //         return;
  //       }

  //       // Step 1: prepare file details
  //       const fileName = `photo_${Date.now()}.jpg`;
  //       const mimeType = "image/jpeg";

  //       console.log("image details", fileName);
  //       // Step 2: request signed URL
  //       const signedRes = await fetch(
  //         `${BASE_URL}/v1/file/signed-url?fileName=${encodeURIComponent(fileName)}&mimeType=${encodeURIComponent(mimeType)}`,
  //         {
  //           method: "POST",
  //           headers: { Authorization: `Bearer ${token}` },
  //         }
  //       );

  //       const signedData = await signedRes.json();
  //       console.log("upload response", signedData);

  //       if (!signedData?.url || !signedData?.key) {
  //         Alert.alert("Error", "Failed to get signed URL");

  //         return;
  //       }
  //       const { key, url } = signedData;


  //       const fileResponse = await fetch(image); // "image" is the local uri from picker
  //       const fileBlob = await fileResponse.blob();

  //       const uploadRes = await fetch(url, {
  //         method: "PUT",
  //         headers: {
  //           "Content-Type": "image/jpeg",
  //         },
  //         body: fileBlob,
  //       });

  //       if (!uploadRes.ok) {
  //         // setApprovalStatus('rejected');

  //         // setCurrentStep("rejected");
  //         throw new Error(`Upload failed with status ${uploadRes.status}`);
  //       }
  //       console.log("✅ File uploaded successfully!");

  //       // STEP 3: Call create post API after upload success
  //       const postRes = await fetch(`${BASE_URL}/v1/post`, {
  //         method: "POST",
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           title: name,
  //           content: message,
  //           mediaUrl: key, // save the S3 key, not signed url
  //           tags: selectedOccasion ? [selectedOccasion] : [],
  //         }),
  //       });
  //       console.log("📌 Create Post Response:", name, message, selectedOccasion);

  //       const postData = await postRes.json();
  //       console.log("📌 Create Post Response:", postData);
  //       const postId = postData._id;




  //       if (!selectedDate || !selectedSlot) {
  //         Alert.alert("Error", "Please select a date and time slot");
  //         return;
  //       }

  //       try {
  //         const token = await AsyncStorage.getItem("authToken");
  //         if (!token) {
  //           Alert.alert("Error", "No token found");
  //           return;
  //         }

  //         const payload = {
  //           date: selectedDate,
  //           startTime: selectedSlot.startTime,
  //           endTime: selectedSlot.endTime,
  //           postId: postId,  // 👈 from params
  //         };

  //         console.log("Scheduling slot payload:", payload);

  //         const res = await fetch(`${BASE_URL}/v1/slot`, {
  //           method: "POST",
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify(payload),
  //         });

  //         const data = await res.json();
  //         console.log("Schedule slot response:", data);

  //         if (data.success) {
  //           Alert.alert(
  //             "Success",
  //             `Slot booked for ${selectedDate} (${selectedSlot.startTime} - ${selectedSlot.endTime})`,
  //             [
  //               {
  //                 text: "OK",
  //                 onPress: () => router.push("/(tabs)"),

  //                 // onPress: () => router.back(), // navigate back when OK is pressed
  //               },
  //             ]
  //           );
  //         } else {
  //           Alert.alert("Error", data.message || "Failed to schedule slot");
  //         }
  //       } catch (err) {
  //         setLoading(false);

  //         console.error("Error scheduling slot:", err);
  //         Alert.alert("Error", "Something went wrong while scheduling the slot");
  //       }


  //     } catch (err) {
  //       console.error("Photo submit error:", err);
  //       Alert.alert("Error", "Something went wrong. Try again.");
  //       // setCurrentStep("rejected");
  //       // setApprovalStatus('rejected');

  //       setLoading(false);

  //     } finally {
  //       setLoading(false);
  //     }
  //   } else {



  //     if (!selectedDate || !selectedSlot) {
  //       Alert.alert("Error", "Please select a date and time slot");
  //       return;
  //     }

  //     try {
  //       const token = await AsyncStorage.getItem("authToken");
  //       if (!token) {
  //         Alert.alert("Error", "No token found");
  //         return;
  //       }

  //       const payload = {
  //         date: selectedDate,
  //         startTime: selectedSlot.startTime,
  //         endTime: selectedSlot.endTime,
  //         postId: postId,  // 👈 from params
  //       };

  //       console.log("Scheduling slot payload:", payload);

  //       const res = await fetch(`${BASE_URL}/v1/slot`, {
  //         method: "POST",
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(payload),
  //       });

  //       const data = await res.json();
  //       console.log("Schedule slot response:", data);

  //       if (data.success) {
  //         Alert.alert(
  //           "Success",
  //           `Slot booked for ${selectedDate} (${selectedSlot.startTime} - ${selectedSlot.endTime})`,
  //           [
  //             {
  //               text: "OK",
  //               onPress: () => router.push("/(tabs)"),

  //               // onPress: () => router.back(), // navigate back when OK is pressed
  //             },
  //           ]
  //         );
  //       } else {
  //         Alert.alert("Error", data.message || "Failed to schedule slot");
  //       }
  //     } catch (err) {
  //       setLoading(false);

  //       console.error("Error scheduling slot:", err);
  //       Alert.alert("Error", "Something went wrong while scheduling the slot");
  //     }
  //   }



  // };
  const renderSlot = ({ item }) => {
    const isSelected =
      selectedSlot &&
      selectedSlot.startTime === item.startTime &&
      selectedSlot.endTime === item.endTime;

    // console.log("sale status",item.saleStatus);
    return (
      <TouchableOpacity
        disabled={item.isBooked}
        onPress={() => setSelectedSlot(item)}
        style={[
          styles.slot,
          item.isBooked && styles.bookedSlot,
          item.saleStatus === "available" && styles.resaleSlot,
          isSelected && styles.selectedSlot,
        ]}
      >
        <Text style={[styles.slotText, isSelected && { color: "white" }]}>
          {item.startTime} - {item.endTime}
        </Text>

        {item.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>♔ Premium</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ Header */}
      <Stack.Screen
        options={{
          title: "Create Slot",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push("/posts")}>
              <Text style={{ color: "white", marginLeft: 10 }}>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <Text style={styles.header}>Select a Date</Text>
      <Calendar
        minDate={new Date().toISOString().split("T")[0]}
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
          setSelectedSlot(null);
        }}
        markedDates={
          selectedDate ? { [selectedDate]: { selected: true } } : {}
        }
      />

      {selectedDate && (
        <>
          <Text style={styles.header}>Available Slots</Text>

          {loading ? (
            <ActivityIndicator size="large" color="blue" />
          ) : slots.length > 0 ? (
            <FlatList
              data={slots}
              numColumns={2}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderSlot}
              columnWrapperStyle={{ justifyContent: "space-between" }}
            />
          ) : (
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              No slots available
            </Text>
          )}
        </>
      )}

      {selectedDate && selectedSlot && (
        <TouchableOpacity
          style={styles.scheduleButton}
          onPress={handleSchedule}
        >
          <Text style={styles.scheduleText}>Schedule Slot</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default CreateSlotScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F9FAFB" },
  header: { fontSize: 18, fontWeight: "600", marginVertical: 12 },
  slot: {
    flex: 1,
    margin: 5,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: "#56b75eff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bookedSlot: {
    backgroundColor: "#f44336",
  },
  resaleSlot: {
    backgroundColor: "#ea8417e9",
  },
  selectedSlot: {
    backgroundColor: "#2563EB",
  },
  slotText: { fontSize: 14, fontWeight: "500", color: "#111827" },
  premiumBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "gold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumText: { fontSize: 10, fontWeight: "bold", color: "#000" },
  scheduleButton: {
    marginTop: 20,
    backgroundColor: "#10B981",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  scheduleText: { color: "white", fontSize: 16, fontWeight: "600" },
});


