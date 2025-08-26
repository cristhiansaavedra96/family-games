import { useEffect } from 'react';
import { router } from 'expo-router';

export default function Lobby() {
  useEffect(() => { router.replace('/rooms'); }, []);
  return null;
}
