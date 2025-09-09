import React from "react";
import { View, Text, Image } from "react-native";
import {
  getUnoCardImage,
  getUnoBackImage,
  getUnoDeckStackImages,
} from "../utils/cardAssets";
import {
  shortId,
  getTableBackgroundColor,
  getTableBorderColor,
} from "../utils/gameHelpers";

export default function CenterTable({
  publicState,
  responsiveStyles,
  responsiveSize,
  styles,
  me,
}) {
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
          <View style={styles.gameElementsContainer}>
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
                <Text style={styles.deckCountText}>
                  {publicState.drawCount}
                </Text>
              </View>

              <View style={styles.discardZone}>
                {publicState.topCard ? (
                  <Image
                    source={getUnoCardImage(publicState.topCard)}
                    style={responsiveStyles.responsiveDiscardImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={responsiveStyles.responsivePlaceholderCard} />
                )}
              </View>

              <View style={styles.spacer} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
