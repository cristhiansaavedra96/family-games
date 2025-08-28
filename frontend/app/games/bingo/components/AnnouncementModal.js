import React from 'react';
import { Modal, View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Bingo } from '../../../../src/games';

const AnnouncementModal = ({ 
  visible, 
  announce, 
  getAvatarUrl,
  onClose 
}) => {
  if (!announce) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 24 
      }}>
        <View style={{ 
          backgroundColor: 'white', 
          padding: 28, 
          borderRadius: 24, 
          alignItems: 'center', 
          maxWidth: '90%',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12
        }}>
          {getAvatarUrl(announce?.playerUsername) ? (
            <View style={{ 
              marginBottom: 16, 
              borderRadius: 50, 
              overflow: 'hidden', 
              borderWidth: 4, 
              borderColor: '#27ae60' 
            }}>
              <Image 
                source={{ uri: getAvatarUrl(announce.playerUsername) }} 
                style={{ width: 90, height: 90 }} 
              />
            </View>
          ) : (
            <View style={{ 
              width: 90, 
              height: 90, 
              borderRadius: 45, 
              backgroundColor: '#27ae60', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 16 
            }}>
              <Ionicons name="person" size={40} color="white" />
            </View>
          )}
          
          <Text style={{ 
            fontSize: 22, 
            fontWeight: '800', 
            marginBottom: 8, 
            color: '#2c3e50', 
            textAlign: 'center', 
            fontFamily: 'Montserrat_700Bold' 
          }}>
            ¡{announce?.playerName || 'Jugador'}!
          </Text>
          
          <View style={{ 
            backgroundColor: '#27ae60', 
            paddingHorizontal: 16, 
            paddingVertical: 8, 
            borderRadius: 20, 
            marginBottom: 12 
          }}>
            <Text style={{ 
              fontSize: 16, 
              color: 'white', 
              fontWeight: '700', 
              fontFamily: 'Montserrat_700Bold' 
            }}>
              {announce?.figures?.map(fig => Bingo.getFigureLabel(fig)).join(', ')}
            </Text>
          </View>
          
          <Text style={{ 
            fontSize: 16, 
            textAlign: 'center', 
            color: '#7f8c8d', 
            fontFamily: 'Montserrat_400Regular' 
          }}>
            ¡Ha completado una figura!
          </Text>
          
          {/* Botón opcional para cerrar manualmente */}
          <TouchableOpacity 
            onPress={onClose}
            style={{
              marginTop: 20,
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: '#3498db',
              borderRadius: 20
            }}
          >
            <Text style={{ 
              color: 'white', 
              fontWeight: '600',
              fontFamily: 'Montserrat_600SemiBold' 
            }}>
              Continuar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AnnouncementModal;
