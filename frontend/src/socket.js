import { io } from 'socket.io-client';
import Constants from 'expo-constants';

const URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'https://family-games-backend-production.up.railway.app';
const socket = io(URL, { transports: ['websocket'] });
export default socket;
