import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { fetchUserBookings, fetchHostelOwnerBookings } from '../../src/redux/bookSlice';
import AdminDashboard from './admin/Dashboard';

const HomePage = () => {
  const role = useSelector((state) => state.auth.role) || 'User';
  const { 
    userBookings = [], 
    hostelOwnerBookings = [], 
    status 
  } = useSelector((state) => state.bookings);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  useEffect(() => {
    if (role === 'Hostellite') {
      dispatch(fetchUserBookings());
    } else if (role === 'Hosteller') {
      dispatch(fetchHostelOwnerBookings());
    } else if (role === 'Admin') {
      navigation.navigate('AdminDashboard');
    }
  }, [role, dispatch, navigation]);

  const navigateBasedOnRole = () => {
    switch (role) {
      case 'Hosteller':
        navigation.navigate('AddHostel');
        break;
      case 'Hostellite':
        navigation.navigate('SearchHostel');
        break;
      default:
        Alert.alert('Error', 'Invalid role');
    }
  };

  if (role === 'Admin') {
    return null;
  }

  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <Text>Loading your data...</Text>
      </View>
    );
  }

  const bookingsToShow = role === 'Hostellite' ? userBookings : hostelOwnerBookings;
  const hasBookings = bookingsToShow.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Welcome, {role}!</Text>

      {hasBookings && (
        <View style={styles.bookingsContainer}>
          <Text style={styles.sectionTitle}>
            {role === 'Hostellite' ? 'Your Current Bookings' : 'Your Hostel Bookings'}
          </Text>
          
          {bookingsToShow.map((booking) => (
            <View key={booking._id} style={styles.bookingCard}>
              {booking.hostel?.images?.[0] && (
                <Image 
                  source={{ uri: booking.hostel.images[0] }} 
                  style={styles.hostelImage}
                />
              )}
              <View style={styles.bookingDetails}>
                <Text style={styles.hostelName}>{booking.hostel?.name || 'Unknown Hostel'}</Text>
                
                {/* Room number display for both Hostellite and Hosteller */}
                <Text>Room: {booking.room?.roomNumber || 'Not specified'}</Text>
                
                {role === 'Hosteller' && (
                  <>
                    <Text>Guest: {booking.user?.name || 'Anonymous'}</Text>
                    <Text>Email: {booking.user?.email || 'Not provided'}</Text>
                  </>
                )}
                
                <Text>
                  Dates: {new Date(booking.checkInDate).toLocaleDateString()} - {' '}
                  {new Date(booking.checkOutDate).toLocaleDateString()}
                </Text>
                <Text>Payment Status: {booking.paymentStatus}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity 
        style={[
          styles.button,
          hasBookings && styles.buttonWithBookings
        ]} 
        onPress={navigateBasedOnRole}
      >
        <Text style={styles.buttonText}>
          {role === 'Hosteller'
            ? hasBookings ? 'Add Another Hostel' : 'Add Hostel'
            : hasBookings ? 'Find Another Hostel' : 'Find Hostel'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6A0DAD',
    marginBottom: 20,
    textAlign: 'center',
  },
  bookingsContainer: {
    marginBottom: 30,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  bookingCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hostelImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 15,
  },
  bookingDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  hostelName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#6A0DAD',
  },
  button: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  buttonWithBookings: {
    marginTop: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HomePage;