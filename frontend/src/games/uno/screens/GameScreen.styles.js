import { StyleSheet } from "react-native";

// Función para crear estilos responsivos
export function createResponsiveStyles(responsiveSize) {
  return StyleSheet.create({
    // Estilos dinámicos que cambian con el tamaño de pantalla
    responsivePlayerSlot: {
      alignItems: "center",
      width: responsiveSize.playerSlot,
      height: responsiveSize.playerSlot,
    },
    responsivePlaceholderCircle: {
      width: responsiveSize.placeholderCircle,
      height: responsiveSize.placeholderCircle,
      borderRadius: responsiveSize.placeholderCircle / 2,
      backgroundColor: "#2c3e50",
      borderWidth: 2,
      borderColor: "#34495e",
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 3,
    },
    responsiveCenterCircle: {
      width: responsiveSize.centerCircle,
      height: responsiveSize.centerCircle,
      borderRadius: responsiveSize.centerCircle / 2,
      backgroundColor: "#0d3b24",
      borderWidth: 2,
      borderColor: "#145c36",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.45,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
      elevation: 9,
    },
    responsiveDiscardImage: {
      width: responsiveSize.discardCard.width,
      height: responsiveSize.discardCard.height,
    },
    responsivePlaceholderCard: {
      width: responsiveSize.discardCard.width,
      height: responsiveSize.discardCard.height,
      backgroundColor: "#333",
      borderRadius: 13,
    },
    responsiveDeckStackWrapper: {
      width: responsiveSize.deckCard.width,
      height: responsiveSize.deckCard.height,
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    responsiveDeckImage: {
      width: responsiveSize.deckCard.width,
      height: responsiveSize.deckCard.height,
      borderRadius: 5,
    },
    responsiveMatrixRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginVertical: responsiveSize.marginVertical,
    },
    responsiveCenterRowContainer: {
      justifyContent: "flex-start",
      alignItems: "center",
      marginTop: responsiveSize.centerMarginTop,
      marginBottom: responsiveSize.centerMarginBottom,
      height: responsiveSize.centerHeight,
    },
    responsiveBottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: responsiveSize.bottomRowMarginTop,
      marginBottom: responsiveSize.bottomRowMarginBottom,
    },
    responsiveGameMatrix: {
      flex: 1,
      justifyContent: "flex-start",
      paddingVertical: 5,
      minHeight: Math.round(350 * (responsiveSize.centerCircle / 160)), // Altura mínima proporcional
    },
    responsiveOpponentAvatar: {
      width: responsiveSize.avatarSize,
      height: responsiveSize.avatarSize,
      borderRadius: responsiveSize.avatarSize / 2,
      borderWidth: 2,
      borderColor: "#3498db",
      marginBottom: 3,
    },
    responsiveOpponentAvatarPlaceholder: {
      width: responsiveSize.avatarSize,
      height: responsiveSize.avatarSize,
      borderRadius: responsiveSize.avatarSize / 2,
      backgroundColor: "#333",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 3,
      borderWidth: 2,
      borderColor: "#444",
    },
  });
}

export const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  backBtn: { padding: 8 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  tableArea: {
    flex: 1,
    paddingTop: 4,
    justifyContent: "flex-start", // Cambiado de "center" a "flex-start"
    paddingBottom: 12, // Aumentado de 8 a 12 para más espacio
  },
  gameMatrix: {
    flex: 1,
    justifyContent: "flex-start", // Volver a flex-start para mejor control
    paddingVertical: 5,
  },
  matrixRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15, // Reducido de 20 a 15
    marginVertical: 4, // Reducido de 8 a 4
  },
  matrixRowSecond: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15, // Reducido de 20 a 15
    marginTop: 8, // Reducido de 15 a 8 - más cerca de la primera fila
    marginBottom: 4, // Reducido de 8 a 4
  },
  centerRowContainer: {
    justifyContent: "flex-start", // Cambiado de "center" a "flex-start"
    alignItems: "center",
    marginTop: 5, // Reducido significativamente de 15 a 5
    marginBottom: 10, // Reducido de 15 a 10
    height: 120, // Altura fija más pequeña para que ocupe menos espacio
  },
  spacerForCenter: {
    width: 60, // Reducido de 80 a 60
  },
  playerSlotPlaceholder: {
    alignItems: "center",
    width: 60, // Reducido de 80 a 60
    height: 60, // Reducido de 80 a 60
  },
  placeholderCircle: {
    width: 38, // Reducido de 50 a 38
    height: 38, // Reducido de 50 a 38
    borderRadius: 19, // Ajustado al nuevo tamaño
    backgroundColor: "#2c3e50",
    borderWidth: 2,
    borderColor: "#34495e",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3, // Reducido de 4 a 3
  },
  placeholderIcon: {
    fontSize: 16, // Reducido de 20 a 16
    opacity: 0.6,
  },
  placeholderText: {
    color: "#7f8c8d",
    fontSize: 9, // Reducido de 10 a 9
    fontWeight: "600",
    textAlign: "center",
  },
  placeholderSubtext: {
    color: "#7f8c8d",
    fontSize: 7, // Reducido de 8 a 7
    opacity: 0.7,
    textAlign: "center",
  },
  mySlotPlaceholder: {
    alignItems: "center",
    width: 60, // Reducido de 80 a 60
    height: 60, // Reducido de 80 a 60
    justifyContent: "center",
  },
  centerZoneCircle: {
    width: 160, // Reducido de 200 a 160
    height: 160, // Reducido de 200 a 160
    borderRadius: 80, // Ajustado al nuevo tamaño
    backgroundColor: "#0d3b24",
    borderWidth: 2,
    borderColor: "#145c36",
    alignItems: "center",
    justifyContent: "center",
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
    justifyContent: "space-between",
    paddingHorizontal: 12, // Reducido de 15 a 12
    width: "100%",
  },
  deckZone: {
    alignItems: "center",
    justifyContent: "center",
  },
  deckStackWrapper: {
    width: 28, // Reducido de 32 a 28
    height: 44, // Reducido de 50 a 44
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  deckImage: {
    width: 28, // Reducido de 32 a 28
    height: 44, // Reducido de 50 a 44
    borderRadius: 5,
  },
  deckCountText: {
    color: "#f1c40f",
    fontWeight: "700",
    fontSize: 10,
    marginTop: 3,
    textAlign: "center",
    textShadowColor: "#000",
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },
  discardZone: {
    alignItems: "center",
    justifyContent: "center",
  },
  discardImage: {
    width: 70, // Reducido de 85 a 70
    height: 110, // Reducido de 135 a 110
  },
  placeholderCard: {
    width: 70, // Reducido de 85 a 70
    height: 110, // Reducido de 135 a 110
    backgroundColor: "#333",
    borderRadius: 13,
  },
  spacer: {
    width: 5, // Mismo ancho que el deckZone para equilibrar
  },
  turnHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    marginBottom: 6, // Reducido de 10 a 6
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
  centerWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 200, // Reducido de 250 a 200
  },
  middleRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  opponentBox: {
    alignItems: "center",
    minWidth: 55, // Reducido de 70 a 55
    maxWidth: 65, // Reducido de 80 a 65
  },
  opponentId: {
    color: "#fff",
    fontSize: 11, // Reducido para ser más compacto
    opacity: 0.8,
  },
  opponentHandRow: {
    flexDirection: "row",
    marginTop: 2,
  },
  backSmallWrapper: {
    width: 22, // Reducido de 26 a 22
    height: 34, // Reducido de 40 a 34
    marginRight: -14, // Ajustado para el nuevo tamaño
  },
  backSmall: {
    width: 22, // Reducido de 26 a 22
    height: 34, // Reducido de 40 a 34
  },
  opponentCount: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12, // Reducido de 14 a 12
    marginTop: 2, // Reducido de 4 a 2
  },
  opponentScore: {
    color: "#f39c12",
    fontWeight: "600",
    fontSize: 10,
    marginTop: 1,
  },
  unoBadge: {
    color: "#e74c3c",
    fontWeight: "800",
    fontSize: 10, // Reducido de 12 a 10
    marginTop: 1, // Reducido de 2 a 1
  },
  handArea: {
    height: 140,
    backgroundColor: "#181818",
    borderTopWidth: 1,
    borderTopColor: "#222",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    justifyContent: "center",
    overflow: "visible",
  },
  handListContentFull: {
    alignItems: "center",
    paddingHorizontal: 50,
    minWidth: "100%",
  },
  handListContainer: {
    flexGrow: 0,
  },
  handContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 10,
    overflow: "visible",
  },
  cardWrapper: {
    width: 72,
    height: 112,
    marginRight: -35,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    overflow: "hidden", // Evita que bordes superpuestos generen líneas claras
    position: "relative", // Necesario para que zIndex funcione de forma consistente (Android)
  },
  cardImage: {
    width: 72,
    height: 112,
  },
  cardGlowContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  cardGlow: {
    position: "absolute",
    width: 72,
    height: 112,
    borderRadius: 12,
    backgroundColor: "#f5c54233", // suave amarillo translúcido
    shadowColor: "#f1c40f",
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  cardDisabledOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Overlay simple sin bordes redondeados para evitar artefactos blancos
    backgroundColor: "rgba(0,0,0,0.35)",
    // Remover borderRadius para evitar rayas blancas por desalineación
    zIndex: 20,
    elevation: 20,
  },
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
  emptyHandSubtext: {
    color: "#bbb",
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
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
  dragImageSmall: { width: 100, height: 156 },
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
    width: 34, // Reducido de 40 a 34
    height: 34, // Reducido de 40 a 34
    borderRadius: 17, // Ajustado al nuevo tamaño
    borderWidth: 2,
    borderColor: "#3498db",
    marginBottom: 3, // Reducido de 4 a 3
  },
  opponentAvatarPlaceholder: {
    width: 34, // Reducido de 40 a 34
    height: 34, // Reducido de 40 a 34
    borderRadius: 17, // Ajustado al nuevo tamaño
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3, // Reducido de 4 a 3
    borderWidth: 2,
    borderColor: "#444",
  },
  opponentAvatarLetter: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14, // Reducido de 16 (por defecto) a 14
  },
});
