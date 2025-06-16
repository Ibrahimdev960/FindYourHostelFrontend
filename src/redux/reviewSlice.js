import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BASE_URL } from '../../service/api';

// Async Thunks
export const createReview = createAsyncThunk(
  'reviews/create',
  async ({ hostelId, bookingId, rating, title, comment }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await fetch(`${BASE_URL}/reviews/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ hostelId, bookingId, rating, title, comment }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create review');
      return data.review;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchHostelReviews = createAsyncThunk(
  'reviews/fetchHostel',
  async (hostelId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/reviews/${hostelId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch reviews');
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserReviews = createAsyncThunk(
  'reviews/fetchUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await fetch(`${BASE_URL}/reviews/user/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch user reviews');
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const respondToReview = createAsyncThunk(
  'reviews/respond',
  async ({ reviewId, response }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const res = await fetch(`${BASE_URL}/reviews/${reviewId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ response }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to respond to review');
      return data.review;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  hostelReviews: [],
  userReviews: [],
  loading: false,
  error: null,
  success: false,
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    resetReviewStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Review
      .addCase(createReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.userReviews.unshift(action.payload);
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Hostel Reviews
      .addCase(fetchHostelReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHostelReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.hostelReviews = action.payload;
      })
      .addCase(fetchHostelReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch User Reviews
      .addCase(fetchUserReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.userReviews = action.payload;
      })
      .addCase(fetchUserReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Respond to Review
      .addCase(respondToReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(respondToReview.fulfilled, (state, action) => {
        state.loading = false;
        state.hostelReviews = state.hostelReviews.map(review => 
          review._id === action.payload._id ? action.payload : review
        );
      })
      .addCase(respondToReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetReviewStatus } = reviewSlice.actions;
export default reviewSlice.reducer;