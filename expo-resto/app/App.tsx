import React, { useRef, useState } from "react";
import { View, Text, Button, ActivityIndicator, TextInput } from "react-native";
import { Audio } from "expo-av";


const API = "http://10.0.2.2:8000"; // Android emulador; usa tu IP en dispositivo real


export default function App() {
const recordingRef = useRef<Audio.Recording | null>(null);
const [status, setStatus] = useState<"idle"|"rec"|"processing">("idle");
const [result, setResult] = useState<string>("");
const [userId, setUserId] = useState("ezequiel");
const [name, setName] = useState("Ezequiel");


async function startRec() {
setResult("");
await Audio.requestPermissionsAsync();
await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
recordingRef.current = recording;
setStatus("rec");
}


async function stop() {
const rec = recordingRef.current; if (!rec) return;
setStatus("processing");
await rec.stopAndUnloadAsync();
const uri = rec.getURI();
recordingRef.current = null;
if (!uri) { setStatus("idle"); return; }


const form = new FormData();
form.append("userId", userId);
form.append("name", name);
// @ts-ignore
form.append("file", { uri, name: "audio.m4a", type: "audio/m4a" });


try {
const resp = await fetch(`${API}/enroll`, { method: "POST", body: form });
const data = await resp.json();
setResult(JSON.stringify(data));
} catch (e) {
setResult(String(e));
} finally { setStatus("idle"); }
}

async function identify() {
const rec = recordingRef.current; if (rec) return;
await startRec();
// graba 5s
setTimeout(async () => {
const r = recordingRef.current; if (!r) return;
await r.stopAndUnloadAsync();
const uri = r.getURI();
recordingRef.current = null;
if (!uri) return;
setStatus("processing");
const form = new FormData();
form.append("threshold", "0.82");
form.append("top_k", "3");
// @ts-ignore
form.append("file", { uri, name: "probe.m4a", type: "audio/m4a" });
try {
const resp = await fetch(`${API}/identify`, { method: "POST", body: form });
const data = await resp.json();
setResult(JSON.stringify(data, null, 2));
} catch (e) {
setResult(String(e));
} finally { setStatus("idle"); }
}, 5000);
}


return (
<View style={{ flex:1, gap:12, padding:24, justifyContent:"center" }}>
<Text style={{ fontSize:18, fontWeight:"600" }}>VoiceID – Demo</Text>
<Text>userId</Text>
<TextInput value={userId} onChangeText={setUserId} style={{ borderWidth:1, padding:8 }} />
<Text>name</Text>
<TextInput value={name} onChangeText={setName} style={{ borderWidth:1, padding:8, marginBottom:8 }} />


{status === "rec" ? (
<Button title="Detener & Enrolar" onPress={stop} />
) : status === "processing" ? (
<ActivityIndicator />
) : (
<>
<Button title="Grabar para Enrolar" onPress={startRec} />
<View style={{ height:8 }} />
<Button title="Identificar (auto 5s)" onPress={identify} />
</>
)}


<Text style={{ marginTop:16, fontWeight:"600" }}>Resultado:</Text>
<Text selectable>{result || "(vacío)"}</Text>
</View>
);
}