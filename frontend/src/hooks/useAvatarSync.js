// src/hooks/useAvatarSync.js
// Hook para sincronización de avatares SIMPLE Y FUNCIONAL
import { useState, useCallback } from "react";
import { getAvatarFromCache, saveAvatarToCache } from "../services/avatarCache";
import socket from "../socket";

export const useAvatarSync = () => {
  const [avatarUrls, setAvatarUrls] = useState(new Map()); // username -> avatarUrl
  const [loading, setLoading] = useState(new Set()); // avatarIds being loaded

  // Función principal: cargar avatares para una lista de jugadores
  const syncPlayers = useCallback(
    async (players) => {
      if (!Array.isArray(players) || players.length === 0) return;

      console.log(`🔄 Sincronizando ${players.length} jugadores...`);

      const syncPromises = players.map(async (player) => {
        if (!player.username || !player.avatarId) return;

        // 1. Si ya está en memoria, saltar
        if (avatarUrls.has(player.username)) {
          console.log(`✅ Ya en memoria: ${player.username}`);
          return;
        }

        // 2. Intentar cargar desde caché
        try {
          const cached = await getAvatarFromCache(player.avatarId);
          if (cached) {
            console.log(
              `✅ Desde caché: ${player.username} -> ${player.avatarId}`
            );
            setAvatarUrls((prev) => new Map(prev.set(player.username, cached)));
            return;
          }
        } catch (error) {
          console.warn(
            `⚠️ Error leyendo caché para ${player.avatarId}:`,
            error
          );
        }

        // 3. Solo si no está en caché, descargarlo
        if (loading.has(player.avatarId)) {
          console.log(`⏳ Ya descargando: ${player.avatarId}`);
          return;
        }

        console.log(`⬇️ Descargando: ${player.username} -> ${player.avatarId}`);
        setLoading((prev) => new Set(prev.add(player.avatarId)));

        socket.emit(
          "getAvatar",
          { avatarId: player.avatarId },
          async (response) => {
            // Quitar de loading
            setLoading((prev) => {
              const newLoading = new Set(prev);
              newLoading.delete(player.avatarId);
              return newLoading;
            });

            if (response.ok && response.avatar?.avatarUrl) {
              console.log(
                `✅ Descargado: ${player.username} -> ${player.avatarId}`
              );

              try {
                // Guardar en caché
                await saveAvatarToCache(
                  player.avatarId,
                  response.avatar.avatarUrl
                );

                // Actualizar estado
                setAvatarUrls(
                  (prev) =>
                    new Map(
                      prev.set(player.username, response.avatar.avatarUrl)
                    )
                );
              } catch (error) {
                console.warn(
                  `⚠️ Error guardando en caché ${player.avatarId}:`,
                  error
                );
              }
            } else {
              console.warn(
                `❌ Error descargando: ${player.username} -> ${player.avatarId}`,
                response.error
              );
            }
          }
        );
      });

      await Promise.all(syncPromises);
      console.log(`✅ Sincronización completada`);
    },
    [avatarUrls, loading]
  );

  // Función para sincronizar un solo avatar
  const syncAvatar = useCallback(
    async (username, avatarId) => {
      return syncPlayers([{ username, avatarId }]);
    },
    [syncPlayers]
  );

  // Obtener URL del avatar desde memoria
  const getAvatarUrl = useCallback(
    (username) => {
      return avatarUrls.get(username) || null;
    },
    [avatarUrls]
  );

  // Establecer avatar manualmente
  const setLocalAvatarUrl = useCallback((username, avatarUrl) => {
    if (username && avatarUrl) {
      setAvatarUrls((prev) => new Map(prev.set(username, avatarUrl)));
    }
  }, []);

  // Verificar si está descargando
  const isLoading = useCallback(
    (avatarId) => {
      return loading.has(avatarId);
    },
    [loading]
  );

  // Limpiar memoria
  const clearMemoryCache = useCallback(() => {
    console.log("🧹 Limpiando caché de memoria");
    setAvatarUrls(new Map());
  }, []);

  return {
    syncAvatar,
    syncPlayers,
    getAvatarUrl,
    setLocalAvatarUrl,
    isLoading,
    clearMemoryCache,
  };
};
