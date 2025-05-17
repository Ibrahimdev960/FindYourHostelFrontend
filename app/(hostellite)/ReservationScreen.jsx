import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert, ActivityIndicator, FlatList
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import StripePayment from './StripePayment';
import { useSelector, useDispatch } from 'react-redux';
import { BASE_URL } from '../../service/api';
import { createBooking } from '../../src/redux/bookSlice';

const ReservationScreen = () => {
  const { hostel } = useRoute().params;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { status: bookingStatus, error: bookingError } = useSelector((state) => state.bookings);
  
  // State management
  const [state, setState] = useState({
    loading: false,
    checkInDate: new Date(),
    checkOutDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    showDatePicker: false,
    currentDateType: null,
    paymentMethod: 'online',
    selectedImageIndex: 0,
    showPayment: false,
    rooms: [],
    selectedRoom: null,
    seatsBooked: 1
  });

  // Memoized values
  const selectedRoomObj = useMemo(() => 
    state.rooms.find(room => room._id === state.selectedRoom), 
    [state.rooms, state.selectedRoom]);

  const totalMonths = useMemo(() => 
    (state.checkOutDate.getFullYear() - state.checkInDate.getFullYear()) * 12 + 
    (state.checkOutDate.getMonth() - state.checkInDate.getMonth()), 
    [state.checkInDate, state.checkOutDate]);

  const totalPrice = useMemo(() => 
    selectedRoomObj ? totalMonths * selectedRoomObj.pricePerBed * state.seatsBooked : 0, 
    [totalMonths, selectedRoomObj, state.seatsBooked]);

  // Helper functions
  const formatDate = useCallback(date => 
    date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), []);

  const updateState = useCallback(newState => 
    setState(prev => ({ ...prev, ...newState })), []);

  // Handlers
  const handleDateChange = useCallback((event, selectedDate) => {
    if (event.type === 'set' && selectedDate) {
      if (state.currentDateType === 'checkIn') {
        const nextMonth = new Date(selectedDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        updateState({ 
          checkInDate: selectedDate, 
          checkOutDate: nextMonth,
          showDatePicker: false 
        });
      } else {
        const minCheckout = new Date(state.checkInDate);
        minCheckout.setMonth(minCheckout.getMonth() + 1);
        
        if (selectedDate < minCheckout) {
          Alert.alert('Minimum Stay', 'Hostel requires a minimum stay of 1 month');
          updateState({ 
            checkOutDate: minCheckout,
            showDatePicker: false 
          });
        } else {
          updateState({ 
            checkOutDate: selectedDate,
            showDatePicker: false 
          });
        }
      }
    } else {
      updateState({ showDatePicker: false });
    }
  }, [state.currentDateType, state.checkInDate]);

// In your handleBookNow function
const handleBookNow = async () => {
  try {
    // 1. Create pending booking first
    const bookingResult = await dispatch(createBooking({
      hostelId: hostel._id,
      roomId: state.selectedRoom,
      checkInDate: state.checkInDate.toISOString(),
      checkOutDate: state.checkOutDate.toISOString(),
      seatsBooked: state.seatsBooked,
      paymentStatus: 'pending',
      amount: totalPrice
    }));

    if (!createBooking.fulfilled.match(bookingResult)) {
      throw new Error('Booking creation failed');
    }

    const booking = bookingResult.payload;

    // 2. Only then show payment for pending bookings
    if (state.paymentMethod === 'online') {
      updateState({ 
        showPayment: true,
        currentBookingId: booking._id // Store booking ID
      });
    } else {
      // Handle cash payment
      await dispatch(confirmBooking(booking._id));
      navigation.navigate('BookingConfirmation', { bookingId: booking._id });
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

  // Effects
  useEffect(() => {
    const loadRooms = async () => {
      try {
        updateState({ loading: true });
        const roomsRes = await fetch(`${BASE_URL}/rooms/hostel/${hostel._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!roomsRes.ok) {
          throw new Error('Failed to fetch rooms');
        }

        const rooms = await roomsRes.json();
        updateState({ 
          rooms,
          selectedRoom: rooms[0]?._id || null,
          loading: false
        });
      } catch (error) {
        console.error('Error:', error);
        Alert.alert('Error', error.message || 'Failed to load rooms');
        updateState({ loading: false });
      }
    };
    
    if (token) {
      loadRooms();
    }
  }, [hostel._id, token]);

  // Render helpers
  const renderAmenity = useCallback((amenity) => (
    <View key={amenity} style={styles.amenityItem}>
      <Feather name="check-circle" size={16} color="#6A0DAD" />
      <Text style={styles.amenityText}>{amenity}</Text>
    </View>
  ), []);

  const renderRoomItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={[
        styles.roomItem,
        state.selectedRoom === item._id && styles.selectedRoomItem
      ]}
      onPress={() => updateState({ selectedRoom: item._id })}
    >
      <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
      <Text style={styles.roomDetails}>
        {item.availableBeds} of {item.totalBeds} beds available
      </Text>
      <Text style={styles.roomPrice}>PKR {item.pricePerBed} per bed</Text>
    </TouchableOpacity>
  ), [state.selectedRoom]);

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
  contentContainerStyle={[styles.container, { paddingBottom: 100 }]} // ⬅️ Extra padding
  style={styles.scrollView}
>

        {/* Image Gallery */}
        <View style={styles.imageGalleryContainer}>
          <Image 
            source={{ uri: hostel.images[state.selectedImageIndex] }} 
            style={styles.mainImage} 
          />
          
          {hostel.images.length > 1 && (
            <FlatList
              horizontal
              data={hostel.images}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity onPress={() => updateState({ selectedImageIndex: index })}>
                  <Image 
                    source={{ uri: item }} 
                    style={[
                      styles.thumbnail,
                      index === state.selectedImageIndex && styles.selectedThumbnail
                    ]} 
                  />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.thumbnailList}
              showsHorizontalScrollIndicator={false}
            />
          )}
        </View>

        {/* Hostel Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.hostelName}>{hostel.name}</Text>
          <View style={styles.locationContainer}>
            <Feather name="map-pin" size={16} color="#666" />
            <Text style={styles.locationText}>{hostel.location}</Text>
          </View>
          
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesContainer}>
            {hostel.amenities?.length > 0 ? 
              hostel.amenities.map(renderAmenity) : 
              <Text style={styles.noAmenitiesText}>No amenities listed</Text>}
          </View>
        </View>

        {/* Booking Form */}
        <View style={styles.bookingForm}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          
          {/* Room Selection - Always show section */}
          <View>
            <Text style={styles.subSectionTitle}>Select Room</Text>
            {state.rooms.length > 0 ? (
              <FlatList
                horizontal
                data={state.rooms}
                renderItem={renderRoomItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.roomList}
                showsHorizontalScrollIndicator={false}
              />
            ) : (
              <Text style={styles.loadingText}>
                {state.loading ? 'Loading rooms...' : 'No rooms available'}
              </Text>
            )}
          </View>

          {/* Seats Selection - Only show if room selected */}
          {state.selectedRoom && (
            <>
              <Text style={styles.subSectionTitle}>Number of Beds</Text>
              <View style={styles.seatsContainer}>
                <TouchableOpacity
                  style={styles.seatButton}
                  onPress={() => updateState({ seatsBooked: Math.max(1, state.seatsBooked - 1) })}
                  disabled={state.seatsBooked <= 1}
                >
                  <Feather name="minus" size={20} color="#6A0DAD" />
                </TouchableOpacity>
                
                <Text style={styles.seatsCount}>{state.seatsBooked}</Text>
                
                <TouchableOpacity
                  style={styles.seatButton}
                  onPress={() => {
                    if (state.seatsBooked < selectedRoomObj.availableBeds) {
                      updateState({ seatsBooked: state.seatsBooked + 1 });
                    }
                  }}
                  disabled={!state.selectedRoom || state.seatsBooked >= selectedRoomObj?.availableBeds}
                >
                  <Feather name="plus" size={20} color="#6A0DAD" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Date Selection */}
          <Text style={styles.subSectionTitle}>Dates</Text>
          <View style={styles.datePickerContainer}>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => updateState({ showDatePicker: true, currentDateType: 'checkIn' })}
            >
              <Feather name="calendar" size={20} color="#6A0DAD" />
              <Text style={styles.dateText}>{formatDate(state.checkInDate)}</Text>
            </TouchableOpacity>

            <Feather name="arrow-right" size={20} color="#666" style={styles.dateArrow} />

            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => updateState({ showDatePicker: true, currentDateType: 'checkOut' })}
            >
              <Feather name="calendar" size={20} color="#6A0DAD" />
              <Text style={styles.dateText}>{formatDate(state.checkOutDate)}</Text>
            </TouchableOpacity>
          </View>

          {/* Payment Method */}
          <Text style={styles.subSectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            {['online', 'cash'].map(method => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentMethod,
                  state.paymentMethod === method && styles.selectedPaymentMethod
                ]}
                onPress={() => updateState({ paymentMethod: method })}
              >
                <Feather 
                  name={state.paymentMethod === method ? 'check-circle' : 'circle'} 
                  size={20} 
                  color={state.paymentMethod === method ? '#6A0DAD' : '#666'} 
                />
                <Text style={styles.paymentMethodText}>
                  {method === 'online' ? 'Online Payment' : 'Pay at Hostel'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Summary */}
          <View style={styles.summaryContainer}>
            {[
              { label: 'Price per bed:', value: `PKR ${selectedRoomObj?.pricePerBed || 'N/A'}` },
              { label: 'Beds:', value: state.seatsBooked },
              { label: 'Months:', value: totalMonths },
              { label: 'Total:', value: `PKR ${totalPrice}`, total: true }
            ].map((item, i) => (
              <View key={i} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={item.total ? styles.summaryTotal : styles.summaryValue}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

      {/* Fixed Bottom Button - Always visible but conditionally enabled */}
      

      {/* DateTimePicker */}
      {state.showDatePicker && (
        <DateTimePicker
          value={state.currentDateType === 'checkIn' ? state.checkInDate : state.checkOutDate}
          mode="date"
          display="default"
          minimumDate={state.currentDateType === 'checkOut' ? 
            new Date(state.checkInDate.getTime() + (30 * 24 * 60 * 60 * 1000)) : // 1 month after check-in
            new Date()}
          onChange={handleDateChange}
        />
      )}
      <View style={styles.buttonContainer}>
        {state.showPayment ? (
          // In your ReservationScreen component
<StripePayment
  amount={totalPrice}
  hostelId={hostel._id}
  roomId={state.selectedRoom}
  checkInDate={state.checkInDate}
  checkOutDate={state.checkOutDate}
  seatsBooked={state.seatsBooked}
  // onSuccess={() => {
  //   dispatch(confirmBooking(state.currentBookingId));
  //   navigation.navigate('BookingConfirmation', { 
  //     bookingId: state.currentBookingId 
  //   });
  // }}
  // onCancel={() => updateState({ showPayment: false })}
/>
        ) : (
          <TouchableOpacity
            style={[
              styles.bookButton, 
              (!state.selectedRoom || state.loading) && styles.disabledButton
            ]}
            onPress={() => {
              if (state.paymentMethod === 'online') {
                updateState({ showPayment: true });
              } else {
                handleBookNow();
              }
            }}
            disabled={!state.selectedRoom || state.loading}
          >
            {state.loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.bookButtonText}>
                {state.paymentMethod === 'online' ? 'Proceed to Payment' : 'Book Now'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
            </ScrollView>

    </View>
  );
};
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    marginBottom: 80, // Space for the fixed button
  },
  container: {
    paddingBottom: 20,
  },
  imageGalleryContainer: {
    marginBottom: 20,
  },
  mainImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
  },
  thumbnailList: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 4,
  },
  selectedThumbnail: {
    borderWidth: 2,
    borderColor: '#6A0DAD',
  },
  detailsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  hostelName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationText: {
    marginLeft: 5,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#6A0DAD',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 8,
  },
  amenityText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#333',
  },
  noAmenitiesText: {
    fontStyle: 'italic',
    color: '#666',
  },
  bookingForm: {
    paddingHorizontal: 20,
  },
  roomList: {
    paddingBottom: 10,
  },
  roomItem: {
    padding: 15,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    width: 180,
    backgroundColor: '#fff',
  },
  selectedRoomItem: {
    borderColor: '#6A0DAD',
    backgroundColor: '#F5E9FF',
  },
  roomNumber: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  roomDetails: {
    color: '#666',
    marginBottom: 5,
    fontSize: 14,
  },
  roomPrice: {
    fontWeight: 'bold',
    color: '#6A0DAD',
    fontSize: 16,
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'center',
  },
  seatButton: {
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6A0DAD',
    backgroundColor: '#fff',
  },
  seatsCount: {
    marginHorizontal: 15,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  dateText: {
    marginLeft: 10,
    color: '#333',
  },
  dateArrow: {
    marginHorizontal: 10,
  },
  paymentMethods: {
    marginBottom: 15,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  selectedPaymentMethod: {
    borderColor: '#6A0DAD',
    backgroundColor: '#F5E9FF',
  },
  paymentMethodText: {
    marginLeft: 10,
    color: '#333',
  },
  summaryContainer: {
    marginTop: 15,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#666',
  },
  summaryValue: {
    fontWeight: '600',
    color: '#333',
  },
  summaryTotal: {
    fontWeight: 'bold',
    color: '#6A0DAD',
    fontSize: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    zIndex: 100, // Ensure it's above other elements
    elevation: 10, // For Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookButton: {
    backgroundColor: '#6A0DAD',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ReservationScreen;