import { useState } from 'react';
import { View, Text, TextInput, Button, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

export default function Profile() {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(null);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });
    if (!res.canceled) setAvatar(res.assets[0].uri);
  };
  const save = async () => {
    if (!name.trim()) return;
    await AsyncStorage.setItem('profile:name', name.trim());
    if (avatar) await AsyncStorage.setItem('profile:avatar', avatar);
  router.replace('/rooms');
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Perfil</Text>
      <TextInput placeholder="Tu nombre" value={name} onChangeText={setName} style={{ borderWidth: 1, padding: 8, borderRadius: 6 }} />
      {avatar && <Image source={{ uri: avatar }} style={{ width: 120, height: 120, borderRadius: 60 }} />}
      <Button title="Elegir foto" onPress={pick} />
      <Button title="Guardar" onPress={save} />
    </View>
  );
}
