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

export function speakBingoNumber(n) {
  const words = numberWordsEs(n);
  let phrase = words;
  if (n >= 10) {
    const digits = String(n).split('').map(digitWord).join(' ');
    phrase = `${digits}, ${words}`;
  }
  Speech.speak(phrase, { language: 'es-AR', pitch: 1.1, rate: 0.9 });
}
