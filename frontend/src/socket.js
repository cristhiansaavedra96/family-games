import { io } from 'socket.io-client';
import Constants from 'expo-constants';

const URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
const socket = io(URL, { transports: ['websocket'] });
export default socket;
