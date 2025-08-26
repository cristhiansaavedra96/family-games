import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
function BingoCardBase({ card, drawn, marked, onToggle, compact, cellAspect, size = 'normal', completedFigures = [], cardIndex = 0, specificFigures = [] }) {
  const gridBorder = '#d1d8e0';
  
  // Tamaños dinámicos según el tipo
  const getSizes = () => {
    switch (size) {
      case 'large':
        return {
          containerPadding: 10,
          headerFontSize: 14,
          cellFontSize: 22,
          borderRadius: 18,
          headerSpacing: 6
        };
      case 'medium':
        return {
          containerPadding: 6,
          headerFontSize: 11,
          cellFontSize: 18,
          borderRadius: 16,
          headerSpacing: 3
        };
      case 'small':
        return {
          containerPadding: 4,
          headerFontSize: 9,
          cellFontSize: 14,
          borderRadius: 12,
          headerSpacing: 2
        };
      default:
        return {
          containerPadding: compact ? 4 : 6,
          headerFontSize: compact ? 9 : 11,
          cellFontSize: compact ? 16 : 18,
          borderRadius: 16,
          headerSpacing: compact ? 2 : 3
        };
    }
  };

  const sizes = getSizes();

  // Función para determinar si una celda está en una figura completada ESPECÍFICAMENTE en este cartón
  const isInCompletedFigure = (r, c) => {
    return specificFigures.some(figure => {
      switch (figure) {
        case 'row':
          // Solo marcar en dorado si ESTA fila específica está completada
          return Array.from({length: 5}, (_, i) => marked?.[r]?.[i]).every(Boolean);
        case 'column':
          // Solo marcar en dorado si ESTA columna específica está completada
          return Array.from({length: 5}, (_, i) => marked?.[i]?.[c]).every(Boolean);
        case 'diagonal':
          // Solo marcar en dorado si ESTA diagonal específica está completada
          return (r === c && Array.from({length: 5}, (_, i) => marked?.[i]?.[i]).every(Boolean)) ||
                 (r + c === 4 && Array.from({length: 5}, (_, i) => marked?.[i]?.[4-i]).every(Boolean));
        case 'corners':
          return (r === 0 || r === 4) && (c === 0 || c === 4);
        case 'border':
          return r === 0 || r === 4 || c === 0 || c === 4;
        case 'full':
          return true;
        default:
          return false;
      }
    });
  };
  
  return (
    <View style={{ 
      borderWidth: 0, 
      paddingTop: sizes.containerPadding, 
      paddingBottom: sizes.containerPadding, 
      paddingHorizontal: sizes.containerPadding, 
      backgroundColor: '#ffffff', 
      borderRadius: sizes.borderRadius, 
      shadowColor: '#000', 
      shadowOpacity: 0.08, 
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6
    }}>
      {/* Header B I N G O */}
      <View style={{ flexDirection: 'row', marginBottom: sizes.headerSpacing, paddingHorizontal: 8 }}>
        {['B','I','N','G','O'].map((h, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ 
              fontWeight: '700', 
              fontSize: sizes.headerFontSize, 
              letterSpacing: 2, 
              color: ['#e74c3c','#f39c12','#27ae60','#3498db','#9b59b6'][i] 
            }}>
              {h}
            </Text>
          </View>
        ))}
      </View>
      
      <View style={{ 
        borderWidth: 1, 
        borderColor: gridBorder, 
        borderRadius: 12, 
        overflow: 'hidden', 
        marginHorizontal: 0,
        backgroundColor: '#f8f9fa'
      }}>
        {card.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {row.map((n, c) => {
              const isCenter = r === 2 && c === 2;
              const isCellMarked = Boolean(marked?.[r]?.[c]);
              const showCircle = !isCenter && isCellMarked;
              const inCompletedFigure = isInCompletedFigure(r, c) && isCellMarked;
              
              // Estados: normal, marcado (rojo), completado (naranja/amarillo)
              let bg = '#ffffff';
              let textColor = '#2c3e50';
              let circleColor = '#e74c3c'; // rojo por defecto
              
              if (showCircle) {
                bg = '#ffffff';
                textColor = '#ffffff';
                // Si está en una figura completada, usar color naranja/amarillo
                if (inCompletedFigure) {
                  circleColor = '#f39c12'; // naranja
                }
              }
              
              return (
                <TouchableOpacity
                  key={c}
                  activeOpacity={0.7}
                  onPress={() => onToggle && onToggle(r, c)}
                  disabled={isCenter}
                  style={{ 
                    flex: 1, 
                    aspectRatio: (cellAspect || 1), 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: bg, 
                    borderLeftWidth: c === 0 ? 0 : 1, 
                    borderTopWidth: r === 0 ? 0 : 1, 
                    borderColor: gridBorder,
                    position: 'relative'
                  }}>
                  
                  {/* Círculo rojo/naranja mejorado */}
                  {showCircle && (
                    <View style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }} pointerEvents="none">
                      <View style={{ 
                        width: '82%',
                        aspectRatio: 1, 
                        borderRadius: 999, 
                        backgroundColor: circleColor, 
                        borderWidth: 2, 
                        borderColor: '#ffffff',
                        shadowColor: circleColor,
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 4
                      }} />
                    </View>
                  )}
                  
                  {/* Número */}
                  <Text style={{ 
                    fontSize: sizes.cellFontSize, 
                    fontWeight: isCenter ? '400' : '700', 
                    letterSpacing: -0.5, 
                    color: isCenter ? '#f39c12' : textColor,
                    zIndex: 1
                  }}>
                    {isCenter ? '★' : n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// Evitar re-render si no cambian props relevantes (shallow)
export const BingoCard = React.memo(
  BingoCardBase,
  (prev, next) => {
    return (
      prev.card === next.card &&
      prev.drawn === next.drawn &&
      prev.marked === next.marked &&
      prev.cellAspect === next.cellAspect &&
      prev.size === next.size &&
      prev.compact === next.compact &&
      prev.cardIndex === next.cardIndex &&
      prev.onToggle === next.onToggle &&
      // completedFigures: comparar referencia
      prev.completedFigures === next.completedFigures &&
      // specificFigures: comparar contenido
      JSON.stringify(prev.specificFigures || []) === JSON.stringify(next.specificFigures || [])
    );
  }
);
