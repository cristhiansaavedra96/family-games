import { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import socket from '../src/socket';

export default function Waiting() {
  const { roomId } = useLocalSearchParams();
  const [state, setState] = useState({ roomId, name: '', players: [], hostId: null, started: false, cardsPerPlayer: 1 });
  const [me, setMe] = useState(null);

  useEffect(() => {
  // Garantiza que me se establezca aunque no llegue otro 'joined'
  setMe(socket.id);
  const onConnect = () => setMe(socket.id);
    const onState = (s) => {
      if (s.roomId === roomId) setState(s);
      if (s.started) router.replace({ pathname: '/game', params: { roomId } });
    };
    const onJoined = ({ id }) => setMe(id);
    socket.on('state', onState);
    socket.on('joined', onJoined);
  socket.on('connect', onConnect);
    socket.emit('getState', { roomId });
  return () => { socket.off('state', onState); socket.off('joined', onJoined); socket.off('connect', onConnect); };
  }, [roomId]);

  const isHost = state.hostId === me;
  const start = () => socket.emit('startGame', { roomId });
  const setCards = (n) => socket.emit('configure', { roomId, cardsPerPlayer: n });

  const renderPlayer = ({ item }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
      <Image source={{ uri: item.avatarUrl || 'https://i.pravatar.cc/60' }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8 }} />
      <Text style={{ fontSize: 16 }}>{item.name || 'Jugador'}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>{state.name}</Text>
      {isHost && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ marginBottom: 6 }}>Cartones por jugador</Text>
          <View style={{ flexDirection: 'row' }}>
            {[1,2,3,4].map(n => (
              <TouchableOpacity key={n} onPress={() => setCards(n)} style={{ backgroundColor: state.cardsPerPlayer===n? '#0984e3' : '#dfe6e9', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, marginRight: 8 }}>
                <Text style={{ color: state.cardsPerPlayer===n? 'white' : '#2d3436', fontWeight: 'bold' }}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      <FlatList data={state.players} keyExtractor={(p) => p.id} renderItem={renderPlayer} />
      {isHost && (
        <TouchableOpacity onPress={start} style={{ backgroundColor: '#0984e3', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Iniciar partida</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
