import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import socket from '../src/socket';

const labels = { corners: 'Esquinas', row: 'Línea', column: 'Columna', diagonal: 'Diagonal', border: 'Marco', full: 'Cartón lleno' };

export default function Summary() {
  const { roomId } = useLocalSearchParams();
  const [state, setState] = useState({ players: [], figuresClaimed: {}, hostId: null });

  useEffect(() => {
    const onState = (s) => { if (!roomId || s.roomId === roomId) setState(s); };
    socket.on('state', onState);
    socket.emit('getState', { roomId });
    return () => socket.off('state', onState);
  }, [roomId]);

  const playersMap = Object.fromEntries((state.players||[]).map(p => [p.id, p]));
  const items = Object.entries(state.figuresClaimed || {});

  const playAgain = () => {
    // Host reinicia la partida con la misma configuración
    socket.emit('startGame', { roomId });
    router.replace({ pathname: '/game', params: { roomId } });
  };

  const renderItem = ([key, pid]) => {
    const p = playersMap[pid];
    return (
      <View key={key} style={{ flexDirection:'row', alignItems:'center', marginBottom:10 }}>
        {p?.avatarUrl ? <Image source={{ uri: p.avatarUrl }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} /> : null}
        <Text><Text style={{ fontWeight:'bold' }}>{labels[key] || key}</Text>: {p?.name || '—'}</Text>
      </View>
    );
  };

  return (
    <View style={{ flex:1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Resumen</Text>
      <FlatList data={items} keyExtractor={([k]) => k} renderItem={({ item }) => renderItem(item)} />
      <TouchableOpacity onPress={playAgain} style={{ backgroundColor: '#2ecc71', padding: 12, borderRadius: 10, alignItems:'center', marginTop: 12 }}>
        <Text style={{ color:'white', fontWeight:'bold' }}>Jugar nuevamente</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { socket.emit('leaveRoom'); router.replace('/rooms'); }} style={{ padding: 12, borderRadius: 10, alignItems:'center', marginTop: 8 }}>
        <Text style={{ color:'#d63031', fontWeight:'bold' }}>Salir</Text>
      </TouchableOpacity>
    </View>
  );
}
