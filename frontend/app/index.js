import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Home() {
  useEffect(() => {
    (async () => {
      const name = await AsyncStorage.getItem('name');
      if (!name) router.replace('/profile');
      else router.replace('/rooms');
    })();
  }, []);
  return null;
}
