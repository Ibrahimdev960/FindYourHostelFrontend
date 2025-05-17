import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../service/api';

const MyBookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    const token = await AsyncStorage.getItem('userToken');
    try {
      const res = await fetch(`${BASE_URL}/bookings/user-bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch bookings');
      setBookings(data);
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

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
  
    const { name, location, images } = item.hostel;
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
});

export default MyBookingsScreen;
