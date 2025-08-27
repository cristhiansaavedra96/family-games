import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Dimensions, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const EMOJIS = [
  { emoji: '😀', label: 'Feliz' },
  { emoji: '😅', label: 'Nervioso' },
  { emoji: '😎', label: 'Genial' },
  { emoji: '😡', label: 'Enojado' },
  { emoji: '🤔', label: 'Pensando' },
  { emoji: '😱', label: 'Sorprendido' },
  { emoji: '🥳', label: 'Celebrando' },
  { emoji: '😴', label: 'Aburrido' },
  { emoji: '🔥', label: 'En racha' },
  { emoji: '❤️', label: 'Me gusta' }
];

const QUICK_MESSAGES = [
  '¡Buena suerte!',
  '¡Vamos!',
  'Casi...',
  '¡Por poco!',
  '¡Increíble!',
  'Esperando...',
  '¡Dale!',
  '¿En serio?',
  'gg',
  '¡Otra vez!'
];

function ChatPanel({ isVisible, onClose, onSendMessage }) {
  const [customMessage, setCustomMessage] = useState('');
  const insets = useSafeAreaInsets();

  const handleSendEmoji = (emoji, label) => {
    onSendMessage({ type: 'emoji', content: emoji, label });
  };

  const handleSendQuickMessage = (message) => {
    onSendMessage({ type: 'message', content: message });
  };

  const handleSendCustomMessage = () => {
    if (customMessage.trim()) {
      onSendMessage({ type: 'message', content: customMessage.trim() });
      setCustomMessage('');
    }
  };

  if (!isVisible) return null;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom + 12 : 0}
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}
    >
      {/* Fondo semitransparente */}
    <Pressable
        onPress={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1
        }}
      />
      
      {/* Panel de chat */}
      <View 
        style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 20 + insets.bottom,
        maxHeight: height * 0.6,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -5 },
        elevation: 6,
        zIndex: 2
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: '#2c3e50',
            fontFamily: 'Montserrat_700Bold'
          }}>
            Chat Rápido
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: 'rgba(44, 62, 80, 0.1)',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Ionicons name="close" size={16} color="#2c3e50" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={{ maxHeight: height * 0.4 }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          scrollEventThrottle={16}
          decelerationRate="normal"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {/* Input personalizado */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#7f8c8d',
              marginBottom: 8,
              fontFamily: 'Montserrat_600SemiBold'
            }}>
              Mensaje personalizado:
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8
            }}>
              <TextInput
                value={customMessage}
                onChangeText={setCustomMessage}
                placeholder="Escribe tu mensaje..."
                style={{
                  flex: 1,
                  borderWidth: 2,
                  borderColor: 'rgba(44, 62, 80, 0.15)',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: '#fff',
                  fontFamily: 'Montserrat_400Regular'
                }}
                maxLength={50}
                returnKeyType="send"
                onSubmitEditing={handleSendCustomMessage}
              />
              <TouchableOpacity
                onPress={handleSendCustomMessage}
                disabled={!customMessage.trim()}
                style={{
                  backgroundColor: customMessage.trim() ? '#e74c3c' : '#bdc3c7',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12
                }}
              >
                <Ionicons name="send" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Emojis */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#7f8c8d',
              marginBottom: 12,
              fontFamily: 'Montserrat_600SemiBold'
            }}>
              Estados de ánimo:
            </Text>
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8
            }}>
              {EMOJIS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSendEmoji(item.emoji, item.label)}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(44, 62, 80, 0.1)',
                    alignItems: 'center',
                    minWidth: 60
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 20, marginBottom: 2 }}>{item.emoji}</Text>
                  <Text style={{
                    fontSize: 10,
                    color: '#7f8c8d',
                    fontFamily: 'Montserrat_400Regular'
                  }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mensajes rápidos */}
          <View>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#7f8c8d',
              marginBottom: 12,
              fontFamily: 'Montserrat_600SemiBold'
            }}>
              Mensajes rápidos:
            </Text>
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8
            }}>
              {QUICK_MESSAGES.map((message, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSendQuickMessage(message)}
                  style={{
                    backgroundColor: '#3498db',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 8
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{
                    color: 'white',
                    fontSize: 14,
                    fontWeight: '500',
                    fontFamily: 'Montserrat_500Medium'
                  }}>
                    {message}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

export default React.memo(ChatPanel);
