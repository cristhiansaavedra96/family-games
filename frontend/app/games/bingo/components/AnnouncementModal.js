import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Bingo } from '../../../../src/games';

const AnnouncementModal = ({ 
  visible, 
  announce, 
  getAvatarUrl,
  onClose 
}) => {
  if (!announce || !visible) {
    return null;
  }

  // Obtener icono según la figura
  const getFigureIcon = (figure) => {
    switch (figure) {
      case 'full': return 'trophy';
      case 'border': return 'border-all';
      case 'diagonal': return 'slash-forward';
      case 'corners': return 'border-none-variant';
      case 'row': return 'minus';
      case 'column': return 'minus-thick';
      default: return 'check-circle';
    }
  };

  const getFigureColor = (figure) => {
    switch (figure) {
      case 'full': return '#ffd700'; // Dorado para cartón lleno
      case 'border': return '#e74c3c'; // Rojo para contorno
      case 'diagonal': return '#9b59b6'; // Púrpura para diagonal
      case 'corners': return '#f39c12'; // Naranja para esquinas
      case 'row': return '#2ecc71'; // Verde para línea
      case 'column': return '#3498db'; // Azul para columna
      default: return '#27ae60';
    }
  };

  const mainFigure = announce?.figures?.[0] || 'unknown';
  const figureColor = getFigureColor(mainFigure);

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.95)', // Fondo más oscuro
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      zIndex: 999999
    }}>
      <View style={{ 
        backgroundColor: '#2c3e50', // Fondo oscuro
        padding: 32, 
        borderRadius: 24, 
        alignItems: 'center', 
        maxWidth: '92%',
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 15,
        borderWidth: 2,
        borderColor: figureColor
      }}>
        {/* Icono de figura en grande */}
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: figureColor,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          shadowColor: figureColor,
          shadowOpacity: 0.5,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8
        }}>
          <MaterialCommunityIcons 
            name={getFigureIcon(mainFigure)} 
            size={40} 
            color="#fff" 
          />
        </View>

        {/* Nombre de la figura en grande */}
        <Text style={{ 
          fontSize: 28, 
          fontWeight: '800', 
          marginBottom: 16, 
          color: '#fff', // Letras claras
          textAlign: 'center', 
          fontFamily: 'Montserrat_700Bold',
          textShadowColor: 'rgba(0,0,0,0.5)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2
        }}>
          {announce?.figures?.map(fig => Bingo.getFigureLabel(fig)).join(', ')}
        </Text>
        
        {/* Avatar del jugador */}
        {getAvatarUrl(announce?.playerUsername) ? (
          <View style={{ 
            marginBottom: 16, 
            borderRadius: 35, 
            overflow: 'hidden', 
            borderWidth: 3, 
            borderColor: figureColor 
          }}>
            <Image 
              source={{ uri: getAvatarUrl(announce.playerUsername) }} 
              style={{ width: 70, height: 70 }} 
            />
          </View>
        ) : (
          <View style={{ 
            width: 70, 
            height: 70, 
            borderRadius: 35, 
            backgroundColor: figureColor, 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: 16,
            borderWidth: 3,
            borderColor: '#fff'
          }}>
            <Text style={{ 
              color: '#fff', 
              fontFamily: 'Montserrat_700Bold', 
              fontSize: 24 
            }}>
              {announce?.playerName?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        
        {/* Nombre del jugador en grande */}
        <Text style={{ 
          fontSize: 24, 
          fontWeight: '700', 
          marginBottom: 8, 
          color: '#fff', // Letras claras
          textAlign: 'center', 
          fontFamily: 'Montserrat_700Bold' 
        }}>
          {announce?.playerName || 'Jugador'}
        </Text>
        
        {/* Mensaje de felicitación */}
        <Text style={{ 
          fontSize: 16, 
          textAlign: 'center', 
          color: '#ecf0f1', // Gris claro
          fontFamily: 'Montserrat_400Regular',
          marginBottom: 20
        }}>
          ¡Ha completado una figura!
        </Text>
        
        {/* Botón para continuar */}
        <TouchableOpacity 
          onPress={() => {
            onClose && onClose();
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: figureColor,
            borderRadius: 20,
            shadowColor: figureColor,
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6
          }}
        >
          <Ionicons name="play-forward" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ 
            color: '#fff', 
            fontWeight: '700',
            fontSize: 16,
            fontFamily: 'Montserrat_700Bold' 
          }}>
            Continuar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AnnouncementModal;
