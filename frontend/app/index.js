import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUsername } from '../src/utils';

export default function Home() {
  useEffect(() => {
    (async () => {
      const username = await getUsername();
      if (!username) {
        router.replace('/login');
        return;
      }
      
      const name = await AsyncStorage.getItem('profile:name');
      if (!name) router.replace('/profile');
      else router.replace('/games');
    })();
  }, []);
  return null;
}
