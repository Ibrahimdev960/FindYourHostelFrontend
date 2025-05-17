import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../service/api';
import { Feather } from '@expo/vector-icons';

const StripePayment = ({
  amount,
  hostelId,
  roomId,
  checkInDate,
  checkOutDate,
  seatsBooked,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [token, setToken] = useState('');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const initializedRef = useRef(false);

  // Define confirmBooking using useCallback to maintain reference stability
  const confirmBooking = useCallback(async (intentId) => {
    try {
      console.log("Confirming booking with:", { 
        paymentIntentId: intentId, 
        hostelId, 
        roomId 
      });

      const response = await fetch(`${BASE_URL}/payment/payment-success`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: intentId,
          hostelId,
          roomId,
          checkInDate,
          checkOutDate,
          seatsBooked,
          amount
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm booking');
      }

      return await response.json();
    } catch (error) {
      console.error('Booking confirmation error:', error);
      throw error;
    }
  }, [token, hostelId, roomId, checkInDate, checkOutDate, seatsBooked, amount]);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (!storedToken) {
          throw new Error('No authentication token found');
        }
        setToken(storedToken);
      } catch (error) {
        console.error('Token load error:', error);
        Alert.alert('Authentication Error', 'Please login again');
        onCancel?.();
      }
    };
    loadToken();
  }, []);
  const initializePayment = useCallback(async () => {
    if (!token || !amount || initializedRef.current) return;
    
    setLoading(true);
    try {
      console.log('Creating payment intent...');
      const response = await fetch(`${BASE_URL}/payment/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents/paisa
          hostelId: hostelId.toString(),
          roomId: roomId.toString(),
          seatsBooked: seatsBooked.toString(),
          currency: 'pkr'
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }
  
      const data = await response.json();
      console.log('Payment intent response:', data);
      
      if (!data.clientSecret) {
        throw new Error('No client secret received from server');
      }
  
      setPaymentIntentId(data.paymentIntentId);
  
      console.log('Initializing payment sheet...');
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'Hostellite',
        paymentIntentClientSecret: data.clientSecret,
        defaultBillingDetails: {
          name: 'Hostel Booking',
        }
      });
  
      if (error) {
        throw error;
      }
  
      initializedRef.current = true;
    } catch (error) {
      console.error('Payment initialization error:', error);
      Alert.alert(
        'Payment Error', 
        error.message || 'Failed to initialize payment. Please check your network connection.'
      );
      onCancel?.();
    } finally {
      setLoading(false);
    }
  }, [token, amount, hostelId, roomId, seatsBooked, initPaymentSheet]);
  
  useEffect(() => {
    initializePayment();
  }, [initializePayment]);

  const handlePayment = async () => {
    if (!initializedRef.current) {
      Alert.alert('Payment Not Ready', 'Please wait while we set up your payment');
      return;
    }
  
    setLoading(true);
    try {
      console.log('Presenting payment sheet...');
      const { error } = await presentPaymentSheet();

      if (error) {
        console.error('Payment error:', error);
        throw error;
      }

      if (!paymentIntentId) {
        throw new Error('Missing payment intent ID');
      }
  
      console.log('Payment successful, creating booking...');
      const bookingData = await confirmBooking(paymentIntentId);
      
      setPaymentCompleted(true);
      onSuccess?.(bookingData);
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert('Payment Failed', error.message || 'Payment could not be completed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      {!paymentCompleted && (
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onCancel}
        >
          <Feather name="x" size={24} color="#666" />
        </TouchableOpacity>
      )}
      
      {loading && !initializedRef.current ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A0DAD" />
          <Text style={styles.loadingText}>Setting up payment...</Text>
        </View>
      ) : paymentCompleted ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>Payment Successful!</Text>
          <TouchableOpacity
            style={styles.closeSuccessButton}
            onPress={onCancel}
          >
            <Text style={styles.closeSuccessText}>Close</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.amount}>Total: PKR {amount.toLocaleString()}</Text>
          <TouchableOpacity
            style={[
              styles.payButton,
              loading && styles.disabledButton
            ]}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>Pay Now</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6A0DAD',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  payButton: {
    backgroundColor: '#6A0DAD',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 20,
  },
  closeSuccessButton: {
    backgroundColor: '#6A0DAD',
    padding: 10,
    borderRadius: 5,
    width: 100,
    alignItems: 'center',
  },
  closeSuccessText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default StripePayment;