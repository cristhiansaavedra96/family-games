import { io } from 'socket.io-client';
import Constants from 'expo-constants';

//const URL = "http://192.168.0.10:4000" || Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'https://family-games-backend-production.up.railway.app';
const URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'https://family-games-backend-production.up.railway.app';
const socket = io(URL, { 
  transports: ['websocket'],
  timeout: 10000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  maxReconnectionAttempts: 5,
  forceNew: true
});

// Debugging logs
socket.on('connect', () => {
  console.log('Socket connected to:', URL);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.log('Socket connection error:', error.message);
});

export default socket;
