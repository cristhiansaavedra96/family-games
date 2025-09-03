// 🎯 BOTÓN DE ACCIONES COLAPSIBLE
// Botón flotante que se expande para mostrar las acciones del Truco

import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import ActionPanel from "./ActionPanel";

const CollapsibleActionButton = ({
  availableActions = [],
  onAction,
  trucoState = { level: 0, canAccept: false, canRaise: false },
  envidoState = { canDeclare: false, active: false },
  florState = { canDeclare: false, hasFlor: false },
  canPlayCard = false,
  style = {},
  shouldOpen = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;

    Animated.spring(animation, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();

    setIsExpanded(!isExpanded);
  };

  const panelHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 260],
  });

  const buttonRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  // ¿Debo mostrar botón local "TIENE"? (rival declaró FLOR y yo no)
  const showTiene = React.useMemo(() => {
    try {
      if (!florState || florState.hasFlor) return false;
      const decls = florState.declarations || {};
      return (
        decls && typeof decls === "object" && Object.keys(decls).length > 0
      );
    } catch (e) {
      return false;
    }
  }, [florState]);

  // Filtramos acciones que realmente se pueden mostrar como botones
  const visibleActions = Array.isArray(availableActions)
    ? availableActions.filter((a) => a !== "play_card")
    : [];
  const openableActionsCount = visibleActions.length + (showTiene ? 1 : 0);
  const hasActions = openableActionsCount > 0;

  // Auto open/close when shouldOpen changes
  React.useEffect(() => {
    if (shouldOpen && !isExpanded && hasActions) {
      toggleExpanded();
    } else if (!shouldOpen && isExpanded) {
      toggleExpanded();
    }
  }, [shouldOpen, hasActions]);

  return (
    <View style={[styles.container, style]}>
      {/* Expanded Actions Panel */}
      {isExpanded && (
        <Animated.View style={[styles.expandedPanel, { height: panelHeight }]}>
          <ActionPanel
            availableActions={availableActions}
            onAction={onAction}
            trucoState={trucoState}
            envidoState={envidoState}
            florState={florState}
            showTiene={showTiene}
            canPlayCard={canPlayCard}
            style={styles.actionPanelCompact}
          />
        </Animated.View>
      )}

      {/* Main Action Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          hasActions && styles.actionButtonActive,
          !hasActions && styles.actionButtonDisabled,
        ]}
        onPress={toggleExpanded}
        activeOpacity={0.8}
        disabled={!hasActions}
      >
        <Animated.View style={{ transform: [{ rotate: buttonRotation }] }}>
          <MaterialIcons
            name={isExpanded ? "close" : "flash-on"}
            size={24}
            color="white"
          />
        </Animated.View>

        {/* Action count badge */}
        {openableActionsCount > 0 && !isExpanded && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{openableActionsCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Quick action hint */}
      {canPlayCard && !isExpanded && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Toca una carta</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    right: 20,
    alignItems: "flex-end",
    zIndex: 1000,
  },

  expandedPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 300,
    maxWidth: 360,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },

  actionPanelCompact: {
    margin: 0,
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },

  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: "relative",
  },

  actionButtonActive: {
    backgroundColor: "#27ae60",
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#f39c12",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },

  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },

  hintContainer: {
    position: "absolute",
    bottom: 70,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  hintText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
});

export default CollapsibleActionButton;
