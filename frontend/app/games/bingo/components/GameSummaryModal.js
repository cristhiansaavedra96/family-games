import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GameSummaryModal = ({ 
  visible, 
  players, 
  figuresClaimed, 
  playersReady, 
  me, 
  onClose, 
  onPlayAgain 
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 24 
      }}>
        <View style={{ 
          backgroundColor: 'white', 
          borderRadius: 24, 
          padding: 24, 
          maxWidth: '95%',
          maxHeight: '80%',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12
        }}>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: '800', 
            marginBottom: 20, 
            color: '#2c3e50', 
            textAlign: 'center', 
            fontFamily: 'Montserrat_700Bold' 
          }}>
            🎉 ¡Juego Terminado!
          </Text>
          
          <ScrollView style={{ maxHeight: 300 }}>
            {players?.map((player, index) => {
              const playerFigures = Object.keys(figuresClaimed || {}).filter(
                fig => figuresClaimed[fig] === player.id
              );
              const isReady = playersReady[player.id];
              
              return (
                <View key={player.id} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  marginBottom: 8,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: playerFigures.length > 0 ? '#27ae60' : '#95a5a6'
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontWeight: '700', 
                      color: '#2c3e50',
                      fontFamily: 'Montserrat_700Bold' 
                    }}>
                      {player.name || player.username}
                    </Text>
                    <Text style={{ 
                      fontSize: 12, 
                      color: '#7f8c8d',
                      fontFamily: 'Montserrat_400Regular' 
                    }}>
                      {playerFigures.length} figura{playerFigures.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {isReady && (
                    <View style={{
                      backgroundColor: '#27ae60',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8
                    }}>
                      <Text style={{ 
                        color: 'white', 
                        fontSize: 10, 
                        fontWeight: '600',
                        fontFamily: 'Montserrat_600SemiBold' 
                      }}>
                        Listo
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
            <TouchableOpacity 
              onPress={onClose} 
              style={{ 
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 14,
                marginRight: 8,
                backgroundColor: '#e74c3c',
                borderRadius: 12,
                shadowColor:'#e74c3c', 
                shadowOpacity:0.25, 
                shadowRadius:8, 
                shadowOffset:{ width:0, height:4 }, 
                elevation:7
              }}
            >
              <Ionicons name="exit-outline" size={18} color="#fff" />
              <Text style={{ 
                fontWeight: '700', 
                color: 'white', 
                fontSize: 16, 
                marginLeft: 8, 
                fontFamily: 'Montserrat_700Bold' 
              }}>
                Salir
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onPlayAgain} 
              style={{ 
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 14,
                marginLeft: 8,
                backgroundColor: playersReady[me] ? '#7f8c8d' : '#27ae60',
                borderRadius: 12,
                shadowColor: playersReady[me] ? '#7f8c8d' : '#27ae60', 
                shadowOpacity:0.25, 
                shadowRadius:8, 
                shadowOffset:{ width:0, height:4 }, 
                elevation:7
              }}
              disabled={playersReady[me]}
            >
              <Ionicons name={playersReady[me] ? 'hourglass-outline' : 'refresh'} size={18} color="#fff" />
              <Text style={{ 
                fontWeight: '700', 
                color: 'white', 
                fontSize: 16, 
                marginLeft: 8, 
                fontFamily: 'Montserrat_700Bold' 
              }}>
                {playersReady[me] ? 'Esperando...' : 'Volver a Jugar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default GameSummaryModal;
