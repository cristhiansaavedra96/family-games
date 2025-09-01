import React from "react";
import { View, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Modal from "../../../shared/components/ui/Modal";
import Typography from "../../../shared/components/ui/Typography";
import Button from "../../../shared/components/ui/Button";

const SpeedSelectModal = ({
  visible,
  currentSpeed = 1,
  onSpeedChange,
  onClose,
}) => {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5];

  const handleSpeedSelect = (speed) => {
    onSpeedChange && onSpeedChange(speed);
    onClose && onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="centered"
      title="Velocidad de juego"
      showCloseButton={false}
      closeOnBackdropPress={true}
      backgroundColor="rgba(0,0,0,0.3)"
      contentStyle={{
        minWidth: 180,
        maxWidth: 260,
        alignItems: "center",
      }}
    >
      {/* Lista de velocidades */}
      <View style={{ width: "100%", marginBottom: 16 }}>
        {speeds.map((speed) => (
          <TouchableOpacity
            key={speed}
            onPress={() => handleSpeedSelect(speed)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 12,
              marginBottom: 6,
              backgroundColor: speed === currentSpeed ? "#2c3e50" : "#f5f7fa",
              minWidth: 160,
            }}
          >
            <MaterialCommunityIcons
              name="fast-forward"
              size={18}
              color={speed === currentSpeed ? "#fff" : "#2c3e50"}
            />
            <Typography
              variant="body"
              style={{
                marginLeft: 12,
                fontWeight: "700",
                color: speed === currentSpeed ? "#fff" : "#2c3e50",
              }}
            >
              {speed}x
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      {/* Botón de cancelar */}
      <Button
        title="Cancelar"
        variant="ghost"
        size="small"
        onPress={onClose}
        textStyle={{
          color: "#e74c3c",
        }}
      />
    </Modal>
  );
};

export default SpeedSelectModal;
