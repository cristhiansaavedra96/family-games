import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import socket from '../src/socket';

export default function Leaderboard() {
  const { gameKey } = useLocalSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socket.emit('getLeaderboard', { gameKey: gameKey || 'bingo' }, (res) => {
      setLoading(false);
      if (res?.ok) setItems(res.leaderboard || []);
    });
  }, [gameKey]);

  const renderItem = ({ item, index }) => (
    <View style={{ flexDirection:'row', alignItems:'center', padding:12, marginBottom:10, backgroundColor:'#fff', borderRadius:12, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:8, shadowOffset:{ width:0, height:3 }, elevation:3 }}>
      <View style={{ width:28, alignItems:'center', marginRight:8 }}>
        <Text style={{ fontFamily:'Montserrat_700Bold', color:'#2c3e50' }}>{index + 1}</Text>
      </View>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={{ width:36, height:36, borderRadius:18, marginRight:10 }} />
      ) : (
        <View style={{ width:36, height:36, borderRadius:18, marginRight:10, backgroundColor:'#3498db', alignItems:'center', justifyContent:'center' }}>
          <Text style={{ color:'#fff', fontFamily:'Montserrat_700Bold' }}>{item?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
      )}
      <View style={{ flex:1 }}>
        <Text style={{ fontFamily:'Montserrat_700Bold', color:'#2c3e50', fontSize:14 }}>{item.name || '—'}</Text>
        <Text style={{ fontFamily:'Montserrat_400Regular', color:'#7f8c8d', fontSize:12 }}>Puntos: {item.points}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:'#f5f7fa' }}>
      <View style={{ paddingHorizontal:16, paddingTop:12, paddingBottom:12, backgroundColor:'#2c3e50', flexDirection:'row', alignItems:'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width:40, height:40, borderRadius:20, backgroundColor:'#fff', alignItems:'center', justifyContent:'center', marginRight:12 }}>
          <Ionicons name="arrow-back" size={20} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={{ color:'#fff', fontFamily:'Montserrat_700Bold', fontSize:18 }}>Ranking {gameKey || 'bingo'}</Text>
      </View>
      <View style={{ flex:1, padding:16 }}>
        {loading ? (
          <Text style={{ color:'#7f8c8d', fontFamily:'Montserrat_400Regular' }}>Cargando...</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it, i) => `${it.id}-${i}`}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom:16 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
