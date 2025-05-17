import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { DataTable, ActivityIndicator, Button } from 'react-native-paper';
import axios from 'axios';
import { BASE_URL } from '../../../../service/api';
import { useSelector } from 'react-redux';

const PendingApproval = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedHostelId, setSelectedHostelId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const token = useSelector(state => state.auth.token);

  useEffect(() => {
    fetchPendingHostels();
  }, []);

  const fetchPendingHostels = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/hostels/pending`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      setHostels(response.data);
    } catch (error) {
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to fetch pending hostels'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (hostelId) => {
    setProcessingId(hostelId);
    try {
      await axios.patch(`${BASE_URL}/hostels/approve/${hostelId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Success', 'Hostel approved successfully');
      fetchPendingHostels();
    } catch (error) {
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to approve hostel'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (hostelId) => {
    setSelectedHostelId(hostelId);
    setRejectModalVisible(true);
  };

  const closeRejectModal = () => {
    setRejectModalVisible(false);
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    setProcessingId(selectedHostelId);
    try {
      await axios.patch(`${BASE_URL}/hostels/reject/${selectedHostelId}`, 
        { reason: rejectionReason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert('Success', 'Hostel rejected');
      fetchPendingHostels();
      closeRejectModal();
    } catch (error) {
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to reject hostel'
      );
    } finally {
      setProcessingId(null);
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
    <View style={styles.container}>
      <Text style={styles.title}>Pending Hostel Approvals</Text>
      
      <ScrollView>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Name</DataTable.Title>
            <DataTable.Title>Location</DataTable.Title>
            <DataTable.Title>Owner</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>

          {hostels.map(hostel => (
            <DataTable.Row key={hostel._id}>
              <DataTable.Cell>{hostel.name}</DataTable.Cell>
              <DataTable.Cell>{hostel.location}</DataTable.Cell>
              <DataTable.Cell>{hostel.owner?.name || 'N/A'}</DataTable.Cell>
              <DataTable.Cell>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => handleApprove(hostel._id)}
                    disabled={processingId === hostel._id}
                  >
                    {processingId === hostel._id ? (
                      <ActivityIndicator color="white" size={14} />
                    ) : (
                      <Text style={styles.buttonText}>Approve</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => openRejectModal(hostel._id)}
                    disabled={processingId === hostel._id}
                  >
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>

        {hostels.length === 0 && !loading && (
          <Text style={styles.noData}>No pending hostels for approval</Text>
        )}
      </ScrollView>

      {/* Rejection Reason Modal */}
      <Modal
        visible={rejectModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeRejectModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rejection Reason</Text>
            <Text style={styles.modalSubtitle}>Please provide a reason for rejecting this hostel:</Text>
            
            <TextInput
              style={styles.reasonInput}
              multiline
              numberOfLines={4}
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />
            
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={closeRejectModal}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleReject}
                loading={processingId === selectedHostelId}
                disabled={processingId === selectedHostelId}
                style={styles.submitButton}
              >
                Submit Rejection
              </Button>
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
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
  },
  noData: {
    textAlign: 'center',
    marginTop: 20,
    color: '#6c757d',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#6A0DAD',
  },
  modalSubtitle: {
    marginBottom: 15,
    color: '#555',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    borderColor: '#6A0DAD',
  },
  submitButton: {
    backgroundColor: '#dc3545',
  },
});

export default PendingApproval;