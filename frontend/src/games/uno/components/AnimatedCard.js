import React, { useEffect, useImperativeHandle, forwardRef } from "react";
import { Image, View } from "react-native";
import Animated from "react-native-reanimated";
import { useCardAnimations } from "../hooks/useCardAnimations";
import { useCardFeedback } from "../hooks/useCardFeedback";
import { getUnoCardImage } from "../utils/cardAssets";

/**
 * Componente de carta animada que maneja todas las animaciones
 * Puede ser controlado desde el componente padre via ref
 */
const AnimatedCard = forwardRef(
  (
    {
      card,
      style = {},
      imageStyle = {},
      isSelected = false,
      showGlow = false,
      onAnimationComplete,
      ...props
    },
    ref
  ) => {
    const {
      animatedCardStyle,
      animatedGlowStyle,
      animateSelection,
      animatePlayCard,
      animateCardEntry,
      animateBounce,
      resetAnimations,
    } = useCardAnimations();

    const {
      feedbackSelection,
      feedbackPlayCard,
      feedbackBounce,
      feedbackCardEntry,
    } = useCardFeedback();

    // Exponer métodos de animación al componente padre
    useImperativeHandle(
      ref,
      () => ({
        playCard: () => {
          feedbackPlayCard(card.kind);
          animatePlayCard(onAnimationComplete);
        },
        enterFromDeck: (index = 0) => {
          feedbackCardEntry();
          animateCardEntry(index, onAnimationComplete);
        },
        bounce: () => {
          feedbackBounce();
          animateBounce();
        },
        reset: () => {
          resetAnimations();
        },
      }),
      [
        animatePlayCard,
        animateCardEntry,
        animateBounce,
        resetAnimations,
        onAnimationComplete,
        feedbackPlayCard,
        feedbackCardEntry,
        feedbackBounce,
        card.kind,
      ]
    );

    // Animar selección cuando cambia
    useEffect(() => {
      animateSelection(isSelected);
      if (isSelected) {
        feedbackSelection();
      }
    }, [isSelected, animateSelection, feedbackSelection]);

    const cardImage = getUnoCardImage(card);

    return (
      <Animated.View style={[style, animatedCardStyle]} {...props}>
        {/* Efecto glow para selección */}
        {showGlow && (
          <Animated.View
            style={[
              {
                position: "absolute",
                top: -4,
                left: -4,
                right: -4,
                bottom: -4,
                borderRadius: 8,
                backgroundColor: "#FFD700",
                shadowColor: "#FFD700",
                shadowOpacity: 0.8,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 0 },
                elevation: 10,
              },
              animatedGlowStyle,
            ]}
            pointerEvents="none"
          />
        )}

        {/* Imagen de la carta */}
        <Image
          source={cardImage}
          style={[
            {
              width: "100%",
              height: "100%",
            },
            imageStyle,
          ]}
          resizeMode="contain"
        />
      </Animated.View>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

export default AnimatedCard;
