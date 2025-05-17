import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { BASE_URL } from '../../../service/api';

const AllHostels = () => {
  const { userToken } = useSelector((state) => state.auth);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHostels = async () => {
    try {
      const res = await fetch(`${BASE_URL}/hostels/all`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      const data = await res.json();
      setHostels(data);
    } catch (error) {
      console.error('Failed to load hostels', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const renderHostel = ({ item }) => (
    <View style={styles.card}>
      {/* Show image if available */}
      {item.images?.[0] && (
        <Image 
          source={{ uri: item.images[0] }} 
          style={styles.image} 
          resizeMode="cover" 
        />
      )}
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.location}>{item.location}</Text>
      <Text style={styles.status}>Status: {item.isApproved ? 'Approved' : 'Pending'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#6A0DAD" />
      ) : (
        <FlatList
          data={hostels}
          keyExtractor={(item) => item._id}
          renderItem={renderHostel}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    padding: 16, 
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginBottom: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 4,
  },
  location: {
    fontSize: 14, 
    color: '#666',
  },
  status: {
    marginTop: 6, 
    fontSize: 14, 
    color: '#28a745', // green text
  },
});

export default AllHostels;
