// src/hooks/useAvatarSync.js
// Hook para sincronización inteligente de avatares
import { useState, useEffect, useCallback } from 'react';
import avatarCache from '../avatarCache';
import socket from '../socket';

export const useAvatarSync = () => {
  const [avatarUrls, setAvatarUrls] = useState(new Map()); // username -> avatarUrl
  const [loading, setLoading] = useState(new Set()); // avatarIds being loaded

  // Sincronizar avatar para un usuario específico
  const syncAvatar = useCallback(async (username, avatarId) => {
    if (!username || !avatarId) return null;

    // Verificar si ya tenemos este avatar en caché
    const cached = await avatarCache.getAvatar(username, avatarId);
    if (cached) {
      setAvatarUrls(prev => new Map(prev.set(username, cached)));
      return cached;
    }

    // Verificar si ya estamos cargando este avatar
    const loadingKey = avatarId;
    if (loading.has(loadingKey)) return null;

    // Marcar como cargando
    setLoading(prev => new Set(prev.add(loadingKey)));

    try {
      console.log(`🔄 Requesting avatar from server: ${username} -> ${avatarId}`);
      
      // Solicitar avatar al servidor
      socket.emit('getAvatar', { avatarId }, async (response) => {
        setLoading(prev => {
          const newLoading = new Set(prev);
          newLoading.delete(loadingKey);
          return newLoading;
        });

        if (response.ok && response.avatar) {
          const { avatarUrl } = response.avatar;
          
          // Guardar en caché
          await avatarCache.setAvatar(username, avatarId, avatarUrl);
          
          // Actualizar estado
          setAvatarUrls(prev => new Map(prev.set(username, avatarUrl)));
          
          console.log(`✅ Avatar synced: ${username} -> ${avatarId}`);
        } else {
          console.warn(`❌ Failed to sync avatar: ${username} -> ${avatarId}:`, response.error);
        }
      });
    } catch (error) {
      console.error('Error syncing avatar:', error);
      setLoading(prev => {
        const newLoading = new Set(prev);
        newLoading.delete(loadingKey);
        return newLoading;
      });
    }
  }, [loading]);

  // Sincronizar múltiples jugadores
  const syncPlayers = useCallback(async (players) => {
    if (!Array.isArray(players)) return;

    const syncPromises = players.map(async (player) => {
      if (player.username && player.avatarId) {
        return syncAvatar(player.username, player.avatarId);
      }
    });

    await Promise.all(syncPromises);
  }, [syncAvatar]);

  // Obtener URL del avatar (del caché local)
  const getAvatarUrl = useCallback((username) => {
    return avatarUrls.get(username) || null;
  }, [avatarUrls]);

  // Función para establecer avatar manualmente (para casos locales)
  const setLocalAvatarUrl = useCallback((username, avatarUrl) => {
    if (username && avatarUrl) {
      console.log(`💾 Setting local avatar: ${username}`);
      setAvatarUrls(prev => new Map(prev.set(username, avatarUrl)));
    }
  }, []);

  // Verificar si un avatar está siendo cargado
  const isLoading = useCallback((avatarId) => {
    return loading.has(avatarId);
  }, [loading]);

  return {
    syncAvatar,
    syncPlayers,
    getAvatarUrl,
    setLocalAvatarUrl,
    isLoading
  };
};
