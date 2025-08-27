import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import socket from '../src/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const onRooms = (list) => setRooms(list);
    socket.on('rooms', onRooms);
    socket.emit('listRooms');
    return () => socket.off('rooms', onRooms);
  }, []);

  const openRoom = async (roomId) => {
    const name = await AsyncStorage.getItem('profile:name');
    const avatarUrl = await AsyncStorage.getItem('profile:avatar');
    socket.emit('joinRoom', { roomId, player: { name, avatarUrl } });
    router.push({ pathname: '/waiting', params: { roomId } });
  };

  const createRoom = async () => {
    const name = await AsyncStorage.getItem('profile:name');
    const avatarUrl = await AsyncStorage.getItem('profile:avatar');
    socket.emit('createRoom', { player: { name, avatarUrl } });
    socket.once('joined', ({ roomId }) => {
      router.push({ pathname: '/waiting', params: { roomId } });
    });
  };

  const refreshRooms = () => {
    socket.emit('listRooms');
  };

  const renderRoom = ({ item }) => {
    const isInGame = item.started;
    const playerCount = item.players.length;
    const maxPlayers = 8; // Suponiendo un máximo
    
    return (
      <TouchableOpacity 
        onPress={() => openRoom(item.id)} 
        style={{ 
          backgroundColor: '#fff', 
          borderRadius: 16, 
          marginBottom: 12, 
          shadowColor: '#000', 
          shadowOpacity: 0.08, 
          shadowRadius: 12, 
          shadowOffset: { width: 0, height: 4 }, 
          elevation: 6,
          borderLeftWidth: 4,
          borderLeftColor: isInGame ? '#e74c3c' : '#27ae60'
        }}
        disabled={isInGame}
        activeOpacity={0.7}
      >
        <View style={{ padding: 16 }}>
          {/* Header de la sala */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#2c3e50', marginRight: 8 }}>
                  Sala {item.id}
                </Text>
                {/* Badge de estado */}
                <View style={{
                  backgroundColor: isInGame ? '#e74c3c' : '#27ae60',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 10
                }}>
                  <Text style={{ 
                    color: 'white', 
                    fontSize: 11, 
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {isInGame ? 'EN JUEGO' : 'ESPERANDO'}
                  </Text>
                </View>
              </View>
              
              {/* Contador de jugadores */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="people" size={16} color="#7f8c8d" />
                <Text style={{ color: '#7f8c8d', fontSize: 14, marginLeft: 4 }}>
                  {playerCount}/{maxPlayers} jugadores
                </Text>
              </View>
            </View>
            
            {/* Icono de acción */}
            <View style={{ alignItems: 'center' }}>
              {isInGame ? (
                <Ionicons name="lock-closed" size={24} color="#e74c3c" />
              ) : (
                <Ionicons name="arrow-forward" size={24} color="#27ae60" />
              )}
            </View>
          </View>
          
          {/* Avatares de jugadores */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {item.players.slice(0, 5).map((p, index) => (
              <Image 
                key={p.id} 
                source={{ uri: p.avatarUrl || `https://i.pravatar.cc/60?u=${p.id}` }} 
                style={{ 
                  width: 28, 
                  height: 28, 
                  borderRadius: 14, 
                  marginRight: 6,
                  borderWidth: 2,
                  borderColor: '#fff',
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2
                }} 
              />
            ))}
            {item.players.length > 5 && (
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#bdc3c7',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: -6
              }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                  +{item.players.length - 5}
                </Text>
              </View>
            )}
            {item.players.length === 0 && (
              <Text style={{ color: '#bdc3c7', fontSize: 14, fontStyle: 'italic' }}>
                Sin jugadores
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: '#2c3e50' }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
          {/* Header fijo con color sólido oscuro - efecto wave */}
          <View
            style={{
              backgroundColor: '#2c3e50',
              paddingTop: 80,
              paddingBottom: 40,
              paddingHorizontal: 20,
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
              marginTop: -40,
            }}
          >
            {/* Back button */}
            <TouchableOpacity 
              onPress={() => router.push('/games')} 
              style={{
                position: 'absolute',
                top: 60,
                left: 20,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)'
              }}
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 28,
                fontWeight: '700',
                color: 'white',
                marginBottom: 10,
                fontFamily: 'Montserrat_700Bold'
              }}>
                Salas de Bingo
              </Text>
              <Text style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.8)',
                textAlign: 'center',
                fontFamily: 'Montserrat_400Regular',
              }}>
                Únete a una sala o crea la tuya
              </Text>
            </View>
          </View>

          {/* Content Area con scroll */}
          <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
            {/* Actions Row fijo */}
            <View style={{ padding: 16, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Create Room Button */}
                <TouchableOpacity 
                  onPress={createRoom}
                  style={{ 
                    flex: 1,
                    backgroundColor: '#e74c3c',
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: 'center',
                    marginRight: 12
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="add-circle" size={20} color="white" />
                    <Text style={{ 
                      color: 'white', 
                      fontSize: 16, 
                      fontWeight: '700', 
                      marginLeft: 6
                    }}>
                      Crear Sala
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Refresh Button - Pequeño */}
                <TouchableOpacity 
                  onPress={refreshRooms}
                  style={{ 
                    backgroundColor: '#3498db',
                    borderRadius: 12,
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Ionicons name="refresh" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Rooms List - Solo esta parte hace scroll */}
            <FlatList 
              data={rooms} 
              keyExtractor={(r) => r.id} 
              renderItem={renderRoom}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View style={{ 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  paddingVertical: 60 
                }}>
                  <Ionicons name="home" size={64} color="#bdc3c7" />
                  <Text style={{ 
                    fontSize: 18, 
                    color: '#7f8c8d', 
                    marginTop: 16,
                    textAlign: 'center'
                  }}>
                    No hay salas disponibles
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: '#95a5a6', 
                    marginTop: 8,
                    textAlign: 'center'
                  }}>
                    ¡Crea la primera sala!
                  </Text>
                </View>
              )}
            />
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}
