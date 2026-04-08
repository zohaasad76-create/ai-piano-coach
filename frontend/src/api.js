const BASE = "http://localhost:8000";

export async function fetchSongs() {
  const res = await fetch(`${BASE}/songs`);
  return res.json();
}

export async function loadSong(songName) {
  const res = await fetch(`${BASE}/song/${songName}`);
  if (!res.ok) throw new Error(`Song not found: ${songName}`);
  return res.json();
}

export async function resetSong(songName) {
  const res = await fetch(`${BASE}/reset/${songName}`, { method: "POST" });
  return res.json();
}

export async function evaluateNote(songName, note, timestamp) {
  const res = await fetch(`${BASE}/note`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ song_name: songName, note, timestamp }),
  });
  return res.json();
}

export async function fetchProgress(songName) {
  const res = await fetch(`${BASE}/progress/${songName}`);
  return res.json();
}

export async function fetchHint(songName) {
  const res = await fetch(`${BASE}/hint/${songName}`);
  return res.json();
}

export async function fetchSummary(songName) {
  const res = await fetch(`${BASE}/summary/${songName}`);
  return res.json();
}

export async function sendChatMessage(message, history = []) {
  const res = await fetch(`${BASE}/tutor/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  return res.json();
}

export async function checkChatHealth() {
  const res = await fetch(`${BASE}/tutor/chat/health`);
  return res.json();
}
