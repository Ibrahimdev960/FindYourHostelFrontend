import React from 'react';
import { View, Text, Image, StyleSheet, FlatList, ScrollView } from 'react-native';

const HostelDetail = ({ route }) => {
  const { hostel } = route.params;

  return (
    <ScrollView style={styles.container}>
      <FlatList
        horizontal
        data={hostel.images}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.image} />
        )}
        showsHorizontalScrollIndicator={false}
      />

      <Text style={styles.name}>{hostel.name}</Text>
      <Text style={styles.info}>📍 {hostel.location}</Text>
      <Text style={styles.info}>💰 Price: ${hostel.price}</Text>
      <Text style={styles.info}>🛏️ Rooms: {hostel.rooms}</Text>
      <Text style={styles.info}>🛌 Beds/Room: {hostel.bedsPerRoom}</Text>
      <Text style={styles.info}>🔧 Amenities: {hostel.amenities.join(', ')}</Text>
      <Text style={styles.info}>Availability: {hostel.availability ? 'Yes' : 'No'}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  image: {
    width: 300,
    height: 200,
    marginRight: 10,
    borderRadius: 10,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#6A0DAD',
    marginVertical: 10,
  },
  info: {
    fontSize: 16,
    marginVertical: 5,
    color: '#333',
  },
});

export default HostelDetail;
