// 🗄️ AVATAR CACHE SERVICE
// Sistema de caché local para avatares usando FileSystem
// Movido de src/services/avatarCache.js para mejor organización

import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, APP_CONFIG } from "../config/constants";

const CACHE_DIR = FileSystem.documentDirectory + "avatars/";
// Usar una clave distinta a la del caché legado para evitar conflictos de formato
const CACHE_INDEX_KEY = "fs_avatar_cache_index";
const LEGACY_PREFIX = "avatar_cache:"; // usado por la implementación antigua en AsyncStorage
const LEGACY_INDEX_KEY = "avatar_cache_index";

// Asegurar que existe el directorio de caché
async function ensureCacheDir() {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

// Obtener índice de caché (avatarId -> timestamp)
async function getCacheIndex() {
  try {
    const index = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    return index ? JSON.parse(index) : {};
  } catch {
    return {};
  }
}

// Guardar índice de caché
async function saveCacheIndex(index) {
  try {
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  } catch {
    // Ignorar errores de guardado
  }
}

// Verificar si tenemos un avatar en caché
export async function hasAvatarInCache(avatarId) {
  if (!avatarId) return false;

  try {
    await ensureCacheDir();
    const filePath = CACHE_DIR + avatarId + ".jpg";
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    return fileInfo.exists;
  } catch {
    return false;
  }
}

// Obtener avatar del caché
export async function getAvatarFromCache(avatarId) {
  if (!avatarId) return null;

  try {
    const filePath = CACHE_DIR + avatarId + ".jpg";
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      const base64 = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    }
    return null;
  } catch {
    return null;
  }
}

// Guardar avatar en caché
export async function saveAvatarToCache(avatarId, base64Data) {
  if (!avatarId || !base64Data) return false;

  try {
    await ensureCacheDir();

    // Extraer solo el base64 sin el prefijo data:image
    const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");

    const filePath = CACHE_DIR + avatarId + ".jpg";
    await FileSystem.writeAsStringAsync(filePath, cleanBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Actualizar índice
    const index = await getCacheIndex();
    index[avatarId] = Date.now();
    await saveCacheIndex(index);

    return true;
  } catch (error) {
    console.warn("❌ Error saving avatar to cache:", error);
    return false;
  }
}

// Limpiar caché antiguo usando configuración centralizada
export async function cleanOldCache(
  maxAge = APP_CONFIG.CACHE_CONFIG.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
) {
  try {
    const index = await getCacheIndex();
    const now = Date.now();
    const cleanedIndex = {};

    for (const [avatarId, timestamp] of Object.entries(index)) {
      if (now - timestamp < maxAge) {
        cleanedIndex[avatarId] = timestamp;
      } else {
        // Eliminar archivo antiguo
        try {
          const filePath = CACHE_DIR + avatarId + ".jpg";
          await FileSystem.deleteAsync(filePath);
        } catch {
          // Ignorar errores al eliminar
        }
      }
    }

    await saveCacheIndex(cleanedIndex);
    console.log("🧹 Avatar cache cleaned successfully");
  } catch {
    console.warn("⚠️ Error cleaning avatar cache");
  }
}

// Obtener avatar con caché automático
export async function getAvatarWithCache(avatarId, fallbackUrl) {
  if (!avatarId) return fallbackUrl;

  // Primero intentar desde caché
  const cached = await getAvatarFromCache(avatarId);
  if (cached) return cached;

  // Si no está en caché pero tenemos fallbackUrl, guardarlo y devolverlo
  if (fallbackUrl && fallbackUrl.startsWith("data:image")) {
    await saveAvatarToCache(avatarId, fallbackUrl);
    return fallbackUrl;
  }

  return fallbackUrl;
}

// PURGA: elimina el caché legado basado en AsyncStorage (evita SQLITE_FULL)
export async function purgeLegacyAvatarCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter(
      (k) => k.startsWith(LEGACY_PREFIX) || k === LEGACY_INDEX_KEY
    );
    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
      console.log("🗑️ Legacy avatar cache purged successfully");
    }
  } catch (e) {
    console.warn("⚠️ Failed purging legacy avatar cache:", e);
  }
}

// Debug: Imprimir estado del caché de avatares (IDs, fechas, tamaños)
export async function logAvatarCacheStatus() {
  try {
    await ensureCacheDir();
    const index = await getCacheIndex();
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);

    console.log("📊 Avatar Cache Status:");
    console.log(`📁 Cache directory: ${CACHE_DIR}`);
    console.log(`📂 Files in cache: ${files.length}`);
    console.log(`📋 Index entries: ${Object.keys(index).length}`);

    for (const avatarId of Object.keys(index)) {
      const filePath = CACHE_DIR + avatarId + ".jpg";
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const sizeKB = fileInfo.exists
        ? (fileInfo.size / 1024).toFixed(1)
        : "N/A";
      const fecha = new Date(index[avatarId]).toLocaleString();
      console.log(`  📄 ${avatarId}: ${sizeKB}KB (${fecha})`);
    }
  } catch (e) {
    console.warn("❌ Error al inspeccionar el caché de avatares:", e);
  }
}
