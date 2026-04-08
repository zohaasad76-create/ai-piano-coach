// src/pages/Library.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import SideNav from "../components/SideNav";
import { fetchSongs } from "../api";

const FILTERS = ["All Repertoire", "Classical", "Jazz & Blues", "Pop Modern", "Film Scores"];

const SONG_META = {
  "fur-elise":          { level: "Beginner",     duration: "10 MIN", artist: "Beethoven",       color: "from-sky-400 to-blue-600" },
  "river-flows-in-you": { level: "Beginner",     duration: "15 MIN", artist: "Yiruma",          color: "from-purple-400 to-indigo-600" },
  "hallelujah":         { level: "Beginner",     duration: "12 MIN", artist: "Leonard Cohen",   color: "from-amber-400 to-orange-600" },
  "imagine":            { level: "Beginner",     duration: "8 MIN",  artist: "John Lennon",     color: "from-emerald-400 to-teal-600" },
  "nocturne-op9-no2":   { level: "Intermediate", duration: "45 MIN", artist: "Chopin",          color: "from-blue-600 to-indigo-900" },
  "interstellar-theme": { level: "Intermediate", duration: "40 MIN", artist: "Hans Zimmer",     color: "from-neutral-700 to-neutral-900" },
  "clair-de-lune":      { level: "Advanced",     duration: "55 MIN", artist: "Debussy",         color: "from-slate-500 to-slate-900" },
  "moonlight-sonata":   { level: "Intermediate", duration: "55 MIN", artist: "Beethoven",       color: "from-gray-700 to-gray-900" },
};

export default function Library() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All Repertoire");

  useEffect(() => {
    fetchSongs()
      .then((d) => setSongs(d.songs || []))
      .catch(() => setSongs([]))
      .finally(() => setLoading(false));
  }, []);

  const beginnerSongs = songs.filter((s) => {
    const meta = SONG_META[s.name];
    return meta?.level === "Beginner";
  });
  const intermediateSongs = songs.filter((s) => {
    const meta = SONG_META[s.name];
    return meta?.level === "Intermediate" || meta?.level === "Advanced";
  });

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen">
      <TopBar />
      <main className="flex min-h-screen">
        <div className="flex-1 px-12 py-12">

          {/* Hero */}
          <section className="mb-16">
            <h1 className="text-6xl font-headline font-extrabold tracking-tighter text-on-surface mb-4">
              Song Library
            </h1>
            <p className="text-neutral-500 text-lg max-w-2xl leading-relaxed">
              Master the repertoire that moves you. From timeless classics to modern synthetics, curated for your growth.
            </p>
          </section>

          {/* Featured Bento */}
          <div className="grid grid-cols-12 gap-6 mb-20">
            <div className="col-span-12 lg:col-span-8 group relative overflow-hidden rounded-[2rem] h-[400px] bg-neutral-900">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-neutral-900 opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-10">
                <span className="inline-block px-4 py-1 rounded-full bg-emerald-300 text-emerald-900 text-xs font-bold mb-4">
                  RECOMMENDED FOR YOU
                </span>
                <h2 className="text-4xl font-headline font-bold text-white mb-2">Clair de Lune</h2>
                <p className="text-neutral-300 mb-6 max-w-md">
                  Claude Debussy — Master the delicate phrasing and Impressionist textures.
                </p>
                <Link
                  to="/practice"
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 w-fit hover:shadow-lg transition-all"
                >
                  Continue Practice
                  <span className="material-symbols-outlined">play_arrow</span>
                </Link>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4 rounded-[2rem] bg-indigo-50 p-10 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-headline font-bold text-indigo-900 mb-2">Daily Challenge</h3>
                <p className="text-indigo-700">"The Blue Danube" rhythm precision test.</p>
              </div>
              <div className="mt-8">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-bold text-indigo-900">85%</span>
                  <span className="text-indigo-600 text-sm font-bold">ALMOST THERE</span>
                </div>
                <div className="w-full h-3 bg-indigo-200 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-indigo-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-12 items-center">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-6 py-2 rounded-full font-bold transition-all ${
                  activeFilter === f
                    ? "bg-indigo-600 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {f}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 text-neutral-500 font-medium">
              <span className="material-symbols-outlined text-xl">filter_list</span>
              <span>Sort by: Latest</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-neutral-400 py-24">Loading songs from backend...</div>
          ) : songs.length === 0 ? (
            <div className="text-center text-neutral-400 py-24">
              <span className="material-symbols-outlined text-5xl block mb-4">music_off</span>
              No MIDI songs found. Add <code>.mid</code> files to <code>backend/songs/</code>
            </div>
          ) : (
            <div className="space-y-16">
              {/* Beginner */}
              {beginnerSongs.length > 0 && (
                <SongSection title="Beginner" songs={beginnerSongs} />
              )}
              {/* Intermediate / Advanced */}
              {intermediateSongs.length > 0 && (
                <SongSection title="Intermediate" songs={intermediateSongs} />
              )}
              {/* All songs fallback if no metadata */}
              {beginnerSongs.length === 0 && intermediateSongs.length === 0 && (
                <SongSection title="All Songs" songs={songs} />
              )}
            </div>
          )}
        </div>

        <SideNav />
      </main>
    </div>
  );
}

function SongCard({ song }) {
  const meta = SONG_META[song.name] || { color: "from-indigo-500 to-indigo-900", duration: "—", artist: "Unknown" };
  const displayName = song.name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Link to="/practice" className="group cursor-pointer">
      <div className={`aspect-[4/5] rounded-[2rem] overflow-hidden bg-gradient-to-br ${meta.color} mb-4 relative transition-transform duration-500 group-hover:-translate-y-2`}>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <span className="material-symbols-outlined text-white text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            play_circle
          </span>
        </div>
        <div className="absolute bottom-4 left-4 flex gap-2">
          <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-neutral-800">
            {meta.duration}
          </span>
          {song.total_notes && (
            <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-neutral-800">
              {song.total_notes} notes
            </span>
          )}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-1 font-headline">{displayName}</h3>
      <p className="text-neutral-500 text-sm">{meta.artist}</p>
    </Link>
  );
}

function SongSection({ title, songs }) {
  return (
    <section>
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-3xl font-headline font-bold tracking-tight">{title}</h2>
        <div className="h-[1px] flex-1 bg-neutral-200" />
        <a className="text-indigo-600 font-bold hover:underline" href="#">See all</a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {songs.map((s) => <SongCard key={s.name} song={s} />)}
      </div>
    </section>
  );
}