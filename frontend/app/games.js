import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Games() {
  const games = [
    {
      id: 'bingo',
      name: 'BINGO',
      description: 'El clásico juego de cartones y números',
      icon: 'grid',
      color: '#e74c3c',
      available: true
    },
    {
      id: 'lotto',
      name: 'LOTTO',
      description: 'Próximamente...',
      icon: 'trophy',
      color: '#9b59b6',
      available: false
    },
    {
      id: 'keno',
      name: 'KENO',
      description: 'Próximamente...',
      icon: 'ticket',
      color: '#3498db',
      available: false
    }
  ];

  const selectGame = (gameId) => {
    if (gameId === 'bingo') {
      router.push('/rooms');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={{ flex: 1, padding: 20 }}>
        {/* Header */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{ 
            fontSize: 32, 
            fontWeight: '800', 
            color: '#2c3e50', 
            textAlign: 'center',
            marginBottom: 8
          }}>
            Family Games
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: '#7f8c8d', 
            textAlign: 'center' 
          }}>
            Selecciona tu juego favorito
          </Text>
        </View>

        {/* Games Grid */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ gap: 16 }}>
            {games.map((game) => (
              <TouchableOpacity
                key={game.id}
                onPress={() => selectGame(game.id)}
                disabled={!game.available}
                style={{
                  backgroundColor: game.available ? '#fff' : '#f1f2f6',
                  borderRadius: 20,
                  padding: 24,
                  shadowColor: game.available ? '#000' : 'transparent',
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: game.available ? 6 : 0,
                  borderWidth: game.available ? 0 : 2,
                  borderColor: '#ddd',
                  opacity: game.available ? 1 : 0.6
                }}
                activeOpacity={game.available ? 0.7 : 1}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Icon */}
                  <View style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: game.available ? game.color : '#95a5a6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 20
                  }}>
                    <Ionicons 
                      name={game.icon} 
                      size={28} 
                      color="white" 
                    />
                  </View>

                  {/* Game Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 24,
                      fontWeight: '700',
                      color: game.available ? '#2c3e50' : '#95a5a6',
                      marginBottom: 4
                    }}>
                      {game.name}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: game.available ? '#7f8c8d' : '#bdc3c7',
                      lineHeight: 20
                    }}>
                      {game.description}
                    </Text>
                  </View>

                  {/* Arrow or Coming Soon */}
                  {game.available ? (
                    <Ionicons 
                      name="chevron-forward" 
                      size={24} 
                      color="#bdc3c7" 
                    />
                  ) : (
                    <View style={{
                      backgroundColor: '#95a5a6',
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 6
                    }}>
                      <Text style={{
                        color: 'white',
                        fontSize: 12,
                        fontWeight: '600'
                      }}>
                        Pronto
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={{ marginTop: 30 }}>
          <TouchableOpacity 
            onPress={() => router.push('/profile')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12
            }}
          >
            <Ionicons name="person-circle" size={20} color="#7f8c8d" />
            <Text style={{ 
              marginLeft: 8, 
              color: '#7f8c8d', 
              fontSize: 16 
            }}>
              Editar perfil
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
