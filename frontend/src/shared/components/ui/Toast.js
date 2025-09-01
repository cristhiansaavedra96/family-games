import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const Toast = ({
  visible = false,
  message = "",
  type = "info", // success, error, warning, info
  duration = 3000,
  onHide,
  position = "top", // top, bottom, center
  icon,
  action,
  style,
  textStyle,
  ...props
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onHide) onHide();
    });
  };

  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "#27ae60",
          iconName: "checkmark-circle",
          iconColor: "#fff",
          textColor: "#fff",
        };
      case "error":
        return {
          backgroundColor: "#e74c3c",
          iconName: "alert-circle",
          iconColor: "#fff",
          textColor: "#fff",
        };
      case "warning":
        return {
          backgroundColor: "#f39c12",
          iconName: "warning",
          iconColor: "#fff",
          textColor: "#fff",
        };
      case "info":
      default:
        return {
          backgroundColor: "#3498db",
          iconName: "information-circle",
          iconColor: "#fff",
          textColor: "#fff",
        };
    }
  };

  const getPositionStyle = () => {
    switch (position) {
      case "top":
        return {
          top: 60,
          left: 20,
          right: 20,
        };
      case "bottom":
        return {
          bottom: 60,
          left: 20,
          right: 20,
        };
      case "center":
        return {
          top: "50%",
          left: 20,
          right: 20,
          transform: [{ translateY: -50 }],
        };
      default:
        return {
          top: 60,
          left: 20,
          right: 20,
        };
    }
  };

  const config = getTypeConfig();

  if (!visible && fadeAnim._value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          zIndex: 9999,
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: position === "bottom" ? [100, 0] : [-100, 0],
              }),
            },
          ],
        },
        getPositionStyle(),
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={action ? action.onPress : undefined}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: config.backgroundColor,
          borderRadius: 12,
          padding: 16,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        {/* Icon */}
        <View style={{ marginRight: 12 }}>
          {icon || (
            <Ionicons
              name={config.iconName}
              size={24}
              color={config.iconColor}
            />
          )}
        </View>

        {/* Message */}
        <Text
          style={[
            {
              flex: 1,
              fontSize: 16,
              fontWeight: "600",
              color: config.textColor,
              lineHeight: 22,
            },
            textStyle,
          ]}
        >
          {message}
        </Text>

        {/* Action */}
        {action && (
          <TouchableOpacity
            onPress={action.onPress}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 6,
              marginLeft: 12,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#fff",
              }}
            >
              {action.text}
            </Text>
          </TouchableOpacity>
        )}

        {/* Dismiss button */}
        <TouchableOpacity
          onPress={hideToast}
          style={{
            marginLeft: 8,
            padding: 4,
          }}
        >
          <Ionicons name="close" size={20} color={config.iconColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Toast;
