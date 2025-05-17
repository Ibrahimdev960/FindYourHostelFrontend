// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import bookReducer from './bookSlice';
import adminReducer from './adminSlice'; // Import the admin slice

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bookings: bookReducer,
    admin: adminReducer,


  },
});
