import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const GameSummaryModal = ({ 
  visible, 
  players, 
  figuresClaimed, 
  playersReady, 
  me, 
  onClose, 
  onPlayAgain 
}) => {
  // Logging para detectar conflictos
  console.log(`[GameSummaryModal] Render`, {
    visible,
    playersCount: players?.length || 0,
    timestamp: new Date().toISOString()
  });

  if (!visible) {
    console.log(`[GameSummaryModal] No visible, no renderizando contenido`);
    return null;
  }

  console.log(`[GameSummaryModal] Modal visible, renderizando contenido completo`);

  // Función para calcular puntos según las figuras reclamadas
  const calculatePoints = (playerFigures) => {
    let points = 0;
    playerFigures.forEach(figure => {
      if (figure === 'full') {
        points += 5;
      } else if (figure === 'border') {
        points += 3;
      } else if (['column', 'row', 'diagonal', 'corners'].includes(figure)) {
        points += 1;
      }
    });
    return points;
  };

  // Calcular datos de jugadores con puntos y ordenar
  const playersWithPoints = players?.map(player => {
    const playerFigures = Object.keys(figuresClaimed || {}).filter(
      fig => figuresClaimed[fig] === player.id
    );
    const points = calculatePoints(playerFigures);
    const hasCartonLleno = playerFigures.includes('full');
    
    return {
      ...player,
      figures: playerFigures,
      points: points,
      isWinner: hasCartonLleno
    };
  }).sort((a, b) => {
    // Primero por cartón lleno, luego por puntos
    if (a.isWinner && !b.isWinner) return -1;
    if (!a.isWinner && b.isWinner) return 1;
    return b.points - a.points;
  }) || [];

  const winner = playersWithPoints.find(p => p.isWinner);

  const renderPlayerItem = (player, index) => {
    const isReady = playersReady[player.id];
    const isWinnerCard = player.isWinner;
    
    // Colores para ranking similar al leaderboard
    let badgeColor = '#8f5cff'; // púrpura eléctrico
    let badgeShadow = '#3d246c';
    let borderBottom = '#8f5cff';
    if (index === 0) { badgeColor = '#d7263d'; badgeShadow = '#7c1622'; borderBottom = '#d7263d'; } // rojo oscuro
    else if (index === 1) { badgeColor = '#00bfff'; badgeShadow = '#005f87'; borderBottom = '#00bfff'; } // azul eléctrico
    else if (index === 2) { badgeColor = '#e0e0e0'; badgeShadow = '#888'; borderBottom = '#e0e0e0'; } // gris claro

    return (
      <View key={player.id} style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 12,
        backgroundColor: '#122436ff',
        borderRadius: 14,
        borderWidth: 1.2,
        borderColor: '#232526',
        shadowColor: badgeShadow,
        shadowOpacity: 0.13,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        borderBottomWidth: 3,
        borderBottomColor: borderBottom,
        minHeight: 70,
      }}>
        <View style={{ width: 40, alignItems: 'center', marginRight: 12 }}>
          <View style={{
            backgroundColor: badgeColor,
            borderRadius: 14,
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 2,
            shadowColor: badgeShadow,
            shadowOpacity: 0.7,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 6,
          }}>
            <Text style={{ 
              fontFamily: 'Montserrat_700Bold', 
              color: '#fff', 
              fontSize: 16, 
              textShadowColor: '#000', 
              textShadowOffset: {width: 1, height: 1}, 
              textShadowRadius: 2 
            }}>
              {index + 1}
            </Text>
            {isWinnerCard && (
              <MaterialCommunityIcons 
                name="crown" 
                size={16} 
                color="#ffd700" 
                style={{ 
                  position: 'absolute', 
                  top: -8, 
                  right: -8, 
                  textShadowColor: '#ff1744', 
                  textShadowRadius: 6 
                }} 
              />
            )}
          </View>
        </View>
        
        {player.avatarUrl ? (
          <Image 
            source={{ uri: player.avatarUrl }} 
            style={{ 
              width: 50, 
              height: 50, 
              borderRadius: 25, 
              marginRight: 14, 
              borderWidth: 2, 
              borderColor: '#e0e0e0', 
              backgroundColor: '#181818' 
            }} 
          />
        ) : (
          <View style={{ 
            width: 50, 
            height: 50, 
            borderRadius: 25, 
            marginRight: 14, 
            backgroundColor: '#8f5cff', 
            alignItems: 'center', 
            justifyContent: 'center', 
            borderWidth: 2, 
            borderColor: '#e0e0e0' 
          }}>
            <Text style={{ 
              color: '#fff', 
              fontFamily: 'Montserrat_700Bold', 
              fontSize: 20 
            }}>
              {player?.name?.[0]?.toUpperCase() || player?.username?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        
        <View style={{ flex: 1, minHeight: 36, justifyContent: 'center' }}>
          <Text style={{ 
            fontFamily: 'Montserrat_700Bold', 
            color: '#fff', 
            fontSize: 16, 
            marginBottom: 2, 
            textShadowColor: '#000', 
            textShadowRadius: 2 
          }} numberOfLines={1} ellipsizeMode="tail">
            {player.name || player.username}
          </Text>
          <Text style={{ 
            fontFamily: 'Montserrat_400Regular', 
            color: '#ff1744', 
            fontSize: 13, 
            marginBottom: 1 
          }} numberOfLines={1} ellipsizeMode="tail">
            Puntos: <Text style={{ fontFamily: 'Montserrat_700Bold', color: '#ffd700' }}>{player.points}</Text>
          </Text>
          <Text style={{ 
            fontFamily: 'Montserrat_400Regular', 
            color: '#e0e0e0', 
            fontSize: 12 
          }} numberOfLines={1} ellipsizeMode="tail">
            Figuras: <Text style={{ color: '#fff', fontFamily: 'Montserrat_700Bold' }}>{player.figures.length}</Text>
            {isWinnerCard && <Text style={{ color: '#ffd700', fontFamily: 'Montserrat_700Bold' }}> | ¡GANADOR!</Text>}
          </Text>
        </View>
        
        {isReady && (
          <View style={{
            backgroundColor: '#27ae60',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            marginLeft: 8
          }}>
            <Text style={{ 
              color: 'white', 
              fontSize: 10, 
              fontWeight: '600',
              fontFamily: 'Montserrat_600SemiBold' 
            }}>
              Listo
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      zIndex: 999999
    }}>
      <View style={{ 
        backgroundColor: '#e6ecf5', 
        borderRadius: 24, 
        padding: 0, 
        maxWidth: '95%',
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 15,
        overflow: 'hidden'
      }}>
        {/* Header con ganador prominente */}
        <View style={{
          backgroundColor: '#2c3e50',
          paddingTop: 30,
          paddingBottom: 30,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          alignItems: 'center'
        }}>
          {winner ? (
            <View style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name="crown" size={40} color="#ffd700" style={{ marginBottom: 10 }} />
              <Text style={{ 
                color: '#fff', 
                fontFamily: 'Montserrat_700Bold', 
                fontSize: 24, 
                textAlign: 'center',
                marginBottom: 5
              }}>
                🎉 ¡GANADOR! 🎉
              </Text>
              <Text style={{ 
                color: '#ffd700', 
                fontFamily: 'Montserrat_700Bold', 
                fontSize: 20, 
                textAlign: 'center',
                marginBottom: 5
              }}>
                {winner.name || winner.username}
              </Text>
              <Text style={{ 
                color: '#e0e0e0', 
                fontFamily: 'Montserrat_400Regular', 
                fontSize: 14, 
                textAlign: 'center'
              }}>
                Cartón lleno • {winner.points} puntos
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ 
                color: '#fff', 
                fontFamily: 'Montserrat_700Bold', 
                fontSize: 22, 
                textAlign: 'center'
              }}>
                🎯 Resumen del Juego
              </Text>
              <Text style={{ 
                color: '#e0e0e0', 
                fontFamily: 'Montserrat_400Regular', 
                fontSize: 14, 
                textAlign: 'center',
                marginTop: 5
              }}>
                Sin ganador de cartón lleno
              </Text>
            </View>
          )}
        </View>
        
        {/* Lista de jugadores estilo ranking */}
        <View style={{ backgroundColor: '#e6ecf5', paddingHorizontal: 16, paddingTop: 20 }}>
          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
            {playersWithPoints.map((player, index) => renderPlayerItem(player, index))}
          </ScrollView>
        </View>
        
        {/* Botones de acción */}
        <View style={{ 
          backgroundColor: '#e6ecf5',
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          paddingHorizontal: 20,
          paddingVertical: 20,
          paddingBottom: 24
        }}>
          <TouchableOpacity 
            onPress={() => {
              console.log(`[GameSummaryModal] Botón Salir presionado (Absolute View)`);
              onClose && onClose();
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
              shadowColor:'#e74c3c', 
              shadowOpacity:0.25, 
              shadowRadius:8, 
              shadowOffset:{ width:0, height:4 }, 
              elevation:7
            }}
          >
            <Ionicons name="exit-outline" size={18} color="#fff" />
            <Text style={{ 
              fontWeight: '700', 
              color: 'white', 
              fontSize: 16, 
              marginLeft: 8, 
              fontFamily: 'Montserrat_700Bold' 
            }}>
              Salir
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {
              console.log(`[GameSummaryModal] Botón Volver a Jugar presionado (Absolute View)`);
              onPlayAgain && onPlayAgain();
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
              shadowColor: playersReady[me] ? '#7f8c8d' : '#27ae60', 
              shadowOpacity:0.25, 
              shadowRadius:8, 
              shadowOffset:{ width:0, height:4 }, 
              elevation:7
            }}
            disabled={playersReady[me]}
          >
            <Ionicons name={playersReady[me] ? 'hourglass-outline' : 'refresh'} size={18} color="#fff" />
            <Text style={{ 
              fontWeight: '700', 
              color: 'white', 
              fontSize: 16, 
              marginLeft: 8, 
              fontFamily: 'Montserrat_700Bold' 
            }}>
              {playersReady[me] ? 'Esperando...' : 'Volver a Jugar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default GameSummaryModal;