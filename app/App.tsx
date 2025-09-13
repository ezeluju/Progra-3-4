// App.tsx — SDK 54 con expo-av y expo-file-system/legacy + cosine-two debug
import React, { useState } from "react";
import { Text, TextInput, Button, ScrollView, View, Pressable, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

const API_BASE = "http://10.206.207.124:8000";
// 192.168.x.x:8000 <- si queres usar la app movil de expo tenes que poner la direccion donde hosteaste el back, si es local: la ip de tu pc. 
// Emulador Android: http://10.0.2.2:8000 <--  no se como funciona esto porque no uso emulador, pero en teoria funciona :)



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2" },
  content: { padding: 20, gap: 12 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  log: {
    marginTop: 16,
    fontFamily: "monospace",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});

function StyledButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

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
        if (action === "login-by-voice" && parsed.token) {
          setToken(parsed.token);
          if (parsed.userId) setUserId(parsed.userId);
        }
        if (action === "enroll" && parsed.id) setUserId(parsed.id);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Identificación por voz</Text>
      <Text style={{ textAlign: "center" }}>API: {API_BASE}</Text>
      {token && <Text style={{ textAlign: "center" }}>Sesión iniciada para {userId}</Text>}

      {userId && (
        <Text style={{ textAlign: "center" }}>ID asignado: {userId}</Text>
      )}
      <TextInput
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <View style={{ gap: 8, marginTop: 16 }}>
        <StyledButton
          title="Registrar usuario"
          onPress={() => recordAndSend("enroll")}
          disabled={state !== "idle"}
        />
        <StyledButton
          title="Identificar usuario"
          onPress={() => recordAndSend("identify")}
          disabled={state !== "idle"}
        />
        <StyledButton
          title="Iniciar sesión por voz"
          onPress={() => recordAndSend("login-by-voice")}
          disabled={state !== "idle"}
        />
        <StyledButton
          title="Comparación rápida de voz"
          onPress={recordTwoAndCompare}
          disabled={state !== "idle"}
        />
      </View>

      <Text style={styles.log}>{log}</Text>
    </ScrollView>
  );
}