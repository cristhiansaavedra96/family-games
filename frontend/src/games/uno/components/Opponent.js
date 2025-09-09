import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
} from "react-native-reanimated";
import { getUnoBackImage } from "../utils/cardAssets";

// Componente animado para cartas nuevas de oponentes
function AnimatedOpponentCard({
  index,
  back,
  stacks,
  responsiveSize,
  shrink,
  styles,
}) {
  const scale = useSharedValue(0.3);
  const translateX = useSharedValue(-100);
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Animación de entrada desde el mazo
    const delay = 100;

    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    translateX.value = withDelay(
      delay,
      withSpring(0, { damping: 12, stiffness: 200 })
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 12, stiffness: 200 })
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        animatedStyle,
        styles.cardWrapper,
        {
          zIndex: stacks - index,
        },
        responsiveSize && {
          width: responsiveSize.opponentCard.width,
          height: responsiveSize.opponentCard.height,
          marginLeft:
            index > 0 ? -(responsiveSize.opponentCard.width * 0.7) : 0,
        },
        shrink &&
          responsiveSize && {
            width: responsiveSize.opponentCard.width * 0.8,
            height: responsiveSize.opponentCard.height * 0.8,
            marginLeft:
              index > 0 ? -(responsiveSize.opponentCard.width * 0.8 * 0.7) : 0,
          },
      ]}
    >
      <Image
        source={back}
        style={[
          styles.cardBack,
          responsiveSize && {
            width: responsiveSize.opponentCard.width,
            height: responsiveSize.opponentCard.height,
          },
          shrink &&
            responsiveSize && {
              width: responsiveSize.opponentCard.width * 0.8,
              height: responsiveSize.opponentCard.height * 0.8,
            },
        ]}
      />
    </Animated.View>
  );
}

export default function Opponent({
  player,
  unoPlayers,
  shrink,
  responsiveStyles,
  responsiveSize,
  scores,
  eliminatedPlayers,
  getAvatarUrl,
  playersWithOneCard,
  onClaimUno,
  me,
  currentPlayer,
  shouldEnlarge,
  shouldMoveDown,
}) {
  const unoFlag = unoPlayers.find((u) => u.playerId === player.id);
  const back = getUnoBackImage();
  const stacks = Math.min(player.handCount, 6);
  const arr = Array.from({ length: stacks });
  const displayName = player.name || player.username || "?";
  const avatarUrl = getAvatarUrl(player.username);
  const playerScore = scores[player.id] || 0;
  const isEliminated = eliminatedPlayers.includes(player.id);
  const isMe = player.id === me; // Detectar si soy yo
  const isMyTurn = currentPlayer === player.id; // Detectar si es el turno de este jugador

  // Debug para mi jugador
  if (isMe) {
    console.log("Mi jugador - Debug:", {
      playerId: player.id,
      playerName: player.name,
      playerUsername: player.username,
      displayName,
      avatarUrl,
      me,
    });
  }

  // Usar tamaños responsivos si están disponibles, si no, usar estilos fijos
  const avatarStyle = responsiveStyles
    ? responsiveStyles.responsiveOpponentAvatar
    : styles.opponentAvatar;
  const avatarPlaceholderStyle = responsiveStyles
    ? responsiveStyles.responsiveOpponentAvatarPlaceholder
    : styles.opponentAvatarPlaceholder;

  // Tracking para detectar cuando el jugador roba cartas (solo para animación)
  const prevHandCount = useRef(player.handCount);
  const gameStarted = useRef(false);
  const shouldAnimateNewCards = useRef(false);

  // Animaciones para el contador de cartas
  const countScale = useSharedValue(1);
  const countOpacity = useSharedValue(1);

  useEffect(() => {
    // Marcar el juego como iniciado después del primer render
    if (player.handCount > 0 && !gameStarted.current) {
      gameStarted.current = true;
      prevHandCount.current = player.handCount;
      return;
    }

    // Detectar cuando el jugador roba cartas (incremento en handCount)
    if (player.handCount > prevHandCount.current && gameStarted.current) {
      console.log(
        `[Opponent] ${displayName} robó ${
          player.handCount - prevHandCount.current
        } carta(s)`
      );
      shouldAnimateNewCards.current = true;

      // Animar el contador de cartas
      countScale.value = withSequence(
        withTiming(1.3, { duration: 150 }),
        withTiming(0.9, { duration: 150 }),
        withTiming(1.1, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );

      countOpacity.value = withSequence(
        withTiming(0.7, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );

      // Reset el flag después de la animación
      setTimeout(() => {
        shouldAnimateNewCards.current = false;
      }, 1000);
    }

    // Detectar cuando el jugador juega cartas (decremento en handCount)
    if (player.handCount < prevHandCount.current && gameStarted.current) {
      console.log(
        `[Opponent] ${displayName} jugó ${
          prevHandCount.current - player.handCount
        } carta(s)`
      );

      // Animación más sutil para cuando juega cartas
      countScale.value = withSequence(
        withTiming(1.15, { duration: 100 }),
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    }

    prevHandCount.current = player.handCount;
  }, [player.handCount, displayName]);

  // Estilo animado para el contador
  const animatedCountStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: countScale.value }],
      opacity: countOpacity.value,
    };
  });

  return (
    <View
      style={[
        styles.opponentContainer,
        shrink && { transform: [{ scale: 0.9 }] },
        shouldEnlarge && { transform: [{ scale: 1.4 }] }, // Escala especial para rivales en 1v1 y 3 jugadores
        shouldMoveDown && {
          marginTop:
            responsiveSize && responsiveSize.avatarSize > 45
              ? 30 // S23 y pantallas de alta densidad (menor margen)
              : 50, // Emulador y pantallas más grandes (mayor margen)
        }, // Margen adicional dinámico para mi posición cuando hay pocos jugadores
        isEliminated && styles.eliminatedPlayer,
        isMe && styles.myPlayerContainer, // Estilo especial para mi jugador
        isMyTurn && styles.activePlayerContainer, // Background especial cuando es el turno del jugador
        isMe &&
          responsiveSize &&
          responsiveSize.avatarSize > 45 && {
            marginTop: 50, // Margen superior adicional para mi jugador en pantallas de alta densidad (scale ~1.34)
          },
      ]}
    >
      {/* Header con nombre y puntos */}
      <View style={styles.header}>
        <Text
          style={[
            styles.playerName,
            {
              fontSize: responsiveSize ? responsiveSize.fontSize.medium : 11,
            },
            isEliminated && styles.eliminatedText,
            isMe && styles.myPlayerName, // Color verde para mi jugador
          ]}
          numberOfLines={1}
        >
          {displayName} {isEliminated && "(ELIM)"}
        </Text>
        <Text
          style={[
            styles.playerScore,
            { fontSize: responsiveSize ? responsiveSize.fontSize.small : 9 },
            isEliminated && styles.eliminatedText,
          ]}
        >
          {playerScore}pts
        </Text>
        {/* Contador de cartas */}
        <Animated.Text
          style={[
            styles.cardCount,
            {
              fontSize: responsiveSize ? responsiveSize.fontSize.medium : 12,
            },
            isEliminated && styles.eliminatedText,
            isMe && styles.myCardCount, // Color verde para mi jugador
            animatedCountStyle,
          ]}
        >
          {player.handCount}
        </Animated.Text>
      </View>

      {/* Avatar centrado - con margen adicional cuando soy yo (sin cartas) */}
      <View
        style={[
          styles.avatarSection,
          isMe && {
            marginTop: responsiveSize
              ? responsiveSize.avatarSize > 45
                ? 16
                : 8 // Más margen en pantallas de alta densidad (scale > 1.3)
              : 8,
          },
        ]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={[
              avatarStyle,
              shrink &&
                responsiveSize && {
                  width: responsiveSize.avatarSize * 0.85,
                  height: responsiveSize.avatarSize * 0.85,
                  borderRadius: (responsiveSize.avatarSize * 0.85) / 2,
                },
              isEliminated && styles.eliminatedAvatar,
              isMe && { borderColor: "#2ecc71" }, // Borde verde para mi jugador
            ]}
          />
        ) : (
          <View
            style={[
              avatarPlaceholderStyle,
              shrink &&
                responsiveSize && {
                  width: responsiveSize.avatarSize * 0.85,
                  height: responsiveSize.avatarSize * 0.85,
                  borderRadius: (responsiveSize.avatarSize * 0.85) / 2,
                },
              isEliminated && styles.eliminatedAvatar,
              isMe && { borderColor: "#2ecc71", backgroundColor: "#2ecc71" }, // Verde para mi jugador
            ]}
          >
            <Text
              style={[
                styles.avatarLetter,
                {
                  fontSize: responsiveSize
                    ? responsiveSize.fontSize.medium
                    : 14,
                },
                shrink && {
                  fontSize: responsiveSize ? responsiveSize.fontSize.small : 12,
                },
              ]}
            >
              {displayName[0].toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Sección de cartas - no mostrar para mi jugador */}
      {!isMe && (
        <View style={styles.cardsSection}>
          <View style={styles.cardsStack}>
            {arr.map((_, i) => {
              // Solo animar las cartas nuevas (índices >= al count anterior)
              const isNewCard =
                shouldAnimateNewCards.current && i >= prevHandCount.current;

              if (isNewCard) {
                return (
                  <AnimatedOpponentCard
                    key={i}
                    index={i}
                    back={back}
                    stacks={stacks}
                    responsiveSize={responsiveSize}
                    shrink={shrink}
                    styles={styles}
                  />
                );
              }

              // Cartas existentes sin animación
              return (
                <View
                  key={i}
                  style={[
                    styles.cardWrapper,
                    {
                      zIndex: stacks - i,
                    },
                    responsiveSize && {
                      width: responsiveSize.opponentCard.width,
                      height: responsiveSize.opponentCard.height,
                      marginLeft:
                        i > 0 ? -(responsiveSize.opponentCard.width * 0.7) : 0,
                    },
                    shrink &&
                      responsiveSize && {
                        width: responsiveSize.opponentCard.width * 0.8,
                        height: responsiveSize.opponentCard.height * 0.8,
                        marginLeft:
                          i > 0
                            ? -(responsiveSize.opponentCard.width * 0.8 * 0.7)
                            : 0,
                      },
                  ]}
                >
                  <Image
                    source={back}
                    style={[
                      styles.cardBack,
                      responsiveSize && {
                        width: responsiveSize.opponentCard.width,
                        height: responsiveSize.opponentCard.height,
                      },
                      shrink &&
                        responsiveSize && {
                          width: responsiveSize.opponentCard.width * 0.8,
                          height: responsiveSize.opponentCard.height * 0.8,
                        },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  opponentContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    minWidth: 95,
    maxWidth: 115,
    padding: 4,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },

  eliminatedPlayer: {
    opacity: 0.6,
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    borderColor: "rgba(231, 76, 60, 0.3)",
  },

  eliminatedText: {
    color: "#e74c3c",
    textDecorationLine: "line-through",
  },

  eliminatedAvatar: {
    borderColor: "#e74c3c",
  },

  // Header con nombre y puntos
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 2,
    position: "relative",
  },

  playerName: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.9,
    flex: 1,
    textAlign: "left",
    marginRight: 4,
  },

  playerScore: {
    color: "#f39c12",
    fontSize: 9,
    fontWeight: "600",
    textAlign: "right",
  },

  // Sección del avatar
  avatarSection: {
    marginBottom: 4,
    alignItems: "center",
  },

  opponentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#3498db",
  },

  opponentAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#555",
  },

  // Sección de cartas
  cardsSection: {
    alignItems: "center",
  },

  cardsStack: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    height: 36, // Altura fija para consistencia
  },

  cardWrapper: {
    width: 24,
    height: 36,
    shadowColor: "#000",
    shadowOffset: {
      width: 1,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },

  cardBack: {
    width: 24,
    height: 36,
    borderRadius: 3,
  },

  cardCount: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
    minWidth: 24,
    position: "absolute",
    top: 20,
    right: 0,
  },

  // Estilos especiales para mi jugador
  myPlayerContainer: {
    borderColor: "rgba(36, 68, 233, 0.6)", // Borde verde más visible
    backgroundColor: "rgba(40, 47, 51, 0.75)", // Fondo azul sutil cuando es el turno del jugador
  },

  myPlayerName: {
    color: "#2ecc71", // Verde para mi nombre
  },

  myCardCount: {
    color: "#2ecc71", // Verde para mi contador de cartas
  },

  activePlayerContainer: {
    backgroundColor: "rgba(18, 31, 41, 0.6)", // Fondo azul sutil cuando es el turno del jugador
    borderColor: "rgba(52, 152, 219, 0.4)", // Borde azul más visible
  },
});
