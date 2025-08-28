import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SpeedSelectModal = ({ 
  visible, 
  currentSpeed = 1, 
  onSpeedChange, 
  onClose 
}) => {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5];

  // Logging para detectar conflictos
  console.log(`[SpeedSelectModal] Render`, {
    visible,
    timestamp: new Date().toISOString()
  });

  if (!visible) {
    console.log(`[SpeedSelectModal] No visible, no renderizando contenido`);
    return null;
  }

  console.log(`[SpeedSelectModal] Modal visible, renderizando contenido completo`);

  const handleSpeedSelect = (speed) => {
    console.log(`[SpeedSelectModal] Velocidad seleccionada: ${speed}x (Absolute View)`);
    onSpeedChange && onSpeedChange(speed);
    onClose && onClose();
  };

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999999
    }}>
      <View style={{ 
        backgroundColor: '#fff', 
        borderRadius: 16, 
        padding: 24, 
        minWidth: 220, 
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10
      }}>
        <Text style={{ 
          fontWeight: '700', 
          fontSize: 18, 
          marginBottom: 16, 
          color: '#2c3e50', 
          fontFamily: 'Montserrat_700Bold' 
        }}>
          Velocidad de juego
        </Text>
        
        {speeds.map((speed) => (
          <TouchableOpacity
            key={speed}
            onPress={() => handleSpeedSelect(speed)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 12,
              marginBottom: 8,
              backgroundColor: speed === currentSpeed ? '#2c3e50' : '#f5f7fa',
              minWidth: 180
            }}
          >
            <MaterialCommunityIcons 
              name="fast-forward" 
              size={18} 
              color={speed === currentSpeed ? '#fff' : '#2c3e50'} 
            />
            <Text style={{ 
              marginLeft: 12, 
              fontWeight: '700', 
              color: speed === currentSpeed ? '#fff' : '#2c3e50', 
              fontSize: 16, 
              fontFamily: 'Montserrat_700Bold' 
            }}>
              {speed}x
            </Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity 
          onPress={() => {
            console.log(`[SpeedSelectModal] Botón Cancelar presionado (Absolute View)`);
            onClose && onClose();
          }}
          style={{ marginTop: 8 }}
        >
          <Text style={{ 
            color: '#e74c3c', 
            fontWeight: '700', 
            fontSize: 16,
            fontFamily: 'Montserrat_700Bold' 
          }}>
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SpeedSelectModal;
