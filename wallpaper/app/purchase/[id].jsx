import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, Calendar, Star, CreditCard, Shield, CircleCheck as CheckCircle, DollarSign, User, MapPin, Smartphone } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Mock data - in real app this would come from API
const slotData = {
  1: {
    id: 1,
    sellerName: 'Alex Thompson',
    sellerImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    timeSlot: '8:00 AM - 8:30 AM',
    date: 'Tomorrow',
    originalPrice: 25,
    askingPrice: 20,
    category: 'Prime Morning',
    description: 'Perfect for motivation quotes and morning wishes',
    isPremium: true,
    rating: 4.8,
    totalSlots: 45,
  }
};

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit Card',
    icon: CreditCard,
    subtitle: 'Visa, Mastercard, American Express',
    isDefault: true,
  },
  {
    id: 'apple',
    name: 'Apple Pay',
    icon: Smartphone,
    subtitle: 'Touch ID or Face ID',
    isDefault: false,
  },
  {
    id: 'google',
    name: 'Google Pay',
    icon: Shield,
    subtitle: 'Fast and secure',
    isDefault: false,
  },
];

export default function PurchaseScreen() {
  const { id } = useLocalSearchParams();
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const slot = slotData[id] || slotData[1];

  const slideInValue = useSharedValue(-width);
  const fadeValue = useSharedValue(0);
  const scaleValue = useSharedValue(0.8);

  useEffect(() => {
    slideInValue.value = withSpring(0);
    fadeValue.value = withTiming(1, { duration: 500 });
    scaleValue.value = withSpring(1);
  }, []);

  const slideAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideInValue.value }],
  }));

  const fadeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ scale: scaleValue.value }],
  }));

  const handlePurchase = () => {
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Purchase Successful! 🎉',
        'Your time slot has been reserved. You can now schedule your message.',
        [
          {
            text: 'View My Slots',
            onPress: () => router.push('/my-slots'),
          },
          {
            text: 'Schedule Message',
            onPress: () => router.push(`/schedule/${slot.id}`),
          },
        ]
      );
    }, 2000);
  };

  const PurchaseButton = () => {
    const buttonScale = useSharedValue(1);
    const buttonOpacity = useSharedValue(1);

    const buttonAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: buttonScale.value }],
      opacity: buttonOpacity.value,
    }));

    const onPressIn = () => {
      buttonScale.value = withSpring(0.98);
    };

    const onPressOut = () => {
      buttonScale.value = withSpring(1);
    };

    return (
      <Animated.View style={buttonAnimatedStyle}>
        <TouchableOpacity
          style={[styles.purchaseButton, isProcessing && styles.purchaseButtonDisabled]}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={handlePurchase}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Text style={styles.purchaseButtonText}>Processing...</Text>
          ) : (
            <>
              {/* <DollarSign size={20} color="white" /> */}
              <Text style={styles.purchaseButtonText}>
                Complete Purchase - {slot.askingPrice}
              </Text>
            </>
          )}
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
        <Text style={styles.headerTitle}>Complete Purchase</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Slot Details Card */}
        <Animated.View style={[styles.slotCard, slideAnimatedStyle]}>
          {slot.isPremium && (
            <View style={styles.premiumBadge}>
              <Star size={12} color="white" fill="white" />
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          )}

          <View style={styles.slotHeader}>
            <Image source={{ uri: slot.sellerImage }} style={styles.sellerImage} />
            <View style={styles.slotInfo}>
              <Text style={styles.sellerName}>{slot.sellerName}</Text>
              <View style={styles.ratingContainer}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{slot.rating}</Text>
                <Text style={styles.slotsText}>• {slot.totalSlots} slots sold</Text>
              </View>
            </View>
          </View>

          <View style={styles.timeDetails}>
            <View style={styles.timeRow}>
              <Clock size={18} color="#8B5CF6" />
              <Text style={styles.timeText}>{slot.timeSlot}</Text>
            </View>
            <View style={styles.timeRow}>
              <Calendar size={18} color="#6B7280" />
              <Text style={styles.dateText}>{slot.date}</Text>
            </View>
            <View style={styles.timeRow}>
              <MapPin size={18} color="#10B981" />
              <Text style={styles.categoryText}>{slot.category}</Text>
            </View>
          </View>

          <Text style={styles.descriptionText}>{slot.description}</Text>
        </Animated.View>

        {/* Payment Methods */}
        <Animated.View style={[styles.section, fadeAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          {paymentMethods.map((method) => {
            const IconComponent = method.icon;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  selectedPayment === method.id && styles.paymentMethodSelected
                ]}
                onPress={() => setSelectedPayment(method.id)}
              >
                <View style={styles.paymentLeft}>
                  <View style={[
                    styles.paymentIconContainer,
                    selectedPayment === method.id && styles.paymentIconSelected
                  ]}>
                    <IconComponent
                      size={20}
                      color={selectedPayment === method.id ? 'white' : '#6B7280'}
                    />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentName}>{method.name}</Text>
                    <Text style={styles.paymentSubtitle}>{method.subtitle}</Text>
                  </View>
                </View>

                <View style={[
                  styles.radioButton,
                  selectedPayment === method.id && styles.radioButtonSelected
                ]}>
                  {selectedPayment === method.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Order Summary */}
        <Animated.View style={[styles.section, fadeAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Slot Price</Text>
              <Text style={styles.summaryValue}>${slot.originalPrice}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.discountValue}>
                -${slot.originalPrice - slot.askingPrice}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Fee</Text>
              <Text style={styles.summaryValue}>$1</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${slot.askingPrice + 1}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Security Badge */}
        <Animated.View style={[styles.securityBadge, fadeAnimatedStyle]}>
          <Shield size={16} color="#10B981" />
          <Text style={styles.securityText}>
            Your payment is secured with 256-bit SSL encryption
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Purchase Button */}
      <View style={styles.footer}>
        <PurchaseButton />
      </View>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  slotCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    zIndex: 1,
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  premiumBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  slotInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  slotsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  dateText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryText: {
    fontSize: 15,
    color: '#10B981',
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    marginBottom: 12,
  },
  paymentMethodSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentIconSelected: {
    backgroundColor: '#8B5CF6',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  paymentSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#8B5CF6',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B5CF6',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  discountValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  securityText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  purchaseButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
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
  purchaseButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
});