import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useSelector } from 'react-redux';
import { BASE_URL } from '../../../service/api';
import { parseLocation } from '../../../utils/locationParser';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const AllHostels = () => {
  const { userToken } = useSelector((state) => state.auth);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

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
      Alert.alert('Error', 'Failed to load hostels');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHostels();
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const renderHostel = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('HostelDetail', { hostelId: item._id })}
      activeOpacity={0.8}
    >
      {item.images?.[0] && (
        <Image 
          source={{ uri: item.images[0] }} 
          style={styles.image} 
          resizeMode="cover" 
        />
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.statusBadge, 
            item.status === 'approved' ? styles.approvedBadge : styles.pendingBadge]}>
            <Text style={styles.statusText}>
              {item.status === 'approved' ? 'Approved' : item.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#6A0DAD" />
          <Text style={styles.location} numberOfLines={2}>
            {parseLocation(item.location)}
          </Text>
        </View>
        
        <View style={styles.detailsRow}>
          {/* Rooms */}
          <View style={styles.detailItem}>
            <Ionicons name="bed-outline" size={16} color="#6A0DAD" />
            <Text style={styles.detailText}>
              {item.roomCount || 0} {item.roomCount === 1 ? 'room' : 'rooms'}
            </Text>
          </View>
          
          {/* Rating */}
          <View style={styles.detailItem}>
            <MaterialIcons name="star-rate" size={16} color="#FFD700" />
            <Text style={styles.detailText}>
              {item.rating?.toFixed(1) || 'New'}
            </Text>
            <Text style={[styles.detailText, { marginLeft: 4 }]}>
              ({item.reviewCount || 0})
            </Text>
          </View>
          
          {/* Price */}
          <View style={styles.detailItem}>
            <Ionicons name="pricetag-outline" size={16} color="#6A0DAD" />
            <Text style={styles.detailText}>
              {item.minPrice ? `From ${item.minPrice} PKR` : 'Price N/A'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#6A0DAD" style={styles.loader} />
      ) : (
        <FlatList
          data={hostels}
          keyExtractor={(item) => item._id}
          renderItem={renderHostel}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6A0DAD']}
              tintColor="#6A0DAD"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>No hostels found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loader: {
    marginTop: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvedBadge: {
    backgroundColor: '#E6F7EE',
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 13,
    color: '#555',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default AllHostels;