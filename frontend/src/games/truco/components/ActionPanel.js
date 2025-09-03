// 🎯 PANEL DE ACCIONES DEL TRUCO
// Botones para Truco, Envido, Flor y otras acciones

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const ActionPanel = ({
  availableActions = [],
  onAction,
  trucoState = { level: 0, canAccept: false, canRaise: false },
  envidoState = { canDeclare: false, active: false },
  florState = { canDeclare: false, hasFlor: false },
  // extras para lógica de FLOR
  players = [],
  myPlayerId = null,
  showTiene: showTieneProp,
  canPlayCard = false,
  style = {},
}) => {
  const handleTrucoAction = (action) => {
    if (onAction) {
      onAction(action);
    }
  };

  const getTrucoButtonText = () => {
    const { level } = trucoState;
    switch (level) {
      case 0:
        return "TRUCO";
      case 1:
        return "RE-TRUCO";
      case 2:
        return "VALE 4";
      default:
        return "TRUCO";
    }
  };

  const getTrucoButtonColor = () => {
    const { level } = trucoState;
    const colors = ["#e74c3c", "#c0392b", "#922b21"];
    return colors[level] || "#e74c3c";
  };

  const renderActionButton = (
    action,
    icon,
    text,
    color,
    onPress,
    opts = {}
  ) => {
    const isResponseAction = [
      "accept_truco",
      "reject_truco",
      "accept_envido",
      "reject_envido",
      "contraflor",
      "contraflor_al_resto",
      "con_flor_envido",
    ].includes(action);

    const canClick =
      (opts.isMyTurn || opts.isResponding || action === "tiene") &&
      availableActions.includes(action) &&
      !opts.disabled;

    return (
      <TouchableOpacity
        key={action}
        style={[
          styles.actionButton,
          { backgroundColor: color },
          !canClick && styles.disabledButton,
        ]}
        onPress={onPress}
        disabled={!canClick}
        activeOpacity={0.8}
      >
        <MaterialIcons name={icon} size={20} color="white" />
        <Text style={styles.buttonText}>{text}</Text>
      </TouchableOpacity>
    );
  };

  // Detectar si debo mostrar el botón "TIENE" (rival tiene flor y yo no)
  const computeShowTiene = () => {
    if (showTieneProp !== undefined) return !!showTieneProp;
    try {
      if (!florState || florState.hasFlor) return false;
      const decls = florState.declarations || {};
      const hasAnyDecl =
        decls && typeof decls === "object" && Object.keys(decls).length > 0;
      return !!hasAnyDecl;
    } catch (e) {
      return false;
    }
  };

  const showTiene = computeShowTiene();

  // ¿Hay flor declarada por alguien?
  const florDeclared = (() => {
    try {
      const decls = florState?.declarations || {};
      return (
        decls && typeof decls === "object" && Object.keys(decls).length > 0
      );
    } catch (e) {
      return false;
    }
  })();

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Acciones</Text>

      {/* Si hay una FLOR en juego, limitar opciones únicamente a FLOR/RESPUESTAS */}
      {florDeclared ? (
        <View style={styles.actionsRow}>
          <View style={styles.section}>
            {/* Caso: no tengo flor -> solo TIENE */}
            {!florState?.hasFlor && showTiene && (
              <TouchableOpacity
                key="tiene"
                style={[styles.actionButton, { backgroundColor: "#7f8c8d" }]}
                onPress={() => handleTrucoAction("tiene")}
                activeOpacity={0.8}
              >
                <MaterialIcons name="check-circle" size={20} color="white" />
                <Text style={styles.buttonText}>TIENE</Text>
              </TouchableOpacity>
            )}

            {/* Caso: tengo flor -> mostrar opciones habilitadas por backend */}
            {florState?.hasFlor && (
              <>
                {availableActions.includes("flor") && (
                  <>
                    {renderActionButton(
                      "flor",
                      "local-florist",
                      "FLOR",
                      "#e91e63",
                      () => handleTrucoAction("flor")
                    )}
                    {renderActionButton(
                      "flor_alias",
                      "spa",
                      "LA MIA FLOR",
                      "#c2185b",
                      () => handleTrucoAction("flor")
                    )}
                  </>
                )}
                {availableActions.includes("contraflor") &&
                  renderActionButton(
                    "contraflor",
                    "filter-vintage",
                    "CONTRAFLOR",
                    "#ad1457",
                    () => handleTrucoAction("contraflor")
                  )}
                {availableActions.includes("contraflor_al_resto") &&
                  renderActionButton(
                    "contraflor_al_resto",
                    "local-florist",
                    "CONTRAFLOR AL RESTO",
                    "#8e44ad",
                    () => handleTrucoAction("contraflor_al_resto")
                  )}
                {availableActions.includes("con_flor_envido") &&
                  renderActionButton(
                    "con_flor_envido",
                    "spa",
                    "CON FLOR ENVIDO",
                    "#16a085",
                    () => handleTrucoAction("con_flor_envido")
                  )}
              </>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.actionsRow}>
          {/* Truco Actions */}
          <View style={styles.section}>
            {/* Truco/Re-truco/Vale 4 */}
            {availableActions.includes("truco") &&
              renderActionButton(
                "truco",
                "flash-on",
                getTrucoButtonText(),
                getTrucoButtonColor(),
                () => handleTrucoAction("truco"),
                { isMyTurn: true }
              )}

            {/* Quiero (aceptar truco) */}
            {availableActions.includes("accept_truco") &&
              renderActionButton(
                "accept_truco",
                "check",
                "QUIERO",
                "#27ae60",
                () => handleTrucoAction("accept_truco"),
                { isResponding: true }
              )}

            {/* No quiero (rechazar truco) */}
            {availableActions.includes("reject_truco") &&
              renderActionButton(
                "reject_truco",
                "close",
                "NO QUIERO",
                "#95a5a6",
                () => handleTrucoAction("reject_truco"),
                { isResponding: true }
              )}
          </View>

          {/* Envido Actions */}
          <View style={styles.section}>
            {availableActions.includes("envido") &&
              renderActionButton(
                "envido",
                "diamond",
                "ENVIDO",
                "#3498db",
                () => handleTrucoAction("envido"),
                { isMyTurn: true }
              )}

            {availableActions.includes("real_envido") &&
              renderActionButton(
                "real_envido",
                "stars",
                "REAL ENVIDO",
                "#2980b9",
                () => handleTrucoAction("real_envido"),
                { isMyTurn: true }
              )}

            {availableActions.includes("falta_envido") &&
              renderActionButton(
                "falta_envido",
                "all-inclusive",
                "FALTA ENVIDO",
                "#1abc9c",
                () => handleTrucoAction("falta_envido"),
                { isMyTurn: true }
              )}

            {/* Respuestas de envido (solo si el backend las habilita para este jugador) */}
            {availableActions.includes("accept_envido") &&
              renderActionButton(
                "accept_envido",
                "check",
                "QUIERO",
                "#27ae60",
                () => handleTrucoAction("accept_envido"),
                { isResponding: true }
              )}

            {availableActions.includes("reject_envido") &&
              renderActionButton(
                "reject_envido",
                "close",
                "NO QUIERO",
                "#95a5a6",
                () => handleTrucoAction("reject_envido"),
                { isResponding: true }
              )}
          </View>

          {/* Flor Actions (sin flor declarada aún): permitir declarar si tengo flor */}
          <View style={styles.section}>
            {/* Botón local: TIENE (solo cuando el rival declaró flor y yo no tengo) */}
            {showTiene && (
              <TouchableOpacity
                key="tiene"
                style={[styles.actionButton, { backgroundColor: "#7f8c8d" }]}
                onPress={() => handleTrucoAction("tiene")}
                activeOpacity={0.8}
              >
                <MaterialIcons name="check-circle" size={20} color="white" />
                <Text style={styles.buttonText}>TIENE</Text>
              </TouchableOpacity>
            )}

            {/* Si tengo flor, y el backend permite declarar/responder, mostrar botones disponibles */}
            {florState.hasFlor && (
              <>
                {availableActions.includes("flor") && (
                  <>
                    {renderActionButton(
                      "flor",
                      "local-florist",
                      "FLOR",
                      "#e91e63",
                      () => handleTrucoAction("flor"),
                      { isMyTurn: true }
                    )}
                    {/* Alias visual que dispara la misma acción */}
                    {renderActionButton(
                      "flor_alias",
                      "spa",
                      "LA MIA FLOR",
                      "#c2185b",
                      () => handleTrucoAction("flor"),
                      { isMyTurn: true }
                    )}
                  </>
                )}

                {availableActions.includes("contraflor") &&
                  renderActionButton(
                    "contraflor",
                    "filter-vintage",
                    "CONTRAFLOR",
                    "#ad1457",
                    () => handleTrucoAction("contraflor"),
                    { isResponding: true }
                  )}

                {/* Mostrar solo si el backend los habilita explícitamente */}
                {availableActions.includes("contraflor_al_resto") &&
                  renderActionButton(
                    "contraflor_al_resto",
                    "local-florist",
                    "CONTRAFLOR AL RESTO",
                    "#8e44ad",
                    () => handleTrucoAction("contraflor_al_resto"),
                    { isResponding: true }
                  )}
                {availableActions.includes("con_flor_envido") &&
                  renderActionButton(
                    "con_flor_envido",
                    "spa",
                    "CON FLOR ENVIDO",
                    "#16a085",
                    () => handleTrucoAction("con_flor_envido"),
                    { isResponding: true }
                  )}
              </>
            )}
          </View>
        </View>
      )}

      {/* Información de estado */}
      <View style={styles.statusInfo}>
        {trucoState.level > 0 && (
          <Text style={styles.statusText}>
            Truco nivel: {trucoState.level} - {getTrucoButtonText()}
          </Text>
        )}

        {envidoState.active && (
          <Text style={styles.statusText}>
            Envido activo: {envidoState.type}
          </Text>
        )}

        {florState.hasFlor && !florState.declared && (
          <Text style={styles.statusText}>¡Tienes FLOR! 🌸</Text>
        )}

        {canPlayCard && (
          <Text style={styles.statusText}>Selecciona una carta para jugar</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },

  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },

  section: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "100%",
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 92,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  disabledButton: {
    backgroundColor: "#bdc3c7",
    opacity: 0.5,
    shadowOpacity: 0.1,
    elevation: 1,
  },

  buttonText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 4,
  },

  statusInfo: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#e9ecef",
    borderRadius: 8,
  },

  statusText: {
    fontSize: 12,
    color: "#495057",
    textAlign: "center",
    marginVertical: 2,
  },
});

export default ActionPanel;
