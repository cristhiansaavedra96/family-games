import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
          borderWidth: isInGame ? 2 : 0,
          borderColor: isInGame ? '#f39c12' : 'transparent'
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontWeight: '700', fontSize: 18, color: '#2c3e50' }}>
                {item.name}
              </Text>
              {isInGame && (
                <View style={{ 
                  marginLeft: 8, 
                  backgroundColor: '#f39c12', 
                  borderRadius: 8, 
                  paddingHorizontal: 8, 
                  paddingVertical: 2 
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                    EN JUEGO
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={{ color: '#7f8c8d', fontSize: 14, marginBottom: 8 }}>
              {playerCount} {playerCount === 1 ? 'jugador' : 'jugadores'}
            </Text>
            
            <View style={{ flexDirection: 'row' }}>
              {item.players.slice(0, 4).map((p, index) => (
                <Image 
                  key={p.id} 
                  source={{ uri: p.avatarUrl || 'https://i.pravatar.cc/60' }} 
                  style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 16, 
                    marginRight: 6,
                    borderWidth: 2,
                    borderColor: '#fff'
                  }} 
                />
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
          
          <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity 
            onPress={() => router.push('/games')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3
            }}
          >
            <Ionicons name="chevron-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#2c3e50' }}>
              Salas BINGO
            </Text>
            <Text style={{ fontSize: 14, color: '#7f8c8d' }}>
              Únete o crea una nueva sala
            </Text>
          </View>

          <TouchableOpacity 
            onPress={refreshRooms}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3
            }}
          >
            <Ionicons name="refresh" size={20} color="#2c3e50" />
          </TouchableOpacity>
        </View>

        {/* Create Room Button */}
        <TouchableOpacity 
          onPress={createRoom} 
          style={{ 
            backgroundColor: '#27ae60', 
            paddingVertical: 16, 
            paddingHorizontal: 20, 
            borderRadius: 16, 
            marginBottom: 20, 
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            shadowColor: '#27ae60',
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6
          }}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={{ 
            color: 'white', 
            fontWeight: '700', 
            fontSize: 18,
            marginLeft: 8
          }}>
            Crear Nueva Sala
          </Text>
        </TouchableOpacity>

        {/* Rooms List */}
        <FlatList 
          data={rooms} 
          keyExtractor={(r) => r.id} 
          renderItem={renderRoom}
          showsVerticalScrollIndicator={false}
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
    </SafeAreaView>
  );
}
