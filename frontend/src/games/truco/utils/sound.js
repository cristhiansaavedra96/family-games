// 🔊 SERVICIO DE SONIDO PARA TRUCO
// Manejo de efectos de sonido específicos del Truco

// TODO: Instalar expo-av para sonidos reales
// import { Audio } from 'expo-av';

class TrucoSoundService {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // TODO: Configurar audio cuando se instale expo-av
      // await Audio.setAudioModeAsync({
      //   allowsRecordingIOS: false,
      //   staysActiveInBackground: false,
      //   playsInSilentModeIOS: true,
      //   shouldDuckAndroid: true,
      //   playThroughEarpieceAndroid: false,
      // });

      this.initialized = true;
      console.log(
        "🔊 Servicio de sonido del Truco inicializado (modo silencioso)"
      );
    } catch (error) {
      console.warn("Error inicializando audio del Truco:", error);
    }
  }

  async playCardSound() {
    if (!this.enabled) return;

    try {
      // Aquí se podría cargar un sonido específico para cuando se juega una carta
      // Por ahora usamos un sonido genérico del sistema
      console.log("🃏 Carta jugada - sonido reproducido");
    } catch (error) {
      console.warn("Error reproduciendo sonido de carta:", error);
    }
  }

  async playTrucoSound() {
    if (!this.enabled) return;

    try {
      // Sonido cuando se canta "Truco"
      console.log("🎯 Truco cantado - sonido reproducido");
    } catch (error) {
      console.warn("Error reproduciendo sonido de truco:", error);
    }
  }

  async playEnvidoSound() {
    if (!this.enabled) return;

    try {
      // Sonido cuando se canta "Envido"
      console.log("💎 Envido cantado - sonido reproducido");
    } catch (error) {
      console.warn("Error reproduciendo sonido de envido:", error);
    }
  }

  async playVictorySound() {
    if (!this.enabled) return;

    try {
      // Sonido de victoria
      console.log("🏆 Victoria - sonido reproducido");
    } catch (error) {
      console.warn("Error reproduciendo sonido de victoria:", error);
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  async cleanup() {
    // TODO: Limpiar recursos de sonido cuando se instale expo-av
    // Object.values(this.sounds).forEach((sound) => {
    //   try {
    //     sound.unloadAsync();
    //   } catch (error) {
    //     console.warn("Error limpiando sonido:", error);
    //   }
    // });
    this.sounds = {};
    console.log("🔊 Sonidos limpiados");
  }
}

export { TrucoSoundService };
export default new TrucoSoundService();
