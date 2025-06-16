import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert
} from 'react-native';
import { BASE_URL } from '../../service/api';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

// Location parser utility function
const parseLocation = (location) => {
  if (!location) return 'Location not specified';
  
  // If location is already a string
  if (typeof location === 'string') {
    try {
      // Try to parse as JSON in case it's stringified
      const parsed = JSON.parse(location);
      if (parsed.address) return parsed.address;
      if (parsed.coordinates) return `Coordinates: ${parsed.coordinates[1]}, ${parsed.coordinates[0]}`;
      return location;
    } catch {
      return location;
    }
  }
  
  // If location is an object
  if (typeof location === 'object') {
    if (location.address) return location.address;
    if (location.coordinates) return `Coordinates: ${location.coordinates[1]}, ${location.coordinates[0]}`;
  }
  
  return 'Location not specified';
};

const MyBookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const token = useSelector(state => state.auth.token);

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${BASE_URL}/bookings/user-bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch bookings');
      
      // Process bookings to ensure location is properly formatted
      const processedBookings = data.map(booking => ({
        ...booking,
        hostel: {
          ...booking.hostel,
          location: parseLocation(booking.hostel?.location)
        }
      }));
      
      setBookings(processedBookings);
    } catch (error) {
      console.error('Error:', error.message);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
    } else {
      Alert.alert('Error', 'Authentication required');
      setLoading(false);
    }
  }, [token]);

  const renderBooking = ({ item }) => {
    if (!item?.hostel) {
      return (
        <View style={styles.card}>
          <View style={styles.details}>
            <Text style={styles.title}>Hostel info not available</Text>
            <Text style={styles.date}>
              {new Date(item.checkInDate).toLocaleDateString()} -{' '}
              {new Date(item.checkOutDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
      );
    }

    const { name, location, images, _id: hostelId } = item.hostel;
    
    const handleReviewPress = async () => {
      try {
        console.log('Making request to:', `${BASE_URL}/bookings/eligible-bookings/${hostelId}`);
        
        const response = await fetch(
          `${BASE_URL}/bookings/eligible-bookings/${hostelId}`, 
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || 'Failed to fetch eligible bookings');
          } catch (e) {
            throw new Error(errorText || `Server error: ${response.status}`);
          }
        }

        const eligibleBookings = await response.json();
        
        if (eligibleBookings.length === 0) {
          Alert.alert(
            'No Eligible Bookings',
            'You have no completed bookings for this hostel that can be reviewed'
          );
          return;
        }

        navigation.navigate('CreateReview', {
          hostelId,
          hostelName: name,
          userBookings: eligibleBookings
        });
      } catch (error) {
        console.error('Review error:', error);
        Alert.alert('Error', error.message || 'Failed to check for reviews');
      }
    };

    return (
      <View style={styles.card}>
        {images?.length > 0 && (
          <Image
            source={{ uri: images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        <View style={styles.details}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.subTitle}>{location}</Text>
          <Text style={styles.date}>
            {new Date(item.checkInDate).toLocaleDateString()} -{' '}
            {new Date(item.checkOutDate).toLocaleDateString()}
          </Text>
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={handleReviewPress}
          >
            <Text style={styles.reviewButtonText}>Write Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#6A0DAD" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Hostel Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={renderBooking}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No bookings found</Text>
        }
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6A0DAD',
    marginBottom: 15,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#F5F0FA',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 2,
  },
  image: {
    width: 100,
    height: 100,
  },
  details: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subTitle: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  reviewButton: {
    backgroundColor: '#6A0DAD',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});

export default MyBookingsScreen;