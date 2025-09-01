import React from "react";
import { Text } from "react-native";
import { typography, colors } from "../../config/theme";

const Typography = ({
  variant = "body", // heading1, heading2, heading3, heading4, body, caption, button
  size, // override size
  weight, // override weight
  color = "text.primary",
  align = "left",
  noLineHeight = false, // Para desactivar lineHeight si hay problemas
  children,
  style,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "heading1":
        return {
          fontSize: typography.fontSize["3xl"],
          fontWeight: typography.fontWeight.bold,
          lineHeight: typography.fontSize["3xl"] * 1.3, // Uso lineHeight absoluto
          fontFamily: typography.fontFamily.bold,
        };

      case "heading2":
        return {
          fontSize: typography.fontSize["2xl"],
          fontWeight: typography.fontWeight.bold,
          lineHeight: typography.fontSize["2xl"] * 1.3,
          fontFamily: typography.fontFamily.bold,
        };

      case "heading3":
        return {
          fontSize: typography.fontSize["xl"],
          fontWeight: typography.fontWeight.semibold,
          lineHeight: typography.fontSize["xl"] * 1.3,
          fontFamily: typography.fontFamily.semibold,
        };

      case "heading4":
        return {
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          lineHeight: typography.fontSize.xl * 1.4,
          fontFamily: typography.fontFamily.semibold,
        };

      case "body":
        return {
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.normal,
          lineHeight: typography.fontSize.base * 1.5,
          fontFamily: typography.fontFamily.regular,
        };

      case "caption":
        return {
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.normal,
          lineHeight: typography.fontSize.sm * 1.4,
          fontFamily: typography.fontFamily.regular,
        };

      case "small":
        return {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.normal,
          lineHeight: typography.fontSize.xs * 1.4,
          fontFamily: typography.fontFamily.regular,
        };

      case "button":
        return {
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.semibold,
          lineHeight: typography.fontSize.base * 1.2, // Para botones más compacto
          fontFamily: typography.fontFamily.semibold,
        };

      default:
        return {
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.normal,
          lineHeight: typography.fontSize.base * 1.5,
          fontFamily: typography.fontFamily.regular,
        };
    }
  };

  const getColor = (colorPath) => {
    const paths = colorPath.split(".");
    let result = colors;

    for (const path of paths) {
      result = result[path];
      if (!result) return colors.text.primary; // fallback
    }

    return result;
  };

  const variantStyle = getVariantStyle();

  const finalStyle = {
    ...variantStyle,
    fontSize: size || variantStyle.fontSize,
    fontWeight: weight || variantStyle.fontWeight,
    color: getColor(color),
    textAlign: align,
  };

  // Remover lineHeight si se especifica
  if (noLineHeight) {
    delete finalStyle.lineHeight;
  }

  return (
    <Text style={[finalStyle, style]} {...props}>
      {children}
    </Text>
  );
};

export default Typography;
