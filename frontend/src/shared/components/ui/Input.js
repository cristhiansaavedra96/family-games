import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Input reutilizable con diferentes estados y validación
 */
export const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  secureTextEntry = false,
  keyboardType = "default",
  maxLength,
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  onRightIconPress = null,
  style = {},
  inputStyle = {},
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  const containerStyle = {
    marginVertical: 8,
    ...style,
  };

  const inputContainerStyle = {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: error ? "#e74c3c" : isFocused ? "#3498db" : "#e9ecef",
    paddingHorizontal: 16,
    paddingVertical: multiline ? 12 : 16,
    opacity: disabled ? 0.6 : 1,
  };

  const textInputStyle = {
    flex: 1,
    fontSize: 16,
    color: "#2c3e50",
    fontFamily: "Montserrat_400Regular",
    marginLeft: leftIcon ? 12 : 0,
    marginRight: rightIcon || secureTextEntry ? 12 : 0,
    textAlignVertical: multiline ? "top" : "center",
    ...inputStyle,
  };

  const labelStyle = {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 6,
    fontFamily: "Montserrat_600SemiBold",
  };

  const errorStyle = {
    fontSize: 12,
    color: "#e74c3c",
    marginTop: 4,
    fontFamily: "Montserrat_400Regular",
  };

  const helperStyle = {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
    fontFamily: "Montserrat_400Regular",
  };

  const handleRightIconPress = () => {
    if (secureTextEntry) {
      setShowPassword(!showPassword);
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  return (
    <View style={containerStyle}>
      {label && <Text style={labelStyle}>{label}</Text>}

      <View style={inputContainerStyle}>
        {leftIcon && leftIcon}

        <TextInput
          style={textInputStyle}
          placeholder={placeholder}
          placeholderTextColor="#95a5a6"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          {...props}
        />

        {(rightIcon || secureTextEntry) && (
          <TouchableOpacity
            onPress={handleRightIconPress}
            disabled={!secureTextEntry && !onRightIconPress}
          >
            {secureTextEntry ? (
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#95a5a6"
              />
            ) : (
              rightIcon
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={errorStyle}>{error}</Text>}
      {helperText && !error && <Text style={helperStyle}>{helperText}</Text>}
    </View>
  );
};
