import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../service/api';

export const fetchAdminData = createAsyncThunk(
  'admin/fetchData',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    
    // if (!auth.userToken) {
    //   return rejectWithValue('No authentication token found');
    // }

    const config = {
      headers: {
        Authorization: `Bearer ${auth.userToken}`,
      },
    };

    try {
      const endpoints = [
        
        { url: `${BASE_URL}/hostels/all`, key: 'hostels' },
        { url: `${BASE_URL}/users/all-users`, key: 'users' },
        { url: `${BASE_URL}/bookings`, key: 'bookings' },
        { url: `${BASE_URL}/hostels/pending`, key: 'pending' },
      ];

      const responses = await Promise.all(
        endpoints.map(endpoint => 
          axios.get(endpoint.url, config)
            .then(res => ({ 
              success: true,
              [endpoint.key]: res.data || [] 
            }))
            .catch(error => ({ 
              success: false,
              [endpoint.key]: [],
              error: error.response?.data?.message || error.message 
            }))
        )
      );

      // Combine all responses
      const combinedData = responses.reduce((acc, curr) => {
        const key = Object.keys(curr).find(k => k !== 'success' && k !== 'error');
        return { ...acc, [key]: curr[key] };
      }, {});

      return {
        totalHostels: combinedData.hostels?.length || 0,
        totalUsers: combinedData.users?.length || 0,
        totalBookings: combinedData.bookings?.length || 0,
        pendingApprovals: combinedData.pending?.length || 0,
      };

    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch admin data'
      );
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    data: {
      totalHostels: 0,
      totalUsers: 0,
      totalBookings: 0,
      pendingApprovals: 0,
    },
    loading: false,
    error: null,
  },
  reducers: {
    resetAdminError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAdminData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetAdminError } = adminSlice.actions;
export default adminSlice.reducer;