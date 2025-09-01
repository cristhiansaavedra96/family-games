// Username como "login" sin contraseña - se pide una sola vez
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getUsername() {
  try {
    const key = 'auth:username';
    let username = await AsyncStorage.getItem(key);
    return username;
  } catch (_e) {
    return null;
  }
}

export async function setUsername(username) {
  try {
    const key = 'auth:username';
    await AsyncStorage.setItem(key, username.trim());
    return true;
  } catch (_e) {
    return false;
  }
}
