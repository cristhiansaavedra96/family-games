import React, { useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  PanResponder,
  Animated,
  Vibration,
} from "react-native";
import { getUnoCardImage } from "../utils/cardAssets";
import AnimatedCard from "./AnimatedCard";

export default function HandArea({
  hand,
  isMyTurn,
  selectedCardId,
  isDragging,
  styles,
  dragY,
  dragX,
  dragCardId,
  dragActive,
  onPlayCard,
  setSelectedCardId,
  setIsDragging,
  socket,
  roomId,
  me,
  publicState,
  wildColorModal, // Nuevo prop para detectar cancelaciones
}) {
  const DRAG_THRESHOLD = 120; // distancia hacia arriba para jugar
  const DOUBLE_TAP_DELAY = 260; // ms máximo entre taps
  const TAP_DEADZONE = 10; // px de movimiento permitido para considerarse tap
  const lastTapRef = useRef({ time: 0, cardId: null });
  const touchStartRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false); // Para saber si se movió fuera de deadzone
  const cardRefs = useRef({}); // Referencias a las cartas animadas
  const playingCardId = useRef(null); // ID de la carta que se está jugando

  // Callback para cuando se completa la animación de jugar carta
  const onCardPlayAnimationComplete = useCallback(() => {
    playingCardId.current = null;
  }, []);

  // Detectar cuando se agregan cartas nuevas para animarlas
  const prevHandLength = useRef(hand.length);
  const gameStarted = useRef(false);

  useEffect(() => {
    // Marcar el juego como iniciado después del primer render con cartas
    if (hand.length > 0 && !gameStarted.current) {
      gameStarted.current = true;
      prevHandLength.current = hand.length;
      return; // No animar las cartas iniciales
    }

    if (hand.length > prevHandLength.current && gameStarted.current) {
      // Se agregaron cartas nuevas después del inicio, animar entrada
      const newCards = hand.length - prevHandLength.current;
      for (let i = 0; i < newCards; i++) {
        const cardIndex = prevHandLength.current + i;
        const card = hand[cardIndex];
        if (card && cardRefs.current[card.id]) {
          // Delay incremental para cada carta nueva
          setTimeout(() => {
            cardRefs.current[card.id]?.enterFromDeck(i);
          }, i * 100);
        }
      }
    }
    prevHandLength.current = hand.length;
  }, [hand.length]);

  // Detectar cuando se cancela el modal de color para limpiar playingCardId
  const prevWildColorModal = useRef(wildColorModal);
  useEffect(() => {
    // Si teníamos modal abierto y ahora está cerrado (cancelado)
    if (prevWildColorModal.current && !wildColorModal) {
      // Limpiar el playingCardId para restaurar la visibilidad de la carta
      playingCardId.current = null;
    }
    prevWildColorModal.current = wildColorModal;
  }, [wildColorModal]);

  // Detectar cuando se confirma una carta wild (cuando cambia el topCard después de tener modal abierto)
  const prevTopCard = useRef(publicState?.topCard);
  useEffect(() => {
    // Si había un modal abierto y cambió la carta superior, significa que se confirmó la wild
    if (
      prevWildColorModal.current &&
      publicState?.topCard !== prevTopCard.current
    ) {
      // Marcar la carta como playing para la animación final
      if (
        prevWildColorModal.current &&
        cardRefs.current[prevWildColorModal.current]
      ) {
        playingCardId.current = prevWildColorModal.current;
        cardRefs.current[prevWildColorModal.current].playCard();
      }
    }
    prevTopCard.current = publicState?.topCard;
  }, [publicState?.topCard]);

  // Maneja el single tap (selección) y double tap (jugar carta)
  const handleTapCard = (card) => {
    if (!isMyTurn) {
      // Si no es mi turno, mostrar bounce effect
      if (cardRefs.current[card.id]) {
        cardRefs.current[card.id].bounce();
      }
      return;
    }

    const now = Date.now();
    const { time: lastTime, cardId: lastId } = lastTapRef.current;
    if (lastId === card.id && now - lastTime < DOUBLE_TAP_DELAY) {
      // Double tap: jugar carta
      lastTapRef.current = { time: 0, cardId: null };
      handlePlayCard(card);
      return;
    }
    // Single tap: seleccionar
    lastTapRef.current = { time: now, cardId: card.id };
    setSelectedCardId(card.id);
  };

  // Nueva función para manejar jugar carta con animaciones
  const handlePlayCard = (card) => {
    if (!isMyTurn) return;

    // Verificar si la carta es jugable antes de animar
    const isPlayable = (() => {
      const state = publicState;
      if (!state || !state.topCard) return false;

      // Stacking activo
      if (state.pendingDrawCount > 0) {
        if (state.pendingDrawType === "draw2" && card.kind === "draw2")
          return true;
        if (
          state.pendingDrawType === "wild_draw4" &&
          card.kind === "wild_draw4"
        )
          return true;
        return false;
      }

      // Wilds siempre jugables
      if (card.kind === "wild" || card.kind === "wild_draw4") return true;

      // Coincidir por color (usar currentColor si existe, sino el color de topCard)
      const activeColor = state.currentColor || state.topCard.color;
      if (card.color && card.color === activeColor) return true;

      // Coincidir por tipo/valor con la carta superior
      const topCard = state.topCard;

      // Si ambas son cartas numéricas, comparar valor
      if (card.kind === "number" && topCard.kind === "number") {
        return card.value === topCard.value;
      }

      // Si ambas son del mismo tipo especial (skip, reverse, draw2)
      if (card.kind !== "number" && card.kind === topCard.kind) {
        return true;
      }

      return false;
    })();

    if (!isPlayable) {
      // Carta no jugable, mostrar efecto bounce
      if (cardRefs.current[card.id]) {
        cardRefs.current[card.id].bounce();
      }
      return;
    }

    // 🎮 Vibración inmediata cuando se juega cualquier carta
    try {
      if (card.kind === "wild" || card.kind === "wild_draw4") {
        // Patrón especial para cartas wild
        Vibration.vibrate([0, 100, 50, 100]);
      } else if (
        card.kind === "draw2" ||
        card.kind === "skip" ||
        card.kind === "reverse"
      ) {
        // Vibración media para cartas especiales
        Vibration.vibrate(150);
      } else {
        // Vibración corta para cartas normales
        Vibration.vibrate(100);
      }
    } catch (error) {
      // Ignorar errores de vibración en simuladores
    }

    // Solo marcar como "playing" si no es una carta wild (que requiere selección de color)
    const isWildCard = card.kind === "wild" || card.kind === "wild_draw4";
    if (!isWildCard) {
      playingCardId.current = card.id;
    }

    // Iniciar animación de jugar carta solo para cartas no-wild
    if (!isWildCard && cardRefs.current[card.id]) {
      cardRefs.current[card.id].playCard();
    }

    // Llamar a la función original de jugar carta
    onPlayCard(card);
    setSelectedCardId(null);
  };

  const renderCard = ({ item, index }) => {
    const img = getUnoCardImage(item);
    const selected = selectedCardId === item.id;
    const isCurrentlyPlaying = playingCardId.current === item.id;
    const isWaitingForColorSelection = wildColorModal === item.id; // Carta esperando selección de color

    // Determinar si la carta es jugable (reglas espejo del backend)
    const isPlayable = (() => {
      // Solo interesa si es mi turno; si no, marcamos no jugable para el efecto visual pero sin interacción
      if (!isMyTurn) return false;
      const state = publicState;
      if (!state || !state.topCard) return false;

      // Stacking activo
      if (state.pendingDrawCount > 0) {
        if (state.pendingDrawType === "draw2" && item.kind === "draw2")
          return true;
        if (
          state.pendingDrawType === "wild_draw4" &&
          item.kind === "wild_draw4"
        )
          return true;
        return false;
      }

      // Wilds siempre jugables
      if (item.kind === "wild" || item.kind === "wild_draw4") return true;

      // Coincidir por color (usar currentColor si existe, sino el color de topCard)
      const activeColor = state.currentColor || state.topCard.color;
      if (item.color && item.color === activeColor) return true;

      // Coincidir por tipo/valor con la carta superior
      const topCard = state.topCard;

      // Si ambas son cartas numéricas, comparar valor
      if (item.kind === "number" && topCard.kind === "number") {
        return item.value === topCard.value;
      }

      // Si ambas son del mismo tipo especial (skip, reverse, draw2)
      if (item.kind !== "number" && item.kind === topCard.kind) {
        return true;
      }

      return false;
    })();

    // Efecto visual de selección mejorado (sin borde): levantar + glow
    const cardMarginRight = selected ? -25 : -35; // Menos superposición cuando está seleccionada
    // zIndex incremental evita que se solapen overlays de cartas anteriores creando "bandas"
    const cardZIndex = selected ? 1000 : index + 1;

    // PanResponder individual para cada carta para drag directo
    const cardPanResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => isMyTurn && isPlayable,
      onMoveShouldSetPanResponder: (_, g) => {
        if (!isMyTurn || !isPlayable) return false;
        // Si ya estamos activos arrastrando, continuar
        if (dragActive.current) return true;
        // Detectar si se excedió deadzone para iniciar drag
        const moved =
          Math.abs(g.dx) > TAP_DEADZONE || Math.abs(g.dy) > TAP_DEADZONE;
        return moved; // Solo si se movió iniciamos pan responder para drag
      },
      onPanResponderGrant: (e) => {
        if (!isMyTurn || !isPlayable) return;
        const { pageX, pageY } = e.nativeEvent;
        touchStartRef.current = { x: pageX, y: pageY };
        movedRef.current = false;
        // No activamos drag aún; esperamos a superar deadzone en move
      },
      onPanResponderMove: (_, g) => {
        if (!isMyTurn || !isPlayable) return;
        const moved =
          Math.abs(g.dx) > TAP_DEADZONE || Math.abs(g.dy) > TAP_DEADZONE;
        if (moved) movedRef.current = true;
        if (moved && !dragActive.current) {
          // Activar drag ahora
          setSelectedCardId(item.id);
          dragCardId.current = item.id;
          dragActive.current = true;
          setIsDragging(true);
        }
        if (dragActive.current) {
          if (g.dy < 0) dragY.setValue(g.dy);
          dragX.setValue(g.dx * 0.5);
        }
      },
      onPanResponderRelease: (e, g) => {
        if (!isMyTurn || !isPlayable) return;
        const wasDragging = dragActive.current;
        dragActive.current = false;
        dragCardId.current = null;
        setIsDragging(false);

        if (wasDragging) {
          // Caso drag
          if (g.dy < -DRAG_THRESHOLD) {
            handlePlayCard(item);
          } else {
            // Volver a posición original; mantener selección un instante
            setTimeout(() => {
              setSelectedCardId(null);
            }, 120);
          }
          Animated.parallel([
            Animated.spring(dragY, { toValue: 0, useNativeDriver: true }),
            Animated.spring(dragX, { toValue: 0, useNativeDriver: true }),
          ]).start();
          return;
        }

        // Si no hubo drag (deadzone), esto es un tap
        handleTapCard(item);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        dragActive.current = false;
        dragCardId.current = null;
        setIsDragging(false);
        Animated.parallel([
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }),
          Animated.spring(dragX, { toValue: 0, useNativeDriver: true }),
        ]).start();
      },
    });

    return (
      <Animated.View
        {...cardPanResponder.panHandlers}
        style={[
          styles.cardWrapper,
          {
            marginRight: cardMarginRight,
            zIndex: cardZIndex,
            elevation: selected ? 50 : 0,
            // Solo bajar opacidad temporal al arrastrar la carta seleccionada
            // Las cartas esperando selección de color mantienen opacidad completa
            opacity:
              isDragging && selected
                ? 0.3
                : isCurrentlyPlaying && !isWaitingForColorSelection
                ? 0.7
                : 1.0,
          },
        ]}
      >
        <AnimatedCard
          ref={(ref) => {
            if (ref) {
              cardRefs.current[item.id] = ref;
            } else {
              delete cardRefs.current[item.id];
            }
          }}
          card={item}
          isSelected={selected}
          showGlow={selected && !isDragging}
          style={styles.cardImage}
          onAnimationComplete={onCardPlayAnimationComplete}
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.handArea}>
      <View style={styles.handContainer}>
        <FlatList
          data={hand}
          horizontal
          keyExtractor={(c) => c.id}
          renderItem={({ item, index }) => renderCard({ item, index })}
          contentContainerStyle={styles.handListContentFull}
          showsHorizontalScrollIndicator={false}
          style={styles.handListContainer}
          extraData={`${hand.length}-${selectedCardId}-${isDragging}`} // Forzar re-render cuando cambien estos estados
          removeClippedSubviews={false} // Evitar que se clipeen las cartas
          initialNumToRender={10} // Renderizar más cartas inicialmente
          maxToRenderPerBatch={5} // Renderizar en lotes más pequeños
          updateCellsBatchingPeriod={50} // Actualizar más frecuentemente
          windowSize={10} // Mantener más items en memoria
        />
      </View>
      {hand.length === 0 && publicState.started && (
        <View style={styles.emptyHandOverlay}>
          <Text style={styles.emptyHandText}>Sin cartas recibidas</Text>
          <Text style={styles.emptyHandSubtext}>
            Jugador: {me || "No definido"} | Juego iniciado:{" "}
            {publicState.started ? "Sí" : "No"}
          </Text>
          <TouchableOpacity
            style={styles.reloadBtn}
            onPress={() => {
              console.log("[UNO][Frontend] Manual request for private hand");
              socket.emit("requestPrivateHand", { roomId });
            }}
          >
            <Text style={styles.reloadBtnText}>Recargar mano</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.reloadBtn,
              { backgroundColor: "#555", marginTop: 8 },
            ]}
            onPress={() => {
              console.log("[UNO][Frontend] Manual request for state");
              socket.emit("getState", { roomId });
            }}
          >
            <Text style={styles.reloadBtnText}>Recargar estado</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Overlay oscuro cuando no es mi turno */}
      {!isMyTurn && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            zIndex: 10,
          }}
          pointerEvents="none"
        />
      )}

      {/* Overlay de drag global para mostrar la carta fuera del contenedor */}
      {isDragging && selectedCardId && (
        <Animated.View
          style={[
            styles.dragOverlayCard,
            {
              transform: [
                { translateY: dragY },
                { translateX: dragX },
                { scale: 1.0 },
              ],
            },
          ]}
          pointerEvents="none"
        >
          {(() => {
            const card = hand.find((c) => c.id === selectedCardId);
            if (!card) return null;
            return (
              <Image
                source={getUnoCardImage(card)}
                style={styles.dragImageSmall}
                resizeMode="contain"
              />
            );
          })()}
        </Animated.View>
      )}
    </View>
  );
}
