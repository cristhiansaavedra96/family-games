import React from "react";
import { View } from "react-native";
import { Modal, Button, Typography } from "../../components/ui";

/**
 * ConfirmModal reutilizable.
 * Props:
 *  - visible: boolean
 *  - title: string
 *  - message: string | ReactNode
 *  - confirmLabel: string (default 'Confirmar')
 *  - cancelLabel: string (default 'Cancelar')
 *  - variant: 'danger' | 'primary' | 'neutral' (estilo del botón principal)
 *  - icon: ReactNode (opcional arriba del título)
 *  - onConfirm: () => void
 *  - onCancel: () => void
 *  - loading: boolean (deshabilita botones)
 */
const ConfirmModal = ({
  visible,
  title = "¿Estás seguro?",
  message = "Confirma esta acción.",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  icon = null,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const primaryVariant =
    variant === "danger"
      ? "danger"
      : variant === "primary"
      ? "primary"
      : "secondary";

  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      variant="centered"
      showCloseButton={false}
      closeOnBackdropPress={!loading}
      backgroundColor="rgba(0,0,0,0.75)"
      contentStyle={{
        width: "88%",
        maxWidth: 340,
        paddingTop: 28,
        paddingBottom: 22,
        paddingHorizontal: 22,
      }}
    >
      {/* Icono opcional */}
      {icon && (
        <View style={{ alignItems: "center", marginBottom: 12 }}>{icon}</View>
      )}

      <Typography
        variant="heading3"
        style={{ textAlign: "center", marginBottom: 10, color: "#2c3e50" }}
      >
        {title}
      </Typography>

      {typeof message === "string" ? (
        <Typography
          variant="body"
          style={{ textAlign: "center", marginBottom: 22, color: "#646d76" }}
        >
          {message}
        </Typography>
      ) : (
        <View style={{ marginBottom: 22 }}>{message}</View>
      )}

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button
          title={cancelLabel}
          variant="secondary"
          size="medium"
          disabled={loading}
          onPress={onCancel}
          style={{ flex: 1 }}
        />
        <Button
          title={confirmLabel}
          variant={primaryVariant}
          size="medium"
          disabled={loading}
          onPress={onConfirm}
          style={{ flex: 1 }}
        />
      </View>
    </Modal>
  );
};

export default ConfirmModal;
