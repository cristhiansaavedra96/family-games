import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { View, Text, Image } from "react-native";
import Animated from "react-native-reanimated";
import {
  getUnoCardImage,
  getUnoBackImage,
  getUnoDeckStackImages,
} from "../utils/cardAssets";
import {
  shortId,
  getTableBackgroundColor,
  getTableBorderColor,
  getDeckCountColor,
} from "../utils/gameHelpers";
import { useCenterTableAnimations } from "../hooks/useCardAnimations";

const CenterTable = forwardRef(
  ({ publicState, responsiveStyles, responsiveSize, styles, me }, ref) => {
    const {
      animatedCenterStyle,
      animatedColorOverlayStyle,
      animatedPulseStyle,
      animateCardChange,
      animateColorChange,
    } = useCenterTableAnimations();

    const prevTopCard = useRef(null);
    const prevCurrentColor = useRef(null);
    const prevDiscardCount = useRef(0);

    // Exponer métodos de animación al componente padre
    useImperativeHandle(
      ref,
      () => ({
        animateCardChange: (cardType = "normal") => {
          animateCardChange(cardType);
        },
        animateColorChange: () => {
          animateColorChange();
        },
      }),
      [animateCardChange, animateColorChange]
    );

    // Animaciones automáticas basadas en cambios del estado público
    // Solo cuando realmente se juega una carta (discardCount aumenta)
    useEffect(() => {
      const currentDiscardCount = publicState.discardCount || 0;
      const didPlayCard = currentDiscardCount > prevDiscardCount.current;
      const topCardChanged =
        publicState.topCard && publicState.topCard !== prevTopCard.current;

      if (topCardChanged && didPlayCard) {
        // Solo animar si se jugó una carta (discardCount aumentó)
        const cardType = publicState.topCard.kind || "normal";
        console.log(
          "[CenterTable] Card played - animating for all players:",
          cardType,
          "discardCount:",
          currentDiscardCount
        );
        animateCardChange(cardType);
        prevTopCard.current = publicState.topCard;
      } else if (topCardChanged) {
        // Solo actualizar la referencia sin animar
        console.log(
          "[CenterTable] TopCard changed but no card played - skipping animation"
        );
        prevTopCard.current = publicState.topCard;
      }

      prevDiscardCount.current = currentDiscardCount;
    }, [publicState.topCard, publicState.discardCount, animateCardChange]);

    // Mantener la animación de cambio de color automática
    useEffect(() => {
      if (
        publicState.currentColor &&
        publicState.currentColor !== prevCurrentColor.current
      ) {
        console.log(
          "[CenterTable] Auto-animating color change for all players:",
          publicState.currentColor
        );
        animateColorChange();
        prevCurrentColor.current = publicState.currentColor;
      }
    }, [publicState.currentColor, animateColorChange]);
    return (
      <View style={responsiveStyles.responsiveCenterRowContainer}>
        <View style={styles.centerWrapper}>
          <View style={styles.turnHeaderContainer}>
            <Text style={styles.turnHeaderText} numberOfLines={1}>
              {publicState.gameEnded
                ? publicState.winner === me
                  ? "Ganaste"
                  : "Ganó otro jugador"
                : publicState.currentPlayer === me
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

          <View
            style={[
              responsiveStyles.responsiveCenterCircle,
              {
                backgroundColor: getTableBackgroundColor(
                  publicState.currentColor
                ),
                borderColor: getTableBorderColor(publicState.currentColor),
              },
            ]}
          >
            {/* Overlay animado para cambios de color */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: responsiveSize.centerCircle / 2,
                  backgroundColor: getTableBorderColor(
                    publicState.currentColor
                  ),
                },
                animatedColorOverlayStyle,
              ]}
              pointerEvents="none"
            />

            {/* Efecto de pulse para cartas especiales */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: -10,
                  left: -10,
                  right: -10,
                  bottom: -10,
                  borderRadius: (responsiveSize.centerCircle + 20) / 2,
                  backgroundColor: "#FFD700",
                },
                animatedPulseStyle,
              ]}
              pointerEvents="none"
            />

            <Animated.View
              style={[styles.gameElementsContainer, animatedCenterStyle]}
            >
              <View style={styles.deckDiscardRow}>
                <View style={styles.deckZone}>
                  <View style={responsiveStyles.responsiveDeckStackWrapper}>
                    {getUnoDeckStackImages(3).map((img, i) => (
                      <Image
                        key={i}
                        source={img}
                        style={[
                          responsiveStyles.responsiveDeckImage,
                          {
                            position: "absolute",
                            top: i * 1.0,
                            left: i * 1.0,
                          },
                        ]}
                      />
                    ))}
                    <Image
                      source={getUnoBackImage()}
                      style={[
                        responsiveStyles.responsiveDeckImage,
                        { opacity: 0 },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.deckCountText,
                      {
                        color: getDeckCountColor(publicState.currentColor),
                        textShadowColor:
                          publicState.currentColor?.toLowerCase() === "yellow"
                            ? "transparent"
                            : "#000",
                        textShadowRadius:
                          publicState.currentColor?.toLowerCase() === "yellow"
                            ? 0
                            : 2,
                      },
                    ]}
                  >
                    {publicState.drawCount}
                  </Text>
                </View>

                <View style={styles.discardZone}>
                  {publicState.topCard ? (
                    <View
                      style={[
                        responsiveStyles.responsiveDiscardImage,
                        {
                          borderWidth: 1,
                          borderColor: "#000000",
                          borderRadius: 12,
                          overflow: "hidden",
                        },
                      ]}
                    >
                      <Image
                        source={getUnoCardImage(publicState.topCard)}
                        style={[
                          responsiveStyles.responsiveDiscardImage,
                          {
                            position: "absolute",
                            top: -1,
                            left: -1,
                            width: "102%",
                            height: "102%",
                          },
                        ]}
                        resizeMode="stretch"
                      />
                    </View>
                  ) : (
                    <View style={responsiveStyles.responsivePlaceholderCard} />
                  )}
                </View>

                <View style={styles.spacer} />
              </View>
            </Animated.View>
          </View>
        </View>
      </View>
    );
  }
);

CenterTable.displayName = "CenterTable";

export default CenterTable;
