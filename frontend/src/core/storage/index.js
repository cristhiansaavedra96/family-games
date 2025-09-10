// 🗄️ STORAGE SYSTEM EXPORTS
// Servicios centralizados de almacenamiento y caché

// Avatar cache system
import { avatarCache } from "./avatarCache";
import { saveToStorage, loadFromStorage } from "../../shared/utils/storage";

// Exportar funciones del avatarCache
export {
  hasAvatarInCache,
  getAvatarFromCache,
  saveAvatarToCache,
  cleanOldCache,
  getAvatarWithCache,
  purgeLegacyAvatarCache,
  logAvatarCacheStatus,
} from "./avatarCache";

// Exportar funciones con los nombres que esperan los hooks
export const saveItem = saveToStorage;
export const loadItem = loadFromStorage;

export { avatarCache };

// Aquí se agregarán más servicios de storage como:
// export * from './gameCache';
// export * from './settingsStorage';
// export * from './profileStorage';
