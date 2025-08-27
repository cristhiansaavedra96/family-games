import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, BackHandler, Image, InteractionManager } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import socket from '../src/socket';
import { Bingo } from '../src/games';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { ChatPanel, ChatButton, ChatToasts } from '../src/components';

export default function Game() {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState({ roomId: null, players: [], drawn: [], lastBall: null, hostId: null, figuresClaimed: {}, specificClaims: {}, speed: 1 });
  const [localMarks, setLocalMarks] = useState({}); // cardIndex -> 5x5 bool
  const [me, setMe] = useState(null);
  const [announce, setAnnounce] = useState(null); // {playerName, playerAvatar, figures}
  const [announceQueue, setAnnounceQueue] = useState([]); // Cola de anuncios
  const [showGameSummary, setShowGameSummary] = useState(false);
  const [gameSummaryData, setGameSummaryData] = useState(null);
  const [playersReady, setPlayersReady] = useState({}); // Jugadores listos para nueva partida
  const allowExitRef = useRef(false);
  const [areaW, setAreaW] = useState(0);
  const [areaH, setAreaH] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(160);
  const [footerHeight, setFooterHeight] = useState(80);
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const [showExit, setShowExit] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null); // deprecated, mantenido temporalmente
  const [toastMessages, setToastMessages] = useState([]);

  // Hook de animaciones del bingo
  const { 
    ballAnimatedStyle,
    historyAnimatedStyle,
    animateNewBall, 
    stopAnimations 
  } = Bingo.useBingoAnimations();
  
  const prevLastBall = useRef(null);

  useEffect(() => {
    socket.on('state', (s) => {
      setState(s);
      // Actualizar estado de jugadores listos
      if (s.playersReady) {
        const readyObj = {};
        s.playersReady.forEach(playerId => {
          readyObj[playerId] = true;
        });
        setPlayersReady(readyObj);
      }
      // Si comenzó una nueva partida, cerrar el resumen si estaba abierto
      // Heurística: si lastBall no es null o si drawn se reseteó y hay roomId estable
      if (showGameSummary && s?.roomId && (s.lastBall !== null || (Array.isArray(s.drawn) && s.drawn.length >= 0))) {
        setShowGameSummary(false);
        setGameSummaryData(null);
      }
    });
    socket.on('ball', (n) => {
      // Animación cuando sale nueva bola
      animateNewBall();
      Bingo.speakBingoNumber(n);
    });
  socket.on('gameOver', (payload) => {
      // En lugar de ir a summary, mostrar modal de resumen
      setGameSummaryData(payload);
      setShowGameSummary(true);
    });
    socket.on('announcement', (payload) => {
      // Asegurar que los anuncios se muestren de a UNO
      // Forzar que 'full' (cartón lleno) vaya siempre al final del grupo (particionado estable)
      if (payload && Array.isArray(payload.figures) && payload.figures.length > 0) {
        const figs = [...payload.figures];
        const others = [];
        const fulls = [];
        figs.forEach((f) => {
          if (f === 'full') fulls.push({ ...payload, figures: [f] });
          else others.push({ ...payload, figures: [f] });
        });
        setAnnounceQueue(prev => [...prev, ...others, ...fulls]);
      } else if (payload) {
        setAnnounceQueue(prev => [...prev, payload]);
      }
    });
    
    socket.on('claimResult', (result) => {
      // Ya no reseteamos aquí; el botón queda bloqueado por 2s tras presionar
      if (!result.ok) {
        const errorMessages = {
          'no_new_figures': 'Ya has reclamado todas las figuras completadas',
          'figure_taken': 'Esa figura ya fue reclamada por otro jugador',
          'invalid': 'La figura no está completada correctamente',
          'marked_not_drawn': 'Has marcado números que no han sido cantados',
          'room_not_found': 'Sala no encontrada',
          'player_not_found': 'Jugador no encontrado',
          'card_not_found': 'Cartón no encontrado'
        };
        const message = errorMessages[result.reason] || `Error: ${result.reason}`;
        console.warn('Reclamación rechazada:', message);
        // Aquí podrías mostrar una alerta o toast al usuario si lo deseas
      } else {
        console.log('¡Reclamación exitosa!');
      }
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

  // Chat listener
  useEffect(() => {
    const onChatMessage = (messageData) => {
      console.log('Game - Chat message received:', messageData);
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const withId = { ...messageData, id };
      setToastMessages(prev => [...prev, withId].slice(-4));
    };

    socket.on('chatMessage', onChatMessage);
    
    return () => {
      socket.off('chatMessage', onChatMessage);
    };
  }, []);

  // Procesar cola de anuncios
  useEffect(() => {
    if (!announce && announceQueue.length > 0) {
      const nextAnnounce = announceQueue[0];
      setAnnounce(nextAnnounce);
      setAnnounceQueue(prev => prev.slice(1));
      
      // Ocultar después de 2.5 segundos
      setTimeout(() => {
        setAnnounce(null);
      }, 2500);
    }
  }, [announce, announceQueue]);

  // Efecto para animar cuando cambia lastBall - separado del resto de la lógica
  useEffect(() => {
    if (state.lastBall !== null && prevLastBall.current !== state.lastBall) {
      // La animación ahora es completamente independiente
      animateNewBall(showNumbers);
      prevLastBall.current = state.lastBall;
    }
  }, [state.lastBall, showNumbers]); // Removí animateNewBall de las dependencias

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
  return () => { 
    // Limpiar animaciones al desmontar
    stopAnimations();
    sub && sub(); 
    backSub?.remove && backSub.remove(); 
  };
  }, [navigation, stopAnimations]);

  // Efecto de limpieza para animaciones
  useEffect(() => {
    return () => {
      stopAnimations();
    };
  }, [stopAnimations]);

  const myPlayer = useMemo(() => state.players.find(p => p.id === me), [state.players, me]);

  // Función para obtener figuras completadas por este jugador usando utilidad del bingo
  const getMyCompletedFigures = useCallback(() => {
    return Bingo.getPlayerCompletedFigures(myPlayer, state.figuresClaimed);
  }, [myPlayer, state.figuresClaimed]);

  // Función para obtener figuras específicas de un cartón
  const getCardSpecificFigures = useCallback((cardIndex) => {
    if (!me || cardIndex === undefined) return [];
    return Bingo.getCardSpecificFigures(me, cardIndex, state.specificClaims || {});
  }, [me, state.specificClaims]);

  const toggle = useCallback((cardIndex, r, c) => {
    // Programar tras las animaciones/interacciones actuales
    InteractionManager.runAfterInteractions(() => {
      setLocalMarks(prev => {
        const grid = prev[cardIndex] ? prev[cardIndex].map(row => row.slice()) : Array.from({ length: 5 }, () => Array(5).fill(false));
        if (!(r === 2 && c === 2)) grid[r][c] = !grid[r][c];
        return { ...prev, [cardIndex]: grid };
      });
    });
  }, []);
  const claimAutoAll = useCallback(() => {
    if (isClaiming) {
      console.log('Ya hay una reclamación en proceso, ignorando...');
      return;
    }
    
    try {
      // Deshabilitar el botón por 2 segundos desde el toque
      setIsClaiming(true);
      setTimeout(() => setIsClaiming(false), 2000);
      const rid = state.roomId || params.roomId;
      
      if (!rid || !myPlayer || !myPlayer.cards) {
        console.warn('No se puede reclamar: faltan datos del jugador o sala');
        return;
      }
      
      const cards = myPlayer.cards;
      console.log(`Evaluando ${cards.length} cartones para reclamar...`);
      
      // Helper: construir matriz marcada efectiva marcando automáticamente los números cantados y el centro libre
  const buildEffectiveMarked = (card, localMarked) => {
        const m = Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => false));
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            if (r === 2 && c === 2) { m[r][c] = true; continue; }
    const wasToggled = Boolean(localMarked?.[r]?.[c]);
            const value = card?.[r]?.[c];
            const isDrawn = state.drawn?.includes?.(value);
    // Considerar marcada solo si el usuario la marcó Y el número fue cantado (o es centro libre)
    m[r][c] = Boolean(wasToggled && isDrawn);
          }
        }
        return m;
      };

  let bestCardIndex = -1;
  let bestEffectiveMarked = null;
      
      // Evaluar cada cartón y reclamar en todos los que tengan figuras disponibles
      const claimTargets = [];
      for (let idx = 0; idx < cards.length; idx++) {
        const card = cards[idx];
        const effectiveMarked = buildEffectiveMarked(card, localMarks[idx]);
        console.log(`Cartón ${idx}:`, {
          hasMarks: effectiveMarked.some(row => row.some(cell => cell)),
          markedCount: effectiveMarked.flat().filter(Boolean).length
        });
        const figures = Bingo.checkFigures(effectiveMarked);
        const completedFigures = Object.entries(figures).filter(([key, value]) => value).map(([key]) => key);
        const availableFigures = completedFigures.filter(fig => !state.figuresClaimed?.[fig]);
        console.log(`Cartón ${idx} - Figuras completadas:`, completedFigures, `| Disponibles:`, availableFigures);
        if (availableFigures.length > 0) {
          claimTargets.push({ idx, marked: effectiveMarked });
        }
      }

  if (claimTargets.length > 0) {
        console.log(`Reclamando en ${claimTargets.length} cartón(es):`, claimTargets.map(t => t.idx));
        claimTargets.forEach(t => {
          socket.emit('claim', { roomId: rid, figure: null, cardIndex: t.idx, marked: t.marked });
        });
      } else {
        console.warn('No se encontraron figuras disponibles para reclamar');
      }
    } catch (error) {
      console.error('Error en claimAutoAll:', error);
    }
  }, [state.roomId, params.roomId, myPlayer, localMarks, isClaiming]);

  // Funciones del chat
  const toggleChat = () => {
    setChatVisible(!chatVisible);
  };

  const handleSendMessage = (messageData) => {
    if (!myPlayer) return;

    const fullMessage = {
      ...messageData,
      player: {
        id: me,
        name: myPlayer.name,
        avatarUrl: myPlayer.avatarUrl
      },
      timestamp: Date.now()
    };

    console.log('Game - Sending chat message:', fullMessage);
    socket.emit('sendChatMessage', { roomId: state.roomId || params.roomId, message: fullMessage });
    setChatVisible(false);
  };

  const handleMessageComplete = () => {
    setCurrentMessage(null);
  };

  const handleToastComplete = (id) => {
    setToastMessages(prev => prev.filter(m => m.id !== id));
  };

  const Header = () => (
    <View style={{ paddingHorizontal: 0 }} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
      <View style={{ backgroundColor: '#2c3e50', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 0, minHeight: 160 }}>
        {/* fila superior: Home y Velocidad juntos a la izquierda, con padding lateral */}
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'flex-start', paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => setShowExit(true)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor:'#fff', alignItems:'center', justifyContent:'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
            <Ionicons name="home" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <View style={{ width: 12 }} />
          {state.hostId === me ? (
            <TouchableOpacity onPress={() => {
              const list = [0.5, 1, 1.5, 2];
              const idx = Math.max(0, list.indexOf(state.speed));
              const next = list[(idx + 1) % list.length];
              socket.emit('setSpeed', { roomId: state.roomId || params.roomId, speed: next });
            }} style={{ height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems:'center', justifyContent:'center', paddingHorizontal: 16, flexDirection:'row', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
              <MaterialCommunityIcons name="fast-forward" size={18} color="#2c3e50" />
              <Text style={{ marginLeft: 8, fontWeight:'700', color:'#2c3e50', fontSize: 14, fontFamily: 'Montserrat_700Bold' }}>{(state.speed||1)}x</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems:'center', justifyContent:'center', paddingHorizontal: 16, flexDirection:'row', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
              <Text style={{ fontWeight:'700', color:'#2c3e50', fontSize: 14, fontFamily: 'Montserrat_700Bold' }}>{(state.speed||1)}x</Text>
            </View>
          )}
        </View>

        {/* bola central animada */}
        <Bingo.AnimatedBingoBall 
          ballAnimatedStyle={ballAnimatedStyle}
          lastBall={state.lastBall}
          style={{ marginTop: 8 }}
        />

        {/* últimas bolillas animadas + botón Lista a la derecha */}
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop: 12, paddingHorizontal: 16 }}>
          <Animated.View style={[
            {
              flexDirection:'row', 
              alignItems:'center'
            },
            historyAnimatedStyle
          ]}>
            {state.drawn.slice(-4).reverse().map((n, i) => (
              <View key={`${n}-${i}`} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#27ae60', alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 2, borderColor: '#fff' }}>
                <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Mukta_700Bold', lineHeight: 16, includeFontPadding: false, textAlignVertical: 'center' }}>{n}</Text>
              </View>
            ))}
          </Animated.View>
          <TouchableOpacity onPress={() => setShowNumbers(true)} style={{ height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems:'center', justifyContent:'center', paddingHorizontal: 12, flexDirection:'row', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
            <Ionicons name="list" size={18} color="#2c3e50" />
            <Text style={{ marginLeft: 8, fontWeight:'700', color:'#2c3e50', fontSize: 12, fontFamily: 'Montserrat_700Bold' }}>Lista</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: '#2c3e50' }}>
        <Header />
        {/* zona de cartones con altura dinámica */}
        <View style={{ flex: 1, paddingHorizontal: 0, paddingTop: 16, backgroundColor: '#f5f7fa' }} onLayout={(e)=>{ setAreaW(e.nativeEvent.layout.width); setAreaH(e.nativeEvent.layout.height); }}>
      {(() => {
        const count = myPlayer?.cards?.length || 0;
        // Calculamos la altura disponible real para los cartones
        const availableHeight = areaH; // Ya no consideramos header/footer aquí porque flex: 1 se encarga
        
        // Función para renderizar cartones según la cantidad con altura dinámica
        const renderCards = () => {
          const cards = myPlayer?.cards || [];
          const completedFigures = getMyCompletedFigures();
          
          if (count === 1) {
            // Un cartón: optimizado para usar todo el espacio disponible
            const widthTarget = Math.min(areaW * 0.85, 340);
            const maxCardHeight = availableHeight * 0.8;
            const computedAspect = Math.min(1.3, Math.max(0.9, widthTarget / maxCardHeight));
            
            return (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                <View style={{ width: widthTarget, maxWidth: '100%' }}>
                  <Bingo.BingoCard 
                    card={cards[0]} 
                    drawn={state.drawn} 
                    marked={localMarks[0]} 
                    onToggle={(r,c) => toggle(0,r,c)} 
                    cellAspect={computedAspect} 
                    size="large"
                    specificFigures={getCardSpecificFigures(0)}
                    cardIndex={0}
                  />
                </View>
              </View>
            );
          }
          
          if (count === 2) {
            // Dos cartones: mismo tamaño que 4 cartones pero centrados
            const spacing = 6;
            const cardWidth = (areaW - (spacing * 3)) / 2; // Mismo cálculo que para 4 cartones
            const maxCardHeight = (availableHeight - (spacing * 4)) / 2.2; // Mismo cálculo que para 4 cartones
            const computedAspect = Math.min(1.5, Math.max(1.0, cardWidth / maxCardHeight));
            
            return (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing }}>
                <View style={{ width: cardWidth }}>
                  {cards.map((card, i) => (
                    <View key={i} style={{ marginBottom: i === 0 ? spacing : 0 }}>
                      <Bingo.BingoCard 
                        card={card} 
                        drawn={state.drawn} 
                        marked={localMarks[i]} 
                        onToggle={(r,c) => toggle(i,r,c)} 
                        cellAspect={computedAspect} 
                        size="small"
                        compact
                        specificFigures={getCardSpecificFigures(i)}
                        cardIndex={i}
                      />
                    </View>
                  ))}
                </View>
              </View>
            );
          }
          
          if (count >= 3) {
            // Tres o más cartones: cuadrícula más compacta
            const spacing = 6;
            const cardWidth = (areaW - (spacing * 3)) / 2; // 2 columnas
            const maxCardHeight = (availableHeight - (spacing * 4)) / 2.2; // 2 filas con más margen
            const computedAspect = Math.min(1.5, Math.max(1.0, cardWidth / maxCardHeight));
            
            return (
              <View style={{ flex: 1, paddingHorizontal: spacing, paddingTop: 4 }}>
                <View style={{ 
                  flexDirection: 'row', 
                  flexWrap: 'wrap', 
                  justifyContent: 'space-between',
                  alignContent: 'flex-start'
                }}>
                  {cards.map((card, i) => (
                    <View 
                      key={i} 
                      style={{ 
                        width: cardWidth, 
                        marginBottom: spacing,
                        // Para centrar si hay número impar de cartones
                        ...(count % 2 !== 0 && i === count - 1 ? { alignSelf: 'center' } : {})
                      }}
                    >
                      <Bingo.BingoCard 
                        card={card} 
                        drawn={state.drawn} 
                        marked={localMarks[i]} 
                        onToggle={(r,c) => toggle(i,r,c)} 
                        cellAspect={computedAspect} 
                        size="small"
                        compact
                        specificFigures={getCardSpecificFigures(i)}
                        cardIndex={i}
                      />
                    </View>
                  ))}
                </View>
              </View>
            );
          }
          
          return null;
        };
        
        return renderCards();
      })()}
    </View>
  </View>

      {/* Footer mejorado con BINGO y Chat */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, backgroundColor: '#f5f7fa', flexDirection: 'row', alignItems: 'center', gap: 12 }} onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
        {/* Chat Button */}
        <TouchableOpacity
          onPress={toggleChat}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#3498db',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubbles" size={24} color="white" />
        </TouchableOpacity>
        
        {/* BINGO Button */}
        <TouchableOpacity 
          onPress={claimAutoAll} 
          disabled={isClaiming}
          style={{ 
            flex: 1,
            backgroundColor: isClaiming ? '#95a5a6' : '#e74c3c', 
            paddingVertical: 18, 
            paddingHorizontal: 40, 
            borderRadius: 30, 
            alignItems: 'center',
            shadowColor: isClaiming ? '#95a5a6' : '#e74c3c',
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
            transform: [{ scale: 1 }],
            opacity: isClaiming ? 0.7 : 1
          }}
          activeOpacity={isClaiming ? 1 : 0.8}
        >
          <Text style={{ color: 'white', fontSize: 22, fontWeight: '800', letterSpacing: 1, fontFamily: 'Montserrat_700Bold' }}>
            {isClaiming ? 'VERIFICANDO...' : '¡BINGO!'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Resumen de Juego */}
      <Modal transparent visible={showGameSummary} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ 
            backgroundColor: 'white', 
            borderRadius: 24, 
            padding: 24, 
            maxWidth: '95%',
            maxHeight: '80%',
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 12
          }}>
            <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 20, color: '#2c3e50', textAlign: 'center', fontFamily: 'Montserrat_700Bold' }}>
              🎉 ¡Juego Terminado!
            </Text>
            
            <ScrollView style={{ maxHeight: 300 }}>
              {state.players?.map((player, index) => {
                const playerFigures = Object.keys(state.figuresClaimed || {}).filter(
                  fig => state.figuresClaimed[fig] === player.id
                );
                const isReady = playersReady[player.id];
                
                return (
                  <View key={player.id} style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    marginBottom: 16,
                    padding: 12,
                    backgroundColor: '#f8f9fa',
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isReady ? '#27ae60' : '#ecf0f1'
                  }}>
                    {player.avatarUrl ? (
                      <Image source={{ uri: player.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                    ) : (
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#3498db', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ color: 'white', fontWeight: '700', fontFamily: 'Montserrat_700Bold' }}>{player.name?.[0]?.toUpperCase() || '?'}</Text>
                      </View>
                    )}
                    
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#2c3e50', fontFamily: 'Montserrat_700Bold' }}>{player.name}</Text>
                      <Text style={{ fontSize: 12, color: '#7f8c8d', fontFamily: 'Montserrat_400Regular' }}>
                        {playerFigures.length > 0 
                          ? playerFigures.map(fig => Bingo.getFigureLabel(fig)).join(', ')
                          : 'Sin completar'
                        }
                      </Text>
                    </View>
                    
                    {isReady && (
                      <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
                    )}
                  </View>
                );
              })}
            </ScrollView>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <TouchableOpacity 
                onPress={() => {
                  setShowGameSummary(false);
                  router.replace('/games');
                }} 
                style={{ 
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 14,
                  marginRight: 8,
                  backgroundColor: '#e74c3c',
                  borderRadius: 12,
                  shadowColor:'#e74c3c', shadowOpacity:0.25, shadowRadius:8, shadowOffset:{ width:0, height:4 }, elevation:7
                }}
              >
                <Ionicons name="exit-outline" size={18} color="#fff" />
                <Text style={{ fontWeight: '700', color: 'white', fontSize: 16, marginLeft: 8, fontFamily: 'Montserrat_700Bold' }}>Salir</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  // Marcar jugador como listo para nueva partida
                  setPlayersReady(prev => ({ ...prev, [me]: true }));
                  // Enviar al servidor que está listo
                  socket.emit('readyForNewGame', { roomId: state.roomId || params.roomId });
                }} 
                style={{ 
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 14,
                  marginLeft: 8,
                  backgroundColor: playersReady[me] ? '#7f8c8d' : '#27ae60',
                  borderRadius: 12,
                  shadowColor: playersReady[me] ? '#7f8c8d' : '#27ae60', shadowOpacity:0.25, shadowRadius:8, shadowOffset:{ width:0, height:4 }, elevation:7
                }}
                disabled={playersReady[me]}
              >
                <Ionicons name={playersReady[me] ? 'hourglass-outline' : 'refresh'} size={18} color="#fff" />
                <Text style={{ fontWeight: '700', color: 'white', fontSize: 16, marginLeft: 8, fontFamily: 'Montserrat_700Bold' }}>
                  {playersReady[me] ? 'Esperando...' : 'Volver a Jugar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Overlay de anuncio mejorado */}
      <Modal transparent visible={!!announce} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ 
            backgroundColor: 'white', 
            padding: 28, 
            borderRadius: 24, 
            alignItems: 'center', 
            maxWidth: '90%',
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 12
          }}>
            {announce?.playerAvatar ? (
              <View style={{ marginBottom: 16, borderRadius: 50, overflow: 'hidden', borderWidth: 4, borderColor: '#27ae60' }}>
                <Image source={{ uri: announce.playerAvatar }} style={{ width: 90, height: 90 }} />
              </View>
            ) : (
              <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#27ae60', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="person" size={40} color="white" />
              </View>
            )}
            
            <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 8, color: '#2c3e50', textAlign: 'center', fontFamily: 'Montserrat_700Bold' }}>
              ¡{announce?.playerName || 'Jugador'}!
            </Text>
            
            <View style={{ backgroundColor: '#27ae60', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 12 }}>
              <Text style={{ fontSize: 16, color: 'white', fontWeight: '700', fontFamily: 'Montserrat_700Bold' }}>
                {announce?.figures?.map(fig => Bingo.getFigureLabel(fig)).join(', ')}
              </Text>
            </View>
            
            <Text style={{ fontSize: 16, textAlign: 'center', color: '#7f8c8d', fontFamily: 'Montserrat_400Regular' }}>
              ¡Ha completado una figura!
            </Text>
          </View>
        </View>
      </Modal>

      {/* Figuras reclamadas y quién ganó cada una (arriba derecha) */}
  <View style={{ position:'absolute', right:8, top: (insets.top || 0) + 6, alignItems:'flex-end' }}>
        {['corners','row','column','diagonal','border','full'].map(key => {
          const pid = state.figuresClaimed?.[key];
          if (!pid) return null;
          const p = (state.players||[]).find(pp=>pp.id===pid);
          const labelMap = { corners:'Esq', row:'Lín', column:'Col', diagonal:'Diag', border:'Contorno', full:'Lleno' };
          return (
            <View key={key} style={{ flexDirection:'row', backgroundColor:'rgba(255,255,255,0.9)', paddingVertical:4, paddingHorizontal:8, borderRadius:12, marginBottom:4, alignItems:'center' }}>
              {p?.avatarUrl ? <Image source={{ uri: p.avatarUrl }} style={{ width: 18, height: 18, borderRadius: 9, marginRight: 6 }} /> : null}
              <Text style={{ fontSize:12, fontWeight:'bold', fontFamily: 'Montserrat_700Bold' }}>{labelMap[key]}: {p?.name || ''}</Text>
            </View>
          );
        })}
      </View>
      {/* Modal salir mejorado */}
      <Modal transparent visible={showExit} animationType="fade">
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', alignItems:'center', padding:24 }}>
          <View style={{ backgroundColor:'#fff', borderRadius:20, padding:24, width:'85%', maxWidth: 320, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 10 }}>
            <Text style={{ fontSize:20, fontWeight:'700', marginBottom:12, color: '#2c3e50', textAlign: 'center', fontFamily: 'Montserrat_700Bold' }}>¿Salir de la partida?</Text>
            <Text style={{ fontSize:14, color:'#7f8c8d', textAlign:'center', marginBottom:20, fontFamily: 'Montserrat_400Regular' }}>Perderás tu progreso actual en el juego</Text>
            <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
              <TouchableOpacity 
                onPress={() => setShowExit(false)} 
                style={{ flex: 1, padding:12, marginRight: 8, backgroundColor: '#ecf0f1', borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '600', color: '#7f8c8d', fontFamily: 'Montserrat_600SemiBold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => { allowExitRef.current = true; socket.emit('leaveRoom'); setShowExit(false); router.replace('/games'); }} 
                style={{ flex: 1, padding:12, marginLeft: 8, backgroundColor: '#e74c3c', borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ color:'#fff', fontWeight:'700', fontFamily: 'Montserrat_700Bold' }}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal listado de números mejorado con bolillas */}
      <Modal transparent visible={showNumbers} animationType="slide">
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)' }}>
          <View style={{ marginTop: 80, marginHorizontal: 16, backgroundColor:'#fff', borderRadius: 20, padding: 20, flex:1, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontWeight:'800', fontSize: 24, color: '#2c3e50', fontFamily: 'Montserrat_700Bold' }}>Números Cantados</Text>
              <TouchableOpacity onPress={() => setShowNumbers(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#ecf0f1', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={20} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection:'row', flexWrap:'wrap', paddingBottom: 20, justifyContent: 'center' }}>
                {Array.from({ length: 75 }, (_, i) => i + 1).map(n => {
                  const drawn = state.drawn.includes(n);
                  return (
                    <View key={n} style={{ width: '11.11%', padding: 4, alignItems: 'center' }}>
                      <View style={{ 
                        width: 32,
                        height: 32,
                        borderRadius: 16, // Bolilla redonda
                        backgroundColor: drawn ? '#27ae60' : '#ecf0f1', 
                        alignItems:'center', 
                        justifyContent:'center', 
                        borderWidth: drawn ? 3 : 2,
                        borderColor: drawn ? '#fff' : '#d1d8e0',
                        shadowColor: drawn ? '#27ae60' : '#000',
                        shadowOpacity: drawn ? 0.4 : 0.1,
                        shadowRadius: drawn ? 6 : 2,
                        shadowOffset: { width: 0, height: drawn ? 3 : 1 },
                        elevation: drawn ? 5 : 1
                      }}>
                        <Text style={{ color: drawn ? 'white' : '#7f8c8d', fontSize: 16, fontFamily: 'Mukta_700Bold', lineHeight: 18, includeFontPadding: false, textAlignVertical: 'center' }}>{n}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

  {/* Chat Toasts apilados a la derecha */}
  <ChatToasts messages={toastMessages} onItemComplete={handleToastComplete} />

      {/* Chat Panel */}
      <ChatPanel
        isVisible={chatVisible}
        onClose={() => setChatVisible(false)}
        onSendMessage={handleSendMessage}
      />
    </>
  );
}
