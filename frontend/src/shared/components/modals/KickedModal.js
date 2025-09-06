import React from "react";
import { View } from "react-native";
import { Modal, Button, Typography } from "../../components/ui";

const KickedModal = ({
  visible,
  onClose,
  title = "Has sido expulsado",
  message = "El anfitrión te expulsó de la sala.",
  actionLabel = "Aceptar",
}) => {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="centered"
      showCloseButton={false}
      closeOnBackdropPress={false}
      backgroundColor="rgba(0,0,0,0.85)"
      contentStyle={{
        width: "88%",
        maxWidth: 340,
        paddingTop: 30,
        paddingBottom: 24,
        paddingHorizontal: 24,
      }}
    >
      <Typography
        variant="heading3"
        style={{ textAlign: "center", marginBottom: 12, color: "#c0392b" }}
      >
        {title}
      </Typography>

      <Typography
        variant="body"
        style={{ textAlign: "center", marginBottom: 26, color: "#7f8c8d" }}
      >
        {message}
      </Typography>

      <View>
        <Button
          title={actionLabel}
          variant="danger"
          size="large"
          onPress={onClose}
          style={{ width: "100%" }}
        />
      </View>
    </Modal>
  );
};

export default KickedModal;
