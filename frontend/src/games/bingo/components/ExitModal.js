import React from "react";
import { View } from "react-native";
import Modal from "../../../shared/components/ui/Modal";
import Typography from "../../../shared/components/ui/Typography";
import Button from "../../../shared/components/ui/Button";

const ExitModal = ({ visible, onClose, onConfirm }) => {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="centered"
      showCloseButton={false}
      closeOnBackdropPress={true}
      backgroundColor="rgba(0,0,0,0.8)"
      contentStyle={{
        width: "90%",
        maxWidth: 320,
      }}
    >
      {/* Título */}
      <Typography
        variant="heading3"
        style={{
          textAlign: "center",
          marginBottom: 12,
          color: "#2c3e50",
        }}
      >
        ¿Salir de la partida?
      </Typography>

      {/* Descripción */}
      <Typography
        variant="body"
        style={{
          textAlign: "center",
          marginBottom: 20,
          color: "#7f8c8d",
        }}
      >
        Perderás tu progreso actual en el juego
      </Typography>

      {/* Botones */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button
          title="Cancelar"
          variant="secondary"
          size="medium"
          onPress={onClose}
          style={{ flex: 1 }}
        />

        <Button
          title="Salir"
          variant="danger"
          size="medium"
          onPress={onConfirm}
          style={{ flex: 1 }}
        />
      </View>
    </Modal>
  );
};

export default ExitModal;
