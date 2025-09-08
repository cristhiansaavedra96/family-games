import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Modal,
  PanResponder,
  Animated,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSocket } from "../../../shared/hooks";
import { ChatPanel, ChatButton, ChatToasts } from "../../../shared/components";
import { useAvatarSync, useMyAvatar } from "../../../shared/hooks";
import {
  getUnoCardImage,
  getUnoBackImage,
  getUnoDeckStackImages,
} from "../utils/cardAssets";

// Estado inicial básico para UNO (public + private)
const initialPublic = {
  started: false,
  gameEnded: false,
  currentPlayer: null,
  direction: 1,
  topCard: null,
  discardCount: 0,
  drawCount: 0,
  players: [],
  pendingDrawCount: 0,
  pendingDrawType: null,
  winner: null,
  uno: [],
  wild4Challenge: null,
};

export default function UnoGameScreen() {
  const params = useLocalSearchParams();
  const roomId = params.roomId;
  const { socket } = useSocket();
  const { syncPlayers, getAvatarUrl, syncAvatar } = useAvatarSync();
  const { myAvatar, myUsername } = useMyAvatar();

  const [publicState, setPublicState] = useState(initialPublic);
  const [hand, setHand] = useState([]); // cartas privadas
  const [me, setMe] = useState(null);
  const [hostId, setHostId] = useState(null);
  const [wildColorModal, setWildColorModal] = useState(null); // cardId en selección
  const [selectedCardId, setSelectedCardId] = useState(null);
  // Chat state
  const [chatVisible, setChatVisible] = useState(false);
  const [toastMessages, setToastMessages] = useState([]);
  const dragY = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const dragCardId = useRef(null);
  const dragActive = useRef(false);

  const DRAG_THRESHOLD = 120; // distancia hacia arriba para jugar

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !!dragCardId.current,
      onMoveShouldSetPanResponder: () => !!dragCardId.current,
      onPanResponderGrant: () => {
        dragActive.current = true;
      },
      onPanResponderMove: (_, g) => {
        if (!dragActive.current) return;
        if (g.dy < 0) dragY.setValue(g.dy);
        dragX.setValue(g.dx * 0.5);
      },
      onPanResponderRelease: (_, g) => {
        const cid = dragCardId.current;
        dragActive.current = false;
        dragCardId.current = null;
        if (g.dy < -DRAG_THRESHOLD && cid) {
          const card = hand.find((c) => c.id === cid);
          if (card) playCard(card);
        }
        Animated.parallel([
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }),
          Animated.spring(dragX, { toValue: 0, useNativeDriver: true }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        dragActive.current = false;
        dragCardId.current = null;
        Animated.parallel([
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }),
          Animated.spring(dragX, { toValue: 0, useNativeDriver: true }),
        ]).start();
      },
    })
  ).current;

  const isMyTurn =
    publicState.currentPlayer === me ||
    publicState.currentPlayer === socket?.id;

  // Limpiar selección al cambiar de turno si no es mío
  useEffect(() => {
    if (!isMyTurn && selectedCardId) setSelectedCardId(null);
  }, [isMyTurn, selectedCardId]);

  // Suscribirse a eventos
  useEffect(() => {
    if (!socket) return;

    const onState = (s) => {
      setPublicState((prev) => ({ ...prev, ...extractUnoState(s) }));
      if (s.players) {
        // Intentar deducir mi id si no lo tenemos
        if (!me && s.players.some((p) => p.id === socket.id)) {
          setMe(socket.id);
        }
      }
      if (s.hostId) setHostId(s.hostId);
    };
    const onPrivateHand = ({ hand }) => setHand(hand || []);
    const onJoined = ({ id, hostId }) => {
      setMe(id);
      setHostId(hostId);
    };

    socket.on("state", onState);
    socket.on("privateHand", onPrivateHand);
    socket.on("joined", onJoined);
    socket.on("drawCardResult", (res) => {
      console.log("[UNO] drawCardResult", res);
    });

    // Eventos específicos UNO (placeholders para futura UI avanzada)
    socket.on("wild4ChallengeAvailable", () => {});
    socket.on("wild4ChallengeResult", () => {});
    socket.on("unoDeclared", () => {});
    socket.on("unoCalledOut", () => {});
    socket.on("playerAtUno", () => {});
    socket.on("unoStateCleared", () => {});

    // Pedir estado inicial y mano privada
    socket.emit("getState", { roomId });
    socket.emit("requestPrivateHand", { roomId });

    // Chat listeners
    const onChatMessage = (messageData) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const withId = { ...messageData, id };
      setToastMessages((prev) => [...prev, withId].slice(-4));
    };
    const onPlayerDisconnected = (payload) => {
      if (!payload) return;
      const id = `disc-${payload.playerId}-${Date.now()}`;
      let reasonText = "se desconectó";
      if (payload.reason === "left") reasonText = "salió de la sala";
      else if (payload.reason === "kick") reasonText = "fue expulsado";
      else if (payload.reason === "timeout") reasonText = "perdió la conexión";
      const toast = {
        id,
        type: "system-disconnect",
        content: reasonText,
        player: payload.username
          ? {
              id: payload.playerId,
              name: payload.name,
              username: payload.username,
              avatarId: payload.avatarId,
            }
          : null,
        meta: { reason: payload.reason },
        timestamp: payload.timestamp || Date.now(),
      };
      setToastMessages((prev) => [...prev, toast].slice(-4));
    };
    socket.on("chatMessage", onChatMessage);
    socket.on("playerDisconnected", onPlayerDisconnected);

    return () => {
      socket.off("state", onState);
      socket.off("privateHand", onPrivateHand);
      socket.off("joined", onJoined);
      socket.off("drawCardResult");
      socket.off("wild4ChallengeAvailable");
      socket.off("wild4ChallengeResult");
      socket.off("unoDeclared");
      socket.off("unoCalledOut");
      socket.off("playerAtUno");
      socket.off("unoStateCleared");
      socket.off("chatMessage");
      socket.off("playerDisconnected");
    };
  }, [socket, roomId, me]);

  useEffect(() => {
    if (!socket) return;
    const playersForSync = (publicState.players || []).filter(
      (p) => p.username && p.avatarId
    );
    if (playersForSync.length) syncPlayers(playersForSync);
  }, [publicState.players, syncPlayers, socket]);

  const extractUnoState = (s) => ({
    started: s.started,
    gameEnded: s.gameEnded,
    currentPlayer: s.currentPlayer,
    direction: s.direction,
    topCard: s.topCard,
    discardCount: s.discardCount,
    drawCount: s.drawCount,
    players: s.players || [],
    pendingDrawCount: s.pendingDrawCount,
    pendingDrawType: s.pendingDrawType,
    winner: s.winner,
    uno: s.uno || [],
    wild4Challenge: s.wild4Challenge || null,
  });

  // Acciones básicas
  const handleDraw = () => {
    if (!isMyTurn) return;
    console.log("[UNO] emit drawCard", { roomId, isMyTurn });
    let responded = false;
    const handler = (res) => {
      responded = true;
      console.log("[UNO] drawCardResult (timed)", res);
      socket.off("drawCardResult", handler);
    };
    socket.on("drawCardResult", handler);
    setTimeout(() => {
      if (!responded) {
        console.warn("[UNO] drawCardResult timeout (2s)");
        socket.off("drawCardResult", handler);
      }
    }, 2000);
    socket.emit("drawCard", { roomId });
  };

  const handleDeclareUno = () => {
    socket.emit("declareUno", { roomId });
  };

  const handleCallOut = (targetId) => {
    socket.emit("callOutUno", { roomId, targetPlayerId: targetId });
  };

  const handleChallenge = () => {
    if (
      publicState.wild4Challenge &&
      publicState.wild4Challenge.targetPlayer === me
    ) {
      socket.emit("challengeWild4", { roomId });
    }
  };

  const handleAcceptWild4 = () => {
    if (
      publicState.wild4Challenge &&
      publicState.wild4Challenge.targetPlayer === me
    ) {
      socket.emit("acceptWild4", { roomId });
    }
  };

  // Jugar carta (por ahora sin selector de color para wild -> se enviará null)
  const playCard = (card) => {
    if (!isMyTurn) return;
    if (card.kind === "wild" || card.kind === "wild_draw4") {
      setWildColorModal(card.id);
      return;
    }
    socket.emit("playCard", { roomId, cardId: card.id, chosenColor: null });
  };

  const confirmWildColor = (color) => {
    if (!wildColorModal) return;
    socket.emit("playCard", {
      roomId,
      cardId: wildColorModal,
      chosenColor: color,
    });
    setWildColorModal(null);
  };

  const cancelWild = () => setWildColorModal(null);

  const onSelectCard = (card) => {
    if (!isMyTurn) return; // no seleccionar si no es mi turno
    setSelectedCardId((prev) => {
      if (prev === card.id) {
        // Segundo tap: intentar jugar
        playCard(card);
        return null;
      }
      dragCardId.current = card.id; // preparar drag sólo al seleccionar
      return card.id;
    });
  };

  const renderCard = ({ item }) => {
    const img = getUnoCardImage(item);
    const selected = selectedCardId === item.id;
    // La carta seleccionada se pinta en overlay global
    if (selected)
      return <View style={{ width: 90, height: 140, marginRight: -50 }} />;
    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={isMyTurn ? () => onSelectCard(item) : undefined}
        onLongPress={isMyTurn ? () => onSelectCard(item) : undefined}
        delayLongPress={120}
        disabled={!isMyTurn}
      >
        <Image source={img} style={styles.cardImage} resizeMode="contain" />
      </TouchableOpacity>
    );
  };

  const otherPlayers = publicState.players.filter((p) => p.id !== me);
  const unoPlayers = publicState.uno || [];
  // Distribución 4 lados: top -> right -> bottom -> left (en orden de la lista)
  const perSide = Math.ceil(otherPlayers.length / 4) || 0;
  const topPlayers = otherPlayers.slice(0, perSide);
  const rightPlayers = otherPlayers.slice(perSide, perSide * 2);
  const bottomPlayers = otherPlayers.slice(perSide * 2, perSide * 3);
  const leftPlayers = otherPlayers.slice(perSide * 3);
  const shrinkOpponents = otherPlayers.length > 8;

  // Display name propio (asegurar disponible antes del render)
  const myPlayerMeta = publicState.players.find((p) => p.id === me);
  const myDisplayName =
    myPlayerMeta?.name || myPlayerMeta?.username || myUsername || "?";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <LinearGradient
        colors={["#0f1f29", "#0b141a", "#05090c"]}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>UNO</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.tableArea}>
        <View style={styles.opponentsRow}>
          {topPlayers.map((p) => (
            <Opponent
              key={p.id}
              player={p}
              unoPlayers={unoPlayers}
              shrink={shrinkOpponents}
            />
          ))}
        </View>
        <View style={styles.middleRow}>
          <View style={styles.sideColumn}>
            {leftPlayers.map((p) => (
              <Opponent
                key={p.id}
                player={p}
                unoPlayers={unoPlayers}
                shrink={shrinkOpponents}
              />
            ))}
          </View>
          <View style={styles.centerWrapper}>
            <View style={styles.centerZoneCircle}>
              <View style={styles.turnHeaderCircle}>
                <Text style={styles.turnHeaderText} numberOfLines={1}>
                  {publicState.gameEnded
                    ? publicState.winner === me
                      ? "Ganaste"
                      : "Ganó otro jugador"
                    : isMyTurn
                    ? "Tu turno"
                    : publicState.currentPlayer
                    ? (() => {
                        const cp = publicState.players.find(
                          (p) => p.id === publicState.currentPlayer
                        );
                        const name =
                          cp?.name ||
                          cp?.username ||
                          shortId(publicState.currentPlayer);
                        return `Turno de ${name}`;
                      })()
                    : "Esperando"}
                </Text>
                {publicState.pendingDrawCount > 0 && (
                  <Text
                    style={styles.turnHeaderStack}
                  >{`+${publicState.pendingDrawCount}`}</Text>
                )}
              </View>
              
              <View style={styles.gameElementsContainer}>
                <View style={styles.deckDiscardRow}>
                  <View style={styles.deckZone}>
                    <View style={styles.deckStackWrapper}>
                      {getUnoDeckStackImages(3).map((img, i) => (
                        <Image
                          key={i}
                          source={img}
                          style={[
                            styles.deckImage,
                            { position: "absolute", top: i * 1.3, left: i * 1.3 },
                          ]}
                        />
                      ))}
                      <Image
                        source={getUnoBackImage()}
                        style={[styles.deckImage, { opacity: 0 }]}
                      />
                    </View>
                    <Text style={styles.deckCountText}>
                      {publicState.drawCount}
                    </Text>
                  </View>
                  
                  <View style={styles.discardZone}>
                    {publicState.topCard ? (
                      <Image
                        source={getUnoCardImage(publicState.topCard)}
                        style={styles.discardImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.placeholderCard} />
                    )}
                  </View>
                </View>
                
                <View style={styles.statusZone}>
                  <Countdowns publicState={publicState} me={me} />
                </View>
              </View>
            </View>
          </View>
          <View style={styles.sideColumn}>
            {rightPlayers.map((p) => (
              <Opponent
                key={p.id}
                player={p}
                unoPlayers={unoPlayers}
                shrink={shrinkOpponents}
              />
            ))}
          </View>
        </View>
        <View style={styles.opponentsRow}>
          {bottomPlayers.map((p) => (
            <Opponent
              key={p.id}
              player={p}
              unoPlayers={unoPlayers}
              shrink={shrinkOpponents}
            />
          ))}
        </View>
      </View>

      <View style={styles.handArea}>
        <View style={styles.meOverlayAvatarCentered}>
          {myDisplayName &&
            (myAvatar ? (
              <Image source={{ uri: myAvatar }} style={styles.meAvatar} />
            ) : (
              <View style={styles.meAvatarPlaceholder}>
                <Text style={styles.meAvatarLetter}>
                  {(myDisplayName || "?")[0].toUpperCase()}
                </Text>
              </View>
            ))}
          {myDisplayName && (
            <Text style={styles.meAvatarNameSmall} numberOfLines={1}>
              {myDisplayName}
            </Text>
          )}
        </View>
        <FlatList
          data={hand}
          horizontal
          keyExtractor={(c) => c.id}
          renderItem={renderCard}
          contentContainerStyle={styles.handListContentFull}
        />
        {hand.length === 0 && (
          <View style={styles.emptyHandOverlay}>
            <Text style={styles.emptyHandText}>Sin cartas recibidas</Text>
            <TouchableOpacity
              style={styles.reloadBtn}
              onPress={() => socket.emit("requestPrivateHand", { roomId })}
            >
              <Text style={styles.reloadBtnText}>Recargar mano</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ActionBar
        isMyTurn={isMyTurn}
        hand={hand}
        publicState={publicState}
        me={me}
        otherPlayers={otherPlayers}
        onDraw={handleDraw}
        onDeclareUno={handleDeclareUno}
        onCallOut={handleCallOut}
        onChallenge={handleChallenge}
        onAcceptWild4={handleAcceptWild4}
      />
      {/* Chat floating button */}
      <ChatButton onPress={() => setChatVisible(true)} />
      <Modal visible={!!wildColorModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.colorWheelWrapper}>
            {[
              { k: "red", c: "#ec321dff" },
              { k: "yellow", c: "#f1c40f" },
              { k: "green", c: "#289455ff" },
              { k: "blue", c: "#2893dbff" },
            ].map((col, idx) => {
              const positions = [
                { top: 22, left: "50%", transform: [{ translateX: -40 }] },
                { top: "50%", right: 22, transform: [{ translateY: -40 }] },
                { bottom: 22, left: "50%", transform: [{ translateX: -40 }] },
                { top: "50%", left: 22, transform: [{ translateY: -40 }] },
              ];
              return (
                <TouchableOpacity
                  key={col.k}
                  style={[
                    styles.colorDot,
                    { backgroundColor: col.c },
                    positions[idx],
                  ]}
                  onPress={() => confirmWildColor(col.k)}
                  activeOpacity={0.85}
                />
              );
            })}
            <TouchableOpacity
              style={styles.closeColorPicker}
              onPress={cancelWild}
            >
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {selectedCardId && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.dragOverlayCard,
            {
              transform: [
                { translateY: dragY },
                { translateX: dragX },
                { scale: 0.9 }, // carta seleccionada más chica
              ],
            },
          ]}
          pointerEvents="auto"
        >
          {(() => {
            const card = hand.find((c) => c.id === selectedCardId);
            if (!card) return null;
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  // Tap en la carta grande juega la carta
                  playCard(card);
                  setSelectedCardId(null);
                }}
              >
                <Image
                  source={getUnoCardImage(card)}
                  style={styles.dragImageSmall}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            );
          })()}
        </Animated.View>
      )}
      {/* Chat Toasts */}
      <ChatToasts
        messages={toastMessages}
        onItemComplete={(id) =>
          setToastMessages((prev) => prev.filter((m) => m.id !== id))
        }
      />
      {/* Chat Panel */}
      <ChatPanel
        isVisible={chatVisible}
        onClose={() => setChatVisible(false)}
        onSendMessage={async (messageData) => {
          // Construir payload similar a waiting/bingo
          const mePlayer = publicState.players.find((p) => p.id === me);
          if (!mePlayer) return;
          const fullMessage = {
            ...messageData,
            player: {
              id: mePlayer.id,
              name: mePlayer.name,
              username: mePlayer.username,
              avatarId: mePlayer.avatarId,
            },
            timestamp: Date.now(),
          };
          socket.emit("sendChatMessage", { roomId, message: fullMessage });
          setChatVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

function shortId(id) {
  return id ? id.slice(0, 4) : "";
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  backBtn: { padding: 8 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  topArea: { alignItems: "center", paddingVertical: 12 },
  topInfo: { color: "#fff", opacity: 0.7, marginBottom: 4 },
  topCard: {
    width: 60,
    height: 90,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  turnInfo: { color: "#fff", fontSize: 16, marginTop: 4 },
  pendingDraw: { color: "#f1c40f", fontWeight: "600", marginTop: 4 },
  otherPlayers: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 8,
  },
  otherPlayerBox: {
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
    minWidth: 60,
  },
  otherPlayerText: { color: "#fff", fontSize: 12 },
  otherPlayerCount: { color: "#fff", fontSize: 18, fontWeight: "700" },
  unoBadge: { color: "#e74c3c", fontWeight: "800", fontSize: 12, marginTop: 4 },
  handArea: {
    height: 140,
    backgroundColor: "#181818",
    borderTopWidth: 1,
    borderTopColor: "#222",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    justifyContent: "center",
  },
  cardWrapper: {
    width: 72,
    height: 112,
    marginRight: -40, // superposición ligera
    alignItems: "center",
    justifyContent: "center",
  },
  cardWrapperSelected: {},
  cardImage: {
    width: 72,
    height: 112,
  },
  cardImageSelected: { width: 90, height: 140 },
  cardTextSmall: { color: "#fff", fontWeight: "700", fontSize: 16 },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    backgroundColor: "#111",
  },
  actionBtn: {
    backgroundColor: "#34495e",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionText: { color: "#fff", fontWeight: "600" },
  tableArea: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 4,
    // Nuevo layout centrado
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  centerZone: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: 2,
    paddingHorizontal: 18,
    backgroundColor: "#0d3b24",
    borderRadius: 140,
    paddingTop: 10,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: "#145c36",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 7,
    alignSelf: "center",
    minWidth: "62%",
  },
  centerZoneCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#0d3b24",
    borderWidth: 2,
    borderColor: "#145c36",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 9,
  },
  gameElementsContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  deckDiscardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginBottom: 12,
  },
  deckZone: {
    alignItems: "center",
    justifyContent: "center",
  },
  deckStackWrapper: {
    width: 48,
    height: 76,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  deckImage: { width: 48, height: 76, borderRadius: 8 },
  deckCountText: {
    color: "#f1c40f",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
    textShadowColor: "#000",
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },
  discardZone: {
    alignItems: "center",
    justifyContent: "center",
  },
  discardImage: { width: 60, height: 96 },
  placeholderCard: {
    width: 60,
    height: 96,
    backgroundColor: "#333",
    borderRadius: 10,
  },
  statusZone: { 
    alignItems: "center", 
    justifyContent: "center", 
    minHeight: 20,
  },
  turnHeaderCircle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  turnHeaderText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    maxWidth: 200,
    textAlign: "center",
  },
  turnHeaderStack: {
    color: "#f39c12",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
  centerWrapper: { flex: 1, alignItems: "center" },
  middleRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  sideColumn: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  opponentsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 4,
    gap: 8,
    paddingHorizontal: 8,
  },
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 4,
    gap: 8,
    paddingHorizontal: 8,
  },
  opponentBox: { alignItems: "center", minWidth: 70, maxWidth: 80 },
  opponentId: { color: "#fff", fontSize: 12, opacity: 0.8 },
  opponentHandRow: { flexDirection: "row", marginTop: 2 },
  backSmallWrapper: { width: 26, height: 40, marginRight: -16 },
  backSmall: { width: 26, height: 40 },
  opponentCount: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginTop: 4,
  },
  unoBadge: { color: "#e74c3c", fontWeight: "800", fontSize: 12, marginTop: 2 },
  handListContent: { paddingHorizontal: 60, alignItems: "center" },
  handListContentFull: {
    paddingLeft: 40,
    paddingRight: 40,
    alignItems: "center",
  },
  actionBarContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  disabledBtn: { opacity: 0.35 },
  dangerBtn: { backgroundColor: "#c0392b" },
  successBtn: { backgroundColor: "#16a085" },
  warnBtn: { backgroundColor: "#f39c12" },
  emptyHandOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  emptyHandText: { color: "#fff", marginBottom: 8 },
  reloadBtn: {
    backgroundColor: "#444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reloadBtnText: { color: "#fff", fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  colorWheelWrapper: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(30,30,30,0.9)",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#444",
  },
  colorDot: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    borderWidth: 3,
    borderColor: "#111",
  },
  closeColorPicker: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dragOverlayCard: {
    position: "absolute",
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
    elevation: 999,
    pointerEvents: "none",
  },
  dragImage: { width: 120, height: 186 },
  dragImageSmall: { width: 100, height: 156 },
  meRow: { flex: 1, flexDirection: "row", alignItems: "center" },
  meOverlayAvatar: {
    /* deprecated */
  },
  meOverlayAvatarCentered: {
    position: "absolute",
    top: 2,
    left: "50%",
    transform: [{ translateX: -27 }],
    width: 54,
    alignItems: "center",
    zIndex: 10,
  },
  meAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#2ecc71",
  },
  meAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#555",
  },
  meAvatarLetter: { color: "#fff", fontWeight: "700", fontSize: 20 },
  meAvatarNameSmall: {
    color: "#fff",
    fontSize: 10,
    marginTop: 2,
    maxWidth: 54,
    textAlign: "center",
  },
  opponentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#3498db",
    marginBottom: 4,
  },
  opponentAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderWidth: 2,
    borderColor: "#444",
  },
  opponentAvatarLetter: { color: "#fff", fontWeight: "700" },
});

function Opponent({ player, unoPlayers, shrink }) {
  const unoFlag = unoPlayers.find((u) => u.playerId === player.id);
  const back = getUnoBackImage();
  const stacks = Math.min(player.handCount, 6);
  const arr = Array.from({ length: stacks });
  const displayName = player.name || player.username || "?";
  const avatarUrl = player.avatarUrl;
  return (
    <View
      style={[styles.opponentBox, shrink && { transform: [{ scale: 0.8 }] }]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.opponentAvatar, shrink && { width: 34, height: 34 }]}
        />
      ) : (
        <View
          style={[
            styles.opponentAvatarPlaceholder,
            shrink && { width: 34, height: 34, borderRadius: 17 },
          ]}
        >
          <Text style={styles.opponentAvatarLetter}>
            {displayName[0].toUpperCase()}
          </Text>
        </View>
      )}
      <View style={[styles.opponentHandRow, { justifyContent: "center" }]}>
        {arr.map((_, i) => (
          <View
            key={i}
            style={[
              styles.backSmallWrapper,
              shrink && { width: 22, height: 34, marginRight: -14 },
            ]}
          >
            <Image
              source={back}
              style={[styles.backSmall, shrink && { width: 22, height: 34 }]}
            />
          </View>
        ))}
      </View>
      <Text style={[styles.opponentId, { marginTop: 2 }]} numberOfLines={1}>
        {displayName}
      </Text>
      <Text style={styles.opponentCount}>{player.handCount}</Text>
      {unoFlag && (
        <Text style={styles.unoBadge}>
          UNO{unoFlag.graceRemainingMs > 0 ? "*" : ""}
        </Text>
      )}
    </View>
  );
}

function ActionBar({
  isMyTurn,
  hand,
  publicState,
  me,
  otherPlayers,
  onDraw,
  onDeclareUno,
  onCallOut,
  onChallenge,
  onAcceptWild4, // ya no se usará para botón directo 'Aceptar', se mantiene por compatibilidad
}) {
  const unoData = publicState.uno || [];
  const myHandSize = hand.length;
  const pending = publicState.pendingDrawCount;
  const pendingType = publicState.pendingDrawType;
  const challenge = publicState.wild4Challenge;

  const canDeclareUno =
    isMyTurn && myHandSize === 2 && !unoData.find((u) => u.playerId === me);
  const canCallOut = otherPlayers.some((p) => {
    const flag = unoData.find((u) => u.playerId === p.id);
    return flag && !flag.declared && flag.graceRemainingMs === 0;
  });

  // Challenge activo para mí (soy target del +4 y aún dentro de ventana)
  const challengeActive = challenge && challenge.targetPlayer === me;

  // Caso especial: si challengeActive => reemplazamos Robar por botones Desafiar / Tomar +N
  // 'Tomar +N' ejecuta onDraw (paga las cartas acumuladas) y avanza turno.
  // Mientras dure el challenge no mostramos declarar UNO ni acusar.
  if (challengeActive) {
    const drawLabel = pending > 0 ? `Tomar +${pending}` : "Tomar +4";
    return (
      <View style={styles.actionBarContainer}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.dangerBtn]}
          onPress={onChallenge}
        >
          <Text style={styles.actionText}>Desafiar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#8e44ad" }]}
          onPress={onDraw}
        >
          <Text style={styles.actionText}>{drawLabel}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Botón Robar visible en mi turno (si hay acumulación draw2/draw4 stacking y soy el jugador actual)
  const showDraw = isMyTurn;
  const drawLabel = pending > 0 ? `Tomar +${pending}` : "Robar";

  return (
    <View style={styles.actionBarContainer}>
      {showDraw && (
        <TouchableOpacity
          style={[
            styles.actionBtn,
            pending > 0 && { backgroundColor: "#8e44ad" },
          ]}
          onPress={onDraw}
        >
          <Text style={styles.actionText}>{drawLabel}</Text>
        </TouchableOpacity>
      )}
      {canDeclareUno && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.warnBtn]}
          onPress={onDeclareUno}
        >
          <Text style={styles.actionText}>Decir UNO</Text>
        </TouchableOpacity>
      )}
      {canCallOut && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.dangerBtn]}
          onPress={() => {
            const target = otherPlayers.find((p) => {
              const f = unoData.find((u) => u.playerId === p.id);
              return f && !f.declared && f.graceRemainingMs === 0;
            });
            if (target) onCallOut(target.id);
          }}
        >
          <Text style={styles.actionText}>Acusar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Countdowns({ publicState, me }) {
  const [_, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 300);
    return () => clearInterval(id);
  }, []);
  const unoData = publicState.uno || [];
  const challenge = publicState.wild4Challenge; // ya no se mostrará en el centro
  const myUno = unoData.find(
    (u) => u.playerId === me && u.graceRemainingMs > 0
  );
  return (
    <View style={{ marginTop: 4, alignItems: "center" }}>
      {myUno && (
        <Text style={{ color: "#f1c40f", fontSize: 12 }}>
          Decí UNO {Math.ceil(myUno.graceRemainingMs / 1000)}s
        </Text>
      )}
      {/* Texto de challenge removido del centro (punto 3) */}
    </View>
  );
}
