// src/hooks/useMyAvatar.js
// Hook específico para manejar mi propio avatar de forma síncrona
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { getUsername } from '../utils';

export const useMyAvatar = () => {
  const [myAvatar, setMyAvatar] = useState(null);
  const [myUsername, setMyUsername] = useState(null);
  const [myName, setMyName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    loadMyData();
  }, []);

  const loadMyData = useCallback(async () => {
    try {
      console.log('🔄 useMyAvatar - Loading my data...');
      
      const [username, name, avatarPath] = await Promise.all([
        getUsername(),
        AsyncStorage.getItem('profile:name'),
        AsyncStorage.getItem('profile:avatar')
      ]);

      console.log('📋 useMyAvatar - Data loaded:', {
        username,
        name,
        hasAvatar: !!avatarPath
      });

      setMyUsername(username);
      setMyName(name);

      if (avatarPath) {
        try {
          const base64 = await FileSystem.readAsStringAsync(avatarPath, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const avatarBase64 = `data:image/jpeg;base64,${base64}`;
          
          console.log('✅ useMyAvatar - Avatar loaded:', (avatarBase64.length / 1024).toFixed(1), 'KB');
          setMyAvatar(avatarBase64);
        } catch (avatarError) {
          console.error('❌ useMyAvatar - Error loading avatar:', avatarError);
          setMyAvatar(null);
        }
      } else {
        setMyAvatar(null);
      }
    } catch (error) {
      console.error('❌ useMyAvatar - Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para refrescar datos (útil cuando se actualiza el perfil)
  const refreshMyData = useCallback(() => {
    setIsLoading(true);
    return loadMyData();
  }, [loadMyData]);

  return {
    myAvatar,
    myUsername,
    myName,
    isLoading,
    refreshMyData
  };
};
