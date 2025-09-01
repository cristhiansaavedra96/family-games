import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Hook para manejar almacenamiento local con AsyncStorage
 * Proporciona funciones comunes para guardar, cargar y eliminar datos
 */
export const useStorage = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Función para guardar un valor
  const saveItem = useCallback(async (key, value) => {
    try {
      setIsLoading(true);
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error guardando ${key}:`, error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para cargar un valor
  const loadItem = useCallback(async (key, defaultValue = null) => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para eliminar un valor
  const removeItem = useCallback(async (key) => {
    try {
      setIsLoading(true);
      await AsyncStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error eliminando ${key}:`, error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para obtener todas las claves
  const getAllKeys = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys;
    } catch (error) {
      console.error("❌ Error obteniendo claves:", error);
      return [];
    }
  }, []);

  // Función para limpiar todo el storage
  const clearAll = useCallback(async () => {
    try {
      setIsLoading(true);
      await AsyncStorage.clear();
      return { success: true };
    } catch (error) {
      console.error("❌ Error limpiando storage:", error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hook para manejar un valor específico con estado reactivo
  const useStorageState = (key, defaultValue = null) => {
    const [value, setValue] = useState(defaultValue);
    const [loading, setLocalLoading] = useState(true);

    // Cargar valor inicial
    useEffect(() => {
      const loadValue = async () => {
        setLocalLoading(true);
        const loadedValue = await loadItem(key, defaultValue);
        setValue(loadedValue);
        setLocalLoading(false);
      };
      loadValue();
    }, [key, defaultValue]);

    // Función para actualizar valor
    const updateValue = useCallback(
      async (newValue) => {
        setValue(newValue);
        await saveItem(key, newValue);
      },
      [key]
    );

    return [value, updateValue, loading];
  };

  return {
    // Funciones básicas
    saveItem,
    loadItem,
    removeItem,
    getAllKeys,
    clearAll,

    // Estado
    isLoading,

    // Hook adicional
    useStorageState,
  };
};
