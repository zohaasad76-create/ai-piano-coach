// src/pages/PracticeRoom.jsx
import { useState, useEffect, useRef } from "react";
import TopBar from "../components/TopBar";
import SideNav from "../components/SideNav";
import { loadSong, evaluateNote, fetchHint, resetSong } from "../api";

const AVAILABLE_SONGS = [
  { id: "fur-elise",           label: "Fur Elise",            artist: "Beethoven",     level: "Beginner"     },
  { id: "river-flows-in-you",  label: "River Flows in You",   artist: "Yiruma",        level: "Beginner"     },
  { id: "hallelujah",          label: "Hallelujah",           artist: "Leonard Cohen", level: "Beginner"     },
  { id: "imagine",             label: "Imagine",              artist: "John Lennon",   level: "Beginner"     },
  { id: "nocturne-op9-no2",    label: "Nocturne Op. 9 No. 2", artist: "Chopin",        level: "Intermediate" },
  { id: "interstellar-theme",  label: "Interstellar Theme",   artist: "Hans Zimmer",   level: "Intermediate" },
  { id: "clair-de-lune",       label: "Clair de Lune",        artist: "Debussy",       level: "Advanced"     },
  { id: "moonlight-sonata",    label: "Moonlight Sonata",     artist: "Beethoven",     level: "Intermediate" },
];

const WHITE_KEYS = [
  { note: "C3" }, { note: "D3" }, { note: "E3" }, { note: "F3" },
  { note: "G3" }, { note: "A3" }, { note: "B3" }, { note: "C4" },
  { note: "D4" }, { note: "E4" }, { note: "F4" }, { note: "G4" },
  { note: "A4" }, { note: "B4" },
];

const BLACK_KEYS = [
  { note: "C#3", afterIndex: 0  },
  { note: "D#3", afterIndex: 1  },
  { note: "F#3", afterIndex: 3  },
  { note: "G#3", afterIndex: 4  },
  { note: "A#3", afterIndex: 5  },
  { note: "C#4", afterIndex: 7  },
  { note: "D#4", afterIndex: 8  },
  { note: "F#4", afterIndex: 10 },
  { note: "G#4", afterIndex: 11 },
  { note: "A#4", afterIndex: 12 },
];

const KEY_MAP = {
  a: "C3", s: "D3", d: "E3", f: "F3", g: "G3", h: "A3", j: "B3",
  k: "C4", l: "D4",
};

export default function PracticeRoom() {
  const [selectedSong,  setSelectedSong]  = useState(null);
  const [songData,      setSongData]      = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [feedback,      setFeedback]      = useState(null);
  const [feedbackLog,   setFeedbackLog]   = useState([]);
  const [nextNote,      setNextNote]      = useState(null);
  const [progress,      setProgress]      = useState(null);
  const [streak,        setStreak]        = useState(0);
  const [hint,          setHint]          = useState("");
  const [summary,       setSummary]       = useState(null);
  const [pressedKey,    setPressedKey]    = useState(null);
  const [wrongKey,      setWrongKey]      = useState(null);

  const startTime     = useRef(null);
  const feedbackTimer = useRef(null);
  const wrongTimer    = useRef(null);

  const handleLoadSong = async (songId) => {
    setLoading(true);
    setSummary(null);
    setFeedbackLog([]);
    setFeedback(null);
    setSessionActive(false);
    setNextNote(null);
    setStreak(0);
    setProgress(null);
    try {
      const data = await loadSong(songId);
      setSongData(data);
      setSelectedSong(songId);
      setNextNote(data.first_note);
      setProgress({ current_index: 0, total: data.total_notes, correct: 0, wrong: 0, streak: 0, percent_done: 0 });
    } catch {
      alert("Could not load song. Make sure the MIDI file is in backend/songs/");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    startTime.current = Date.now();
    setSessionActive(true);
    setFeedback({ status: "info", message: `🎹 Play: ${nextNote}` });
  };

  const handleReset = async () => {
    if (!selectedSong) return;
    const data = await resetSong(selectedSong);
    setSessionActive(false);
    setSummary(null);
    setFeedbackLog([]);
    setFeedback(null);
    setStreak(0);
    setWrongKey(null);
    setNextNote(data.first_note);
    setProgress({ current_index: 0, total: songData?.total_notes, correct: 0, wrong: 0, streak: 0, percent_done: 0 });
  };

  const handleNotePlay = async (note) => {
    if (!sessionActive || !selectedSong || summary) return;
    setPressedKey(note);
    setTimeout(() => setPressedKey(null), 150);

    const timestamp = (Date.now() - startTime.current) / 1000;
    try {
      const result = await evaluateNote(selectedSong, note, timestamp);
      setFeedback(result);
      clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => setFeedback(null), 2000);

      if (result.status === "wrong") {
        setWrongKey(note);
        clearTimeout(wrongTimer.current);
        wrongTimer.current = setTimeout(() => setWrongKey(null), 600);
      } else {
        setWrongKey(null);
      }

      setFeedbackLog((prev) => [
        { ...result, note, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 29),
      ]);

      if (result.advance) {
        setNextNote(result.expected_next);
        setStreak(result.streak || 0);
      }

      setProgress((prev) => ({
        ...prev,
        current_index: result.current_index ?? prev?.current_index,
        correct: (prev?.correct || 0) + (result.status === "correct" ? 1 : 0),
        wrong:   (prev?.wrong   || 0) + (result.status === "wrong"   ? 1 : 0),
        streak:  result.streak || prev?.streak || 0,
        percent_done: songData
          ? Math.round(((result.current_index || 0) / songData.total_notes) * 100)
          : 0,
      }));

      if (result.song_complete) {
        setSessionActive(false);
        setSummary(result.summary);
        setNextNote(null);
        setFeedback({ status: "complete", message: "🎉 Song Complete!" });
      }
    } catch (err) {
      console.error("Note eval error", err);
    }
  };

  const handleHint = async () => {
    if (!selectedSong) return;
    const data = await fetchHint(selectedSong);
    setHint(data.hint);
    setTimeout(() => setHint(""), 4000);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.repeat) return;
      const note = KEY_MAP[e.key.toLowerCase()];
      if (note) handleNotePlay(note);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sessionActive, selectedSong, summary, nextNote]);

  const getWhiteState = (note) => {
    if (wrongKey === note)                        return "wrong";
    if (pressedKey === note)                      return "pressed";
    if (sessionActive && nextNote === note)       return "next";
    return "default";
  };

  const getBlackState = (note) => {
    if (wrongKey === note)                        return "wrong";
    if (pressedKey === note)                      return "pressed";
    if (sessionActive && nextNote === note)       return "next";
    return "default";
  };

  const wStyle = {
    default: { background: "linear-gradient(to bottom,#fff,#efefef)", border: "1px solid #ccc", boxShadow: "0 4px 6px rgba(0,0,0,0.12)", color: "#aaa" },
    next:    { background: "linear-gradient(to bottom,#bbf7d0,#22c55e)", border: "3px solid #16a34a", boxShadow: "0 0 28px 10px rgba(34,197,94,0.7),0 4px 8px rgba(0,0,0,0.2)", color: "#fff", transform: "scaleY(1.03)" },
    pressed: { background: "linear-gradient(to bottom,#c7d2fe,#6366f1)", border: "2px solid #4338ca", boxShadow: "0 0 16px rgba(99,102,241,0.5)", color: "#fff", transform: "scaleY(0.96)" },
    wrong:   { background: "linear-gradient(to bottom,#fecaca,#ef4444)", border: "2px solid #dc2626", boxShadow: "0 0 20px rgba(239,68,68,0.6)", color: "#fff" },
  };

  const bStyle = {
    default: { background: "linear-gradient(to bottom,#1f2937,#111827)", boxShadow: "0 4px 8px rgba(0,0,0,0.5)" },
    next:    { background: "linear-gradient(to bottom,#16a34a,#15803d)", boxShadow: "0 0 24px 10px rgba(34,197,94,0.8)", border: "2px solid #22c55e" },
    pressed: { background: "linear-gradient(to bottom,#6366f1,#4338ca)", boxShadow: "0 0 16px rgba(99,102,241,0.6)" },
    wrong:   { background: "linear-gradient(to bottom,#ef4444,#dc2626)", boxShadow: "0 0 16px rgba(239,68,68,0.6)" },
  };

  const totalWhite = WHITE_KEYS.length;

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh", fontFamily: "Inter,sans-serif" }}>
      <TopBar />
      <main style={{ display: "flex", height: "calc(100vh - 88px)", overflow: "hidden" }}>
        <section style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Song Picker */}
          <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 24px", display: "flex", gap: 8, overflowX: "auto" }}>
            {AVAILABLE_SONGS.map((s) => (
              <button key={s.id} onClick={() => handleLoadSong(s.id)} style={{ flexShrink: 0, padding: "8px 18px", borderRadius: 999, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: selectedSong === s.id ? "#4f46e5" : "#f3f4f6", color: selectedSong === s.id ? "#fff" : "#4b5563", boxShadow: selectedSong === s.id ? "0 4px 12px rgba(79,70,229,0.3)" : "none", transition: "all 0.2s" }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>

            {!songData && !loading && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#9ca3af" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 64 }}>piano</span>
                <p style={{ fontSize: 20, fontWeight: 700 }}>Select a song to begin</p>
                <p style={{ fontSize: 14 }}>Choose from the bar above</p>
              </div>
            )}

            {loading && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#6366f1", animation: "spin 1s linear infinite" }}>refresh</span>
              </div>
            )}

            {songData && !loading && (
              <>
                {/* Header + Controls */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#111827" }}>{AVAILABLE_SONGS.find((s) => s.id === selectedSong)?.label}</h1>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>{AVAILABLE_SONGS.find((s) => s.id === selectedSong)?.artist} · {songData.total_notes} notes · {songData.tempo} BPM</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleHint} style={{ padding: "8px 16px", borderRadius: 12, border: "none", background: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lightbulb</span> Hint
                    </button>
                    <button onClick={handleReset} style={{ padding: "8px 16px", borderRadius: 12, border: "none", background: "#f3f4f6", color: "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span> Reset
                    </button>
                    {!sessionActive && !summary && (
                      <button onClick={handleStart} style={{ padding: "8px 20px", borderRadius: 12, border: "none", background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span> Start
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {progress && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>
                      <span>{progress.current_index} / {progress.total} notes</span>
                      <span>{progress.percent_done}%</span>
                    </div>
                    <div style={{ width: "100%", height: 8, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${progress.percent_done}%`, background: "linear-gradient(to right,#6366f1,#4f46e5)", borderRadius: 999, transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                  {[
                    { label: "Correct", value: progress?.correct ?? 0,              color: "#16a34a", bg: "#f0fdf4" },
                    { label: "Wrong",   value: progress?.wrong   ?? 0,              color: "#dc2626", bg: "#fef2f2" },
                    { label: "Streak",  value: streak,                               color: "#4f46e5", bg: "#eef2ff" },
                    { label: "Done",    value: `${progress?.percent_done ?? 0}%`,   color: "#374151", bg: "#f9fafb" },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} style={{ background: bg, borderRadius: 16, padding: "16px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* NEXT NOTE — big glowing banner */}
                {sessionActive && nextNote && !summary && (
                  <div style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", borderRadius: 20, padding: "20px 28px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 8px 24px rgba(79,70,229,0.35)" }}>
                    <span className="material-symbols-outlined" style={{ color: "#a5b4fc", fontSize: 32 }}>piano</span>
                    <div>
                      <p style={{ color: "#c7d2fe", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>Play this note now ↓</p>
                      <p style={{ color: "#fff", fontSize: 48, fontWeight: 900, margin: "2px 0 0", lineHeight: 1, textShadow: "0 0 20px rgba(255,255,255,0.4)" }}>{nextNote}</p>
                    </div>
                    <div style={{ marginLeft: "auto", background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 18px", textAlign: "center" }}>
                      <p style={{ color: "#e0e7ff", fontSize: 11, margin: 0 }}>Keyboard</p>
                      <p style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "4px 0 0" }}>
                        {Object.entries(KEY_MAP).find(([, v]) => v === nextNote)?.[0]?.toUpperCase() || "↓"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Not started yet */}
                {!sessionActive && !summary && songData && (
                  <div style={{ background: "#f0fdf4", border: "2px dashed #86efac", borderRadius: 16, padding: "20px 24px", textAlign: "center", color: "#16a34a" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32, display: "block", marginBottom: 8 }}>play_circle</span>
                    <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Press Start to begin</p>
                    <p style={{ fontSize: 13, margin: "6px 0 0", color: "#4ade80" }}>The piano keys will light up green showing which note to play</p>
                  </div>
                )}

                {/* Feedback banner */}
                {feedback && (
                  <div style={{
                    borderRadius: 16, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, fontWeight: 700, fontSize: 15,
                    background: feedback.status === "correct" ? "#f0fdf4" : feedback.status === "wrong" ? "#fef2f2" : feedback.status === "complete" ? "#eef2ff" : "#f9fafb",
                    border: `2px solid ${feedback.status === "correct" ? "#86efac" : feedback.status === "wrong" ? "#fca5a5" : feedback.status === "complete" ? "#a5b4fc" : "#e5e7eb"}`,
                    color: feedback.status === "correct" ? "#15803d" : feedback.status === "wrong" ? "#dc2626" : feedback.status === "complete" ? "#4338ca" : "#374151",
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                      {feedback.status === "correct" ? "check_circle" : feedback.status === "wrong" ? "cancel" : feedback.status === "complete" ? "celebration" : "info"}
                    </span>
                    {feedback.message}
                  </div>
                )}

                {/* Hint */}
                {hint && (
                  <div style={{ background: "#fffbeb", border: "2px solid #fcd34d", borderRadius: 14, padding: "12px 18px", color: "#92400e", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lightbulb</span>{hint}
                  </div>
                )}

                {/* Summary */}
                {summary && (
                  <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 20px", color: "#111827" }}>🎉 Session Complete!</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
                      {[
                        { label: "Final Score",     value: `${summary.final_score}%`     },
                        { label: "Note Accuracy",   value: `${summary.note_accuracy}%`   },
                        { label: "Timing Accuracy", value: `${summary.timing_accuracy}%` },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ textAlign: "center", background: "#eef2ff", borderRadius: 16, padding: 20 }}>
                          <div style={{ fontSize: 36, fontWeight: 900, color: "#4f46e5" }}>{value}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    {summary.most_missed_notes?.length > 0 && (
                      <div style={{ background: "#fef2f2", borderRadius: 14, padding: "14px 18px", marginBottom: 16 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Most Missed</p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {summary.most_missed_notes.map(({ note, times }) => (
                            <span key={note} style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 12px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>{note} × {times}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <button onClick={handleReset} style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                      Practice Again
                    </button>
                  </div>
                )}

                {/* Feedback log */}
                {feedbackLog.length > 0 && (
                  <div style={{ background: "#fff", borderRadius: 16, padding: 18, border: "1px solid #e5e7eb" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>Live Guidance</p>
                    <div style={{ maxHeight: 140, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                      {feedbackLog.map((log, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: log.status === "correct" ? "#22c55e" : "#ef4444" }} />
                          <span style={{ color: "#374151", flex: 1 }}>{log.message}</span>
                          <span style={{ color: "#9ca3af", fontSize: 11 }}>{log.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── PIANO KEYBOARD ── */}
          <div style={{ background: "#0f0f1a", padding: "16px 24px 20px", borderTop: "3px solid #312e81", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em" }}>C3 — B4 · Keyboard: A S D F G H J K L</span>
              <div style={{ display: "flex", gap: 16, fontSize: 11, fontWeight: 700 }}>
                {[
                  { color: "#22c55e", shadow: "0 0 6px #22c55e", label: "Play this key" },
                  { color: "#ef4444", shadow: "none",             label: "Wrong"         },
                  { color: "#6366f1", shadow: "none",             label: "Pressed"       },
                ].map(({ color, shadow, label }) => (
                  <span key={label} style={{ color, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block", boxShadow: shadow }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ position: "relative", height: 180, display: "flex" }}>
              {/* White keys */}
              {WHITE_KEYS.map((k, i) => {
                const state = getWhiteState(k.note);
                const s = wStyle[state];
                return (
                  <div
                    key={k.note}
                    onClick={() => handleNotePlay(k.note)}
                    style={{
                      flex: 1,
                      height: "100%",
                      marginRight: i < WHITE_KEYS.length - 1 ? 2 : 0,
                      borderRadius: "0 0 10px 10px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      paddingBottom: 10,
                      userSelect: "none",
                      transition: "all 0.08s ease",
                      position: "relative",
                      zIndex: 1,
                      ...s,
                    }}
                  >
                    {state === "next" && (
                      <div style={{ position: "absolute", inset: -4, borderRadius: "0 0 14px 14px", border: "3px solid #22c55e", animation: "pulse-ring 0.9s ease-in-out infinite", pointerEvents: "none", zIndex: 3 }} />
                    )}
                    <span style={{ fontSize: 10, fontWeight: 700 }}>{k.note}</span>
                  </div>
                );
              })}

              {/* Black keys */}
              {BLACK_KEYS.map((k) => {
                const state = getBlackState(k.note);
                const s = bStyle[state];
                const leftPct  = ((k.afterIndex + 0.65) / totalWhite) * 100;
                const widthPct = (0.6 / totalWhite) * 100;
                return (
                  <div
                    key={k.note}
                    onClick={(e) => { e.stopPropagation(); handleNotePlay(k.note); }}
                    style={{
                      position: "absolute",
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      top: 0,
                      height: "62%",
                      borderRadius: "0 0 8px 8px",
                      cursor: "pointer",
                      zIndex: 2,
                      transition: "all 0.08s ease",
                      ...s,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </section>

        <SideNav progressData={progress} />
      </main>

      <style>{`
        @keyframes pulse-ring {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.4; transform:scale(1.04); }
        }
        @keyframes spin {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
      `}</style>
    </div>
  );
}