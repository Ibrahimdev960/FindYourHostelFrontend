import React, { useState, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import Layout from './_layout';

SplashScreen.preventAutoHideAsync();

const fetchFonts = () => {
  return Font.loadAsync({
    'SpaceMono-Regular': require('../../assets/fonts/SpaceMono-Regular.ttf'),
    // Add other custom fonts here
  });
};

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        await fetchFonts();
      } catch (error) {
        console.warn(error);
      } finally {
        setAppReady(true);
        SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, []);

  if (!appReady) {
    return null; // Keep the splash screen visible
  }

  return <Layout/>;
}



