import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
// import * as Updates from 'expo-updates';
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import socket from "../src/core/socket";
import { getUsername } from "../src/shared/utils";

export default function Profile() {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarBase64, setAvatarBase64] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Cargar datos existentes
  useEffect(() => {
    loadProfile();

    // Monitorear conexión del socket
    let firstConnect = true;
    const onConnect = () => {
      setSocketConnected(true);
      if (firstConnect) {
        firstConnect = false;
        Alert.alert("Conexión exitosa", "Conectado al servidor correctamente.");
      }
    };
    const onDisconnect = () => {
      setSocketConnected(false);
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar al servidor. Verifica tu conexión a internet o intenta más tarde."
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setSocketConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const loadProfile = async () => {
    try {
      const savedName = await AsyncStorage.getItem("profile:name");
      const savedAvatar = await AsyncStorage.getItem("profile:avatar");
      const currentUsername = await getUsername();

      if (savedName) setName(savedName);
      if (savedAvatar) {
        setAvatar(savedAvatar);
        // Si tenemos avatar local, convertir a base64 para enviar al servidor
        try {
          const base64 = await FileSystem.readAsStringAsync(savedAvatar, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setAvatarBase64(`data:image/jpeg;base64,${base64}`);
        } catch (e) {
          console.error("❌ Error converting saved avatar to base64:", e);
        }
      }
      if (currentUsername) setUsername(currentUsername);
    } catch (error) {
      console.log("Error loading profile:", error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permisos",
          "Necesitamos acceso a tu galería para seleccionar una foto"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3, // Reducir de 0.8 a 0.3 para menor tamaño
        base64: true, // Obtener base64 directamente del picker
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;
        setAvatar(uri);

        // Usar base64 directamente del ImagePicker (más eficiente y comprimido)
        if (asset.base64) {
          const base64 = asset.base64;
          // Verificar si aún es demasiado grande
          const sizeInMB = base64.length / 1024 / 1024;
          if (sizeInMB > 0.5) {
            console.warn(
              "⚠️ Avatar base64 is still large:",
              sizeInMB.toFixed(2),
              "MB"
            );
            // Podrías mostrar un warning al usuario o comprimir más
          }

          setAvatarBase64(`data:image/jpeg;base64,${base64}`);
        } else {
          // Fallback al método anterior si no hay base64 directo
          try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });

            const sizeInMB = base64.length / 1024 / 1024;
            if (sizeInMB > 0.5) {
              console.warn(
                "⚠️ Avatar base64 is large:",
                sizeInMB.toFixed(2),
                "MB"
              );
            }

            setAvatarBase64(`data:image/jpeg;base64,${base64}`);
          } catch (e) {
            console.error("❌ Error converting image to base64:", e);
            Alert.alert("Error", "No se pudo procesar la imagen");
          }
        }
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Por favor ingresa tu nombre");
      return;
    }

    if (!username) {
      Alert.alert("Error", "No se encontró nombre de usuario");
      return;
    }

    setIsLoading(true);

    try {
      // Guardar localmente primero
      await AsyncStorage.setItem("profile:name", name.trim());
      if (avatar) {
        await AsyncStorage.setItem("profile:avatar", avatar);
      }

      // Asegurar conexión del socket con reintentos
      let attempts = 0;
      const maxAttempts = 3;

      while (!socket.connected && attempts < maxAttempts) {
        attempts++;
        socket.connect();

        // Esperar hasta que se conecte o timeout
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            socket.off("connect", onConnect);
            reject(new Error(`Connection attempt ${attempts} failed`));
          }, 3000);

          const onConnect = () => {
            clearTimeout(timeout);
            socket.off("connect", onConnect);
            console.log("Socket connected successfully");
            resolve();
          };

          if (socket.connected) {
            clearTimeout(timeout);
            resolve();
          } else {
            socket.on("connect", onConnect);
          }
        });
      }

      if (!socket.connected) {
        throw new Error(
          "No se pudo conectar al servidor después de varios intentos"
        );
      }

      // Preparar los datos
      const profileData = {
        username,
        name: name.trim(),
        avatarUrl: avatarBase64 || null,
      };

      // Validación final de tamaño antes de enviar
      if (avatarBase64 && avatarBase64.length > 800 * 1024) {
        // Máximo 800KB
        console.error(
          "❌ Avatar too large for transmission:",
          (avatarBase64.length / 1024).toFixed(2),
          "KB"
        );
        Alert.alert(
          "Imagen muy grande",
          "La imagen seleccionada es demasiado grande. Por favor, selecciona una imagen más pequeña.",
          [{ text: "OK" }]
        );
        return;
      }

      // Enviar al servidor con timeout más largo
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error("⏰ Timeout waiting for server response");
          reject(new Error("Timeout"));
        }, 15000); // 15 segundos

        socket.emit("updateProfile", profileData, (response) => {
          clearTimeout(timeout);

          if (response?.ok) {
            resolve(response);
          } else {
            reject(new Error(response?.error || "Error del servidor"));
          }
        });
      });
      router.replace("/gameSelect");
    } catch (error) {
      console.error("Error saving profile:", error);

      let errorMessage = "No se pudo guardar el perfil";
      if (error.message === "Timeout") {
        errorMessage =
          "Tiempo de espera agotado. El servidor puede estar ocupado, intenta de nuevo.";
      } else if (error.message.includes("conectar")) {
        errorMessage =
          "No se pudo conectar al servidor. Verifica tu conexión a internet.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    return (
      name
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?"
    );
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: "#2c3e50" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
          <ScrollView
            style={{ flex: 1, backgroundColor: "#f8f9fa" }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header con color sólido oscuro - efecto wave */}
            <View
              style={{
                backgroundColor: "#2c3e50",
                paddingTop: 80, // Aumentado para compensar el marginTop
                paddingBottom: 40,
                paddingHorizontal: 20,
                borderBottomLeftRadius: 30,
                borderBottomRightRadius: 30,
                marginTop: -40, // Reducido para que no suba tanto
              }}
            >
              {/* Back button */}
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  position: "absolute",
                  top: 60, // Ajustado para el nuevo paddingTop
                  left: 20,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.3)",
                }}
              >
                <Ionicons name="arrow-back" size={20} color="white" />
              </TouchableOpacity>

              {/* Connection status indicator */}
              <View
                style={{
                  position: "absolute",
                  top: 60,
                  right: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: socketConnected
                    ? "rgba(76, 175, 80, 0.2)"
                    : "rgba(244, 67, 54, 0.2)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: socketConnected
                    ? "rgba(76, 175, 80, 0.5)"
                    : "rgba(244, 67, 54, 0.5)",
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: socketConnected ? "#4CAF50" : "#F44336",
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: "white",
                    fontFamily: "Montserrat_500Medium",
                  }}
                >
                  {socketConnected ? "Conectado" : "Desconectado"}
                </Text>
              </View>

              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "700",
                    color: "white",
                    marginBottom: 20,
                    fontFamily: "Montserrat_700Bold",
                  }}
                >
                  Mi Perfil
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: "rgba(255,255,255,0.8)",
                    textAlign: "center",
                    fontFamily: "Montserrat_400Regular",
                  }}
                >
                  Personaliza tu experiencia de juego
                </Text>
              </View>
            </View>

            {/* Avatar Section */}
            <View
              style={{ alignItems: "center", marginTop: -30, marginBottom: 30 }}
            >
              <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                <View
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: "#fff",
                    shadowColor: "#000",
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 10,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {avatar ? (
                    <Image
                      source={{ uri: avatar }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 60,
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#34495e",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 60,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 32,
                          fontWeight: "700",
                          color: "white",
                          fontFamily: "Montserrat_700Bold",
                        }}
                      >
                        {getInitials()}
                      </Text>
                    </View>
                  )}

                  {/* Camera icon overlay */}
                  <View
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "#34495e",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 3,
                      borderColor: "#fff",
                    }}
                  >
                    <Ionicons name="camera" size={16} color="white" />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={pickImage} style={{ marginTop: 12 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#34495e",
                    fontWeight: "600",
                    fontFamily: "Montserrat_600SemiBold",
                  }}
                >
                  {avatar ? "Cambiar foto" : "Agregar foto"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Section */}
            <View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 20,
                  padding: 24,
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#2c3e50",
                    marginBottom: 12,
                    fontFamily: "Montserrat_600SemiBold",
                  }}
                >
                  Nombre de usuario
                </Text>

                <TextInput
                  placeholder="Ingresa tu nombre"
                  value={name}
                  onChangeText={setName}
                  style={{
                    fontSize: 18,
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: "#f8f9fa",
                    borderWidth: 2,
                    borderColor: name.trim() ? "#34495e" : "#e1e5e9",
                    color: "#2c3e50",
                    fontFamily: "Montserrat_500Medium",
                  }}
                  maxLength={20}
                  autoCapitalize="words"
                />

                <Text
                  style={{
                    fontSize: 12,
                    color: "#7f8c8d",
                    marginTop: 8,
                    fontFamily: "Montserrat_400Regular",
                  }}
                >
                  Este será tu nombre visible para otros jugadores
                </Text>
              </View>
            </View>

            {/* Save Button */}
            <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
              <TouchableOpacity
                onPress={saveProfile}
                disabled={!name.trim() || isLoading || !socketConnected}
                style={{
                  backgroundColor:
                    name.trim() && socketConnected ? "#34495e" : "#bdc3c7",
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: "center",
                  shadowColor:
                    name.trim() && socketConnected ? "#34495e" : "transparent",
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: name.trim() && socketConnected ? 8 : 0,
                }}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "white",
                        marginRight: 8,
                        fontFamily: "Montserrat_700Bold",
                      }}
                    >
                      Guardando...
                    </Text>
                  </View>
                ) : !socketConnected ? (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="cloud-offline" size={24} color="white" />
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "white",
                        marginLeft: 8,
                        fontFamily: "Montserrat_700Bold",
                      }}
                    >
                      Sin Conexión
                    </Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "white",
                        marginLeft: 8,
                        fontFamily: "Montserrat_700Bold",
                      }}
                    >
                      Guardar Perfil
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  );
}
