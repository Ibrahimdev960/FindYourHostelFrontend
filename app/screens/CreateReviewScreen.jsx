import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../service/api';
import { useNavigation } from '@react-navigation/native';

const Star = memo(({ filled, onPress, size }) => (
  <TouchableOpacity onPress={onPress}>
    <Ionicons
      name={filled ? 'star' : 'star-outline'}
      size={size}
      color="#FFD700"
      style={styles.starButton}
    />
  </TouchableOpacity>
));

const BookingItem = memo(({ booking, selected, onSelect }) => (
  <TouchableOpacity
    style={[
      styles.bookingCard,
      selected && styles.selectedBooking
    ]}
    onPress={onSelect}
  >
    <Text style={styles.bookingDate}>
      {new Date(booking.checkInDate).toLocaleDateString()} - 
      {new Date(booking.checkOutDate).toLocaleDateString()}
    </Text>
    <Text style={styles.bookingRoom}>{booking.roomType || 'Room'}</Text>
    <Text style={styles.bookingStatus}>{booking.status}</Text>
  </TouchableOpacity>
));

const CreateReviewScreen = ({ route }) => {
  const navigation = useNavigation();
  const { hostelId, hostelName, userBookings = [] } = route.params;
  
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleStarPress = useCallback((star) => {
    setRating(star);
  }, []);

  const handleBookingSelect = useCallback((booking) => {
    setSelectedBooking(booking);
    setError(null);
  }, []);

  const validateForm = useCallback(() => {
    if (!selectedBooking) {
      setError('Please select a booking');
      return false;
    }
    if (rating === 0) {
      setError('Please provide a rating');
      return false;
    }
    return true;
  }, [selectedBooking, rating]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${BASE_URL}/reviews/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          hostelId,
          bookingId: selectedBooking._id,
          rating,
          title: title.trim(),
          comment: comment.trim()
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }
      
      Alert.alert('Success', 'Review submitted successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Review submission error:', error);
      setError(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }, [selectedBooking, rating, title, comment, hostelId, navigation, validateForm]);

  const renderStars = useCallback(() => {
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star}
            filled={star <= rating}
            onPress={() => handleStarPress(star)}
            size={32}
          />
        ))}
      </View>
    );
  }, [rating, handleStarPress]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write Review</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <Text style={styles.hostelName}>{hostelName}</Text>

          <Text style={styles.label}>Select Booking *</Text>
          {userBookings.length === 0 ? (
            <Text style={styles.noBookingsText}>
              No eligible bookings found for this hostel
            </Text>
          ) : (
            <>
              <FlatList
                data={userBookings}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <BookingItem 
                    booking={item}
                    selected={selectedBooking?._id === item._id}
                    onSelect={() => handleBookingSelect(item)}
                  />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.bookingsList}
                contentContainerStyle={styles.bookingsContent}
              />
              {error && error.includes('booking') && (
                <Text style={styles.errorText}>{error}</Text>
              )}
            </>
          )}

          <Text style={styles.label}>Rating *</Text>
          {renderStars()}
          {error && error.includes('rating') && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Summary of your experience"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            blurOnSubmit={true}
            returnKeyType="done"
          />

          <Text style={styles.label}>Comment</Text>
          <TextInput
            style={[styles.input, styles.commentInput]}
            placeholder="Share details about your stay..."
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
            maxLength={500}
            textAlignVertical="top"
            blurOnSubmit={true}
          />

          {error && !error.includes('booking') && !error.includes('rating') && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Button to View Reviews */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('Review', { hostelId })}
      >
        <Ionicons name="list" size={24} color="white" />
        <Text style={styles.floatingButtonText}>Reviews</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6A0DAD',
    flex: 1,
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  hostelName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6A0DAD',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  bookingsList: {
    marginBottom: 10,
  },
  bookingsContent: {
    paddingHorizontal: 5,
  },
  bookingCard: {
    backgroundColor: '#F5F0FA',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0D4F7',
    width: 160,
    height: 80,
  },
  selectedBooking: {
    borderColor: '#6A0DAD',
    backgroundColor: '#E8F4FD',
    borderWidth: 2,
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookingRoom: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  bookingStatus: {
    fontSize: 12,
    color: '#6A0DAD',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  noBookingsText: {
    color: '#999',
    textAlign: 'center',
    marginVertical: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  starButton: {
    marginHorizontal: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0D4F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F5F0FA',
  },
  commentInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#6A0DAD',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 5,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#6A0DAD',
    borderRadius: 30,
    width: 120,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  floatingButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
  },
});

export default CreateReviewScreen;