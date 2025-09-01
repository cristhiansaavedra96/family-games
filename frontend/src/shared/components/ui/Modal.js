import React from "react";
import { View, TouchableOpacity, Dimensions, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "./Button";
import Typography from "./Typography";

const { width, height } = Dimensions.get("window");

const Modal = ({
  visible = false,
  onClose,
  title,
  children,
  variant = "default", // default, fullscreen, bottom-sheet, centered
  showCloseButton = true,
  closable = true,
  closeOnBackdropPress = true,
  backgroundColor = "rgba(0,0,0,0.8)",
  containerStyle,
  headerStyle,
  titleStyle,
  contentStyle,
  ...props
}) => {
  // Si no es visible, no renderizar nada
  if (!visible) return null;

  const getModalStyle = () => {
    switch (variant) {
      case "fullscreen":
        return {
          flex: 1,
          backgroundColor: "#fff",
        };

      case "bottom-sheet":
        return {
          flex: 1,
          justifyContent: "flex-end",
        };

      case "centered":
        return {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        };

      default: // default
        return {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        };
    }
  };

  const getContentStyle = () => {
    switch (variant) {
      case "fullscreen":
        return {
          flex: 1,
        };

      case "bottom-sheet":
        return {
          backgroundColor: "#fff",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 20,
          paddingHorizontal: 20,
          paddingBottom: 40,
          maxHeight: height * 0.8,
        };

      case "centered":
        return {
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 20,
          width: "90%",
          maxWidth: 400,
          maxHeight: height * 0.8,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 10,
        };

      default:
        return {
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 20,
          width: "100%",
          maxWidth: 400,
          maxHeight: height * 0.8,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 10,
        };
    }
  };

  const handleBackdropPress = () => {
    // En fullscreen no permitir cerrar por backdrop
    if (variant === "fullscreen") return;

    if (closable && closeOnBackdropPress && onClose) {
      onClose();
    }
  };

  return (
    <View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          backgroundColor,
        },
        getModalStyle(),
        containerStyle,
      ]}
      {...props}
    >
      {/* Backdrop TouchableOpacity que cubre toda la pantalla */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        activeOpacity={1}
        onPress={handleBackdropPress}
      />

      {/* Contenido del modal */}
      <View
        style={[
          {
            flex: 1,
            justifyContent:
              variant === "centered" || variant === "default"
                ? "center"
                : "flex-start",
            alignItems:
              variant === "centered" || variant === "default"
                ? "center"
                : "stretch",
            paddingHorizontal:
              variant === "centered" || variant === "default"
                ? contentStyle?.width
                  ? 0
                  : 20 // Si hay width personalizado, no agregar padding
                : 0,
          },
        ]}
        pointerEvents="box-none" // Permite que los toques pasen al backdrop
      >
        <View
          style={[
            getContentStyle(),
            variant === "fullscreen"
              ? { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }
              : {},
            contentStyle, // Mover contentStyle al final para que sobrescriba
          ]}
          pointerEvents="auto" // El contenido captura los toques
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f1f2f6",
                },
                headerStyle,
              ]}
            >
              <Typography
                variant="heading3"
                style={[
                  {
                    color: "#2c3e50",
                    flex: 1,
                  },
                  titleStyle,
                ]}
              >
                {title || ""}
              </Typography>

              {showCloseButton && closable && (
                <TouchableOpacity
                  onPress={onClose}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#dcdee0ff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 12,
                  }}
                >
                  <Ionicons name="close" size={18} color="#383c3cff" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content */}
          <View style={{ flex: variant === "fullscreen" ? 1 : 0 }}>
            {children}
          </View>
        </View>
      </View>
    </View>
  );
};

export default Modal;
