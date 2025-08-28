import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import socket from '../src/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUsername } from '../src/utils';
import * as FileSystem from 'expo-file-system';

import { useAvatarSync } from '../src/hooks/useAvatarSync';
import { logAvatarCacheStatus, cleanOldCache, purgeLegacyAvatarCache } from '../src/services/avatarCache';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const { syncPlayers, getAvatarUrl, setLocalAvatarUrl } = useAvatarSync();

  // Log de caché de avatares al entrar a la lista de salas
  useEffect(() => {
    // Limpia el índice de caché de avatares de inmediato (elimina entradas huérfanas)
    (async () => {
      // Purga caché legado en AsyncStorage para liberar espacio
      await purgeLegacyAvatarCache();
      await cleanOldCache(0);
      await logAvatarCacheStatus();
    })();
  }, []);

  // Helper function to convert local avatar to base64
  const getAvatarBase64 = async () => {
    try {
      const avatarPath = await AsyncStorage.getItem('profile:avatar');
      if (!avatarPath) {
        console.log('❌ Rooms - No avatar path found in AsyncStorage');
        return null;
      }
      
      console.log('🔄 Converting avatar to base64 for room join...');
      const base64 = await FileSystem.readAsStringAsync(avatarPath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const avatarBase64 = `data:image/jpeg;base64,${base64}`;
      console.log('✅ Avatar converted for room join, size:', avatarBase64.length, 'characters');
      console.log('🔍 Avatar preview:', avatarBase64.substring(0, 100) + '...');
      return avatarBase64;
    } catch (error) {
      console.error('❌ Error converting avatar for room:', error);
      return null;
    }
  };

  useEffect(() => {
    const onRooms = (list) => {
      console.log('📦 Lista de salas recibida:', list.map(r => ({ id: r.id, cardsPerPlayer: r.cardsPerPlayer, players: r.players.length })));
      setRooms(list);
      // Sincronizar avatares de todos los jugadores
      const allPlayers = list.flatMap(room => room.players || []);
      if (allPlayers.length > 0) {
        // console.log('🔄 Syncing avatars for players in rooms:', allPlayers.length);
        syncPlayers(allPlayers);
      }
    };
    
    socket.on('rooms', onRooms);
    socket.emit('listRooms');
    
    // Cargar mi propio avatar para mostrarlo inmediatamente en las salas
    const loadMyAvatarForRooms = async () => {
      try {
        const myUsername = await getUsername();
        const savedAvatarPath = await AsyncStorage.getItem('profile:avatar');
        
        if (myUsername && savedAvatarPath) {
          console.log('🔄 Rooms - Loading my avatar for display');
          const base64 = await FileSystem.readAsStringAsync(savedAvatarPath, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const avatarBase64 = `data:image/jpeg;base64,${base64}`;
          setLocalAvatarUrl(myUsername, avatarBase64);
          console.log('⚡ Rooms - My avatar ready for display');
        }
      } catch (error) {
        console.error('❌ Error loading my avatar in rooms:', error);
      }
    };
    
    loadMyAvatarForRooms();
    
    return () => {
      socket.off('rooms', onRooms);
      // Limpiar estados de loading al salir
      setIsCreatingRoom(false);
      setJoiningRoomId(null);
    };
  }, [syncPlayers, setLocalAvatarUrl]);

  // Limpiar estados de loading al desmontarse
  useEffect(() => {
    return () => {
      setIsCreatingRoom(false);
      setJoiningRoomId(null);
    };
  }, []);

  const openRoom = async (roomId) => {
    if (joiningRoomId) return; // Prevenir múltiples clicks
    setJoiningRoomId(roomId);
    try {
      const name = await AsyncStorage.getItem('profile:name');
      const username = await getUsername();
      // No enviar avatar - el servidor lo obtiene de la BD
      socket.emit('joinRoom', { roomId, player: { name, username } });
      // Escuchar respuesta del servidor
      socket.once('joined', ({ roomId: joinedRoomId }) => {
        setJoiningRoomId(null);
        // Buscar el estado inicial de la sala
        const room = rooms.find(r => r.id === joinedRoomId);
        if (room) {
          router.push({ pathname: '/waiting', params: { roomId: joinedRoomId, initialState: JSON.stringify(room) } });
        } else {
          router.push({ pathname: '/waiting', params: { roomId: joinedRoomId } });
        }
      });
      // Timeout de seguridad
      setTimeout(() => {
        setJoiningRoomId(null);
      }, 10000);
    } catch (error) {
      console.error('Error joining room:', error);
      setJoiningRoomId(null);
    }
  };

  const createRoom = async () => {
    if (isCreatingRoom) return; // Prevenir múltiples clicks
    
    setIsCreatingRoom(true);
    try {
      const name = await AsyncStorage.getItem('profile:name');
      const username = await getUsername();
      
      console.log('🔄 Creating room with player data:', {
        name,
        username,
        note: 'Avatar will be loaded from DB by server'
      });
      
      // No enviar avatar - el servidor lo obtiene de la BD
      socket.emit('createRoom', { player: { name, username } });
      
      socket.once('joined', ({ roomId }) => {
        console.log('✅ Room created and joined:', roomId);
        setIsCreatingRoom(false);
        router.push({ pathname: '/waiting', params: { roomId } });
      });
      
      // Timeout de seguridad
      setTimeout(() => {
        setIsCreatingRoom(false);
      }, 10000);
      
    } catch (error) {
      console.error('Error creating room:', error);
      setIsCreatingRoom(false);
    }
  };

  const refreshRooms = () => {
    socket.emit('listRooms');
  };

  const renderRoom = ({ item }) => {
    const isInGame = item.started;
    const playerCount = item.players.length;
    const maxPlayers = 8; // Suponiendo un máximo
    const isJoining = joiningRoomId === item.id;
    const cardsPerPlayer = item.cardsPerPlayer || 1;
    
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
          borderLeftColor: isInGame ? '#e74c3c' : (isJoining ? '#f39c12' : '#27ae60'),
          opacity: (isInGame || isJoining) ? 0.7 : 1
        }}
        disabled={isInGame || isJoining}
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
                  backgroundColor: isJoining ? '#f39c12' : (isInGame ? '#e74c3c' : '#27ae60'),
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
                    {isJoining ? 'UNIÉNDOSE' : (isInGame ? 'EN JUEGO' : 'ESPERANDO')}
                  </Text>
                </View>
              </View>
              
              {/* Contador de jugadores y cartones */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                  <Ionicons name="people" size={16} color="#7f8c8d" />
                  <Text style={{ color: '#7f8c8d', fontSize: 14, marginLeft: 4 }}>
                    {playerCount}/{maxPlayers} jugadores
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="grid-outline" size={16} color="#7f8c8d" />
                  <Text style={{ color: '#7f8c8d', fontSize: 14, marginLeft: 4 }}>
                    {cardsPerPlayer} {cardsPerPlayer === 1 ? 'cartón' : 'cartones'} por jugador
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Icono de acción */}
            <View style={{ alignItems: 'center' }}>
              {isJoining ? (
                <ActivityIndicator size={24} color="#f39c12" />
              ) : isInGame ? (
                <Ionicons name="lock-closed" size={24} color="#e74c3c" />
              ) : (
                <Ionicons name="arrow-forward" size={24} color="#27ae60" />
              )}
            </View>
          </View>
          
          {/* Avatares de jugadores */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {item.players.slice(0, 5).map((p, index) => (
              getAvatarUrl(p.username) ? (
                <Image 
                  key={p.id} 
                  source={{ 
                    uri: getAvatarUrl(p.username)
                  }} 
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 22, 
                    marginRight: 10,
                    borderWidth: 2,
                    borderColor: '#fff',
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2
                }} 
              />
              ) : (
                <View 
                  key={p.id}
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 22, 
                    marginRight: 10,
                    backgroundColor: '#f0f0f0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#fff',
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#666' }}>👤</Text>
                </View>
              )
            ))}
            {item.players.length > 5 && (
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
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
      <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
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
                {/* Botón ranking en header */}
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/leaderboard', params: { gameKey: 'bingo' } })}
                  style={{
                    marginTop: 12,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: 20,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.25)'
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trophy" size={16} color="#f1c40f" />
                  <Text style={{ color: 'white', marginLeft: 6, fontWeight: '700' }}>Ver Ranking</Text>
                </TouchableOpacity>
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
                    disabled={isCreatingRoom}
                    style={{ 
                      flex: 1,
                      backgroundColor: isCreatingRoom ? '#bdc3c7' : '#e74c3c',
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: 'center',
                      marginRight: 12,
                      opacity: isCreatingRoom ? 0.7 : 1
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {isCreatingRoom ? (
                        <>
                          <ActivityIndicator size="small" color="white" />
                          <Text style={{ 
                            color: 'white', 
                            fontSize: 16, 
                            fontWeight: '700', 
                            marginLeft: 6
                          }}>
                            Creando...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="add-circle" size={20} color="white" />
                          <Text style={{ 
                            color: 'white', 
                            fontSize: 16, 
                            fontWeight: '700', 
                            marginLeft: 6
                          }}>
                            Crear Sala
                          </Text>
                        </>
                      )}
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
          </View>
        </SafeAreaView>
        </View>
    </>
  );
}
