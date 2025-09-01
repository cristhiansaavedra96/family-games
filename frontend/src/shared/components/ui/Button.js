import React from "react";
import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

/**
 * Botón reutilizable con diferentes variantes y tamaños
 */
export const Button = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  icon = null,
  leftIcon = null, // Nuevo prop para icono a la izquierda
  style = {},
  textStyle = {},
  children, // Soporte para children como alternativa a title
  ...props
}) => {
  // Estilos base por variante
  const variants = {
    primary: {
      backgroundColor: "#e74c3c",
      shadowColor: "#e74c3c",
    },
    secondary: {
      backgroundColor: "#3498db",
      shadowColor: "#3498db",
    },
    success: {
      backgroundColor: "#27ae60",
      shadowColor: "#27ae60",
    },
    danger: {
      backgroundColor: "#e74c3c",
      shadowColor: "#e74c3c",
    },
    custom: {
      // Para variante custom, los estilos se aplican via style prop
      backgroundColor: "transparent",
    },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: "#e74c3c",
    },
    ghost: {
      backgroundColor: "transparent",
    },
  };

  // Estilos por tamaño
  const sizes = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: 14,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      fontSize: 16,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      fontSize: 18,
    },
  };

  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle = sizes[size] || sizes.medium;

  const buttonStyle = {
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowOpacity: variant === "outline" || variant === "ghost" ? 0 : 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: variant === "outline" || variant === "ghost" ? 0 : 6,
    opacity: disabled || loading ? 0.6 : 1,
    ...variantStyle,
    paddingVertical: sizeStyle.paddingVertical,
    paddingHorizontal: sizeStyle.paddingHorizontal,
    ...style,
  };

  const getTextColor = () => {
    // Si hay estilo personalizado para el texto, usarlo primero
    if (textStyle?.color) return textStyle.color;

    if (variant === "outline") return "#e74c3c";
    if (variant === "ghost") return "#2c3e50";
    return "#fff";
  };

  const defaultTextStyle = {
    fontSize: sizeStyle.fontSize,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
    marginLeft: (icon || leftIcon) && (title || children) ? 8 : 0,
    color: getTextColor(),
  };

  const displayText = title || children;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
          style={{ marginRight: displayText ? 8 : 0 }}
        />
      )}

      {!loading && (leftIcon || icon) && (leftIcon || icon)}

      {displayText && (
        <Text
          style={[defaultTextStyle, textStyle]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
        >
          {displayText}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
