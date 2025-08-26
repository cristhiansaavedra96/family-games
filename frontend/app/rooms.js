import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
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

  const renderRoom = ({ item }) => (
    <TouchableOpacity onPress={() => openRoom(item.id)} style={{ padding: 12, backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        {item.players.slice(0,4).map(p => (
          <Image key={p.id} source={{ uri: p.avatarUrl || 'https://i.pravatar.cc/60' }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 6 }} />
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <TouchableOpacity onPress={createRoom} style={{ backgroundColor: '#2ecc71', padding: 12, borderRadius: 10, marginBottom: 12, alignItems: 'center' }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Crear sala</Text>
      </TouchableOpacity>
      <FlatList data={rooms} keyExtractor={(r) => r.id} renderItem={renderRoom} />
    </View>
  );
}
