import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BASE_URL } from '../../service/api';
import axios from 'axios'; // Make sure to import axios

// Helper function for API requests
const apiRequest = async (url, method, token, data = null) => {
  const config = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${url}`, config);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Request failed');
  }

  return await response.json();
};

// Thunks
export const fetchUserBookings = createAsyncThunk(
  'bookings/fetchUserBookings',
  async (_, { getState }) => {
    const { token } = getState().auth;
    return apiRequest('/bookings/user-bookings', 'GET', token);
  }
);

export const fetchHostelOwnerBookings = createAsyncThunk(
  'bookings/fetchHostelOwnerBookings',
  async (_, { getState }) => {
    const { token } = getState().auth;
    return apiRequest('/bookings/hostel-owner-bookings', 'GET', token);
  }
);

export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData, { getState }) => {
    const { token } = getState().auth;
    return apiRequest('/bookings/book', 'POST', token, bookingData);
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async (bookingId, { getState }) => {
    const { token } = getState().auth;
    await apiRequest(`/bookings/cancel/${bookingId}`, 'DELETE', token);
    return bookingId;
  }
);

const initialState = {
  userBookings: [],
  hostelOwnerBookings: [], // Add this line
  status: 'idle',
  error: null,
  lastBooking: null,
};

const bookSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearBookings: () => initialState,
    clearLastBooking: (state) => {
      state.lastBooking = null;
    },
  },
  extraReducers: (builder) => {
    // Specific cases first
    builder
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userBookings = action.payload;
      })
      .addCase(fetchHostelOwnerBookings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.hostelOwnerBookings = action.payload;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userBookings.unshift(action.payload);
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userBookings = state.userBookings.filter(
          booking => booking._id !== action.payload
        );
      });

    // Generic matchers last
    builder
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => {
          state.status = 'loading';
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.status = 'failed';
          state.error = action.error.message;
        }
      );
  },
});

export const { clearBookings, clearLastBooking } = bookSlice.actions;

// Selectors
export const selectAllBookings = (state) => state.bookings.userBookings;
export const selectHostelOwnerBookings = (state) => state.bookings.hostelOwnerBookings; // Add this selector
export const selectLastBooking = (state) => state.bookings.lastBooking;
export const selectBookingStatus = (state) => state.bookings.status;
export const selectBookingError = (state) => state.bookings.error;

export default bookSlice.reducer;