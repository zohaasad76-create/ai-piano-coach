// src/components/TopBar.jsx
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Library",     to: "/library" },
  { label: "Curriculum",  to: "/" },
  { label: "Performance", to: "/performance" },
  { label: "Studio",      to: "/vibe" },
];

export default function TopBar() {
  const { pathname } = useLocation();

  return (
    <header className="w-full top-0 sticky bg-slate-50 z-50">
      <div className="flex justify-between items-center px-12 py-6 max-w-[1920px] mx-auto">
        <div className="flex items-center gap-12">
          <Link to="/" className="text-2xl font-bold tracking-tighter text-neutral-900 font-headline">
            Sonic Architect
          </Link>
          <nav className="hidden md:flex gap-8 items-center">
            {navLinks.map(({ label, to }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`font-headline tracking-tight font-bold transition-opacity duration-300 pb-1
                    ${active
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-neutral-500 hover:text-neutral-900"
                    }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              search
            </span>
            <input
              className="bg-neutral-100 border-none rounded-xl pl-10 pr-4 py-2 w-64 focus:ring-2 focus:ring-indigo-500 text-sm transition-all outline-none"
              placeholder="Search compositions..."
              type="text"
            />
          </div>
          <button className="hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-neutral-500">notifications</span>
          </button>
          <button className="hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-neutral-500">settings</span>
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-neutral-200 bg-neutral-200" />
        </div>
      </div>
      <div className="bg-neutral-100 h-[1px] w-full" />
    </header>
  );
}