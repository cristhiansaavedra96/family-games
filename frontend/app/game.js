import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, BackHandler, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import socket from '../src/socket';
import { Carton5x5 } from '../src/bingo-ui';
import { speakNumberEs } from '../src/voice';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';

export default function Game() {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState({ roomId: null, players: [], drawn: [], lastBall: null, hostId: null, figuresClaimed: {}, speed: 1 });
  const [localMarks, setLocalMarks] = useState({}); // cardIndex -> 5x5 bool
  const [me, setMe] = useState(null);
  const [announce, setAnnounce] = useState(null); // {playerName, playerAvatar, figures}
  const allowExitRef = useRef(false);
  const [areaW, setAreaW] = useState(0);
  const [areaH, setAreaH] = useState(0);
  const label = (f) => ({ corners: 'Esquinas', row: 'Línea', column: 'Columna', diagonal: 'Diagonal', border: 'Marco', full: 'Cartón lleno' }[f] || f);
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const [showExit, setShowExit] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);

  useEffect(() => {
    socket.on('state', (s) => {
      setState(s);
    });
    socket.on('ball', (n) => {
      speakNumberEs(n);
    });
  socket.on('gameOver', (payload) => {
      const rid = payload?.roomId || state.roomId || params.roomId;
      router.replace({ pathname: '/summary', params: { roomId: rid } });
    });
  socket.on('announcement', (payload) => {
      setAnnounce(payload);
      // ocultar después de unos segundos
      setTimeout(() => setAnnounce(null), 3500);
    });
  // Si ya está conectado, usa socket.id actual
  setMe(socket.id);
  // Solicita el estado actual de la sala
  socket.emit('getState', { roomId: params.roomId });
  socket.on('joined', ({ id }) => setMe(id));
    return () => {
  socket.off('state'); socket.off('ball'); socket.off('gameOver'); socket.off('joined'); socket.off('announcement');
    };
  }, []);

  // Confirmación al salir
  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e) => {
      if (allowExitRef.current) return; // permitir salida real
      e.preventDefault();
      setShowExit(true);
    });
    const onBack = () => {
      if (allowExitRef.current) return false; // permitir back real
      setShowExit(true);
      return true;
    };
  const backSub = BackHandler.addEventListener('hardwareBackPress', onBack);
  return () => { sub && sub(); backSub?.remove && backSub.remove(); };
  }, [navigation]);

  const myPlayer = useMemo(() => state.players.find(p => p.id === me), [state.players, me]);

  const toggle = (cardIndex, r, c) => {
    setLocalMarks(prev => {
      const grid = prev[cardIndex] ? prev[cardIndex].map(row => row.slice()) : Array.from({ length: 5 }, () => Array(5).fill(false));
      if (!(r === 2 && c === 2)) grid[r][c] = !grid[r][c];
      return { ...prev, [cardIndex]: grid };
    });
  };
  const claimAutoAll = () => {
    const rid = state.roomId || params.roomId;
    const cards = myPlayer?.cards || [];
    cards.forEach((_card, idx) => {
      const marked = localMarks[idx] ?? Array.from({ length: 5 }, () => Array(5).fill(false));
      socket.emit('claim', { roomId: rid, figure: null, cardIndex: idx, marked });
    });
  };

  const Header = () => (
    <View style={{ paddingHorizontal: 0 }}>
      <View style={{ backgroundColor: '#1e436eff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingTop: 6, paddingBottom: 10, paddingHorizontal: 0, minHeight: 150 }}>
        {/* fila superior: Home y Velocidad juntos a la izquierda, con padding lateral */}
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'flex-start', paddingHorizontal: 12 }}>
          <TouchableOpacity onPress={() => setShowExit(true)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor:'#fff', alignItems:'center', justifyContent:'center' }}>
            <Ionicons name="home" size={22} color="#1565c0" />
          </TouchableOpacity>
          <View style={{ width: 8 }} />
          {state.hostId === me ? (
            <TouchableOpacity onPress={() => {
              const list = [0.5, 1, 1.5, 2];
              const idx = Math.max(0, list.indexOf(state.speed));
              const next = list[(idx + 1) % list.length];
              socket.emit('setSpeed', { roomId: state.roomId || params.roomId, speed: next });
            }} style={{ height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems:'center', justifyContent:'center', paddingHorizontal: 12, flexDirection:'row' }}>
              <MaterialCommunityIcons name="fast-forward" size={16} color="#2d3436" />
              <Text style={{ marginLeft: 6, fontWeight:'bold', color:'#2d3436' }}>{(state.speed||1)}x</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems:'center', justifyContent:'center', paddingHorizontal: 12, flexDirection:'row' }}>
              <Text style={{ fontWeight:'bold', color:'#2d3436' }}>{(state.speed||1)}x</Text>
            </View>
          )}
        </View>

        {/* bola central */}
        <View style={{ alignItems:'center', marginTop: 4 }}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#e53935', borderWidth: 5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8 }}>
            <Text style={{ fontSize: 34, color: 'white', fontWeight: 'bold' }}>{state.lastBall ?? '-'}</Text>
          </View>
        </View>

        {/* últimas bolillas + botón Lista a la derecha */}
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop: 6, paddingHorizontal: 12 }}>
          <View style={{ flexDirection:'row', alignItems:'center' }}>
            {state.drawn.slice(-4).map((n, i) => (
              <View key={i} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#55efc4', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                <Text style={{ color: '#2d3436', fontWeight: 'bold', fontSize: 13 }}>{n}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={() => setShowNumbers(true)} style={{ height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems:'center', justifyContent:'center', paddingHorizontal: 10, flexDirection:'row' }}>
            <Ionicons name="list" size={16} color="#2d3436" />
            <Text style={{ marginLeft: 6, fontWeight:'bold', color:'#2d3436' }}>Lista</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
  <View style={{ flex: 1 }}>
    <Header />
  {/* zona de cartones sin scroll */}
  <View style={{ flex: 1, paddingHorizontal: 0, paddingTop: 12, backgroundColor: '#e6f2ff' }} onLayout={(e)=>{ setAreaW(e.nativeEvent.layout.width); setAreaH(e.nativeEvent.layout.height); }}>
      {(() => {
        const count = myPlayer?.cards?.length || 0;
        const two = count === 2;
        const one = count === 1;
        // calcular aspect dinámico para 2 cartones
        let computedAspect = undefined;
        let cardPixelWidth = undefined;
        if (two && areaW && areaH) {
          const spacing = 8; // separación vertical entre cartones
          const perCardHeight = (areaH - spacing) / 2;
          const widthTarget = areaW * 0.88; // recorta ancho visible
          const overhead = 52; // header BINGO + paddings aprox
          const gridHeight = Math.max(60, perCardHeight - overhead);
          computedAspect = Math.min(1.7, Math.max(0.9, widthTarget / gridHeight));
          cardPixelWidth = Math.round(widthTarget);
        }
        if (one && areaW && areaH) {
          const widthTarget = areaW * 0.96;
          const overhead = 56; // BINGO + paddings
          const gridHeight = Math.max(80, areaH - overhead);
          computedAspect = Math.min(1.8, Math.max(0.85, widthTarget / gridHeight));
          cardPixelWidth = Math.round(widthTarget);
        }
        return (
          <View style={{ flexDirection: (two ? 'column' : (one ? 'column' : 'row')), flexWrap: (two || one) ? 'nowrap' : 'wrap', justifyContent: 'space-between', alignItems: (two || one) ? 'center' : 'stretch', flex: 1, paddingHorizontal: 8 }}>
            {myPlayer?.cards?.map((card, i) => (
      two ? (
    <View key={i} style={{ width: cardPixelWidth || '90%', marginBottom: i === 0 ? 6 : 0, alignSelf: 'center' }}>
                  <Carton5x5 card={card} drawn={state.drawn} marked={localMarks[i]} onToggle={(r,c)=>toggle(i,r,c)} compact cellAspect={computedAspect || 1.35} />
                </View>
              ) : one ? (
                <View key={i} style={{ width: cardPixelWidth || '100%', flex: 1, alignSelf: 'center' }}>
                  <Carton5x5 card={card} drawn={state.drawn} marked={localMarks[i]} onToggle={(r,c)=>toggle(i,r,c)} cellAspect={computedAspect || 1.2} />
                </View>
              ) : (
        <View key={i} style={{ width: '49%', marginBottom: 6 }}>
                  <Carton5x5 card={card} drawn={state.drawn} marked={localMarks[i]} onToggle={(r,c)=>toggle(i,r,c)} />
                </View>
              )
            ))}
          </View>
        );
      })()}
    </View>
  </View>

      {/* Footer fijo con BINGO */}
      <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 14 }}>
        <TouchableOpacity onPress={claimAutoAll} style={{ backgroundColor: '#ffa502', paddingVertical: 16, paddingHorizontal: 36, borderRadius: 24, alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>BINGO!</Text>
        </TouchableOpacity>
      </View>

      {/* Overlay de anuncio */}
      <Modal transparent visible={!!announce} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 16, alignItems: 'center' }}>
            {announce?.playerAvatar ? (
              <Image source={{ uri: announce.playerAvatar }} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 10 }} />
            ) : null}
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 6 }}>{announce?.playerName || 'Jugador'}</Text>
    <Text style={{ fontSize: 18, textAlign: 'center' }}>¡completó: {announce?.figures?.map(label).join(', ')}!</Text>
          </View>
        </View>
      </Modal>

      {/* Figuras reclamadas y quién ganó cada una (arriba derecha) */}
  <View style={{ position:'absolute', right:8, top: (insets.top || 0) + 6, alignItems:'flex-end' }}>
        {['corners','row','column','diagonal','border','full'].map(key => {
          const pid = state.figuresClaimed?.[key];
          if (!pid) return null;
          const p = (state.players||[]).find(pp=>pp.id===pid);
          const labelMap = { corners:'Esq', row:'Lín', column:'Col', diagonal:'Diag', border:'Marco', full:'Lleno' };
          return (
            <View key={key} style={{ flexDirection:'row', backgroundColor:'rgba(255,255,255,0.9)', paddingVertical:4, paddingHorizontal:8, borderRadius:12, marginBottom:4, alignItems:'center' }}>
              {p?.avatarUrl ? <Image source={{ uri: p.avatarUrl }} style={{ width: 18, height: 18, borderRadius: 9, marginRight: 6 }} /> : null}
              <Text style={{ fontSize:12, fontWeight:'bold' }}>{labelMap[key]}: {p?.name || ''}</Text>
            </View>
          );
        })}
      </View>
      {/* Modal salir */}
      <Modal transparent visible={showExit} animationType="fade">
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center', padding:24 }}>
          <View style={{ backgroundColor:'#fff', borderRadius:12, padding:16, width:'80%' }}>
            <Text style={{ fontSize:18, fontWeight:'bold', marginBottom:8 }}>¿Salir de la partida?</Text>
            <View style={{ flexDirection:'row', justifyContent:'flex-end' }}>
              <TouchableOpacity onPress={() => setShowExit(false)} style={{ padding:10 }}><Text>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { allowExitRef.current = true; socket.emit('leaveRoom'); setShowExit(false); router.replace('/rooms'); }} style={{ padding:10 }}>
                <Text style={{ color:'#d63031', fontWeight:'bold' }}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal listado de números */}
      <Modal transparent visible={showNumbers} animationType="slide">
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)' }}>
          <View style={{ marginTop: 60, marginHorizontal: 12, backgroundColor:'#fff', borderRadius: 12, padding: 12, flex:1 }}>
            <TouchableOpacity onPress={() => setShowNumbers(false)} style={{ position:'absolute', right:10, top:10, zIndex:1 }}>
              <Ionicons name="close" size={22} color="#2d3436" />
            </TouchableOpacity>
            <Text style={{ fontWeight:'bold', fontSize:16, marginBottom: 8 }}>Bolillas</Text>
            <ScrollView>
              <View style={{ flexDirection:'row', flexWrap:'wrap' }}>
                {Array.from({ length: 75 }, (_, i) => i + 1).map(n => {
                  const drawn = state.drawn.includes(n);
                  return (
                    <View key={n} style={{ width: '11.11%', padding: 4 }}>
                      <View style={{ backgroundColor: drawn ? '#2ecc71' : '#ecf0f1', borderRadius: 6, alignItems:'center', justifyContent:'center', height: 32 }}>
                        <Text style={{ fontWeight:'bold', color: drawn ? 'white' : '#2d3436' }}>{n}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
