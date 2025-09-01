import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Funciones utilitarias de storage para usar fuera de componentes React
 * (No requieren hooks, pueden usarse en utils, servicios, etc.)
 */

// Función para guardar un valor
export const saveToStorage = async (key, value) => {
  try {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
    return { success: true };
  } catch (error) {
    console.error(`❌ Error guardando ${key}:`, error);
    return { success: false, error };
  }
};

// Función para cargar un valor
export const loadFromStorage = async (key, defaultValue = null) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return defaultValue;

    // Intentar parsear como JSON, si falla devolver como string
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error(`❌ Error cargando ${key}:`, error);
    return defaultValue;
  }
};

// Función para eliminar un valor
export const removeFromStorage = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return { success: true };
  } catch (error) {
    console.error(`❌ Error eliminando ${key}:`, error);
    return { success: false, error };
  }
};

// Función para obtener todas las claves
export const getAllStorageKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys;
  } catch (error) {
    console.error("❌ Error obteniendo claves:", error);
    return [];
  }
};

// Función para limpiar todo el storage
export const clearAllStorage = async () => {
  try {
    await AsyncStorage.clear();
    return { success: true };
  } catch (error) {
    console.error("❌ Error limpiando storage:", error);
    return { success: false, error };
  }
};
