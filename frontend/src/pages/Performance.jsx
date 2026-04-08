// src/pages/Performance.jsx
import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import SideNav from "../components/SideNav";
import { fetchSummary, fetchSongs } from "../api";

// Mock historical data per song for the progress chart
const MOCK_HISTORY = [40, 55, 48, 65, 75, 82, 94];
const WEEK_LABELS  = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Today"];

const SONG_META = {
  "fur-elise":          { label: "Fur Elise",            artist: "Beethoven",     level: "Beginner"     },
  "river-flows-in-you": { label: "River Flows in You",   artist: "Yiruma",        level: "Beginner"     },
  "hallelujah":         { label: "Hallelujah",           artist: "Leonard Cohen", level: "Beginner"     },
  "imagine":            { label: "Imagine",              artist: "John Lennon",   level: "Beginner"     },
  "nocturne-op9-no2":   { label: "Nocturne Op. 9 No. 2", artist: "Chopin",        level: "Intermediate" },
  "interstellar-theme": { label: "Interstellar Theme",   artist: "Hans Zimmer",   level: "Intermediate" },
  "clair-de-lune":      { label: "Clair de Lune",        artist: "Debussy",       level: "Advanced"     },
  "moonlight-sonata":   { label: "Moonlight Sonata",     artist: "Beethoven",     level: "Intermediate" },
};

export default function Performance() {
  const [songs, setSongs]         = useState([]);
  const [selected, setSelected]   = useState(null);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [activeChart, setActiveChart] = useState("ACCURACY");

  // Load available songs on mount
  useEffect(() => {
    fetchSongs()
      .then((d) => setSongs(d.songs || []))
      .catch(() => setSongs([]));
  }, []);

  const handleSelectSong = async (songName) => {
    setSelected(songName);
    setError(null);
    setSummary(null);
    setLoading(true);
    try {
      const data = await fetchSummary(songName);
      setSummary(data);
    } catch {
      setError("No session data found. Practice this song first!");
    } finally {
      setLoading(false);
    }
  };

  const meta  = selected ? SONG_META[selected] : null;
  const score = summary?.final_score ?? 0;

  const scoreColor =
    score >= 85 ? "text-emerald-600" :
    score >= 60 ? "text-amber-500"   : "text-red-500";

  const scoreBg =
    score >= 85 ? "bg-emerald-50 border-emerald-200" :
    score >= 60 ? "bg-amber-50 border-amber-200"     : "bg-red-50 border-red-200";

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen">
      <TopBar />

      <div className="flex min-h-[calc(100vh-89px)]">
        <main className="flex-grow p-12 overflow-y-auto">
          <div className="max-w-6xl mx-auto">

            {/* ── Page Header ── */}
            <section className="mb-10 flex justify-between items-end flex-wrap gap-6">
              <div>
                <h4 className="font-headline text-sm font-bold tracking-widest text-indigo-600 uppercase mb-2">
                  Performance Report
                </h4>
                <h1 className="font-headline text-5xl font-extrabold tracking-tighter mb-4">
                  {meta ? meta.label : "Select a Song"}
                </h1>
                {meta && (
                  <div className="flex gap-3 flex-wrap">
                    <span className="bg-neutral-100 px-4 py-2 rounded-full text-xs font-bold tracking-tight">
                      {meta.artist}
                    </span>
                    <span className="bg-neutral-100 px-4 py-2 rounded-full text-xs font-bold tracking-tight">
                      LEVEL: {meta.level.toUpperCase()}
                    </span>
                    {summary && (
                      <span className="bg-neutral-100 px-4 py-2 rounded-full text-xs font-bold tracking-tight">
                        {summary.total} NOTES
                      </span>
                    )}
                  </div>
                )}
              </div>

              {summary && (
                <div className="text-right">
                  <div className={`text-6xl font-headline font-extrabold tracking-tighter ${scoreColor}`}>
                    {score}<span className="text-2xl text-neutral-400">/100</span>
                  </div>
                  <p className="text-sm font-medium text-neutral-500">Global Performance Score</p>
                </div>
              )}
            </section>

            {/* ── Song Picker ── */}
            <div className="flex flex-wrap gap-3 mb-10">
              {songs.length === 0 && (
                <p className="text-sm text-neutral-400">No songs found. Add .mid files to backend/songs/</p>
              )}
              {songs.map((s) => {
                const m = SONG_META[s.name];
                return (
                  <button
                    key={s.name}
                    onClick={() => handleSelectSong(s.name)}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                      selected === s.name
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {m?.label || s.name}
                  </button>
                );
              })}
            </div>

            {/* ── Loading ── */}
            {loading && (
              <div className="flex items-center justify-center py-32 text-neutral-400">
                <span className="material-symbols-outlined animate-spin text-4xl mr-3">refresh</span>
                Loading session data...
              </div>
            )}

            {/* ── Error ── */}
            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-32 gap-4 text-neutral-400">
                <span className="material-symbols-outlined text-5xl">music_off</span>
                <p className="text-lg font-headline font-bold">{error}</p>
                <p className="text-sm">Go to Practice Room and complete a session first.</p>
              </div>
            )}

            {/* ── No song selected ── */}
            {!selected && !loading && (
              <div className="flex flex-col items-center justify-center py-32 gap-4 text-neutral-400">
                <span className="material-symbols-outlined text-6xl">bar_chart</span>
                <p className="text-xl font-headline font-bold">Pick a song above to view your report</p>
              </div>
            )}

            {/* ── Main Report ── */}
            {summary && !loading && (
              <>
                {/* ── Score Cards ── */}
                <div className="grid grid-cols-12 gap-6 mb-10">
                  {[
                    {
                      icon: "target",
                      label: "Note Accuracy",
                      desc: "Precision of correct notes played",
                      value: summary.note_accuracy,
                    },
                    {
                      icon: "speed",
                      label: "Timing Accuracy",
                      desc: "Tempo consistency within 300ms window",
                      value: summary.timing_accuracy,
                    },
                    {
                      icon: "piano",
                      label: "Final Score",
                      desc: "Weighted: 70% accuracy + 30% timing",
                      value: summary.final_score,
                    },
                  ].map(({ icon, label, desc, value }) => (
                    <div
                      key={label}
                      className="col-span-12 lg:col-span-4 bg-white p-8 rounded-2xl flex flex-col justify-between shadow-sm"
                    >
                      <div>
                        <span className="material-symbols-outlined text-indigo-600 mb-4 block">{icon}</span>
                        <h3 className="font-headline text-lg font-bold mb-1">{label}</h3>
                        <p className="text-xs text-neutral-500 mb-6 leading-relaxed">{desc}</p>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="text-4xl font-headline font-extrabold">{value}%</div>
                        <div className="h-2 w-32 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* ── Progress Chart ── */}
                  <div className="col-span-12 bg-neutral-50 p-10 rounded-2xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
                      <div>
                        <h3 className="font-headline text-2xl font-bold tracking-tight mb-1">
                          Mastery Progress
                        </h3>
                        <p className="text-sm text-neutral-500">
                          Simulated 7-session history for {meta?.label}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-4 md:mt-0">
                        {["ACCURACY", "TIMING"].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveChart(tab)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                              activeChart === tab
                                ? "bg-indigo-600 text-white"
                                : "bg-white text-neutral-500 hover:bg-neutral-100"
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="relative h-48 flex items-end justify-between gap-3">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {[100, 75, 50, 25].map((v) => (
                          <div key={v} className="flex items-center gap-2">
                            <span className="text-[10px] text-neutral-400 w-6 text-right">{v}</span>
                            <div className="flex-1 border-t border-neutral-200" />
                          </div>
                        ))}
                      </div>

                      {/* Bars */}
                      <div className="flex-1 flex items-end justify-between gap-3 pl-8">
                        {MOCK_HISTORY.map((val, i) => {
                          const isToday = i === MOCK_HISTORY.length - 1;
                          const displayVal = isToday
                            ? (activeChart === "ACCURACY" ? summary.note_accuracy : summary.timing_accuracy)
                            : val;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                              {isToday && (
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                  TODAY
                                </span>
                              )}
                              <div
                                className={`w-full rounded-t-lg transition-all duration-700 ${
                                  isToday
                                    ? "bg-indigo-600 shadow-lg shadow-indigo-200"
                                    : "bg-indigo-200 group-hover:bg-indigo-300"
                                }`}
                                style={{ height: `${(displayVal / 100) * 160}px` }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between mt-3 pl-8 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      {WEEK_LABELS.map((l) => <span key={l}>{l}</span>)}
                    </div>
                  </div>
                </div>

                {/* ── Analysis + Sidebar ── */}
                <div className="grid grid-cols-12 gap-8">

                  {/* Refinement Strategy */}
                  <div className="col-span-12 lg:col-span-8">
                    <h2 className="font-headline text-3xl font-extrabold tracking-tight mb-8">
                      Refinement Strategy
                    </h2>
                    <div className="space-y-5">

                      {/* Most missed notes */}
                      {summary.most_missed_notes?.length > 0 && (
                        <div className="group p-8 rounded-2xl bg-white border-l-4 border-indigo-500 hover:translate-x-1 transition-transform shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-headline font-bold text-lg">Most Missed Notes</h4>
                            <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                              AI PRIORITY
                            </span>
                          </div>
                          <p className="text-sm text-neutral-500 leading-relaxed mb-4">
                            You consistently struggled with these notes. Focus practice on finding them quickly on the keyboard.
                          </p>
                          <div className="flex gap-3 flex-wrap mb-4">
                            {summary.most_missed_notes.map(({ note, times }) => (
                              <span
                                key={note}
                                className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-bold"
                              >
                                {note} <span className="text-red-400 font-normal">× {times}</span>
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-6 text-xs">
                            <div className="flex items-center gap-2 text-neutral-500">
                              <span className="material-symbols-outlined text-indigo-500 text-sm">schedule</span>
                              <span className="font-bold">10 min Drill</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Timing insight */}
                      {summary.timing_errors > 0 && (
                        <div className="group p-8 rounded-2xl bg-white border-l-4 border-amber-400 hover:translate-x-1 transition-transform shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-headline font-bold text-lg">Timing Consistency</h4>
                            <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-600 rounded-full">
                              RHYTHM
                            </span>
                          </div>
                          <p className="text-sm text-neutral-500 leading-relaxed mb-4">
                            You had <strong>{summary.timing_errors}</strong> timing error
                            {summary.timing_errors !== 1 ? "s" : ""} this session — notes played outside the 300ms
                            window. Try practicing with a metronome at 60% of the target BPM.
                          </p>
                          <div className="flex items-center gap-6 text-xs">
                            <div className="flex items-center gap-2 text-neutral-500">
                              <span className="material-symbols-outlined text-indigo-500 text-sm">schedule</span>
                              <span className="font-bold">15 min Metronome</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Streak achievement */}
                      <div className="group p-8 rounded-2xl bg-white border-l-4 border-emerald-400 hover:translate-x-1 transition-transform shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-headline font-bold text-lg">Best Streak</h4>
                          <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                            ACHIEVEMENT
                          </span>
                        </div>
                        <p className="text-sm text-neutral-500 leading-relaxed">
                          Your best streak was{" "}
                          <strong className="text-emerald-600">{summary.max_streak} consecutive correct notes</strong>.
                          {summary.max_streak >= 10
                            ? " Excellent consistency! Push for an even longer streak next session."
                            : " Keep practicing to build longer streaks — they indicate muscle memory forming."
                          }
                        </p>
                      </div>

                      {/* Score based general advice */}
                      <div className={`p-6 rounded-2xl border ${scoreBg}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className="material-symbols-outlined text-sm"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {score >= 85 ? "celebration" : score >= 60 ? "lightbulb" : "flag"}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-widest">
                            {score >= 85 ? "Excellent Work" : score >= 60 ? "Keep Going" : "Keep Practicing"}
                          </span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed">
                          {score >= 85
                            ? "Outstanding session! Your accuracy is excellent. Consider attempting the next difficulty level."
                            : score >= 60
                            ? "Good progress! Focus on the missed notes above and try slowing down the tricky sections."
                            : "Great effort! Try practicing at a slower tempo first — accuracy before speed always wins."
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Summary Panel */}
                  <div className="col-span-12 lg:col-span-4 space-y-5">

                    {/* Refinement ETA */}
                    <div className="bg-neutral-900 p-8 rounded-2xl text-white">
                      <h4 className="font-headline text-lg font-bold mb-4">Session Stats</h4>
                      <div className="space-y-4">
                        {[
                          { label: "Notes Correct",    value: summary.correct,        bar: (summary.correct / summary.total) * 100 },
                          { label: "Notes Wrong",       value: summary.wrong,          bar: (summary.wrong   / summary.total) * 100 },
                          { label: "Timing Errors",     value: summary.timing_errors,  bar: (summary.timing_errors / summary.total) * 100 },
                          { label: "Max Streak",        value: summary.max_streak,     bar: Math.min((summary.max_streak / 20) * 100, 100) },
                        ].map(({ label, value, bar }) => (
                          <div key={label}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-neutral-400">{label}</span>
                              <span className="font-bold">{value}</span>
                            </div>
                            <div className="w-full h-1 bg-neutral-700 rounded-full">
                              <div
                                className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(bar, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="w-full mt-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                        Start Targeted Practice
                      </button>
                    </div>

                    {/* Mistakes breakdown */}
                    {summary.mistakes?.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <h4 className="font-headline font-bold text-sm mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                          Mistake Breakdown
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {summary.mistakes.slice(0, 10).map((m, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs">
                              <span
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  m.type === "wrong_note" ? "bg-red-400" : "bg-amber-400"
                                }`}
                              />
                              <span className="text-neutral-600 flex-1">
                                {m.type === "wrong_note"
                                  ? `Expected ${m.expected}, played ${m.played}`
                                  : `${m.note} — ${m.direction} by ${Math.abs(m.delay)}s`
                                }
                              </span>
                              <span className="text-neutral-400">#{m.position + 1}</span>
                            </div>
                          ))}
                          {summary.mistakes.length > 10 && (
                            <p className="text-xs text-neutral-400 text-center pt-2">
                              +{summary.mistakes.length - 10} more mistakes
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>

        {/* Side Nav with AI Chat */}
        <SideNav />
      </div>
    </div>
  );
}