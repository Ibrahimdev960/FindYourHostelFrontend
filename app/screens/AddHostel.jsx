import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  Alert, StyleSheet, Modal, ScrollView, Image, ActivityIndicator, RefreshControl
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { BASE_URL } from '../../service/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Linking } from 'react-native';

const ManageHostels = () => {
  const [hostels, setHostels] = useState([]);
  const [filteredHostels, setFilteredHostels] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [images, setImages] = useState([]);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [mapRegion, setMapRegion] = useState({
    latitude: 24.8607, // Default to Pakistan coordinates
    longitude: 67.0011,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markerPosition, setMarkerPosition] = useState(null);
  const [address, setAddress] = useState('');
  const isFocused = useIsFocused();

  const [hostelForm, setHostelForm] = useState({
    name: '',
    location: { coordinates: [], address: '' },
    amenities: '',
    availability: 'true',
    status: 'pending'
  });

  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    totalBeds: '',
    pricePerBed: '',
  });

  const navigation = useNavigation();

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  useEffect(() => {
    filterHostels();
  }, [hostels, activeTab]);

  const loadData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      if (!storedToken) {
        Alert.alert('Error', 'Please login again');
        navigation.navigate('Login');
        return;
      }
      setToken(storedToken);
      await fetchHostels(storedToken);
    } catch (error) {
      console.error('Initialization error:', error);
      Alert.alert('Error', 'Failed to initialize');
    }
  };

  const fetchHostels = async (authToken) => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/hostels/all`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.status === 401) {
        await AsyncStorage.removeItem('userToken');
        navigation.navigate('Login');
        return;
      }

      const data = await response.json();
      setHostels(data);
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to fetch hostels');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterHostels = () => {
    switch (activeTab) {
      case 'pending':
        setFilteredHostels(hostels.filter(h => h.status === 'pending'));
        break;
      case 'approved':
        setFilteredHostels(hostels.filter(h => h.status === 'approved'));
        break;
      case 'rejected':
        setFilteredHostels(hostels.filter(h => h.status === 'rejected'));
        break;
      default:
        setFilteredHostels(hostels);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHostels(token);
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'We need access to your photos to select images',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets) {
        const selectedImages = result.assets.map(asset => asset.uri);
        if (selectedHostel) {
          setImages(prev => [...prev, ...selectedImages]);
        } else {
          setImages(selectedImages);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const handleHostelChange = (field, value) => {
    setHostelForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRoomChange = (field, value) => {
    setRoomForm(prev => ({ ...prev, [field]: value }));
  };

  const openEditModal = (hostel) => {
    setSelectedHostel(hostel);
    setHostelForm({
      name: hostel.name || '',
      location: hostel.location || { coordinates: [], address: '' },
      amenities: hostel.amenities.join(', ') || '',
      availability: String(hostel.availability) || 'true',
    });
    
    // Set map position if coordinates exist
    if (hostel.location?.coordinates?.length === 2) {
      setMarkerPosition({
        latitude: hostel.location.coordinates[1],
        longitude: hostel.location.coordinates[0]
      });
      setMapRegion({
        latitude: hostel.location.coordinates[1],
        longitude: hostel.location.coordinates[0],
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setAddress(hostel.location.address || '');
    }
    
    setImages(hostel.images || []);
    setModalVisible(true);
  };

  const openRoomModal = async (hostel) => {
    setSelectedHostel(hostel);
    await fetchRooms(hostel._id);
    setRoomModalVisible(true);
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    reverseGeocode(latitude, longitude);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      
      let addressText = '';
      if (data.address) {
        const { road, house_number, suburb, city, state, country } = data.address;
        addressText = [
          road,
          house_number,
          suburb,
          city,
          state,
          country
        ].filter(Boolean).join(', ');
      }
      
      setAddress(addressText || 'Location selected');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setAddress('Location selected');
    }
  };

  const handleAddOrUpdateHostel = async () => {
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }
  
    if (!hostelForm.name || !markerPosition) {
      Alert.alert('Error', 'Please fill all required fields and select a location on the map');
      return;
    }
  
    if (!selectedHostel && images.length === 0) {
      Alert.alert('Error', 'At least one image is required');
      return;
    }
  
    setLoading(true);
  
    try {
      const method = selectedHostel ? 'PUT' : 'POST';
      const endpoint = selectedHostel 
        ? `${BASE_URL}/hostels/update/${selectedHostel._id}`
        : `${BASE_URL}/hostels/add`;
  
      const formData = new FormData();
      formData.append('name', hostelForm.name);
      formData.append('location', JSON.stringify({
        type: 'Point',
        coordinates: [markerPosition.longitude, markerPosition.latitude],
        address: address
      }));
      formData.append('amenities', hostelForm.amenities);
      formData.append('availability', hostelForm.availability);
      formData.append('status', hostelForm.status);
      
      formData.append('price', '0');
      formData.append('rooms', '0');
      formData.append('bedsPerRoom', '0');
  
      if (!selectedHostel) {
        images.forEach((uri, index) => {
          if (!uri) return;
          const filename = uri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename || '');
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('images', {
            uri,
            name: `image_${index}_${filename}`,
            type,
          });
        });
      }
  
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }
  
      Alert.alert(
        'Success', 
        selectedHostel 
          ? 'Hostel updated!' 
          : 'Hostel added and pending admin approval!'
      );
      setModalVisible(false);
      fetchHostels(token);
      resetHostelForm();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.message || 'Failed to save hostel');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (hostelId) => {
    try {
      const response = await fetch(`${BASE_URL}/rooms/hostel/${hostelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      Alert.alert('Error', 'Failed to fetch rooms');
    }
  };

  const handleAddRoom = async () => {
    if (!selectedHostel || !roomForm.roomNumber || !roomForm.totalBeds || !roomForm.pricePerBed) {
      Alert.alert('Error', 'Please fill all room details');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostelId: selectedHostel._id,
          roomNumber: roomForm.roomNumber,
          totalBeds: roomForm.totalBeds,
          pricePerBed: roomForm.pricePerBed,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to add room');
      }

      Alert.alert('Success', 'Room added successfully!');
      fetchRooms(selectedHostel._id);
      resetRoomForm();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.message || 'Failed to add room');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      const response = await fetch(`${BASE_URL}/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete room');
      }

      Alert.alert('Success', 'Room deleted successfully');
      fetchRooms(selectedHostel._id);
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteHostel = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/hostels/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete hostel');
      }

      const result = await response.json();
      Alert.alert('Success', result.message);
      fetchHostels(token);
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const resetHostelForm = () => {
    setHostelForm({
      name: '',
      location: { coordinates: [], address: '' },
      amenities: '',
      availability: 'true',
      status: 'pending'
    });
    setImages([]);
    setMarkerPosition(null);
    setAddress('');
    setSelectedHostel(null);
  };

  const resetRoomForm = () => {
    setRoomForm({
      roomNumber: '',
      totalBeds: '',
      pricePerBed: '',
    });
  };

  const renderRoomItem = ({ item }) => (
    <View style={styles.roomCard}>
      <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
      <Text>Beds: {item.availableBeds}/{item.totalBeds}</Text>
      <Text>Price per bed: PKR {item.pricePerBed}</Text>
      <TouchableOpacity 
        style={styles.deleteRoomButton}
        onPress={() => handleDeleteRoom(item._id)}
      >
        <Feather name="trash-2" size={18} color="#B00020" />
      </TouchableOpacity>
    </View>
  );

  const renderHostelItem = ({ item }) => (
    <View style={[
      styles.card,
      item.status === 'pending' && styles.pendingCard,
      item.status === 'approved' && styles.approvedCard,
      item.status === 'rejected' && styles.rejectedCard
    ]}>
      {item.images?.[0] && (
        <Image 
          source={{ uri: item.images[0] }} 
          style={styles.hostelImage}
          resizeMode="cover"
        />
      )}
      
      <View style={[
        styles.statusBadge,
        item.status === 'pending' && styles.pendingBadge,
        item.status === 'approved' && styles.approvedBadge,
        item.status === 'rejected' && styles.rejectedBadge
      ]}>
        <Text style={styles.statusBadgeText}>
          {item.status.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.hostelName}>{item.name}</Text>
      
      {item.location?.address ? (
        <Text style={styles.hostelInfo}>Location: {item.location.address}</Text>
      ) : (
        <Text style={styles.hostelInfo}>Location: Coordinates {item.location?.coordinates?.join(', ')}</Text>
      )}
      
      {item.status === 'rejected' && item.rejectionReason && (
        <Text style={styles.rejectionText}>
          Reason: {item.rejectionReason}
        </Text>
      )}

      <View style={styles.cardButtons}>
        <TouchableOpacity 
          style={[
            styles.detailButton,
            (item.status !== 'approved') && styles.disabledButton
          ]}
          onPress={() => item.status === 'approved' && navigation.navigate('HostelDetail', { hostel: item })}
          disabled={item.status !== 'approved'}
        >
          <Feather name="info" size={18} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.roomsButton,
            (item.status !== 'approved') && styles.disabledButton
          ]}
          onPress={() => item.status === 'approved' && openRoomModal(item)}
          disabled={item.status !== 'approved'}
        >
          <Feather name="home" size={18} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.editButton,
            (item.status !== 'approved') && styles.disabledButton
          ]}
          onPress={() => item.status === 'approved' && openEditModal(item)}
          disabled={item.status !== 'approved'}
        >
          <Feather name="edit" size={18} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteHostel(item._id)}
        >
          <Feather name="trash-2" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Manage Hostels</Text>

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Add Hostel</Text>
      </TouchableOpacity>

      <View style={styles.tabContainer}>
        {['all', 'pending', 'approved', 'rejected'].map((tab) => (
          <TouchableOpacity 
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={activeTab === tab ? styles.activeTabText : styles.tabText}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A0DAD" />
        </View>
      ) : (
        <FlatList
          data={filteredHostels}
          keyExtractor={(item) => item._id}
          renderItem={renderHostelItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6A0DAD']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="alert-circle" size={40} color="#888" />
              <Text style={styles.emptyText}>
                {activeTab === 'pending' ? 'No pending hostels' : 
                 activeTab === 'approved' ? 'No approved hostels' :
                 activeTab === 'rejected' ? 'No rejected hostels' : 'No hostels found'}
              </Text>
            </View>
          }
        />
      )}

      {/* Hostel Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.heading}>{selectedHostel ? 'Update Hostel' : 'Add Hostel'}</Text>

          {selectedHostel && (
            <View style={[
              styles.statusContainer,
              selectedHostel.status === 'pending' && styles.pendingStatusContainer,
              selectedHostel.status === 'approved' && styles.approvedStatusContainer,
              selectedHostel.status === 'rejected' && styles.rejectedStatusContainer
            ]}>
              <Text style={styles.statusTitle}>Status:</Text>
              <Text style={styles.statusText}>{selectedHostel.status.toUpperCase()}</Text>
              {selectedHostel.status === 'rejected' && selectedHostel.rejectionReason && (
                <Text style={styles.rejectionReason}>
                  Reason: {selectedHostel.rejectionReason}
                </Text>
              )}
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Name"
            value={hostelForm.name}
            onChangeText={(text) => handleHostelChange('name', text)}
          />

          <Text style={styles.mapLabel}>Select location on map:</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={mapRegion}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              {markerPosition && (
                <Marker coordinate={markerPosition}>
                  <Callout>
                    <Text>{address || 'Selected location'}</Text>
                  </Callout>
                </Marker>
              )}
            </MapView>
          </View>

          <Text style={styles.addressText}>
            {address || 'Tap on the map to select a location'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Amenities (comma separated)"
            value={hostelForm.amenities}
            onChangeText={(text) => handleHostelChange('amenities', text)}
          />

          <View style={styles.availabilityContainer}>
            <Text>Availability:</Text>
            <TouchableOpacity
              style={styles.availabilityToggle}
              onPress={() => handleHostelChange('availability', hostelForm.availability === 'true' ? 'false' : 'true')}
            >
              <Text>{hostelForm.availability === 'true' ? 'Available' : 'Unavailable'}</Text>
              <Feather 
                name={hostelForm.availability === 'true' ? 'toggle-right' : 'toggle-left'} 
                size={24} 
                color={hostelForm.availability === 'true' ? '#4CAF50' : '#B00020'} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.imageButton} onPress={pickImages}>
            <Feather name="image" size={20} color="#6A0DAD" />
            <Text style={styles.imageButtonText}>
              {selectedHostel ? 'Change Images' : 'Pick Images'}
            </Text>
          </TouchableOpacity>

          {images.length > 0 && (
            <View style={styles.imagePreviewContainer}>
              {images.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.imageWrapper}>
                  <Image
                    source={{ uri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      const newImages = [...images];
                      newImages.splice(index, 1);
                      setImages(newImages);
                    }}
                  >
                    <Feather name="x" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleAddOrUpdateHostel}
            disabled={loading || !markerPosition}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{selectedHostel ? 'Update' : 'Add'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setModalVisible(false);
              resetHostelForm();
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {/* Room Management Modal */}
      <Modal visible={roomModalVisible} animationType="slide">
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.heading}>Manage Rooms: {selectedHostel?.name}</Text>
          
          <Text style={styles.sectionTitle}>Add New Room</Text>
          {['roomNumber', 'totalBeds', 'pricePerBed'].map((field) => (
            <TextInput
              key={field}
              style={styles.input}
              placeholder={field === 'roomNumber' ? 'Room Number' : 
                         field === 'totalBeds' ? 'Total Beds' : 'Price per Bed'}
              value={roomForm[field]}
              onChangeText={(text) => handleRoomChange(field, text)}
              keyboardType={field === 'pricePerBed' || field === 'totalBeds' ? 'numeric' : 'default'}
            />
          ))}

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleAddRoom}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Add Room</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Existing Rooms</Text>
          {rooms.length > 0 ? (
            <FlatList
              data={rooms}
              renderItem={renderRoomItem}
              keyExtractor={item => item._id}
            />
          ) : (
            <Text style={styles.noRoomsText}>No rooms added yet</Text>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setRoomModalVisible(false);
              setSelectedHostel(null);
              setRooms([]);
            }}
          >
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8f9fa',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6A0DAD',
    marginBottom: 15,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#6A0DAD',
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 5,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#6A0DAD',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  pendingCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#FFA500',
  },
  approvedCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  rejectedCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#B00020',
  },
  hostelImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor: '#888',
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pendingBadge: {
    backgroundColor: '#FFA500',
  },
  approvedBadge: {
    backgroundColor: '#4CAF50',
  },
  rejectedBadge: {
    backgroundColor: '#B00020',
  },
  hostelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  hostelInfo: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  rejectionText: {
    color: '#B00020',
    fontStyle: 'italic',
    marginBottom: 5,
    fontSize: 13,
  },
  cardButtons: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  detailButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 20,
    width: 40,
    alignItems: 'center',
  },
  roomsButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 20,
    width: 40,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#FF9800',
    padding: 10,
    borderRadius: 20,
    width: 40,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#B00020',
    padding: 10,
    borderRadius: 20,
    width: 40,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  modalContent: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  statusContainer: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
  },
  pendingStatusContainer: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 5,
    borderLeftColor: '#FFA500',
  },
  approvedStatusContainer: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  rejectedStatusContainer: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 5,
    borderLeftColor: '#B00020',
  },
  statusTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusText: {
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  rejectionReason: {
    marginTop: 5,
    fontStyle: 'italic',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#6A0DAD',
    borderRadius: 8,
    marginBottom: 15,
  },
  imageButtonText: {
    color: '#6A0DAD',
    marginLeft: 10,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
  },
  imageWrapper: {
    position: 'relative',
    margin: 5,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    right: 5,
    top: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#6A0DAD',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#6A0DAD',
    fontWeight: '600',
  },
  roomCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  roomNumber: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  deleteRoomButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  noRoomsText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  mapContainer: {
    height: 200,
    width: '100%',
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLabel: {
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default ManageHostels;