// src/pages/Home.jsx
import TopBar from "../components/TopBar";
import SideNav from "../components/SideNav";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="bg-surface text-on-surface font-body min-h-screen">
      <TopBar />
      <div className="flex max-w-[1920px] mx-auto">
        <main className="flex-grow px-12 py-8 overflow-y-auto">

          {/* Hero */}
          <section className="mb-16">
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 to-indigo-900" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex flex-col justify-center px-16">
                <div className="max-w-xl">
                  <span className="text-emerald-300 font-headline font-bold uppercase tracking-widest text-xs mb-4 block">
                    Last Practiced
                  </span>
                  <h1 className="text-5xl font-headline font-extrabold text-white leading-tight mb-6 tracking-tight">
                    Nocturne Op. 9 No. 2
                  </h1>
                  <p className="text-neutral-300 text-lg mb-8 font-medium">
                    Pick up right where you left off. Chopin's masterpiece awaits your touch.
                  </p>
                  <Link
                    to="/practice"
                    className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 w-fit transition-transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-500/20"
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      play_arrow
                    </span>
                    Resume Session
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Bento */}
          <div className="grid grid-cols-12 gap-8 mb-12">
            <div className="col-span-12 lg:col-span-8 space-y-8">
              <h2 className="text-3xl font-headline font-extrabold tracking-tight">Your Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Course Card */}
                <div className="bg-white p-8 rounded-2xl flex flex-col justify-between min-h-[240px] shadow-sm">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-xl font-headline font-bold">Classical Foundation II</h3>
                      <span className="text-indigo-600 font-bold text-sm">68% Complete</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full mb-8">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: "68%" }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex -space-x-2">
                      {["SM", "AR"].map((l) => (
                        <div key={l} className="h-8 w-8 rounded-full border-2 border-white bg-neutral-200 flex items-center justify-center text-[10px] font-bold">{l}</div>
                      ))}
                      <div className="h-8 w-8 rounded-full border-2 border-white bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">+12</div>
                    </div>
                    <span className="text-neutral-500">Studio Group</span>
                  </div>
                </div>

                {/* Streak Card */}
                <div className="bg-neutral-50 p-8 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <span className="material-symbols-outlined text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    </div>
                    <div>
                      <h3 className="font-headline font-bold">Daily Streak</h3>
                      <p className="text-sm text-neutral-500">12 Days Active</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex gap-2 items-end">
                      {[16, 20, 12, 24, 20, 28].map((h, i) => (
                        <div key={i} className={`w-2 rounded-full ${i === 5 ? "bg-indigo-600" : "bg-emerald-300"}`} style={{ height: `${h * 3}px` }} />
                      ))}
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-headline font-extrabold text-indigo-600">45m</span>
                      <p className="text-xs font-bold text-neutral-400 uppercase">Today</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <h2 className="text-3xl font-headline font-extrabold tracking-tight pt-8">Personalized for You</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "River Flows In You", artist: "Yiruma",       level: "Intermediate", color: "from-sky-400 to-blue-600" },
                  { title: "Interstellar Theme", artist: "Hans Zimmer",   level: "Advanced",     color: "from-indigo-600 to-purple-700" },
                  { title: "Clair de Lune",      artist: "Debussy",       level: "Expert",       color: "from-neutral-700 to-neutral-900" },
                ].map(({ title, artist, level, color }) => (
                  <Link to="/practice" key={title} className="group cursor-pointer">
                    <div className={`aspect-[4/5] rounded-2xl overflow-hidden mb-4 bg-gradient-to-br ${color} relative`}>
                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                        {level}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                      </div>
                    </div>
                    <h4 className="font-headline font-bold text-lg">{title}</h4>
                    <p className="text-sm text-neutral-500 font-medium">{artist}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
        <SideNav />
      </div>

      {/* Mobile Bottom Nav */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-neutral-200 px-6 py-4 flex justify-around items-center z-60">
        {[
          { icon: "dashboard", label: "Home", to: "/" },
          { icon: "library_music", label: "Library", to: "/library" },
          { icon: "auto_awesome", label: "AI Guide", to: "/" },
          { icon: "person", label: "Profile", to: "/" },
        ].map(({ icon, label, to }) => (
          <Link key={label} to={to} className="flex flex-col items-center gap-1 text-neutral-400">
            <span className="material-symbols-outlined">{icon}</span>
            <span className="text-[10px] font-bold uppercase">{label}</span>
          </Link>
        ))}
      </footer>
    </div>
  );
}