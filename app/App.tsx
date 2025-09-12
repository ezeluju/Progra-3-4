import React, { useState } from 'react';
import { Text, TextInput, Button, ScrollView } from 'react-native';
import * as FileSystem from "expo-file-system/legacy";
import { Audio } from 'expo-audio';

const API_BASE = 'http://127.0.0.1:8000';  // 

export default function App() {
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [log, setLog] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'rec' | 'processing'>('idle');

  async function recordAndSend(action: 'enroll' | 'identify' | 'login-by-voice') {
    try {
      setState('rec');
      setLog('Recording...');
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) throw new Error('Permission denied');
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      await new Promise((res) => setTimeout(res, 5000));
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error('No recording');
      await FileSystem.getInfoAsync(uri);
      const form = new FormData();
      if (action === 'enroll') {
        form.append('userId', userId);
        form.append('name', name);
      }
      form.append('file', { uri, name: 'audio.m4a', type: 'audio/m4a' } as any);
      setState('processing');
      const res = await fetch(`${API_BASE}/${action}`, { method: 'POST', body: form });
      const json = await res.json();
      setLog(JSON.stringify(json, null, 2));
      if (action === 'login-by-voice' && json.token) {
        setToken(json.token);
      }
    } catch (e: any) {
      setLog(e.message);
    } finally {
      setState('idle');
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text>API: {API_BASE}</Text>
      {token && <Text>Sesión iniciada para {userId}</Text>}
      <TextInput
        placeholder="User ID"
        value={userId}
        onChangeText={setUserId}
        style={{ borderWidth: 1, marginVertical: 4, padding: 4 }}
      />
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, marginVertical: 4, padding: 4 }}
      />
      <Button title="Enrolar" onPress={() => recordAndSend('enroll')} disabled={state !== 'idle'} />
      <Button title="Identificar" onPress={() => recordAndSend('identify')} disabled={state !== 'idle'} />
      <Button title="Login por voz" onPress={() => recordAndSend('login-by-voice')} disabled={state !== 'idle'} />
      <Text style={{ marginTop: 20 }}>{log}</Text>
    </ScrollView>
  );
}