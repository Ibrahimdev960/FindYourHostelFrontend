import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../../../service/api';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';

const AllBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1
  });
  
  const navigation = useNavigation();
  const authState = useSelector(state => state.auth);
  // Fix: Get token from authState.token instead of authState.userToken
  const userToken = authState?.token;

  const handleAuthError = useCallback((error) => {
    console.error('Auth error:', error);
    Alert.alert('Session Expired', 'Please login again', [
      {
        text: 'OK',
        onPress: () => {
          // Use your actual login route name
          if (navigation.canGoBack()) {
            navigation.navigate('Auth', { screen: 'Login' });
          } else {
            navigation.replace('Auth', { screen: 'Login' });
          }
        }
      }
    ]);
  }, [navigation]);

  const fetchAllBookings = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!userToken) {
        throw new Error('Authentication token not found');
      }

      let url = `${BASE_URL}/bookings/all?page=${pagination.page}&limit=${pagination.limit}`;
      
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.dateFrom) url += `&dateFrom=${filters.dateFrom}`;
      if (filters.dateTo) url += `&dateTo=${filters.dateTo}`;
      if (searchQuery) url += `&search=${searchQuery}`;
      
      console.log('Request URL:', url);
      console.log('Using token:', userToken);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log('Response status:', response.status);
      
      if (response.status === 401) {
        throw new Error('Unauthorized - Invalid token');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch bookings');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.bookings);
        setPagination({
          ...pagination,
          totalPages: data.totalPages
        });
      } else {
        throw new Error(data.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      
      if (error.message.includes('Unauthorized') || 
          error.message.includes('token') || 
          error.message.includes('jwt')) {
        handleAuthError(error);
      } else {
        Alert.alert('Error', error.message || 'Failed to load bookings');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken, pagination.page, pagination.limit, filters, searchQuery, handleAuthError]);

  useEffect(() => {
    console.log('Current auth state:', authState);
    console.log('Current user token:', userToken);
    
    if (!userToken) {
      Alert.alert('Authentication Required', 'Please login to view bookings', [
        {
          text: 'OK',
          onPress: () => {
            // Use your actual login route name
            if (navigation.canGoBack()) {
              navigation.navigate('Auth', { screen: 'Login' });
            } else {
              navigation.replace('Auth', { screen: 'Login' });
            }
          }
        }
      ]);
      return;
    }
    
    fetchAllBookings();
  }, [userToken, pagination.page, filters, searchQuery]);


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [pagination.page, pagination.totalPages]);

   const resetFilters = useCallback(() => {
    setFilters({
      status: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));

  }, []);

 
  const renderBookingItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => navigation.navigate('BookingDetail', { bookingId: item._id })}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.hostelName}>{item.hostel?.name || 'Unknown Hostel'}</Text>
        <View style={[
          styles.statusBadge,
          item.status === 'confirmed' ? styles.confirmedBadge :
          item.status === 'cancelled' ? styles.cancelledBadge :
          styles.pendingBadge
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.userInfo}>
        <Ionicons name="person" size={16} color="#6A0DAD" />
        <Text style={styles.userText}>
          {item.user?.name || 'Unknown User'} • {item.user?.email || 'No email'}
        </Text>
      </View>
      
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar" size={16} color="#6A0DAD" />
          <Text style={styles.detailText}>
            {format(new Date(item.checkInDate), 'MMM d, yyyy')} - {format(new Date(item.checkOutDate), 'MMM d, yyyy')}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="bed" size={16} color="#6A0DAD" />
          <Text style={styles.detailText}>
            {item.seatsBooked} {item.seatsBooked > 1 ? 'beds' : 'bed'} • Room {item.room?.roomNumber || 'N/A'}
          </Text>
        </View>
      </View>
      
      <View style={styles.paymentRow}>
        <Text style={styles.amountText}>
          PKR {(item.room?.pricePerBed * item.seatsBooked).toLocaleString()}
        </Text>
        <View style={[
          styles.paymentBadge,
          item.paymentStatus === 'completed' ? styles.paidBadge : styles.unpaidBadge
        ]}>
          <Text style={styles.paymentText}>
            {item.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), []);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search bookings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={() => setPagination(prev => ({ ...prev, page: 1 }))}
        />
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Feather name="filter" size={20} color="#6A0DAD" />
          {Object.values(filters).some(val => val !== '') && (
            <View style={styles.filterBadge} />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6A0DAD']}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          pagination.page < pagination.totalPages ? (
            <ActivityIndicator size="small" color="#6A0DAD" style={styles.loadMoreIndicator} />
          ) : null
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={48} color="#999" />
              <Text style={styles.emptyText}>No bookings found</Text>
              <Text style={styles.emptySubText}>Try adjusting your filters</Text>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Bookings</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Feather name="x" size={24} color="#6A0DAD" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.filterOptions}>
                {['', 'confirmed', 'cancelled', 'pending'].map((status) => (
                  <TouchableOpacity
                    key={status || 'all'}
                    style={[
                      styles.filterOption,
                      filters.status === status && styles.selectedFilterOption
                    ]}
                    onPress={() => setFilters({...filters, status})}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.status === status && styles.selectedFilterOptionText
                    ]}>
                      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Date Range</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="From (YYYY-MM-DD)"
                  value={filters.dateFrom}
                  onChangeText={(text) => setFilters({...filters, dateFrom: text})}
                />
                <Text style={styles.dateSeparator}>to</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="To (YYYY-MM-DD)"
                  value={filters.dateTo}
                  onChangeText={(text) => setFilters({...filters, dateTo: text})}
                />
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalResetButton}
                onPress={resetFilters}
              >
                <Text style={styles.modalResetButtonText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalApplyButton}
                onPress={() => applyFilters(filters)}
              >
                <Text style={styles.modalApplyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 10,
    padding: 4,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  hostelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  confirmedBadge: {
    backgroundColor: '#e6f7ee',
  },
  cancelledBadge: {
    backgroundColor: '#ffebee',
  },
  pendingBadge: {
    backgroundColor: '#fff3e0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  detailsRow: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 6,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidBadge: {
    backgroundColor: '#e6f7ee',
  },
  unpaidBadge: {
    backgroundColor: '#fff3e0',
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  resetButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#6A0DAD',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadMoreIndicator: {
    marginVertical: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: '#6A0DAD',
    borderColor: '#6A0DAD',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedFilterOptionText: {
    color: '#fff',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
  },
  dateSeparator: {
    marginHorizontal: 8,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalResetButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  modalResetButtonText: {
    color: '#6A0DAD',
    fontWeight: '600',
  },
  modalApplyButton: {
    flex: 1,
    backgroundColor: '#6A0DAD',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalApplyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default AllBooking;