const { syncPlayerWithDatabase } = require("./playerManager");

/**
 * Crea los manejadores de eventos Socket.IO para gestión de salas
 * @param {object} dependencies - Dependencias necesarias
 * @returns {object} Objeto con todos los handlers de salas
 */
function createRoomHandlers({
  roomsManager,
  gameHandlers,
  getGameHandler,
  cleanupGameHandler,
  ensurePlayerInSingleRoom,
  broadcastRoomState,
  broadcastRoomsList,
  checkAllPlayersReady,
  io,
}) {
  return {
    // Listado y limpieza de salas
    listRooms: (socket) => () => {
      socket.emit("rooms", roomsManager.getRoomsList(gameHandlers));
    },

    cleanupRooms: (socket) => () => {
      // Limpiar salas vacías o inactivas
      const cleanedCount = roomsManager.cleanupEmptyRooms();

      // Limpiar game handlers huérfanos
      for (const roomId of gameHandlers.keys()) {
        if (!roomsManager.getRoom(roomId)) {
          cleanupGameHandler(roomId);
        }
      }

      console.log(`Limpieza completada: ${cleanedCount} salas eliminadas`);
      broadcastRoomsList();
    },

    // Crear sala
    createRoom:
      (socket) =>
      async ({ player, gameKey }) => {
        let { name, avatarUrl, username } = player || {};
        let avatarId = null;

        // Validar que el tipo de juego sea válido
        const validGameKeys = ["bingo"]; // Aquí se pueden agregar más juegos en el futuro
        const selectedGameKey =
          gameKey && validGameKeys.includes(gameKey) ? gameKey : "bingo";

        // Asegurar que el jugador salga de cualquier sala anterior
        ensurePlayerInSingleRoom(socket);

        // Sincronizar jugador con base de datos
        const syncResult = await syncPlayerWithDatabase(
          username,
          name,
          avatarUrl
        );
        avatarUrl = syncResult.player.avatarUrl;
        avatarId = syncResult.avatarId;

        // Crear sala con configuración básica (sin configuraciones específicas de juego)
        const roomConfig = {
          speed: 1,
        };
        const room = roomsManager.createRoom(selectedGameKey, roomConfig);

        // El GameHandler se encarga automáticamente de inicializar su configuración por defecto
        getGameHandler(room.id);

        // Agregar jugador a la sala
        roomsManager.addPlayerToRoom(room.id, socket.id, {
          name,
          avatarUrl,
          avatarId,
          username,
          cards: [],
        });

        socket.join(room.id);
        socket.data.roomId = room.id;

        socket.emit("joined", {
          id: socket.id,
          hostId: room.hostId,
          roomId: room.id,
        });

        broadcastRoomState(room.id);
        broadcastRoomsList();
      },

    // Unirse a sala
    joinRoom:
      (socket) =>
      async ({ roomId, player }) => {
        const room = roomsManager.getRoom(roomId);
        if (!room) return;

        // Asegurar que el jugador salga de cualquier sala anterior (excepto la que está tratando de unirse)
        ensurePlayerInSingleRoom(socket, roomId);

        let { name, avatarUrl, username } = player || {};
        let avatarId = null;

        // Sincronizar jugador con base de datos
        const syncResult = await syncPlayerWithDatabase(
          username,
          name,
          avatarUrl
        );
        avatarUrl = syncResult.player.avatarUrl;
        avatarId = syncResult.avatarId;

        // Agregar jugador a la sala
        roomsManager.addPlayerToRoom(roomId, socket.id, {
          name,
          avatarUrl,
          avatarId,
          username,
          cards: [],
        });

        socket.join(roomId);
        socket.data.roomId = roomId;

        socket.emit("joined", {
          id: socket.id,
          hostId: room.hostId,
          roomId: room.id,
        });

        broadcastRoomState(roomId);
        broadcastRoomsList();
      },

    // Salir de sala
    leaveRoom: (socket) => () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const result = roomsManager.removePlayerFromRoom(roomId, socket.id);
      if (!result) return;

      const { room, shouldDelete } = result;
      socket.leave(roomId);
      socket.data.roomId = null;

      if (shouldDelete) {
        cleanupGameHandler(roomId);
        roomsManager.deleteRoom(roomId);
        broadcastRoomsList();
        return;
      }

      broadcastRoomState(roomId);
      broadcastRoomsList();
    },

    // Jugador listo para nueva partida
    readyForNewGame:
      (socket) =>
      ({ roomId }) => {
        const room = roomsManager.setPlayerReady(
          roomId || socket.data.roomId,
          socket.id
        );
        if (!room) return;

        broadcastRoomState(room.id);

        // Verificar si todos están listos
        if (roomsManager.checkAllPlayersReady(room)) {
          checkAllPlayersReady(room);
        }
      },
  };
}

/**
 * Crea los manejadores de eventos Socket.IO para el flujo del juego
 * @param {object} dependencies - Dependencias necesarias
 * @returns {object} Objeto con todos los handlers de juego
 */
function createGameFlowHandlers({
  roomsManager,
  getGameHandler,
  broadcastRoomState,
  broadcastRoomsList,
}) {
  return {
    // Configurar juego
    configure:
      (socket) =>
      ({ roomId, config }) => {
        const room = roomsManager.getRoom(roomId || socket.data.roomId);
        if (!room || room.hostId !== socket.id) return;

        // No permitir cambios si el juego ya empezó
        if (room.gameState?.started) return;

        // Configurar parámetros específicos del juego usando el GameHandler
        const gameHandler = getGameHandler(room.id);
        if (gameHandler && config) {
          gameHandler.setGameConfig(config);
        }

        broadcastRoomState(room.id);
        broadcastRoomsList();
      },

    // Establecer velocidad
    setSpeed:
      (socket) =>
      ({ roomId, speed }) => {
        const room = roomsManager.getRoom(roomId || socket.data.roomId);
        if (!room || room.hostId !== socket.id) return;

        const gameHandler = getGameHandler(room.id);
        if (gameHandler && gameHandler.setSpeed) {
          const success = gameHandler.setSpeed(speed);
          if (success) {
            broadcastRoomState(room.id);
          }
        }
      },

    // Iniciar juego
    startGame:
      (socket) =>
      ({ roomId }) => {
        const room = roomsManager.getRoom(roomId || socket.data.roomId);
        if (!room || room.hostId !== socket.id) return;

        const gameHandler = getGameHandler(room.id);
        if (gameHandler) {
          gameHandler.startGame();
          broadcastRoomState(room.id);
        }
      },

    // Pausar sorteo
    pauseDraw:
      (socket) =>
      ({ roomId }) => {
        const room = roomsManager.getRoom(roomId || socket.data.roomId);
        if (!room || room.hostId !== socket.id) return;

        const gameHandler = getGameHandler(room.id);
        if (gameHandler && gameHandler.pauseDraw) {
          gameHandler.pauseDraw();
          broadcastRoomState(room.id);
        }
      },

    // Reanudar sorteo
    resumeDraw:
      (socket) =>
      ({ roomId }) => {
        const room = roomsManager.getRoom(roomId || socket.data.roomId);
        if (!room || room.hostId !== socket.id) return;

        const gameHandler = getGameHandler(room.id);
        if (gameHandler && gameHandler.resumeDraw) {
          gameHandler.resumeDraw();
          broadcastRoomState(room.id);
        }
      },

    // Siguiente bola (control manual)
    nextBall:
      (socket) =>
      ({ roomId }) => {
        const room = roomsManager.getRoom(roomId || socket.data.roomId);
        if (!room || room.hostId !== socket.id) return;

        const gameHandler = getGameHandler(room.id);
        if (gameHandler && gameHandler.forceNextBall) {
          const ball = gameHandler.forceNextBall();
          if (ball !== null) {
            broadcastRoomState(room.id);
          }
        }
      },

    // Reclamar victoria (claim)
    claim:
      (socket) =>
      ({ roomId, figure, cardIndex, marked }) => {
        try {
          console.log(`Claim recibido de ${socket.id}:`, {
            roomId,
            figure,
            cardIndex,
            hasMarked: !!marked,
          });
          const rid = roomId || socket.data.roomId;

          if (!rid) {
            console.error("Error: No roomId available");
            socket.emit("claimResult", { ok: false, reason: "no_room_id" });
            return;
          }

          const gameHandler = getGameHandler(rid);
          if (!gameHandler) {
            console.error("Error: No game handler available");
            socket.emit("claimResult", {
              ok: false,
              reason: "no_game_handler",
            });
            return;
          }

          const res = figure
            ? gameHandler.checkClaim(
                socket.id,
                figure,
                cardIndex,
                marked,
                require("../services/statsService"),
                require("../core/datastore").getDataStore()
              )
            : gameHandler.autoClaim(
                socket.id,
                cardIndex,
                marked,
                require("../services/statsService"),
                require("../core/datastore").getDataStore()
              );

          console.log(`Resultado del claim para ${socket.id}:`, res);
          socket.emit("claimResult", res);
          broadcastRoomState(rid);
        } catch (error) {
          console.error("Error procesando claim:", error);
          socket.emit("claimResult", { ok: false, reason: "server_error" });
        }
      },

    // Obtener estado de la sala
    getState:
      (socket) =>
      ({ roomId }) => {
        const room = roomsManager.getRoom(roomId || socket.data.roomId);
        if (!room) return;

        const publicPlayers = Array.from(room.players.entries()).map(
          ([sid, p]) => ({
            id: sid,
            name: p.name,
            avatarId: p.avatarId,
            username: p.username,
            cards: p.cards,
          })
        );

        // Obtener el estado específico del juego
        const gameHandler = getGameHandler(room.id);
        const gameState = gameHandler ? gameHandler.getPublicState() : {};
        const fullConfig = gameHandler
          ? gameHandler.getFullConfig()
          : room.config;

        socket.emit("state", {
          roomId: room.id,
          name: room.name,
          gameKey: room.gameKey,
          hostId: room.hostId,
          players: publicPlayers,
          // Configuración completa (sala + juego específico)
          ...fullConfig,
          // Estado del juego
          ...gameState,
          gameEnded: room.gameEnded,
          playersReady: Array.from(room.playersReady),
        });
      },
  };
}

/**
 * Crea los manejadores de eventos Socket.IO para estadísticas y datos
 * @param {object} handlers - Handlers modulares ya creados
 * @returns {object} Objeto con todos los handlers de stats
 */
function createStatsHandlers({
  getStatsHandler,
  getLeaderboardHandler,
  getTopPlayersHandler,
  searchPlayersHandler,
  getAvatarHandler,
  getAvatarByIdHandler,
  syncAvatarsHandler,
  checkAvatarsHandler,
  updateProfileHandler,
  compressAllAvatarsHandler,
}) {
  return {
    // Estadísticas
    getStats:
      (socket) =>
      async ({ playerId }, cb) => {
        await getStatsHandler({ playerId }, cb, socket.id, socket.data.roomId);
      },

    getLeaderboard:
      (socket) =>
      async ({ gameKey, limit }, cb) => {
        await getLeaderboardHandler({ gameKey, limit }, cb);
      },

    getTopPlayers: (socket) => async (params, cb) => {
      await getTopPlayersHandler(params, cb);
    },

    searchPlayers:
      (socket) =>
      async ({ query, limit }, cb) => {
        await searchPlayersHandler({ query, limit }, cb);
      },

    // Gestión de avatares
    getAvatar:
      (socket) =>
      async ({ avatarId, clientHasCache }, cb) => {
        await getAvatarHandler({ avatarId, clientHasCache }, cb);
      },

    getAvatarById:
      (socket) =>
      async ({ avatarId }, cb) => {
        await getAvatarByIdHandler({ avatarId }, cb);
      },

    syncAvatars:
      (socket) =>
      async ({ lastSync }, cb) => {
        await syncAvatarsHandler({ lastSync }, cb);
      },

    checkAvatars:
      (socket) =>
      async ({ avatarIds, clientCachedIds }, cb) => {
        await checkAvatarsHandler({ avatarIds, clientCachedIds }, cb);
      },

    // Gestión de perfiles
    updateProfile:
      (socket) =>
      async ({ username, name, avatarUrl }, cb) => {
        await updateProfileHandler(
          { username, name, avatarUrl },
          cb,
          socket.id
        );
      },

    compressAllAvatars: (socket) => async (data, cb) => {
      await compressAllAvatarsHandler(data, cb);
    },
  };
}

/**
 * Crea los manejadores de eventos Socket.IO para chat
 * @param {object} dependencies - Dependencias necesarias
 * @returns {object} Objeto con todos los handlers de chat
 */
function createChatHandlers({ roomsManager, io }) {
  return {
    sendChatMessage:
      (socket) =>
      ({ roomId, message }) => {
        console.log("Received chat message:", { roomId, message });
        const room = roomsManager.getRoom(roomId || socket.data.roomId);
        if (!room) {
          console.log("Room not found for chat message");
          return;
        }

        // Verificar que el jugador está en la sala
        if (!room.players.has(socket.id)) {
          console.log("Player not in room for chat message");
          return;
        }

        console.log(
          "Broadcasting chat message to room:",
          roomId || socket.data.roomId
        );
        // Reenviar el mensaje a todos en la sala
        io.to(roomId || socket.data.roomId).emit("chatMessage", message);
      },
  };
}

/**
 * Crea el manejador de desconexión
 * @param {object} dependencies - Dependencias necesarias
 * @returns {function} Handler de disconnect
 */
function createDisconnectHandler({
  roomsManager,
  cleanupGameHandler,
  broadcastRoomState,
  broadcastRoomsList,
}) {
  return (socket) => () => {
    // Remover el jugador de todas las salas donde pueda estar
    const removedResults = roomsManager.removePlayerFromAllRooms(socket.id);

    if (removedResults.length === 0) return;

    // Procesar cada sala de la que fue removido
    for (const result of removedResults) {
      const { room, shouldDelete } = result;

      if (shouldDelete) {
        // Limpiar game handler y eliminar sala
        cleanupGameHandler(room.id);
        roomsManager.deleteRoom(room.id);
        console.log(`Eliminando sala ${room.id} por falta de jugadores`);
      } else {
        // Solo notificar cambios en la sala
        broadcastRoomState(room.id);
      }
    }

    // Actualizar lista de salas una sola vez al final
    broadcastRoomsList();
    socket.data.roomId = null;
  };
}

module.exports = {
  createRoomHandlers,
  createGameFlowHandlers,
  createStatsHandlers,
  createChatHandlers,
  createDisconnectHandler,
};
