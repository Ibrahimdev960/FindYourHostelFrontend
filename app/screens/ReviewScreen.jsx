import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../service/api';
import { useNavigation } from '@react-navigation/native';

const ReviewScreen = ({ route }) => {
  const navigation = useNavigation();
  const { hostelId } = route.params;
  
  const [reviews, setReviews] = useState([]);
  const [hostelInfo, setHostelInfo] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      setCurrentUserId(userId);
      
      await Promise.all([
        fetchReviews(),
        fetchHostelInfo(),
        fetchUserBookings()
      ]);
    } catch (error) {
      console.error('Error initializing screen:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${BASE_URL}/reviews/${hostelId}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to fetch reviews');
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error.message);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchHostelInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/hostels/${hostelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to fetch hostel info');
      setHostelInfo(data);
      
      // Check if current user is the owner
      const userId = await AsyncStorage.getItem('userId');
      setIsOwner(data.owner === userId);
    } catch (error) {
      console.error('Error fetching hostel info:', error.message);
    }
  };

  const fetchUserBookings = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/bookings/user-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to fetch bookings');
      
      // Filter bookings for this hostel that are completed and paid
      const eligibleBookings = data.filter(booking => 
        booking.hostel?._id === hostelId && 
        booking.paymentStatus === 'completed' &&
        (booking.status === 'confirmed' || booking.status === 'completed')
      );
      setUserBookings(eligibleBookings);
    } catch (error) {
      console.error('Error fetching user bookings:', error.message);
    }
  };

  const handleResponse = async () => {
    if (!responseText.trim()) {
      Alert.alert('Error', 'Please enter a response');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/reviews/respond/${selectedReview._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ response: responseText.trim() })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to add response');
      
      Alert.alert('Success', 'Response added successfully');
      setShowResponseModal(false);
      setResponseText('');
      setSelectedReview(null);
      fetchReviews();
    } catch (error) {
      console.error('Error adding response:', error.message);
      Alert.alert('Error', error.message || 'Failed to add response');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const renderStars = (rating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  const renderReview = ({ item: review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View>
          <Text style={styles.reviewerName}>{review.user?.name || 'Anonymous'}</Text>
          <Text style={styles.reviewDate}>
            {new Date(review.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {renderStars(review.rating)}
      </View>

      {review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}
      {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}

      {review.response && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>Owner Response:</Text>
          <Text style={styles.responseText}>{review.response}</Text>
        </View>
      )}

      {isOwner && !review.response && (
        <TouchableOpacity
          style={styles.respondButton}
          onPress={() => {
            setSelectedReview(review);
            setShowResponseModal(true);
          }}
        >
          <Text style={styles.respondButtonText}>Respond</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A0DAD" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {hostelInfo?.name || 'Hostel'} Reviews
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Reviews List */}
      <FlatList
        data={reviews}
        keyExtractor={(item) => item._id}
        renderItem={renderReview}
        contentContainerStyle={styles.reviewsList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#6A0DAD']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No reviews yet</Text>
            <Text style={styles.emptySubtext}>Be the first to review this hostel!</Text>
          </View>
        }
      />


      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResponseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Respond to Review</Text>
            
            <TextInput
              style={styles.responseInput}
              placeholder="Type your response..."
              multiline
              numberOfLines={4}
              value={responseText}
              onChangeText={setResponseText}
              maxLength={500}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowResponseModal(false);
                  setResponseText('');
                  setSelectedReview(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleResponse}
                disabled={!responseText.trim()}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
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
    backgroundColor: '#fff',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6A0DAD',
  },
  reviewsList: {
    padding: 20,
    paddingBottom: 40,
  },
  reviewCard: {
    backgroundColor: '#F5F0FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0D4F7',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  responseContainer: {
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6A0DAD',
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6A0DAD',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  respondButton: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  respondButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#6A0DAD',
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#6A0DAD',
  },
  submitButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '600',
  },
  addReviewButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6A0DAD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addReviewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ReviewScreen;