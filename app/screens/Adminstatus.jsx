import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { DataTable, ActivityIndicator } from 'react-native-paper';
import { BASE_URL } from '../../service/api';
import { useSelector } from 'react-redux';
import axios from 'axios';

const Adminstatus = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingHostelId, setProcessingHostelId] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedHostelId, setSelectedHostelId] = useState(null);

  const token = useSelector(state => state.auth.token);

  const fetchHostels = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/hostels/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setHostels(response.data);
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to fetch hostels';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const handleApprove = async (hostelId) => {
    setProcessingHostelId(hostelId);
    try {
      await axios.patch(`${BASE_URL}/hostels/approve/${hostelId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchHostels();
      Alert.alert('Success', 'Hostel approved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve hostel');
    } finally {
      setProcessingHostelId(null);
    }
  };

  const openRejectModal = (hostelId) => {
    setSelectedHostelId(hostelId);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please enter a reason for rejection');
      return;
    }
    setProcessingHostelId(selectedHostelId);
    try {
      await axios.patch(`${BASE_URL}/hostels/reject/${selectedHostelId}`, {
        reason: rejectReason,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchHostels();
      Alert.alert('Success', 'Hostel rejected successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject hostel');
    } finally {
      setRejectModalVisible(false);
      setProcessingHostelId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6A0DAD" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Hostel Approval Dashboard</Text>

      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Name</DataTable.Title>
          <DataTable.Title>Location</DataTable.Title>
          <DataTable.Title>Status</DataTable.Title>
          <DataTable.Title>Actions</DataTable.Title>
        </DataTable.Header>

        {hostels.map(hostel => (
          <DataTable.Row key={hostel._id}>
            <DataTable.Cell>{hostel.name}</DataTable.Cell>
            <DataTable.Cell>{hostel.location}</DataTable.Cell>
            <DataTable.Cell>
              <Text style={[
                styles.statusText,
                hostel.status === 'approved' && styles.approved,
                hostel.status === 'rejected' && styles.rejected,
              ]}>
                {hostel.status}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              {hostel.status === 'pending' ? (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => handleApprove(hostel._id)}
                    disabled={processingHostelId === hostel._id}
                  >
                    {processingHostelId === hostel._id ? (
                      <ActivityIndicator color="white" size={14} />
                    ) : (
                      <Text style={styles.buttonText}>Approve</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => openRejectModal(hostel._id)}
                    disabled={processingHostelId === hostel._id}
                  >
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.processedText}>Processed</Text>
              )}
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>

      {hostels.length === 0 && (
        <Text style={styles.noDataText}>No hostels found</Text>
      )}

      {/* Modal for Reject Reason */}
      <Modal
        visible={rejectModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reason for Rejection</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter reason"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={handleConfirmReject}
              >
                <Text style={styles.buttonText}>Confirm Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#aaa' }]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#6A0DAD',
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    textTransform: 'capitalize',
    fontWeight: 'bold',
  },
  approved: {
    color: 'green',
  },
  rejected: {
    color: 'red',
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginVertical: 3,
    minWidth: 75,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: 'green',
  },
  rejectButton: {
    backgroundColor: 'red',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
  },
  processedText: {
    color: 'gray',
    fontStyle: 'italic',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'gray',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    height: 80,
    textAlignVertical: 'top',
    borderRadius: 5,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default Adminstatus;
