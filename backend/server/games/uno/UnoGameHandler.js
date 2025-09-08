const BaseGameHandler = require("../BaseGameHandler");
const TurnManager = require("../../shared/TurnManager");
const {
  buildDeck,
  shuffle,
  initialGameState,
  dealInitialHands,
  drawOne,
  reshuffleFromDiscard,
  topDiscard,
  canPlayCard,
  applyCardEffects,
  randomColor,
} = require("./logic");

class UnoGameHandler extends BaseGameHandler {
  constructor(room, io) {
    room.config = room.config || {};
    room.config.maxPlayers = room.config.maxPlayers || 6; // por ahora 2-6
    room.config.playerCount = room.players?.size || 0;

    super(room);
    this.io = io;

    this.turnManager = new TurnManager({
      maxSkips: 1,
      onTurnChange: (info) => {
        this.gameState.currentPlayer = info.currentPlayer;
        this.emitTurn(info.previousPlayer, info.currentPlayer);
      },
      onDirectionChange: (dir) => {
        this.io.to(this.room.id).emit("directionChanged", {
          direction: dir === 1 ? "clockwise" : "counterclockwise",
        });
      },
      onPlayerSkipped: (skippedPlayer, nextPlayer) => {
        this.io.to(this.room.id).emit("playerSkipped", {
          skippedPlayer,
          nextPlayer,
        });
      },
    });

    // Control de UNO (decir UNO y acusaciones)
    this.unoState = {
      // playerId -> { declared:boolean, atOneSince:number, penalized:boolean }
      players: new Map(),
      graceMs: 3000,
    };

    // Estado para challenge de wild draw 4
    this.wild4Challenge = null; // { playedBy, targetPlayer, snapshotHand, chosenColor, createdAt, timeoutAt, resolved }
  }

  createInitialState() {
    return initialGameState();
  }

  getGameConfig() {
    return { gameKey: "uno" };
  }

  setGameConfig(newConfig) {
    // Placeholder para configuraciones futuras
    return true;
  }

  startGame() {
    if (this.gameState.started) return false;

    const playerIds = Array.from(this.room.players.keys());
    if (playerIds.length < 2) return false;

    // Inicializar
    this.gameState = Object.assign(this.gameState, initialGameState());
    this.gameState.started = true;
    this.gameState.players = playerIds;

    let deck = buildDeck();
    shuffle(deck);
    this.gameState.drawPile = deck;
    dealInitialHands(this.gameState, playerIds, 7);

    // Voltear primera carta que no sea wild_draw4
    let first;
    while (deck.length) {
      first = deck.pop();
      if (first.kind !== "wild_draw4") break;
      // poner al fondo si es wild draw4
      deck.unshift(first);
      first = null;
    }
    if (!first) {
      first = deck.pop();
    }
    this.gameState.discardPile.push(first);
    this.gameState.currentColor = first.color || randomColor();
    this.gameState.currentKind = first.kind;
    this.gameState.currentValue = first.value;

    // Efecto inicial si aplica (skip, reverse, draw2)
    if (["skip", "reverse", "draw2"].includes(first.kind)) {
      if (first.kind === "reverse" && playerIds.length === 2) {
        // Reverse con 2 jugadores actúa como skip
        this.turnManager.initialize(playerIds);
        this.turnManager.setCurrentPlayer(playerIds[0]);
        this.turnManager.skipNext();
      } else {
        this.turnManager.initialize(playerIds);
        this.turnManager.setCurrentPlayer(playerIds[0]);
        if (first.kind === "skip") this.turnManager.skipNext();
        if (first.kind === "reverse") this.turnManager.reverseDirection();
        if (first.kind === "draw2") {
          this.gameState.pendingDrawType = "draw2";
          this.gameState.pendingDrawCount = 2;
        }
      }
    } else {
      this.turnManager.initialize(playerIds);
      this.turnManager.setCurrentPlayer(playerIds[0]);
    }

    this.gameState.currentPlayer = this.turnManager.getCurrentPlayer();

    // Broadcast manos privadas iniciales
    this.sendPrivateHands();

    return true;
  }

  // Enviar manos privadas a cada jugador
  sendPrivateHands() {
    for (const pid of this.gameState.players) {
      const hand = this.gameState.hands[pid] || [];
      this.io.to(pid).emit("privateHand", { hand });
    }
  }

  getPlayerIndex(socketId) {
    return this.gameState.players.indexOf(socketId);
  }

  // (Se unifica implementación al final del archivo con info adicional UNO)

  emitTurn(previousPlayer, currentPlayer) {
    const info = {
      previousPlayer,
      currentPlayer,
      direction: this.turnManager.getState().direction,
      pendingDrawCount: this.gameState.pendingDrawCount,
      pendingDrawType: this.gameState.pendingDrawType,
    };
    this.io.to(this.room.id).emit("turnChanged", info);
  }

  playCard(socketId, cardId, chosenColor) {
    if (!this.gameState.started || this.gameState.gameEnded)
      return { ok: false, reason: "not_started" };
    if (this.gameState.currentPlayer !== socketId)
      return { ok: false, reason: "not_your_turn" };

    const hand = this.gameState.hands[socketId];
    if (!hand) return { ok: false, reason: "hand_not_found" };
    const idx = hand.findIndex((c) => c.id === cardId);
    if (idx === -1) return { ok: false, reason: "card_not_in_hand" };
    const card = hand[idx];
    // Snapshot previo de la mano (para challenge wild4) antes de remover la carta
    const prePlayHandSnapshot = hand.map((c) => ({
      id: c.id,
      color: c.color,
      kind: c.kind,
      value: c.value,
    }));
    const previousTop = topDiscard(this.gameState);

    if (!canPlayCard(this.gameState, card, socketId)) {
      console.log("[UNO][playCard][reject]", {
        player: socketId,
        card: {
          id: card.id,
          color: card.color,
          kind: card.kind,
          value: card.value,
        },
        state: {
          currentColor: this.gameState.currentColor,
          currentKind: this.gameState.currentKind,
          currentValue: this.gameState.currentValue,
          pendingDrawType: this.gameState.pendingDrawType,
          pendingDrawCount: this.gameState.pendingDrawCount,
        },
      });
      return { ok: false, reason: "invalid_play" };
    }

    // Quitar carta de la mano y poner en discard
    hand.splice(idx, 1);
    this.gameState.discardPile.push(card);

    // Si había stacking y se juega carta válida del mismo tipo, acumula; si no, se limpia antes
    if (this.gameState.pendingDrawCount > 0) {
      // Solo llegamos aquí si card.kind coincide (validación hecha por canPlayCard)
      // No limpiamos todavía, se acumulará en applyCardEffects
    } else {
      // Resetear cualquier estado de draw pendiente
      this.gameState.pendingDrawType = null;
      this.gameState.pendingDrawCount = 0;
    }

    // Guardar color vigente antes de aplicar efectos (para challenge wild +4)
    const prevColorBeforePlay = this.gameState.currentColor;
    const effects = applyCardEffects(this.gameState, card, chosenColor);

    // Iniciar ventana de challenge si es wild_draw4
    if (card.kind === "wild_draw4") {
      const nextPlayer = this.turnManager.getNextPlayer();
      // Snapshot antes de jugar la carta (sin excluir la carta jugada) -> removemos luego
      const snapshotHand = prePlayHandSnapshot.filter((c) => c.id !== card.id);
      this.wild4Challenge = {
        playedBy: socketId,
        targetPlayer: nextPlayer,
        snapshotHand, // mano restante del jugador tras jugar
        chosenColor: this.gameState.currentColor,
        previousColor: prevColorBeforePlay || null,
        previousTopCard: previousTop
          ? {
              color: previousTop.color,
              kind: previousTop.kind,
              value: previousTop.value,
            }
          : null,
        createdAt: Date.now(),
        timeoutAt: null, // Sin timeout automático
        resolved: false,
        eligibleChallengers: this.gameState.players.filter(
          (pid) => pid !== socketId
        ), // Todos excepto quien jugó
      };

      console.log("[UNO][Challenge] wild4Challenge created:", {
        playedBy: socketId,
        targetPlayer: nextPlayer,
        eligibleChallengers: this.wild4Challenge.eligibleChallengers,
        allPlayers: this.gameState.players,
      });

      this.io.to(this.room.id).emit("wild4ChallengeAvailable", {
        playedBy: socketId,
        targetPlayer: nextPlayer,
        eligibleChallengers: this.wild4Challenge.eligibleChallengers,
        deadline: null, // Sin deadline
      });
    } else {
      // Si se juega otra carta, limpiar challenge previo pendiente no resuelto
      if (this.wild4Challenge && !this.wild4Challenge.resolved) {
        this.wild4Challenge.resolved = true; // expirado implícitamente
      }
    }

    // Verificar victoria
    if (hand.length === 0) {
      this.gameState.winner = socketId;
      this.gameState.gameEnded = true;
      this.io.to(this.room.id).emit("winner", { playerId: socketId });
      return { ok: true, winner: socketId };
    }

    // Actualizar estado UNO para este jugador tras jugar
    this.updateUnoStateFor(socketId);

    // Avanzar turno
    this.advanceTurnAfterPlay(card, effects);

    // Enviar manos privadas actualizadas solo al jugador
    this.io.to(socketId).emit("privateHand", { hand });

    return { ok: true };
  }

  advanceTurnAfterPlay(card, effects) {
    // NO limpiar desafío si se acaba de jugar un wild_draw4
    if (
      this.wild4Challenge &&
      !this.wild4Challenge.resolved &&
      card.kind !== "wild_draw4"
    ) {
      this.wild4Challenge.resolved = true;
    }

    // Reglas de salto, reverse ya se aplicó en effects
    if (card.kind === "skip") {
      if (this.gameState.players.length === 2) {
        // En 1vs1, skip hace que el mismo jugador siga jugando
        // No avanzar turno, mantener el jugador actual
        return;
      } else {
        // En 3+ jugadores, skip salta al siguiente
        this.turnManager.skipNext();
        this.turnManager.nextTurn();
      }
    } else if (card.kind === "reverse") {
      if (this.gameState.players.length === 2) {
        // En 1vs1, reverse actúa como skip - mismo jugador sigue
        return;
      } else {
        // ya se cambió direction en applyCardEffects, solo avanzar turno
        this.turnManager.nextTurn();
      }
    } else if (card.kind === "draw2" || card.kind === "wild_draw4") {
      // stacking manejado en estado; siguiente jugador deberá responder o robar
      this.turnManager.nextTurn();
      // No auto-skip; la lógica de stacking se resuelve cuando el siguiente decide jugar o robar
    } else {
      // Carta normal, solo avanzar turno
      this.turnManager.nextTurn();
    }
  }

  drawCard(socketId) {
    console.log("[UNO][UnoGameHandler.drawCard] start", {
      socketId,
      currentPlayer: this.gameState.currentPlayer,
      pending: this.gameState.pendingDrawCount,
    });
    if (!this.gameState.started || this.gameState.gameEnded)
      return { ok: false, reason: "not_started" };
    if (this.gameState.currentPlayer !== socketId)
      return { ok: false, reason: "not_your_turn" };

    const hand = this.gameState.hands[socketId];
    if (!hand) return { ok: false, reason: "hand_not_found" };

    if (this.gameState.pendingDrawCount > 0) {
      // Debe robar todas las cartas acumuladas y pierde turno
      const toDraw = this.gameState.pendingDrawCount;
      for (let i = 0; i < toDraw; i++) {
        drawOne(this.gameState, socketId);
      }
      this.io.to(socketId).emit("privateHand", { hand });
      this.io.to(this.room.id).emit("playerDrew", {
        playerId: socketId,
        count: toDraw,
        stacked: true,
      });

      // Si es el target player del desafío, resolver automáticamente
      if (
        this.wild4Challenge &&
        !this.wild4Challenge.resolved &&
        this.wild4Challenge.targetPlayer === socketId
      ) {
        this.wild4Challenge.resolved = true;
      }

      // Reset stacking
      this.gameState.pendingDrawCount = 0;
      this.gameState.pendingDrawType = null;
      // Avanzar turno después de pagar
      this.turnManager.nextTurn();
      console.log("[UNO][UnoGameHandler.drawCard] stacked draw complete", {
        socketId,
        drew: toDraw,
      });
      return { ok: true, drew: toDraw, stacked: true };
    }

    // Robo normal de 1
    const card = drawOne(this.gameState, socketId);
    this.io.to(socketId).emit("privateHand", { hand });

    // Si ahora tiene >1 cartas eliminar estado UNO si existía
    this.clearUnoStateIfNeeded(socketId);

    // Reglas UNO: si la carta robada es jugable podría permitir jugar inmediatamente (no implementado, se puede agregar)

    // Avanzar turno al siguiente
    this.turnManager.nextTurn();
    console.log("[UNO][UnoGameHandler.drawCard] normal draw complete", {
      socketId,
      drew: 1,
    });
    return { ok: true, drew: 1 };
  }

  // ---- Challenge Wild Draw 4 ----
  challengeWild4(socketId) {
    const ch = this.wild4Challenge;
    if (!ch || ch.resolved) return { ok: false, reason: "no_active_challenge" };
    if (!ch.eligibleChallengers.includes(socketId))
      return { ok: false, reason: "not_eligible_challenger" };

    // Evaluar si el jugador que jugó el +4 tenía otra jugada legal antes de jugarlo.
    const previousColor =
      ch.previousColor ||
      (ch.previousTopCard && ch.previousTopCard.color) ||
      null;
    const topBefore = ch.previousTopCard;
    let hadPlayable = false;
    for (const c of ch.snapshotHand) {
      if (c.kind === "wild") {
        hadPlayable = true;
        break;
      }
      if (previousColor && c.color === previousColor) {
        hadPlayable = true;
        break;
      }
      if (topBefore) {
        if (
          topBefore.kind === "number" &&
          c.kind === "number" &&
          c.value === topBefore.value
        ) {
          hadPlayable = true;
          break;
        }
        if (topBefore.kind !== "number" && c.kind === topBefore.kind) {
          hadPlayable = true;
          break;
        }
      }
    }

    let result;
    if (hadPlayable) {
      // El desafiante gana: quien jugó +4 toma 4 cartas
      for (let i = 0; i < 4; i++) drawOne(this.gameState, ch.playedBy);
      this.io.to(ch.playedBy).emit("privateHand", {
        hand: this.gameState.hands[ch.playedBy],
      });
      // Limpiar acumulación para el target player
      this.gameState.pendingDrawCount = 0;
      this.gameState.pendingDrawType = null;
      result = {
        ok: true,
        success: true,
        penalized: ch.playedBy,
        penalty: 4,
        challenger: socketId,
        target: ch.playedBy, // Quien jugó el +4 original
        wasValid: false, // El +4 NO era válido (sí podía jugar otra carta)
      };
    } else {
      // El desafiante pierde: toma las cartas acumuladas (4 + lo que hubiera)
      const penalty = Math.max(4, this.gameState.pendingDrawCount || 4);
      for (let i = 0; i < penalty; i++) drawOne(this.gameState, socketId);
      this.io.to(socketId).emit("privateHand", {
        hand: this.gameState.hands[socketId],
      });
      // Si el desafiante era el target player, avanzar turno
      if (socketId === ch.targetPlayer) {
        this.gameState.pendingDrawCount = 0;
        this.gameState.pendingDrawType = null;
        this.turnManager.nextTurn();
      }
      result = {
        ok: true,
        success: false,
        penalized: socketId,
        penalty: penalty,
        challenger: socketId,
        target: ch.playedBy, // Quien jugó el +4 original
        wasValid: true, // El +4 SÍ era válido (no podía jugar otra carta)
      };
    }

    ch.resolved = true;
    this.io.to(this.room.id).emit("wild4ChallengeResult", result);
    return result;
  }

  acceptWild4(socketId) {
    const ch = this.wild4Challenge;
    if (!ch || ch.resolved) return { ok: false, reason: "no_active_challenge" };
    if (socketId !== ch.targetPlayer)
      return { ok: false, reason: "not_target_player" };
    // Pagar cartas acumuladas (si no respondió con otro draw4 antes) - ya se maneja en drawCard.
    ch.resolved = true;
    return { ok: true, accepted: true };
  }

  // ---- Lógica UNO (decir y acusar) ----
  updateUnoStateFor(playerId) {
    const hand = this.gameState.hands[playerId] || [];
    if (hand.length === 1) {
      const info = this.unoState.players.get(playerId) || {};
      if (!info.atOneSince) {
        info.atOneSince = Date.now();
        info.declared = false;
        info.penalized = false;
        this.unoState.players.set(playerId, info);
        this.io.to(this.room.id).emit("playerAtUno", {
          playerId,
          graceMs: this.unoState.graceMs,
        });
      }
    } else {
      // Más de una carta -> limpiar
      this.clearUnoStateIfNeeded(playerId);
    }
  }

  clearUnoStateIfNeeded(playerId) {
    const hand = this.gameState.hands[playerId] || [];
    if (hand.length !== 1) {
      if (this.unoState.players.has(playerId)) {
        this.unoState.players.delete(playerId);
        this.io.to(this.room.id).emit("unoStateCleared", { playerId });
      }
    }
  }

  declareUno(socketId) {
    const info = this.unoState.players.get(socketId);
    if (!info) return { ok: false, reason: "not_at_uno" };
    if (info.declared) return { ok: false, reason: "already_declared" };
    info.declared = true;
    this.io.to(this.room.id).emit("unoDeclared", { playerId: socketId });
    return { ok: true };
  }

  callOutUno(socketId, targetPlayerId) {
    if (socketId === targetPlayerId) {
      return { ok: false, reason: "cannot_call_self" };
    }
    const info = this.unoState.players.get(targetPlayerId);
    if (!info) return { ok: false, reason: "target_not_at_uno" };
    if (info.declared) return { ok: false, reason: "already_declared" };
    if (info.penalized) return { ok: false, reason: "already_penalized" };

    const elapsed = Date.now() - (info.atOneSince || 0);
    if (elapsed < this.unoState.graceMs) {
      return { ok: false, reason: "grace_period" };
    }

    // Penalizar +4 cartas
    for (let i = 0; i < 4; i++) {
      drawOne(this.gameState, targetPlayerId);
    }
    info.penalized = true;
    this.io.to(targetPlayerId).emit("privateHand", {
      hand: this.gameState.hands[targetPlayerId],
    });
    // Limpiar estado UNO (ya no está a una carta)
    this.clearUnoStateIfNeeded(targetPlayerId);
    this.io.to(this.room.id).emit("unoCalledOut", {
      target: targetPlayerId,
      by: socketId,
      penalty: 4,
    });
    return { ok: true, penalty: 4 };
  }

  // Public state consolidado con información de UNO y challenge
  getPublicState() {
    const top = topDiscard(this.gameState);
    const unoPlayers = [];
    for (const [pid, info] of this.unoState.players.entries()) {
      const hand = this.gameState.hands[pid] || [];
      if (hand.length === 1) {
        unoPlayers.push({
          playerId: pid,
          declared: !!info.declared,
          graceRemainingMs: info.declared
            ? 0
            : Math.max(
                0,
                this.unoState.graceMs - (Date.now() - (info.atOneSince || 0))
              ),
        });
      }
    }

    // IMPORTANT: No sobreescribir la lista de jugadores del lobby antes de que el juego empiece
    // (el broadcast en index.js primero arma 'players' con nombres/avatar y luego mezcla este objeto).
    // Si devolvemos 'players' cuando aún no empezó, la sobrescribimos con un array vacío (porque gameState.players
    // solo se llena al iniciar) y en el frontend se ve "0 jugadores".
    const includePlayers = this.gameState.started;
    let playersSection = {};
    if (includePlayers) {
      playersSection.players = this.gameState.players.map((pid) => {
        // Intentar tomar metadatos del room original (nombres, avatar) si existen
        const roomPlayer = this.room.players.get(pid) || {};
        return {
          id: pid,
          handCount: (this.gameState.hands[pid] || []).length,
          name: roomPlayer.name,
          username: roomPlayer.username,
          avatarUrl: roomPlayer.avatarUrl,
          avatarId: roomPlayer.avatarId,
        };
      });
    }

    return {
      started: this.gameState.started,
      gameEnded: this.gameState.gameEnded,
      currentPlayer: this.gameState.currentPlayer,
      direction: this.gameState.direction,
      currentColor: this.gameState.currentColor,
      topCard: top
        ? { id: top.id, color: top.color, kind: top.kind, value: top.value }
        : null,
      discardCount: this.gameState.discardPile.length,
      drawCount: this.gameState.drawPile.length,
      pendingDrawCount: this.gameState.pendingDrawCount,
      pendingDrawType: this.gameState.pendingDrawType,
      winner: this.gameState.winner,
      uno: unoPlayers,
      wild4Challenge:
        this.wild4Challenge && !this.wild4Challenge.resolved
          ? {
              playedBy: this.wild4Challenge.playedBy,
              targetPlayer: this.wild4Challenge.targetPlayer,
              eligibleChallengers: this.wild4Challenge.eligibleChallengers,
              deadline: this.wild4Challenge.timeoutAt,
            }
          : null,
      ...playersSection,
    };
  }
}

module.exports = UnoGameHandler;
