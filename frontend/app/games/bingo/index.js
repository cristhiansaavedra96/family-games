import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, BackHandler, Image, InteractionManager } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import socket from '../../../src/socket';
import { Bingo } from '../../../src/games';
import { getBingoColorByIndexOrNumber } from '../../../src/games/bingo/components/BingoCard';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { ChatPanel, ChatButton, ChatToasts } from '../../../src/components';
import { useAvatarSync } from '../../../src/hooks/useAvatarSync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { getUsername } from '../../../src/utils';
import { saveAvatarToCache } from '../../../src/services/avatarCache';
import { useMyAvatar } from '../../../src/hooks/useMyAvatar';
import { useBingoSound } from '../../../src/sound/useBingoSound';

import { ActivityIndicator } from 'react-native';
import { 
  GameSummaryModal,
  AnnouncementModal,
  ExitModal,
  NumbersModal,
  SpeedSelectModal
} from './components';
import useBingoUiStore from '../../../src/store/bingoUiStore';

export default function Game() {
  const insets = useSafeAreaInsets();
  const { syncPlayers, getAvatarUrl, syncAvatar, setLocalAvatarUrl } = useAvatarSync();
  const { myAvatar, myUsername, myName } = useMyAvatar(); // Hook para mi avatar local
  const [state, setState] = useState({ roomId: null, players: [], drawn: [], lastBall: null, hostId: null, figuresClaimed: {}, specificClaims: {}, speed: 1 });
  // Estado global (Zustand) para animación de la bola
  const currentBallUi = useBingoUiStore(s => s.currentBall);
  const prevBallUi = useBingoUiStore(s => s.prevBall);
  const setBall = useBingoUiStore(s => s.setBall);
  const clearBalls = useBingoUiStore(s => s.clearBalls);
  const [localMarks, setLocalMarks] = useState({}); // cardIndex -> 5x5 bool
  const [me, setMe] = useState(null);
  const [myAvatarLoaded, setMyAvatarLoaded] = useState(false); // Para controlar si ya cargamos el avatar
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
  const [showSpeedSelect, setShowSpeedSelect] = useState(false);
  
  // Logging consolidado de todos los estados de modales
  useEffect(() => {
    console.log(`[BingoGame] Estados de modales:`, {
      showGameSummary,
      showExit,
      showNumbers,
      showSpeedSelect,
      announce: !!announce,
      timestamp: new Date().toISOString()
    });
  }, [showGameSummary, showExit, showNumbers, showSpeedSelect, announce]);

  const {
    startBackground,
    stopBackground,
    musicMuted,
    setMusicMuted,
    effectsMuted,
    setEffectsMuted,
    playEffect,
    assetsReady
  } = useBingoSound();
  
  const prevLastBall = useRef(null);
  const hasGameStartedRef = useRef(false);

  // Ref para mantener la lista anterior de jugadores y evitar sincronizaciones innecesarias
  const previousPlayersRef = useRef([]);

  useEffect(() => {
    socket.on('state', (s) => {
      setState(s);
      
      // Solo sincronizar avatares si los jugadores han cambiado
      if (s.players && Array.isArray(s.players)) {
        const currentPlayerIds = s.players.map(p => p.id).sort();
        const previousPlayerIds = previousPlayersRef.current.map(p => p.id).sort();
        
        // Comparar si han cambiado los jugadores
        const playersChanged = currentPlayerIds.length !== previousPlayerIds.length ||
          currentPlayerIds.some((id, index) => id !== previousPlayerIds[index]);
        
        if (playersChanged) {
          console.log('🔄 Game - Players changed, syncing avatars:', s.players.length);
          syncPlayers(s.players);
          previousPlayersRef.current = s.players;
        }
      }
      
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
      // Efecto de inicio al recibir la primera bola de una nueva partida
      if (!hasGameStartedRef.current) {
        hasGameStartedRef.current = true;
      }
      
      // Actualizar inmediatamente el estado con la nueva bolilla para que aparezca en el historial
      setState(prevState => ({
        ...prevState,
        lastBall: n,
        drawn: [...(prevState.drawn || []), n]
      }));
      
  // Solo actualizar el número - la animación es automática en SimpleBingoBall
  setBall(n);
      
      Bingo.speakNumberBingo(n);
      // Cuando termina la animación, mantener el número hasta que el estado global cambie
      // y evitar parpadeo con el anterior
      setTimeout(() => {
        // Si el estado global ya tiene el nuevo número, limpiar
        if (state.lastBall === n) {
          // opcional: no limpiar inmediatamente; mantenemos historial en state.drawn
        }
      }, 600);
    });
  socket.on('gameOver', (payload) => {
      // En lugar de ir a summary, mostrar modal de resumen
      setGameSummaryData(payload);
      handleShowModal('gameresumen');
      // Si yo gané full, reproducir win
      try {
        const myId = me;
        const fullWinner = payload?.figuresClaimed?.full;
        if (fullWinner && fullWinner === myId) {
          playEffect('win');
        }
      } catch {}
    });
    socket.on('announcement', (payload) => {
      // Sonidos por anuncio
      if (Array.isArray(payload?.figures) && payload.figures.length > 0) {
        if (payload.figures.includes('full')) {
          // Win suena para todos cuando hay cartón lleno
          playEffect('win');
        } else if (payload.playerId === me) {
          playEffect('logro');
        }
      }
      // Sincronizar avatar del jugador del anuncio
      if (payload?.playerUsername && payload?.playerAvatarId) {
        console.log('🔄 Game - Syncing announcement avatar:', payload.playerUsername, payload.playerAvatarId);
        syncAvatar(payload.playerUsername, payload.playerAvatarId);
      }
      
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
        // Si reclamé y no es full, disparar logro
        try {
          const figs = Array.isArray(result?.figures) ? result.figures : [];
          if (figs.includes('full')) {
            playEffect('win');
          } else if (figs.length > 0) {
            playEffect('logro');
          }
        } catch {}
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

  // Música de fondo: iniciar al entrar, detener al salir
  useEffect(() => {
    if (!musicMuted && assetsReady) {
      startBackground();
    }
    return () => {
      stopBackground();
    };
  }, [assetsReady]); // Solo dependemos de assetsReady

  // Responder a cambios de mute de música
  useEffect(() => {
    if (!assetsReady) return;
    
    if (musicMuted) {
      stopBackground();
    } else {
      startBackground();
    }
  }, [musicMuted, assetsReady]); // Removemos las funciones como dependencias

  // Resetear flag de inicio cuando se detecta una nueva partida (sin bolillas)
  useEffect(() => {
    if (Array.isArray(state.drawn) && state.drawn.length === 0 && state.lastBall === null) {
      hasGameStartedRef.current = false;
    }
  }, [state.drawn?.length, state.lastBall]);

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
    }
  }, [announce, announceQueue]);

  // Efecto separado para ocultar anuncios después de un tiempo
  useEffect(() => {
    if (announce) {
      const timer = setTimeout(() => {
        setAnnounce(null);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [announce]);

  // Efecto para manejar el inicio del juego y reproducir sonido
  useEffect(() => {
    if (!hasGameStartedRef.current && 
        Array.isArray(state.drawn) && 
        state.drawn.length === 0 && 
        state.lastBall === null && 
        state.roomId) {
      // Marcar que hemos detectado el estado inicial
      hasGameStartedRef.current = true;
    }
  }, [state.drawn?.length, state.lastBall, state.roomId]);

  // Persistir mute de efectos en SoundManager cuando cambie
  // effectsMuted manejado dentro del hook

  // Confirmación al salir
  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e) => {
      if (allowExitRef.current) return; // permitir salida real
      e.preventDefault();
      handleShowModal('exit');
    });
    const onBack = () => {
      if (allowExitRef.current) return false; // permitir back real
      handleShowModal('exit');
      return true;
    };
  const backSub = BackHandler.addEventListener('hardwareBackPress', onBack);
  return () => { 
    sub && sub(); 
    backSub?.remove && backSub.remove(); 
  };
  }, [navigation]);

  // Funciones helper para manejar modales de forma segura
  const handleShowModal = useCallback((modalName) => {
    console.log(`[BingoGame] Mostrando modal: ${modalName}`);
    
    switch (modalName) {
      case 'gameresumen':
        setShowGameSummary(true);
        break;
      case 'exit':
        setShowExit(true);
        break;
      case 'numbers':
        setShowNumbers(true);
        break;
      case 'speed':
        setShowSpeedSelect(true);
        break;
    }
  }, []);

  const handleHideModal = useCallback((modalName) => {
    console.log(`[BingoGame] Ocultando modal: ${modalName}`);
    
    switch (modalName) {
      case 'gameresumen':
        setShowGameSummary(false);
        break;
      case 'exit':
        setShowExit(false);
        break;
      case 'numbers':
        setShowNumbers(false);
        break;
      case 'speed':
        setShowSpeedSelect(false);
        break;
    }
  }, []);

  // Las animaciones se limpian automáticamente en el hook useBingoAnimations

  const myPlayer = useMemo(() => {
    const player = state.players.find(p => p.id === me);
    if (player) {
      // Si tenemos datos del hook useMyAvatar, usarlos como backup
      return {
        ...player,
        name: player.name || myName || null,
        username: player.username || myUsername || null
      };
    }
    
    // Si no encontramos el jugador en el estado, crear uno temporal con datos del hook
    return {
      id: me,
      name: myName || null,
      username: myUsername || null,
      avatarId: null,
      cards: []
    };
  }, [state.players, me, myName, myUsername]);

  // Cargar datos locales del jugador (nombre y username) cuando no están en el estado
  useEffect(() => {
    const loadPlayerData = async () => {
      if (myPlayer && (!myPlayer.name || !myPlayer.username)) {
        try {
          const [savedName, savedUsername] = await Promise.all([
            AsyncStorage.getItem('profile:name'),
            getUsername()
          ]);
          
          console.log('🔄 Game - Loading player data:', { savedName, savedUsername });
          
          // Aquí no podemos modificar el estado directamente, pero podemos loguear para debug
          if (savedName && savedUsername) {
            console.log('⚡ Game - Player data loaded:', { name: savedName, username: savedUsername });
          }
        } catch (error) {
          console.error('❌ Error loading player data:', error);
        }
      }
    };
    
    loadPlayerData();
  }, [myPlayer?.name, myPlayer?.username]);

  // Sincronizar mi propio avatar cuando se carga mi jugador
  useEffect(() => {
    if (myPlayer && myPlayer.username && myPlayer.avatarId) {
      console.log('🔄 Game - Syncing my own avatar:', myPlayer.username, myPlayer.avatarId);
      syncAvatar(myPlayer.username, myPlayer.avatarId);
    }
  }, [myPlayer?.username, myPlayer?.avatarId, syncAvatar]);

  // Establecer mi avatar local en el caché cuando esté disponible
  useEffect(() => {
    if (myAvatar && myUsername) {
      console.log('⚡ Game - Setting my avatar from useMyAvatar hook:', myUsername);
      setLocalAvatarUrl(myUsername, myAvatar);
    }
  }, [myAvatar, myUsername, setLocalAvatarUrl]);

  // Recargar avatar cuando regresamos al juego (por si lo actualizamos en perfil)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 Game - Screen focused, checking for avatar updates...');
      // Recargar avatar por si se actualizó desde perfil
      const recheckAvatar = async () => {
        try {
          const myUsername = await getUsername();
          const savedAvatarPath = await AsyncStorage.getItem('profile:avatar');
          
          if (myUsername && savedAvatarPath) {
            const base64 = await FileSystem.readAsStringAsync(savedAvatarPath, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const avatarBase64 = `data:image/jpeg;base64,${base64}`;
            
            // Actualizar caché con el avatar más reciente
            const tempAvatarId = `local_${myUsername}_${Date.now()}`;
            await saveAvatarToCache(tempAvatarId, avatarBase64);
            
            // También establecer inmediatamente en el hook
            setLocalAvatarUrl(myUsername, avatarBase64);
            
            console.log('⚡ Game - Avatar updated after screen focus');
          }
        } catch (error) {
          console.error('❌ Error rechecking avatar:', error);
        }
      };
      
      recheckAvatar();
    });

    return unsubscribe;
  }, [navigation]);

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
        const prevVal = Boolean(prev?.[cardIndex]?.[r]?.[c]);
        const grid = prev[cardIndex] ? prev[cardIndex].map(row => row.slice()) : Array.from({ length: 5 }, () => Array(5).fill(false));
        if (!(r === 2 && c === 2)) {
          // Sonido al seleccionar una ficha (solo cuando se marca)
          if (!prevVal) {
            playEffect('select');
          }
          grid[r][c] = !grid[r][c];
        }
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
  // Sincronizar: usar drawn + currentBall de UI si no está incluido
        let drawnSync = state.drawn || [];
        if (currentBallUi && !drawnSync.includes(currentBallUi)) {
          drawnSync = [...drawnSync, currentBallUi];
        }
        const m = Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => false));
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            if (r === 2 && c === 2) { m[r][c] = true; continue; }
            const wasToggled = Boolean(localMarked?.[r]?.[c]);
            const value = card?.[r]?.[c];
            const isDrawn = drawnSync.includes(value);
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

  const handleSendMessage = async (messageData) => {
    if (!myPlayer && !myUsername) return;

    console.log('📤 Game - Sending message with my data:', {
      hookUsername: myUsername,
      hookName: myName,
      serverPlayer: myPlayer?.username,
      hasAvatar: !!myAvatar
    });

    // Usar datos del hook useMyAvatar como primera opción
    let username = myUsername;
    let name = myName;
    let avatarId = myPlayer?.avatarId || null; // Usar el avatarId real del servidor

    // Si tenemos avatar del hook, asegurarnos de que esté en el caché
    if (username && myAvatar) {
      console.log('📤 Game - Setting local avatar in cache before sending message');
      setLocalAvatarUrl(username, myAvatar);
    }

    // Si no tenemos datos del hook, usar datos del servidor
    if (!username && myPlayer) {
      username = myPlayer.username;
      name = myPlayer.name;
      avatarId = myPlayer.avatarId;
    }

    // Fallback final a AsyncStorage
    if (!username || !name) {
      const [currentUsername, currentName] = await Promise.all([
        getUsername(),
        AsyncStorage.getItem('profile:name')
      ]);
      username = username || currentUsername;
      name = name || currentName;
    }

    const fullMessage = {
      ...messageData,
      player: {
        id: me,
        name: name,
        username: username,
        avatarId: avatarId // Puede ser null si usamos datos del hook
      },
      timestamp: Date.now()
    };

    console.log('📤 Game - Sending chat message with final data:', fullMessage);
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
      <View style={{ backgroundColor: '#2c3e50', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingTop: insets.top + 4, paddingBottom: 6, paddingHorizontal: 0, minHeight: 100 }}>
        {/* fila superior: Home y Velocidad en la primera fila, con padding lateral */}
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: 16 }}>
          {/* Grupo izquierdo: Home + Velocidad */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Home */}
            <TouchableOpacity onPress={() => handleShowModal('exit')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor:'#fff', alignItems:'center', justifyContent:'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
              <Ionicons name="home" size={24} color="#2c3e50" />
            </TouchableOpacity>
            {/* Velocidad (host editable, otros lectura) */}
            {state.hostId === me ? (
              <TouchableOpacity onPress={() => handleShowModal('speed')} style={{ marginLeft: 8, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems:'center', justifyContent:'center', paddingHorizontal: 16, flexDirection:'row', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
                <MaterialCommunityIcons name="fast-forward" size={18} color="#2c3e50" />
                <Text style={{ marginLeft: 8, fontWeight:'700', color:'#2c3e50', fontSize: 14, fontFamily: 'Montserrat_700Bold' }}>{(state.speed||1)}x</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ marginLeft: 8, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems:'center', justifyContent:'center', paddingHorizontal: 16, flexDirection:'row', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
                <Text style={{ fontWeight:'700', color:'#2c3e50', fontSize: 14, fontFamily: 'Montserrat_700Bold' }}>{(state.speed||1)}x</Text>
              </View>
            )}
          </View>
          {/* Placeholder para mantener altura/espacio a la derecha */}
          <View style={{ width: 44, height: 44 }} />
        </View>

        {/* Segunda fila absoluta: Música y Efectos lado a lado, no empuja el bolillero */}
        <View style={{ position: 'absolute', left: 16, top: (insets.top || 0) + 4 + 44 + 8, zIndex: 2, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setMusicMuted((m) => !m)}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3, marginRight: 8 }}
            accessibilityLabel="Silenciar música"
          >
            <Ionicons name={musicMuted ? 'musical-notes-outline' : 'musical-notes'} size={20} color={musicMuted ? '#95a5a6' : '#2c3e50'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setEffectsMuted(prev => !prev)}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}
            accessibilityLabel="Silenciar efectos"
          >
            <Ionicons name={effectsMuted ? 'volume-mute' : 'volume-high'} size={20} color={effectsMuted ? '#95a5a6' : '#2c3e50'} />
          </TouchableOpacity>
        </View>

        {/* bola central animada simple y efectiva */}
        <Bingo.SimpleBingoBall 
          key='bingoBall'
          style={{ marginTop: 0, marginBottom: 2 }}
        />

        {/* últimas bolillas animadas + botón Lista como 5ta bolilla */}
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', marginTop: 12, paddingHorizontal: 16 }}>
          {/* Contenedor con fondo para las últimas 4 bolillas + botón lista */}
          <View style={{
            flexDirection:'row', 
            alignItems:'center',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            minWidth: 220, // Ancho fijo para 4 bolillas + lista
            justifyContent: 'flex-start'
          }}>
            {/* Renderizar siempre 4 espacios, llenando desde la izquierda con reverse */}
            {Array.from({ length: 4 }, (_, index) => {
              // Reverse: la última cantada aparece primera (index 0)
              const drawnIndex = state.drawn.length - 1 - index;
              const number = drawnIndex >= 0 ? state.drawn[drawnIndex] : null;
              
              return (
                <View 
                  key={`slot-${index}`} 
                  style={{ 
                    width: 34, 
                    height: 34, 
                    borderRadius: 17, 
                    backgroundColor: number ? getBingoColorByIndexOrNumber(number) : 'rgba(255, 255, 255, 0.2)', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginRight: 8,
                    borderWidth: 2, 
                    borderColor: number ? '#fff' : 'rgba(255, 255, 255, 0.3)'
                  }}
                >
                  {number && (
                    <Text style={{ 
                      color: '#fff', 
                      fontSize: 20, 
                      fontFamily: 'Mukta_700Bold', 
                      lineHeight: 16, 
                      includeFontPadding: false, 
                      textAlignVertical: 'center' 
                    }}>
                      {number}
                    </Text>
                  )}
                </View>
              );
            })}
            
            {/* Botón Lista como 5ta bolilla */}
            <TouchableOpacity 
              onPress={() => handleShowModal('numbers')} 
              style={{ 
                width: 34, 
                height: 34, 
                borderRadius: 17, 
                backgroundColor: '#fff', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#6d7b88ff',
                shadowOpacity: 0.1, 
                shadowRadius: 4, 
                shadowOffset: { width: 0, height: 2 }, 
                elevation: 3
              }}
            >
              <Ionicons name="list" size={18} color="#2c3e50" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  if (!assetsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2c3e50' }}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={{ color: 'white', marginTop: 16, fontSize: 18, fontWeight: '700', fontFamily: 'Montserrat_700Bold' }}>Cargando sonidos...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: '#2c3e50' }}>
        <Header />
        {/* zona de cartones con altura dinámica */}
        <View style={{ flex: 1, paddingHorizontal: 0, paddingTop: 4, backgroundColor: '#f5f7fa' }} onLayout={(e)=>{ setAreaW(e.nativeEvent.layout.width); setAreaH(e.nativeEvent.layout.height); }}>
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

      {/* === SECCIÓN DE MODALES === */}
      {/* Solo se renderizan cuando su estado visible es true */}
      
      {/* Modal de Resumen de Juego */}
      {showGameSummary && (
        <GameSummaryModal
          visible={showGameSummary}
          players={state.players}
          figuresClaimed={state.figuresClaimed}
          playersReady={playersReady}
          me={me}
          onClose={() => {
            handleHideModal('gameresumen');
            router.replace('/gameSelect');
          }}
          onPlayAgain={() => {
            // Marcar jugador como listo para nueva partida
            setPlayersReady(prev => ({ ...prev, [me]: true }));
            // Enviar al servidor que está listo
            socket.emit('readyForNewGame', { roomId: state.roomId || params.roomId });
          }}
        />
      )}

      {/* Modal de Salir */}
      {showExit && (
        <ExitModal
          visible={showExit}
          onClose={() => handleHideModal('exit')}
          onConfirm={() => {
            allowExitRef.current = true;
            socket.emit('leaveRoom');
            clearBalls(); // Limpiar bolas al salir
            handleHideModal('exit');
            router.replace('/gameSelect');
          }}
        />
      )}

      {/* Modal de Números Cantados */}
      {showNumbers && (
        <NumbersModal
          visible={showNumbers}
          drawnNumbers={state.drawn}
          onClose={() => handleHideModal('numbers')}
        />
      )}

      {/* Modal de Selección de Velocidad */}
      {showSpeedSelect && (
        <SpeedSelectModal
          visible={showSpeedSelect}
          currentSpeed={state.speed}
          onSpeedChange={(speed) => {
            if (speed !== state.speed) {
              socket.emit('setSpeed', { roomId: state.roomId || params.roomId, speed });
            }
          }}
          onClose={() => handleHideModal('speed')}
        />
      )}

      {/* Modal de Anuncios */}
      {announce && (
        <AnnouncementModal
          visible={!!announce}
          announce={announce}
          getAvatarUrl={getAvatarUrl}
          onClose={() => setAnnounce(null)}
        />
      )}

      {/* Overlay de anuncio mejorado */}
      <AnnouncementModal
        visible={!!announce}
        announce={announce}
        getAvatarUrl={getAvatarUrl}
        onClose={() => setAnnounce(null)}
      />

      {/* Figuras reclamadas y quién ganó cada una (arriba derecha) */}
      <View style={{ position:'absolute', right:8, top: (insets.top || 0) + 6, alignItems:'flex-end' }}>
        {['corners','row','column','diagonal','border','full'].map(key => {
          const pid = state.figuresClaimed?.[key];
          if (!pid) return null;
          const p = (state.players||[]).find(pp=>pp.id===pid);
          const labelMap = { corners:'Esq', row:'Lín', column:'Col', diagonal:'Diag', border:'Contorno', full:'Lleno' };
          return (
            <View key={key} style={{ flexDirection:'row', backgroundColor:'rgba(255,255,255,0.9)', paddingVertical:4, paddingHorizontal:8, borderRadius:12, marginBottom:4, alignItems:'center' }}>
              {p?.avatarId && getAvatarUrl(p.username) ? (
                <View style={{ width: 18, height: 18, borderRadius: 9, marginRight: 6 }}>
                  <Image 
                    source={{ uri: getAvatarUrl(p.username) }} 
                    style={{ width: 18, height: 18, borderRadius: 9 }} 
                  />
                </View>
              ) : (
                <View style={{ 
                  width: 18, 
                  height: 18, 
                  borderRadius: 9, 
                  marginRight: 6, 
                  backgroundColor: '#f0f0f0',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Text style={{ fontSize: 10, color: '#666' }}>👤</Text>
                </View>
              )}
              <Text style={{ fontSize:12, fontWeight:'bold', fontFamily: 'Montserrat_700Bold' }}>{labelMap[key]}: {p?.name || ''}</Text>
            </View>
          );
        })}
      </View>
      {/* === FIN SECCIÓN DE MODALES === */}

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
