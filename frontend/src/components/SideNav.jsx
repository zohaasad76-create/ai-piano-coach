// src/components/SideNav.jsx
import { useState } from "react";
import AIChatbot from "./AIChatbot";

const tools = [
  { icon: "auto_awesome", label: "AI Tutor",       id: "chat"      },
  { icon: "piano",        label: "Chord Analysis", id: "chord"     },
  { icon: "music_note",   label: "Sheet Assist",   id: "sheet"     },
  { icon: "speed",        label: "Metronome",      id: "metronome" },
  { icon: "mic",          label: "Recordings",     id: "recordings"},
];

export default function SideNav({ progressData }) {
  const [activeTool, setActiveTool] = useState("chat");

  return (
    <aside className="h-screen w-80 sticky top-0 right-0 bg-white/80 backdrop-blur-xl flex flex-col p-6 gap-4 shadow-2xl shadow-neutral-900/5">

      {/* Tool Nav */}
      <nav className="flex flex-col gap-1">
        {tools.map(({ icon, label, id }) => (
          <button
            key={id}
            onClick={() => setActiveTool(id)}
            className={`flex items-center gap-4 p-3 rounded-xl text-sm font-medium font-body transition-all
              ${activeTool === id
                ? "bg-indigo-50 text-indigo-700 scale-95"
                : "text-neutral-600 hover:bg-neutral-100"
              }`}
          >
            <span
              className="material-symbols-outlined"
              style={activeTool === id ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {icon}
            </span>
            {label}
          </button>
        ))}
      </nav>

      {/* Tool Panel */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTool === "chat" && <AIChatbot />}
        {activeTool === "metronome" && <MetronomeTool />}
        {activeTool === "chord" && <PlaceholderTool label="Chord Analysis" icon="piano" />}
        {activeTool === "sheet" && <PlaceholderTool label="Sheet Assist" icon="music_note" />}
        {activeTool === "recordings" && <PlaceholderTool label="Recordings" icon="mic" />}
      </div>

      {/* Progress + CTA */}
      {progressData && (
        <div className="mt-auto pt-4 border-t border-neutral-100">
          <div className="bg-neutral-50 rounded-2xl p-4 mb-4">
            <h5 className="font-headline font-bold text-sm mb-1">Session Progress</h5>
            <p className="text-xs text-neutral-500 mb-2">
              {progressData.correct}/{progressData.total} notes · {progressData.percent_done}%
            </p>
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${progressData.percent_done}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <button className="w-full py-4 bg-gradient-to-br from-indigo-600 to-indigo-500 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-indigo-500/20 transition-all font-headline">
        Start Practice Session
      </button>
    </aside>
  );
}

// ── Mini Metronome Tool ────────────────────────────────────────────────────────
function MetronomeTool() {
  const [bpm, setBpm] = useState(80);
  const [running, setRunning] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-2">
      <h4 className="font-headline font-bold">Metronome</h4>
      <div className="text-5xl font-headline font-extrabold text-center text-indigo-600">{bpm}</div>
      <p className="text-center text-xs text-neutral-500 uppercase tracking-widest">BPM</p>
      <input
        type="range" min="40" max="200" value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
      <div className="flex gap-2">
        {[60, 80, 100, 120].map((b) => (
          <button
            key={b}
            onClick={() => setBpm(b)}
            className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-neutral-100 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            {b}
          </button>
        ))}
      </div>
      <button
        onClick={() => setRunning(!running)}
        className={`w-full py-3 rounded-xl font-bold transition-colors ${
          running ? "bg-red-100 text-red-600" : "bg-indigo-600 text-white"
        }`}
      >
        {running ? "Stop" : "Start"}
      </button>
    </div>
  );
}

function PlaceholderTool({ label, icon }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-400">
      <span className="material-symbols-outlined text-4xl">{icon}</span>
      <p className="text-sm font-medium">{label} — coming soon</p>
    </div>
  );
}