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
    
    return (
      <TouchableOpacity 
        onPress={() => openRoom(item.id)} 
        style={{ 
          padding: 16, 
          backgroundColor: '#fff', 
          borderRadius: 16, 
          marginBottom: 12, 
          shadowColor: '#000', 
          shadowOpacity: 0.08, 
          shadowRadius: 12, 
          shadowOffset: { width: 0, height: 4 }, 
          elevation: 6 
        }}
        disabled={isInGame}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: isInGame ? '#e74c3c' : '#27ae60',
                marginRight: 8
              }} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#2c3e50' }}>
                Sala {item.id}
              </Text>
            </View>
            
            <Text style={{ color: '#7f8c8d', fontSize: 14, marginBottom: 8 }}>
              {playerCount} {playerCount === 1 ? 'jugador' : 'jugadores'}
            </Text>
            
            <View style={{ flexDirection: 'row' }}>
              {item.players.slice(0, 4).map((p, index) => (
                p.avatarUrl ? (
                  <Image 
                    key={p.id} 
                    source={{ uri: p.avatarUrl }} 
                    style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 16, 
                      marginRight: 6,
                      borderWidth: 2,
                      borderColor: '#fff'
                    }} 
                  />
                ) : (
                  <View 
                    key={p.id}
                    style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 16, 
                      marginRight: 6,
                      backgroundColor: '#f0f0f0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: '#fff'
                    }}
                  >
                    <Text style={{ fontSize: 14, color: '#666' }}>👤</Text>
                  </View>
                )
              ))}
              {item.players.length > 4 && (
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#bdc3c7',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                    +{item.players.length - 4}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={{ alignItems: 'center' }}>
            {isInGame ? (
              <View style={{
                backgroundColor: '#e74c3c',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                  EN JUEGO
                </Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <StatusBar style="light" backgroundColor="#2c3e50" translucent={false} />
      <View style={{ flex: 1, backgroundColor: '#2c3e50' }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
          <ScrollView style={{ flex: 1, backgroundColor: '#f8f9fa' }} showsVerticalScrollIndicator={false}>
            {/* Header con color sólido oscuro - efecto wave */}
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

            {/* Content */}
            <View style={{ padding: 16 }}>
              {/* Refresh Button */}
              <TouchableOpacity 
                onPress={refreshRooms}
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#3498db',
                  borderRadius: 12,
                  paddingVertical: 12,
                  marginBottom: 16
                }}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={{ 
                  color: 'white', 
                  fontWeight: '600', 
                  fontSize: 16, 
                  marginLeft: 8
                }}>
                  Actualizar
                </Text>
              </TouchableOpacity>

              {/* Create Room Button */}
              <TouchableOpacity 
                onPress={createRoom}
                style={{ 
                  backgroundColor: '#e74c3c',
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginBottom: 20
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="add-circle" size={24} color="white" />
                  <Text style={{ 
                    color: 'white', 
                    fontSize: 18, 
                    fontWeight: '700', 
                    marginLeft: 8
                  }}>
                    Crear nueva sala
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Rooms List */}
              <FlatList 
                data={rooms} 
                keyExtractor={(r) => r.id} 
                renderItem={renderRoom}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                ListEmptyComponent={() => (
                  <View style={{ 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    paddingVertical: 40 
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
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  );
}
