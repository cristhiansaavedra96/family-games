import React from "react";
import { View, TouchableOpacity } from "react-native";

/**
 * Card reutilizable con diferentes elevaciones y estilos
 */
export const Card = ({
  children,
  onPress,
  variant = "default",
  padding = "medium",
  disabled = false,
  style = {},
  ...props
}) => {
  // Estilos por variante
  const variants = {
    default: {
      backgroundColor: "#fff",
      shadowColor: "#000",
      shadowOpacity: 0.1,
      elevation: 3,
    },
    elevated: {
      backgroundColor: "#fff",
      shadowColor: "#000",
      shadowOpacity: 0.15,
      elevation: 6,
    },
    outlined: {
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#e9ecef",
      shadowOpacity: 0,
      elevation: 0,
    },
    flat: {
      backgroundColor: "#f8f9fa",
      shadowOpacity: 0,
      elevation: 0,
    },
  };

  // Estilos por padding
  const paddings = {
    none: { padding: 0 },
    small: { padding: 12 },
    medium: { padding: 16 },
    large: { padding: 24 },
  };

  const variantStyle = variants[variant] || variants.default;
  const paddingStyle = paddings[padding] || paddings.medium;

  const cardStyle = {
    borderRadius: 12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    opacity: disabled ? 0.6 : 1,
    ...variantStyle,
    ...paddingStyle,
    ...style,
  };

  // Si tiene onPress, es un TouchableOpacity, sino un View
  const Component = onPress ? TouchableOpacity : View;

  const touchableProps = onPress
    ? {
        onPress,
        disabled,
        activeOpacity: 0.8,
      }
    : {};

  return (
    <Component style={cardStyle} {...touchableProps} {...props}>
      {children}
    </Component>
  );
};
