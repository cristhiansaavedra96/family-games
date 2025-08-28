import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

const ExitModal = ({ 
  visible, 
  onClose, 
  onConfirm 
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 24 
      }}>
        <View style={{ 
          backgroundColor: '#fff', 
          borderRadius: 20, 
          padding: 24, 
          width: '85%', 
          maxWidth: 320, 
          shadowColor: '#000', 
          shadowOpacity: 0.25, 
          shadowRadius: 12, 
          shadowOffset: { width: 0, height: 6 }, 
          elevation: 10 
        }}>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: '700', 
            marginBottom: 12, 
            color: '#2c3e50', 
            textAlign: 'center', 
            fontFamily: 'Montserrat_700Bold' 
          }}>
            ¿Salir de la partida?
          </Text>
          
          <Text style={{ 
            fontSize: 14, 
            color: '#7f8c8d', 
            textAlign: 'center', 
            marginBottom: 20, 
            fontFamily: 'Montserrat_400Regular' 
          }}>
            Perderás tu progreso actual en el juego
          </Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity 
              onPress={onClose} 
              style={{ 
                flex: 1, 
                padding: 12, 
                marginRight: 8, 
                backgroundColor: '#ecf0f1', 
                borderRadius: 12, 
                alignItems: 'center' 
              }}
            >
              <Text style={{ 
                fontWeight: '600', 
                color: '#7f8c8d', 
                fontFamily: 'Montserrat_600SemiBold' 
              }}>
                Cancelar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onConfirm} 
              style={{ 
                flex: 1, 
                padding: 12, 
                marginLeft: 8, 
                backgroundColor: '#e74c3c', 
                borderRadius: 12, 
                alignItems: 'center' 
              }}
            >
              <Text style={{ 
                color: '#fff', 
                fontWeight: '700', 
                fontFamily: 'Montserrat_700Bold' 
              }}>
                Salir
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ExitModal;
