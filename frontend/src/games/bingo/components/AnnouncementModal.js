import React from "react";
import { View, Image } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getFigureLabel } from "../utils/layout";
import Modal from "../../../shared/components/ui/Modal";
import Typography from "../../../shared/components/ui/Typography";
import Button from "../../../shared/components/ui/Button";

const AnnouncementModal = ({ visible, announce, getAvatarUrl, onClose }) => {
  if (!announce) {
    return null;
  }

  // Obtener icono según la figura
  const getFigureIcon = (figure) => {
    switch (figure) {
      case "full":
        return "trophy";
      case "border":
        return "border-all";
      case "diagonal":
        return "slash-forward";
      case "corners":
        return "border-none-variant";
      case "row":
        return "minus";
      case "column":
        return "minus-thick";
      default:
        return "check-circle";
    }
  };

  const getFigureColor = (figure) => {
    switch (figure) {
      case "full":
        return "#ffd700"; // Dorado para cartón lleno
      case "border":
        return "#e74c3c"; // Rojo para contorno
      case "diagonal":
        return "#9b59b6"; // Púrpura para diagonal
      case "corners":
        return "#f39c12"; // Naranja para esquinas
      case "row":
        return "#2ecc71"; // Verde para línea
      case "column":
        return "#3498db"; // Azul para columna
      default:
        return "#27ae60";
    }
  };

  const mainFigure = announce?.figures?.[0] || "unknown";
  const figureColor = getFigureColor(mainFigure);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="centered"
      showCloseButton={false}
      closeOnBackdropPress={true}
      backgroundColor="rgba(0,0,0,0.95)"
      contentStyle={{
        backgroundColor: "#2c3e50",
        width: "95%",
        maxWidth: 420,
        borderWidth: 2,
        borderColor: figureColor,
        alignItems: "center",
      }}
    >
      {/* Icono de figura en grande */}
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: figureColor,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          alignSelf: "center",
          shadowColor: figureColor,
          shadowOpacity: 0.5,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <MaterialCommunityIcons
          name={getFigureIcon(mainFigure)}
          size={50}
          color="#fff"
        />
      </View>

      {/* Nombre de la figura en grande */}
      <Typography
        variant="heading2"
        style={{
          marginBottom: 16,
          color: "#fff",
          textAlign: "center",
          textShadowColor: "rgba(0,0,0,0.5)",
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2,
        }}
      >
        {announce?.figures?.map((fig) => getFigureLabel(fig)).join(", ")}
      </Typography>

      {/* Avatar del jugador */}
      {getAvatarUrl(announce?.playerUsername) ? (
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            overflow: "hidden",
            borderWidth: 5,
            borderColor: figureColor,
            marginBottom: 16,
            alignSelf: "center",
          }}
        >
          <Image
            source={{ uri: getAvatarUrl(announce.playerUsername) }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
            }}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: figureColor,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            borderWidth: 5,
            borderColor: "#fff",
            alignSelf: "center",
          }}
        >
          <Typography
            variant="heading1"
            style={{
              color: "#fff",
              fontSize: 36,
            }}
          >
            {announce?.playerName?.[0]?.toUpperCase() || "?"}
          </Typography>
        </View>
      )}

      {/* Nombre del jugador en grande */}
      <Typography
        variant="heading3"
        style={{
          marginBottom: 8,
          color: "#fff",
          textAlign: "center",
        }}
      >
        {announce?.playerName || "Jugador"}
      </Typography>

      {/* Mensaje de felicitación */}
      <Typography
        variant="body"
        style={{
          textAlign: "center",
          color: "#ecf0f1",
          marginBottom: 20,
        }}
      >
        ¡Ha completado una figura!
      </Typography>

      {/* Botón para continuar */}
      <Button
        title="Continuar"
        variant="custom"
        size="medium"
        onPress={onClose}
        style={{
          backgroundColor: figureColor,
          shadowColor: figureColor,
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
        leftIcon={
          <Ionicons
            name="play-forward"
            size={16}
            color="#fff"
            style={{ marginRight: 8 }}
          />
        }
      />
    </Modal>
  );
};

export default AnnouncementModal;
