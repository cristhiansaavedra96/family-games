import React from "react";
import { View, ActivityIndicator, Text, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const LoadingSpinner = ({
  size = "large",
  color = "#e74c3c",
  message = "Cargando...",
  showMessage = true,
  fullScreen = false,
  backgroundColor = "rgba(0,0,0,0.5)",
  ...props
}) => {
  const getSizeValue = () => {
    switch (size) {
      case "small":
        return "small";
      case "large":
        return "large";
      case "custom":
        return props.customSize || 40;
      default:
        return "large";
    }
  };

  const getSpinnerSize = () => {
    switch (size) {
      case "small":
        return 20;
      case "large":
        return 40;
      case "custom":
        return props.customSize || 40;
      default:
        return 40;
    }
  };

  if (fullScreen) {
    return (
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          ...props.style,
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 24,
            alignItems: "center",
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 10,
          }}
        >
          <ActivityIndicator size={getSizeValue()} color={color} />
          {showMessage && (
            <Text
              style={{
                marginTop: 12,
                fontSize: 16,
                color: "#2c3e50",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {message}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        ...props.style,
      }}
    >
      <ActivityIndicator size={getSizeValue()} color={color} />
      {showMessage && (
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: "#7f8c8d",
            fontWeight: "500",
            textAlign: "center",
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

export default LoadingSpinner;
