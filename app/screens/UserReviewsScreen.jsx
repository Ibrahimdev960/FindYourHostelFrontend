import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../service/api';
import { useNavigation } from '@react-navigation/native';

const UserReviewsScreen = () => {
  const navigation = useNavigation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserReviews();
  }, []);

  const fetchUserReviews = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/reviews/user/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to fetch reviews');
      setReviews(data);
    } catch (error) {
      console.error('Error fetching user reviews:', error.message);
      Alert.alert('Error', 'Failed to load your reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserReviews();
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
          <Text style={styles.hostelName}>{review.hostel?.name || 'Unknown Hostel'}</Text>
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
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A0DAD" />
        <Text style={styles.loadingText}>Loading your reviews...</Text>
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
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

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
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No reviews yet</Text>
            <Text style={styles.emptySubtext}>Start reviewing your stays!</Text>
          </View>
        }
      />
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
  hostelName: {
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
});

export default UserReviewsScreen;