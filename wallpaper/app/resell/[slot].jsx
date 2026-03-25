import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Clock, DollarSign, Tag, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function ResellScreen() {
  const { slot } = useLocalSearchParams();
  let slotData = null;

  try {
    slotData = slot ? JSON.parse(decodeURIComponent(slot)) : null;
    console.log("slot data", slot);
  } catch (e) {
    console.error("Failed to parse slot param:", e);
  }
  // const slotData = slot ? JSON.parse(slot) : null;

  const [resellPrice, setResellPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);



  if (!slotData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Slot Not Found</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>The premium slot you're looking for doesn't exist.</Text>
        </View>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!resellPrice || parseFloat(resellPrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid resell price');
      return;
    }

    if (parseFloat(resellPrice) > slotData.originalPrice * 2) {
      Alert.alert('Error', 'Resell price cannot be more than twice the original price');
      return;
    }

    setIsSubmitting(true);

    if (!slotData?._id) {
      Alert.alert("Error", "Slot ID missing!");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.log("No token found");
        return;
      }
      // ✅ API request
      const res = await fetch("http://35.154.98.17:3000/v1/slot/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slotId: slotData._id,
          salePrice: resellPrice,
              saleDescription: description, // ✅ include description

        }),
      });

      const data = await res.json();
      console.log("Resell Response:", data);
      if (res.ok) {
        Alert.alert("Success", "Slot resold successfully!", [
          {
            text: "OK",
            // onPress: () => router.back(), // 👈 go back after success
            onPress: () =>
      router.push({
        pathname: "/profile",
        params: { refresh: true }, // 👈 send refresh flag
      }),
          },
        ]);
      } else {
        Alert.alert("Failed", data?.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Resell error:", err);
      Alert.alert("Error", "Failed to resell slot");
    } finally {
      setIsSubmitting(false);

      setLoading(false);
    }

    // Simulate API call
    // setTimeout(() => {
    //   setIsSubmitting(false);
    //   Alert.alert(
    //     'Success!',
    //     'Your premium slot has been listed for resale. You will be notified when someone purchases it.',
    //     [
    //       {
    //         text: 'OK',
    //         onPress: () => router.back(),
    //       },
    //     ]
    //   );
    // }, 1500);
  };

  const suggestedPrices = [
    (slotData.price ?? 0) * 0.8,
    (slotData.price ?? 0) * 0.9,
    (slotData.price ?? 0),
    (slotData.price ?? 0) * 1.1,
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resell Premium Slot</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Slot Details Card */}
        <View style={styles.slotCard}>
          <Text style={styles.sectionTitle}>Slot Details</Text>

          <View style={styles.detailRow}>
            <Calendar size={20} color="#8B5CF6" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{slotData.date}</Text>
              <Text style={styles.detailSubValue}>{slotData.startTime}-{slotData.endTime}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Tag size={20} color="#F59E0B" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{slotData.category}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            {/* <DollarSign size={20} color="#10B981" /> */}
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Original Price</Text>
              <Text style={styles.detailValue}>{slotData.price}</Text>
              <Text style={styles.detailSubValue}>Purchased on {slotData.date}</Text>
            </View>
          </View>
        </View>

        {/* Pricing Section */}
        <View style={styles.pricingCard}>
          <Text style={styles.sectionTitle}>Set Resell Price</Text>

          <View style={styles.priceInputContainer}>
            <Text style={styles.inputLabel}>Resell Price </Text>
            <TextInput
              style={styles.priceInput}
              value={resellPrice}
              onChangeText={setResellPrice}
              placeholder="Enter price"
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.suggestedPrices}>
            <Text style={styles.suggestedLabel}>Suggested Prices:</Text>
            <View style={styles.priceButtons}>
              {suggestedPrices.map((price, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.priceButton,
                    resellPrice === price.toString() && styles.selectedPriceButton
                  ]}
                  onPress={() => setResellPrice(price.toString())}
                >
                  <Text style={[
                    styles.priceButtonText,
                    resellPrice === price.toString() && styles.selectedPriceButtonText
                  ]}>
                    {price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>Description (Optional)</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Add any additional details about your slot..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={200}
          />
          <Text style={styles.characterCount}>{description.length}/200</Text>
        </View>

        {/* Warning Card */}
        <View style={styles.warningCard}>
          <AlertTriangle size={20} color="#F59E0B" />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Important Notes</Text>
            <Text style={styles.warningText}>
              • Once listed, you cannot use this slot yourself{'\n'}
              • We charge a 5% commission on successful sales{'\n'}
              • You can cancel the listing anytime before sale{'\n'}
              • Payment will be processed after the buyer uses the slot
            </Text>
          </View>
        </View>

        {/* Earnings Preview */}
        {resellPrice && parseFloat(resellPrice) > 0 && (
          <View style={styles.earningsCard}>
            <CheckCircle size={20} color="#10B981" />
            <View style={styles.earningsContent}>
              <Text style={styles.earningsTitle}>You will receive</Text>
              <Text style={styles.earningsAmount}>
                ${(parseFloat(resellPrice) * 0.95).toFixed(2)}
              </Text>
              <Text style={styles.earningsSubtext}>
                (${resellPrice} - 5% commission)
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!resellPrice || parseFloat(resellPrice) <= 0 || isSubmitting) && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={!resellPrice || parseFloat(resellPrice) <= 0 || isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Listing for Sale...' : 'List for Resale'}
          </Text>
        </TouchableOpacity>
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
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  slotCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailSubValue: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  pricingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  priceInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  suggestedPrices: {
    marginTop: 8,
  },
  suggestedLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  priceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  selectedPriceButton: {
    borderColor: '#8B5CF6',
    backgroundColor: '#8B5CF6',
  },
  priceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedPriceButtonText: {
    color: 'white',
  },
  descriptionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  warningCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  warningContent: {
    marginLeft: 12,
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  earningsCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  earningsContent: {
    marginLeft: 12,
    flex: 1,
  },
  earningsTitle: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#166534',
  },
  earningsSubtext: {
    fontSize: 12,
    color: '#16A34A',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});