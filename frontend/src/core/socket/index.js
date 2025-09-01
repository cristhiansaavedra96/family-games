import { io } from "socket.io-client";
import { APP_CONFIG } from "../config/constants";

// Clase para manejar la conexión de socket de manera más organizada
class SocketManager {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  // Inicializar la conexión
  connect() {
    if (this.socket?.connected) {
      console.log("Socket ya está conectado");
      return this.socket;
    }

    console.log("Iniciando conexión a:", APP_CONFIG.SERVER_URL);

    this.socket = io(APP_CONFIG.SERVER_URL, APP_CONFIG.SOCKET_CONFIG);
    this.setupEventHandlers();

    return this.socket;
  }

  // Configurar manejadores de eventos básicos
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Socket conectado a:", APP_CONFIG.SERVER_URL);
      console.log("📡 Socket ID:", this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket desconectado:", reason);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.log("🔥 Error de conexión:", error.message);
      this.reconnectAttempts++;
      this.isConnected = false;
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Socket reconectado en intento:", attemptNumber);
      this.isConnected = true;
    });

    this.socket.on("reconnect_failed", () => {
      console.log("💀 Falló la reconexión del socket");
      this.isConnected = false;
    });
  }

  // Obtener el socket actual
  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  // Verificar si está conectado
  isSocketConnected() {
    return this.socket?.connected || false;
  }

  // Desconectar
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Helper para obtener el socket ID de manera segura
  getSocketId() {
    return this.socket?.id || null;
  }
}

// Instancia singleton del socket manager
const socketManager = new SocketManager();

// Inicializar conexión automáticamente
const socket = socketManager.connect();

// Exportar tanto el socket tradicional como el manager
export default socket;
export { socketManager };
