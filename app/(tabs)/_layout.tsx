import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import AppNavigator from '../navigation/AppNavigator'; // Import your AppNavigator

const Layout = () => {
  return (
    <SafeAreaProvider>
        <AppNavigator /> 
    </SafeAreaProvider>
  );
};

export default Layout;
