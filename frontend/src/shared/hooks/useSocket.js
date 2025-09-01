import { useEffect, useState } from "react";
import { socketManager } from "../../core/socket";

/**
 * Hook para manejar la conexión y estado del socket
 * Proporciona el socket y información sobre su estado
 */
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(
    socketManager.isSocketConnected()
  );
  const [socketId, setSocketId] = useState(socketManager.getSocketId());

  useEffect(() => {
    const socket = socketManager.getSocket();

    // Handlers para actualizar el estado
    const handleConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketId(null);
    };

    // Registrar listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Actualizar estado inicial
    setIsConnected(socket.connected);
    setSocketId(socket.id);

    // Cleanup
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  return {
    socket: socketManager.getSocket(),
    isConnected,
    socketId,
    socketManager,
  };
};
