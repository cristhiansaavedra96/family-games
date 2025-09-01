import { useState } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../src/shared/components/ui";
import { setUsername } from "../src/shared/utils";

export default function Login() {
  const [username, setUsernameState] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Por favor ingresa tu nombre de usuario");
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert(
        "Error",
        "El nombre de usuario debe tener al menos 3 caracteres"
      );
      return;
    }

    setLoading(true);
    const success = await setUsername(username.trim());

    if (success) {
      router.replace("/gameSelect");
    } else {
      Alert.alert("Error", "No se pudo guardar el nombre de usuario");
    }
    setLoading(false);
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: "#2c3e50" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
          <View
            style={{ flex: 1, justifyContent: "center", paddingHorizontal: 40 }}
          >
            {/* Icon */}
            <View style={{ alignItems: "center", marginBottom: 60 }}>
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <Ionicons name="person" size={60} color="white" />
              </View>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "700",
                  color: "white",
                  textAlign: "center",
                  fontFamily: "Montserrat_700Bold",
                }}
              >
                Bienvenido
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.8)",
                  textAlign: "center",
                  marginTop: 8,
                  fontFamily: "Montserrat_400Regular",
                }}
              >
                Ingresa tu nombre de usuario para continuar
              </Text>
            </View>

            {/* Username Input */}
            <View style={{ marginBottom: 40 }}>
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                  fontWeight: "600",
                  marginBottom: 12,
                  fontFamily: "Montserrat_600SemiBold",
                }}
              >
                Nombre de Usuario
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsernameState}
                placeholder="Ej: juan_familia"
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  fontSize: 16,
                  color: "white",
                  fontFamily: "Montserrat_400Regular",
                  borderWidth: 2,
                  borderColor: username.trim()
                    ? "rgba(255,255,255,0.3)"
                    : "transparent",
                }}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 12,
                  marginTop: 8,
                  fontFamily: "Montserrat_400Regular",
                }}
              >
                Este nombre te permitirá recuperar tus datos si cambias de
                dispositivo
              </Text>
            </View>

            {/* Login Button */}
            <Button
              title={loading ? "Guardando..." : "Continuar"}
              onPress={handleLogin}
              disabled={!username.trim() || loading}
              loading={loading}
              variant="primary"
              size="large"
              icon={
                !loading && (
                  <Ionicons name="arrow-forward" size={20} color="white" />
                )
              }
              style={{
                backgroundColor:
                  username.trim() && !loading
                    ? "#e74c3c"
                    : "rgba(255,255,255,0.2)",
                shadowColor:
                  username.trim() && !loading ? "#e74c3c" : "transparent",
                elevation: username.trim() && !loading ? 8 : 0,
              }}
            />
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}
