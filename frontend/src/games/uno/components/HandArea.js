import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  PanResponder,
  Animated,
} from "react-native";
import { getUnoCardImage } from "../utils/cardAssets";

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
}) {
  const DRAG_THRESHOLD = 120; // distancia hacia arriba para jugar
  const DOUBLE_TAP_DELAY = 260; // ms máximo entre taps
  const TAP_DEADZONE = 10; // px de movimiento permitido para considerarse tap
  const lastTapRef = useRef({ time: 0, cardId: null });
  const touchStartRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false); // Para saber si se movió fuera de deadzone

  // Maneja el single tap (selección) y double tap (jugar carta)
  const handleTapCard = (card) => {
    if (!isMyTurn) return;
    const now = Date.now();
    const { time: lastTime, cardId: lastId } = lastTapRef.current;
    if (lastId === card.id && now - lastTime < DOUBLE_TAP_DELAY) {
      // Double tap: jugar carta
      lastTapRef.current = { time: 0, cardId: null };
      onPlayCard(card);
      setSelectedCardId(null);
      return;
    }
    // Single tap: seleccionar
    lastTapRef.current = { time: now, cardId: card.id };
    setSelectedCardId(card.id);
  };

  const renderCard = ({ item, index }) => {
    const img = getUnoCardImage(item);
    const selected = selectedCardId === item.id;

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
    const cardScale = selected ? 1.0 : 1.0;
    const cardMarginRight = selected ? -25 : -35; // Menos superposición cuando está seleccionada
    // zIndex incremental evita que se solapen overlays de cartas anteriores creando "bandas"
    const cardZIndex = selected ? 1000 : index + 1;
    const liftTranslate = selected && !isDragging ? -2 : 0; // levantamiento más sutil

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
            onPlayCard(item);
            setSelectedCardId(null);
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
            opacity: isDragging && selected ? 0.3 : 1.0,
            transform: [{ scale: cardScale }, { translateY: liftTranslate }],
          },
        ]}
      >
        {selected && !isDragging && (
          <View style={styles.cardGlowContainer} pointerEvents="none">
            <View style={styles.cardGlow} />
          </View>
        )}
        <Image source={img} style={styles.cardImage} resizeMode="contain" />
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
