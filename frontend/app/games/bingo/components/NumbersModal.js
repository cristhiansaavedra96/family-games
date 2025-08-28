import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBingoColorByIndexOrNumber } from '../../../../src/games/bingo/components/BingoCard';

const NumbersModal = ({ 
  visible, 
  drawnNumbers = [], 
  onClose 
}) => {
  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ 
          marginTop: 80, 
          marginHorizontal: 16, 
          backgroundColor: '#fff', 
          borderRadius: 20, 
          padding: 20, 
          flex: 1, 
          shadowColor: '#000', 
          shadowOpacity: 0.25, 
          shadowRadius: 12, 
          shadowOffset: { width: 0, height: 6 }, 
          elevation: 10 
        }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: 16 
          }}>
            <Text style={{ 
              fontWeight: '800', 
              fontSize: 24, 
              color: '#2c3e50', 
              fontFamily: 'Montserrat_700Bold' 
            }}>
              Números Cantados
            </Text>
            
            <TouchableOpacity 
              onPress={onClose} 
              style={{ 
                width: 36, 
                height: 36, 
                borderRadius: 18, 
                backgroundColor: '#ecf0f1', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <Ionicons name="close" size={20} color="#2c3e50" />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap', 
              paddingBottom: 20, 
              justifyContent: 'center' 
            }}>
              {Array.from({ length: 75 }, (_, i) => i + 1).map(n => {
                const isDrawn = drawnNumbers.includes(n);
                return (
                  <View 
                    key={n} 
                    style={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: 18, 
                      backgroundColor: isDrawn ? getBingoColorByIndexOrNumber(n) : '#f8f9fa', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      margin: 4, 
                      borderWidth: 2, 
                      borderColor: isDrawn ? '#fff' : '#dee2e6' 
                    }}
                  >
                    <Text style={{ 
                      color: isDrawn ? '#fff' : '#6c757d', 
                      fontSize: 14, 
                      fontFamily: 'Mukta_700Bold', 
                      fontWeight: '700' 
                    }}>
                      {n}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
          
          <View style={{ 
            paddingTop: 16, 
            borderTopWidth: 1, 
            borderTopColor: '#dee2e6' 
          }}>
            <Text style={{ 
              textAlign: 'center', 
              color: '#6c757d', 
              fontSize: 14,
              fontFamily: 'Montserrat_400Regular' 
            }}>
              {drawnNumbers.length} de 75 números cantados
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default NumbersModal;
