import * as Speech from 'expo-speech';

const digitWord = (d) => ['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve'][Number(d)];

const numberWordsEs = (n) => {
  const u = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve'];
  const e = ['diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve'];
  const d = ['','','veinte','treinta','cuarenta','cincuenta','sesenta','setenta'];
  
  if (n < 10) return u[n];
  if (n < 20) return e[n-10];
  
  const dec = Math.floor(n/10), un = n%10;
  if (n === 20) return 'veinte';
  if (dec === 2) return un ? `veinti${u[un]}` : 'veinte';
  return un ? `${d[dec]} y ${u[un]}` : d[dec];
};

// Versión alternativa con pausa dramática para bingo
export function speakNumberBingo(n) {
  const words = numberWordsEs(n);
  console.log(`Speaking bingo numbersss: ${n}`);
  if (n >= 10) {
    const digits = String(n).split('').map(digitWord).join(' ');
  
      Speech.speak(words, {
        language: 'es-AR',
        volume: 0.1,
        rate: 1,
        pitch: 1,
        quality: "Enhanced"
      });
    
  } else {
    // Para números menores a 10, solo dice el nombre
    Speech.speak(words, {
      language: 'es-AR',
      volume: 0.1,
        rate: 0.8,
      pitch: 1,
      quality: "Enhanced"
    });
  }
}

// Función para probar diferentes voces disponibles
export async function getAvailableVoices() {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const spanishVoices = voices.filter(voice => 
      voice.language.startsWith('es-') || 
      voice.name.toLowerCase().includes('spanish') ||
      voice.name.toLowerCase().includes('español')
    );
    return spanishVoices;
  } catch (error) {
    console.log('Error obteniendo voces:', error);
    return [];
  }
}