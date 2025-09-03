// 🃏 UTILIDADES PARA CARTAS DEL TRUCO
// Funciones auxiliares para trabajar con cartas del Truco Uruguayo

/**
 * Obtiene el símbolo del palo
 */
export function getCardSuitSymbol(suit) {
  const symbols = {
    espada: "♠",
    basto: "♣",
    oro: "♦",
    copa: "♥",
  };
  return symbols[suit] || "?";
}

/**
 * Obtiene el color del palo
 */
export function getCardColor(suit) {
  const colors = {
    espada: "#1a1a1a", // Negro
    basto: "#1a1a1a", // Negro
    oro: "#d4af37", // Dorado
    copa: "#dc143c", // Rojo
  };
  return colors[suit] || "#666666";
}

/**
 * Formatea el nombre de la carta para mostrar
 */
export function formatCardName(card) {
  const { value, suit } = card;
  const suitSymbol = getCardSuitSymbol(suit);

  // Nombres especiales para algunas cartas
  const specialNames = {
    1: "As",
    11: "J",
    12: "Q",
  };

  const displayValue = specialNames[value] || value.toString();
  return `${displayValue}${suitSymbol}`;
}

/**
 * Calcula la jerarquía de una carta según la muestra
 */
export function getCardStrength(card, muestra) {
  if (!card || !muestra) return 0;

  const { value, suit } = card;

  // Piezas (cartas del palo de la muestra con valores especiales)
  if (suit === muestra.suit) {
    const piezaValues = { 2: 130, 4: 129, 5: 128, 11: 127, 10: 127 };
    if (piezaValues[value]) {
      return piezaValues[value];
    }

    // Alcahuete (12 del palo de muestra si la muestra es pieza)
    if (value === 12 && [2, 4, 5, 11, 10].includes(muestra.value)) {
      const piezaValues = { 2: 130, 4: 129, 5: 128, 11: 127, 10: 127 };
      return piezaValues[muestra.value];
    }
  }

  // Matas (cartas siempre fuertes)
  const mataStrength = {
    "1-espada": 126,
    "1-basto": 125,
    "7-espada": 124,
    "7-oro": 123,
  };

  const mataKey = `${value}-${suit}`;
  if (mataStrength[mataKey]) {
    return mataStrength[mataKey];
  }

  // Cartas comunes (orden descendente de fuerza)
  const commonOrder = [3, 2, 1, 12, 11, 10, 7, 6, 5, 4];
  const position = commonOrder.indexOf(value);
  return position >= 0 ? 50 - position : 0;
}

/**
 * Calcula el envido de una mano
 */
export function calculateEnvido(hand, muestra) {
  if (!hand || !muestra) return 0;

  const piezaValues = { 2: 30, 4: 29, 5: 28, 11: 27, 10: 27 };
  const isPiece = (c) =>
    c.suit === muestra.suit && piezaValues[c.value] != null;
  const isAlca = (c) =>
    c.suit === muestra.suit &&
    c.value === 12 &&
    piezaValues[muestra.value] != null;
  const envidoVal = (c) => {
    if (isPiece(c)) return piezaValues[c.value];
    if (isAlca(c)) return piezaValues[muestra.value];
    return c.value >= 10 ? 0 : c.value;
  };

  // Caso 1: al menos una pieza: pieza + mejor liga
  const pieces = hand.filter((c) => isPiece(c) || isAlca(c));
  if (pieces.length > 0) {
    const bestPieceVal = Math.max(...pieces.map((p) => envidoVal(p)));
    const ligaCandidates = hand.filter((c) => !isPiece(c) && !isAlca(c));
    const bestLiga = ligaCandidates.length
      ? Math.max(...ligaCandidates.map((c) => envidoVal(c)))
      : 0;
    return bestPieceVal + bestLiga;
  }

  // Caso 2: sin piezas, dos del mismo palo => 20 + dos mejores de ese palo
  const bySuit = hand.reduce((acc, c) => {
    (acc[c.suit] = acc[c.suit] || []).push(c);
    return acc;
  }, {});

  let maxEnvido = 0;
  Object.values(bySuit).forEach((cards) => {
    if (cards.length >= 2) {
      const vals = cards.map(envidoVal).sort((a, b) => b - a);
      const total = 20 + vals[0] + vals[1];
      if (total > maxEnvido) maxEnvido = total;
    }
  });

  // Caso 3: sin piezas ni dos del mismo palo: mayor suelto (hasta 7)
  if (maxEnvido === 0) {
    maxEnvido = Math.max(...hand.map(envidoVal));
  }

  return maxEnvido;
}

/**
 * Verifica si una mano tiene flor
 */
export function hasFlor(hand, muestra) {
  if (!hand || !muestra) return { hasFlor: false };

  // Helper piezas (excluye alcahuete para flor)
  const isPiece = (card) =>
    card.suit === muestra.suit && [2, 4, 5, 11, 10].includes(card.value);
  const isAlca = (card) =>
    card.suit === muestra.suit &&
    card.value === 12 &&
    [2, 4, 5, 11, 10].includes(muestra.value);

  const pieces = hand.filter(isPiece);
  const suitCounts = hand.reduce((acc, c) => {
    acc[c.suit] = (acc[c.suit] || 0) + 1;
    return acc;
  }, {});

  // 3 del mismo palo
  for (const [suit, count] of Object.entries(suitCounts)) {
    if (count === 3) {
      return { hasFlor: true, type: "tres_mismo_palo", suit };
    }
  }

  // 2 piezas (del palo de muestra) – no cuenta alcahuete
  if (pieces.length >= 2) {
    return { hasFlor: true, type: "piezas", suit: muestra.suit };
  }

  // 1 pieza + las otras dos del mismo palo (excluye piezas/alcahuete)
  if (pieces.length === 1) {
    const others = hand.filter((c) => !isPiece(c) && !isAlca(c));
    if (others.length === 2 && others[0].suit === others[1].suit) {
      return { hasFlor: true, type: "pieza_mismo_palo", suit: others[0].suit };
    }
  }

  return { hasFlor: false };
}
