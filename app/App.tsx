// App.tsx — SDK 54 con expo-av y expo-file-system/legacy + cosine-two debug
import React, { useState } from "react";
import { Text, TextInput, Button, ScrollView, View } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

const API_BASE = "http://10.206.207.124:8000";
// 192.168.x.x:8000 <- si queres usar la app movil de expo tenes que poner la direccion donde hosteaste el back, si es local: la ip de tu pc. 
// Emulador Android: http://10.0.2.2:8000 <--  no se como funciona esto porque no uso emulador, pero en teoria funciona :)

export default function App() {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [log, setLog] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "rec" | "processing">("idle");

  async function ensureRecordPermissions() {
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) throw new Error("Permission denied");
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  }

  async function recordN(ms: number) {
    const r = new Audio.Recording();
    await r.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await r.startAsync();
    await new Promise((res) => setTimeout(res, ms));
    await r.stopAndUnloadAsync();
    const uri = r.getURI();
    if (!uri) throw new Error("No recording");
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) throw new Error("Recorded file not found");
    return uri;
  }

  async function recordAndSend(action: "enroll" | "identify" | "login-by-voice") {
    try {
      setState("rec");
      setLog("Recording...");
      await ensureRecordPermissions();

      // grabar 5s
      const uri = await recordN(5000);

      const form = new FormData();
      if (action === "enroll") {
        form.append("userId", userId);
        form.append("name", name);
      }
      // @ts-ignore — RN FormData file
      form.append("file", { uri, name: "audio.m4a", type: "audio/m4a" });

      setState("processing");
      setLog("Uploading...");

      const res = await fetch(`${API_BASE}/${action}`, { method: "POST", body: form });
      const contentType = res.headers.get("content-type") ?? "";
      const text = await res.text();

      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch {}

      if (!res.ok) {
        setLog(`HTTP ${res.status} ${res.statusText}\nContent-Type: ${contentType}\n\n${text}`);
      } else if (parsed) {
        setLog(JSON.stringify(parsed, null, 2));
        if (action === "login-by-voice" && parsed.token) setToken(parsed.token);
      } else {
        setLog(`Respuesta no JSON (Content-Type: ${contentType})\n\n${text}`);
      }
    } catch (e: any) {
      setLog(`Cliente: ${e?.message ?? String(e)}`);
    } finally {
      setState("idle");
    }
  }

  // 🔎 Botón de debug: graba 2 clips y consulta /debug/cosine-two
  async function recordTwoAndCompare() {
    try {
      setState("rec");
      setLog("Grabando A (4s)...");
      await ensureRecordPermissions();
      const uriA = await recordN(4000);

      setLog("Grabando B (4s)...");
      const uriB = await recordN(4000);

      setState("processing");
      setLog("Subiendo a /debug/cosine-two ...");

      const form = new FormData();
      // @ts-ignore
      form.append("a", { uri: uriA, name: "a.m4a", type: "audio/m4a" });
      // @ts-ignore
      form.append("b", { uri: uriB, name: "b.m4a", type: "audio/m4a" });

      const res = await fetch(`${API_BASE}/debug/cosine-two`, { method: "POST", body: form });
      const ct = res.headers.get("content-type") ?? "";
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setLog(`cosine-two → ${JSON.stringify(json, null, 2)}`);
      } catch {
        setLog(`Respuesta no JSON (CT: ${ct})\n\n${text}`);
      }
    } catch (e: any) {
      setLog(`Cliente: ${e?.message ?? String(e)}`);
    } finally {
      setState("idle");
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 8 }}>
      <Text>API: {API_BASE}</Text>
      {token && <Text>Sesión iniciada para {userId}</Text>}

      <TextInput
        placeholder="User ID"
        value={userId}
        onChangeText={setUserId}
        style={{ borderWidth: 1, borderRadius: 6, padding: 8 }}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, borderRadius: 6, padding: 8 }}
      />

      <View style={{ gap: 8, marginTop: 8 }}>
        <Button title="Enrolar" onPress={() => recordAndSend("enroll")} disabled={state !== "idle"} />
        <Button title="Identificar" onPress={() => recordAndSend("identify")} disabled={state !== "idle"} />
        <Button title="Login por voz" onPress={() => recordAndSend("login-by-voice")} disabled={state !== "idle"} />
        <Button title="Comparar (cosine-two)" onPress={recordTwoAndCompare} disabled={state !== "idle"} />
      </View>

      <Text style={{ marginTop: 16, fontFamily: "monospace" }}>{log}</Text>
    </ScrollView>
  );
}
