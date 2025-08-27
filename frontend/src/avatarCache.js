// src/avatarCache.js
// Sistema de caché de avatares por avatarId
import AsyncStorage from '@react-native-async-storage/async-storage';

const AVATAR_CACHE_PREFIX = 'avatar_cache:';
const AVATAR_INDEX_KEY = 'avatar_cache_index';

class AvatarCache {
  constructor() {
    this.memoryCache = new Map(); // Cache en memoria para acceso rápido
  }

  // Generar clave de caché
  getCacheKey(avatarId) {
    return `${AVATAR_CACHE_PREFIX}${avatarId}`;
  }

  // Obtener avatar del caché
  async getAvatar(username, avatarId) {
    if (!avatarId) return null;

    // Primero verificar memoria
    const memoryKey = `${username}:${avatarId}`;
    if (this.memoryCache.has(memoryKey)) {
      console.log(`🎯 Avatar cache HIT (memory): ${username} -> ${avatarId}`);
      return this.memoryCache.get(memoryKey);
    }

    // Verificar AsyncStorage
    try {
      const cacheKey = this.getCacheKey(avatarId);
      const cachedAvatar = await AsyncStorage.getItem(cacheKey);
      
      if (cachedAvatar) {
        console.log(`🎯 Avatar cache HIT (storage): ${username} -> ${avatarId}`);
        // Guardar en memoria para próximas consultas
        this.memoryCache.set(memoryKey, cachedAvatar);
        return cachedAvatar;
      }
    } catch (error) {
      console.error('❌ Error reading avatar cache:', error);
    }

    console.log(`🔍 Avatar cache MISS: ${username} -> ${avatarId}`);
    return null;
  }

  // Guardar avatar en caché
  async setAvatar(username, avatarId, avatarUrl) {
    if (!avatarId || !avatarUrl) return;

    const memoryKey = `${username}:${avatarId}`;
    const cacheKey = this.getCacheKey(avatarId);

    try {
      // Guardar en AsyncStorage
      await AsyncStorage.setItem(cacheKey, avatarUrl);
      
      // Guardar en memoria
      this.memoryCache.set(memoryKey, avatarUrl);
      
      // Actualizar índice de caché
      await this.updateCacheIndex(avatarId);
      
      console.log(`💾 Avatar cached: ${username} -> ${avatarId} (${(avatarUrl.length/1024).toFixed(1)}KB)`);
    } catch (error) {
      console.error('❌ Error saving avatar cache:', error);
    }
  }

  // Verificar si necesitamos actualizar el avatar
  async needsUpdate(username, newAvatarId) {
    if (!newAvatarId) return false;
    
    const cached = await this.getAvatar(username, newAvatarId);
    const needsUpdate = !cached;
    
    console.log(`🔄 Avatar update check: ${username} -> ${newAvatarId} -> ${needsUpdate ? 'NEEDS UPDATE' : 'UP TO DATE'}`);
    return needsUpdate;
  }

  // Actualizar índice de avatares cacheados
  async updateCacheIndex(avatarId) {
    try {
      let index = [];
      const existingIndex = await AsyncStorage.getItem(AVATAR_INDEX_KEY);
      if (existingIndex) {
        index = JSON.parse(existingIndex);
      }

      if (!index.includes(avatarId)) {
        index.push(avatarId);
        await AsyncStorage.setItem(AVATAR_INDEX_KEY, JSON.stringify(index));
      }
    } catch (error) {
      console.error('❌ Error updating cache index:', error);
    }
  }

  // Limpiar caché antiguo (opcional, para mantener el storage limpio)
  async clearOldCache(keepCount = 50) {
    try {
      const indexData = await AsyncStorage.getItem(AVATAR_INDEX_KEY);
      if (!indexData) return;

      const index = JSON.parse(indexData);
      if (index.length <= keepCount) return;

      // Mantener solo los más recientes
      const toDelete = index.slice(0, index.length - keepCount);
      const toKeep = index.slice(-keepCount);

      // Eliminar avatares antiguos
      for (const avatarId of toDelete) {
        const cacheKey = this.getCacheKey(avatarId);
        await AsyncStorage.removeItem(cacheKey);
      }

      // Actualizar índice
      await AsyncStorage.setItem(AVATAR_INDEX_KEY, JSON.stringify(toKeep));
      
      console.log(`🧹 Cleaned ${toDelete.length} old avatars from cache`);
    } catch (error) {
      console.error('❌ Error cleaning cache:', error);
    }
  }
}

// Instancia global del caché
const avatarCache = new AvatarCache();
export default avatarCache;
