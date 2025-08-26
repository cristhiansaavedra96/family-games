// Utilidades para cálculos de diseño del bingo
export function calculateCardLayout(numCards, availableWidth, availableHeight) {
  if (numCards <= 0) return { cardWidth: 0, cardHeight: 0, aspectRatio: 1 };

  let cols, rows, aspectRatio, cardWidth, cardHeight;
  const margin = 12;
  
  if (numCards === 1) {
    // 1 cartón: centrado y grande
    cols = 1;
    rows = 1;
    aspectRatio = 1.0;
    cardWidth = Math.min(availableWidth - margin * 2, availableHeight * aspectRatio - margin * 2);
    cardHeight = cardWidth / aspectRatio;
  } else if (numCards === 2) {
    // 2 cartones: en columna (vertical)
    cols = 1;
    rows = 2;
    aspectRatio = 0.95;
    const maxHeight = (availableHeight - margin * 3) / rows; // espacio entre cartones
    const maxWidth = availableWidth - margin * 2;
    cardHeight = Math.min(maxHeight, maxWidth / aspectRatio);
    cardWidth = cardHeight * aspectRatio;
  } else {
    // 3-4 cartones: cuadrícula 2x2
    cols = 2;
    rows = Math.ceil(numCards / cols);
    aspectRatio = 0.9;
    const maxHeight = (availableHeight - margin * (rows + 1)) / rows;
    const maxWidth = (availableWidth - margin * (cols + 1)) / cols;
    cardHeight = Math.min(maxHeight, maxWidth / aspectRatio);
    cardWidth = cardHeight * aspectRatio;
  }

  return { cardWidth, cardHeight, aspectRatio, cols, rows };
}

// Obtener figuras completadas por un jugador (mantener para compatibilidad)
export function getPlayerCompletedFigures(player, figuresClaimed) {
  if (!player) return [];
  return Object.keys(figuresClaimed || {}).filter(
    fig => figuresClaimed[fig] === player.id
  );
}

// Nueva función para obtener figuras específicas de un cartón
export function getCardSpecificFigures(playerId, cardIndex, specificClaims) {
  if (!specificClaims || !playerId || cardIndex === undefined) return [];
  
  const figures = [];
  Object.values(specificClaims).forEach(claim => {
    if (claim.playerId === playerId && claim.cardIndex === cardIndex) {
      figures.push(claim.figure);
    }
  });
  
  return figures;
}

// Etiquetas de figuras en español
export function getFigureLabel(figure) {
  const labels = {
    corners: 'Esquinas',
    row: 'Línea',
    column: 'Columna',
    diagonal: 'Diagonal',
    border: 'Marco',
    full: 'Cartón lleno'
  };
  return labels[figure] || figure;
}

// Obtener el tamaño apropiado para los cartones según la cantidad
export function getCardSize(numCards) {
  if (numCards === 1) return 'large';
  if (numCards === 2) return 'medium';
  return 'small';
}

// Verificar qué figuras están completadas en un cartón marcado
export function checkFigures(marked) {
  if (!Array.isArray(marked) || marked.length !== 5) {
    console.warn('checkFigures: matriz inválida', marked);
    return {};
  }
  
  // Verificar que cada fila sea un array de 5 elementos
  for (let i = 0; i < 5; i++) {
    if (!Array.isArray(marked[i]) || marked[i].length !== 5) {
      console.warn(`checkFigures: fila ${i} inválida`, marked[i]);
      return {};
    }
  }
  
  const flags = {
    corners: false,
    row: false,
    column: false,
    diagonal: false,
    border: false,
    full: false
  };
  
  console.log('checkFigures: evaluando matriz:', marked.map(row => row.map(cell => cell ? '1' : '0').join('')));
  
  // Verificar esquinas
  flags.corners = marked[0][0] && marked[0][4] && marked[4][0] && marked[4][4];
  
  // Verificar filas
  for (let r = 0; r < 5; r++) {
    if (marked[r].every(cell => cell)) {
      flags.row = true;
      console.log(`checkFigures: fila ${r} completada`);
      break;
    }
  }
  
  // Verificar columnas
  for (let c = 0; c < 5; c++) {
    if (marked.every(row => row[c])) {
      flags.column = true;
      console.log(`checkFigures: columna ${c} completada`);
      break;
    }
  }
  
  // Verificar diagonales
  const diagonal1 = marked[0][0] && marked[1][1] && marked[2][2] && marked[3][3] && marked[4][4];
  const diagonal2 = marked[0][4] && marked[1][3] && marked[2][2] && marked[3][1] && marked[4][0];
  flags.diagonal = diagonal1 || diagonal2;
  
  // Verificar marco (borde completo)
  const topRow = marked[0].every(cell => cell);
  const bottomRow = marked[4].every(cell => cell);
  const leftColumn = marked.every(row => row[0]);
  const rightColumn = marked.every(row => row[4]);
  flags.border = topRow && bottomRow && leftColumn && rightColumn;
  
  // Verificar cartón lleno
  flags.full = marked.every(row => row.every(cell => cell));
  
  const completedFigures = Object.entries(flags).filter(([key, value]) => value).map(([key]) => key);
  console.log('checkFigures: figuras completadas:', completedFigures);
  
  return flags;
}
