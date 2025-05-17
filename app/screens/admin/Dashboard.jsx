import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { fetchAdminData, resetAdminError } from '../../../src/redux/adminSlice';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const { user } = useSelector((state) => state.auth);
  const { 
    data: adminData = {
      totalHostels: 0,
      totalUsers: 0,
      totalBookings: 0,
      pendingApprovals: 0,
    }, 
    loading, 
    error 
  } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminData());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { 
          text: 'OK', 
          onPress: () => dispatch(resetAdminError()) 
        }
      ]);
    }
  }, [error]);

  const dashboardItems = [
    {
      title: 'Hostels',
      icon: <MaterialIcons name="apartment" size={24} color="#6A0DAD" />,
      screen: 'AllHostels',
      count: adminData.totalHostels,
    },
    {
      title: 'Pending Approvals',
      icon: <MaterialIcons name="pending-actions" size={24} color="#6A0DAD" />,
      screen: 'PendingApproval',
      count: adminData.pendingApprovals,
    },
    {
      title: 'Users',
      icon: <FontAwesome name="users" size={24} color="#6A0DAD" />,
      screen: 'AllUsers',
      count: adminData.totalUsers,
    },
    {
      title: 'Bookings',
      icon: <MaterialIcons name="book-online" size={24} color="#6A0DAD" />,
      screen: 'AllBookings',
      count: adminData.totalBookings,
    },
    {
      title: 'Reports',
      icon: <Ionicons name="document-text" size={24} color="#6A0DAD" />,
      screen: 'Reports',
    },
    {
      title: 'Settings',
      icon: <Ionicons name="settings" size={24} color="#6A0DAD" />,
      screen: 'AdminSettings',
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A0DAD" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.name || 'Admin'}!</Text>
        <Text style={styles.subText}>Admin Dashboard</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{adminData.totalHostels}</Text>
          <Text style={styles.statLabel}>Total Hostels</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{adminData.pendingApprovals}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{adminData.totalUsers}</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
      </View>

      <View style={styles.gridContainer}>
        {dashboardItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.gridItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={styles.iconContainer}>
              {item.icon}
            </View>
            <Text style={styles.gridTitle}>{item.title}</Text>
            {item.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6A0DAD',
  },
  subText: {
    fontSize: 16,
    color: '#6c757d',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6A0DAD',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0e6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#343a40',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4757',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,   
    fontWeight: 'bold',
  },
});

export default AdminDashboard;