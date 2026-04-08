// src/pages/Vibe.jsx
// ─────────────────────────────────────────────────────────────────────────────
// SONIC ARCHITECT — VIBE MODE
// Inspired by astrodither.robertborghesi.is
// Audio-reactive 3D hand with dithering, chromatic aberration, fluid particles
// Three.js r128 via CDN loaded dynamically
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";

export default function Vibe() {
  const mountRef     = useRef(null);
  const canvasRef    = useRef(null);
  const animRef      = useRef(null);
  const audioCtxRef  = useRef(null);
  const analyserRef  = useRef(null);
  const sourceRef    = useRef(null);
  const threeRef     = useRef({});

  const [entered,   setEntered]   = useState(false);
  const [speed,     setSpeed]     = useState(1);
  const [tooFast,   setTooFast]   = useState(false);
  const [holding,   setHolding]   = useState(false);
  const [audioErr,  setAudioErr]  = useState(false);
  const [bpm,       setBpm]       = useState(80);

  const holdInterval = useRef(null);
  const speedRef     = useRef(1);
  const tooFastTimer = useRef(null);

  // ── Inject Three.js from CDN ──────────────────────────────────────────────
  useEffect(() => {
    if (window.THREE) return;
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.async = true;
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  // ── Enter + start audio + build scene ────────────────────────────────────
  const handleEnter = async () => {
    setEntered(true);

    // Wait for THREE to load
    let tries = 0;
    while (!window.THREE && tries < 30) {
      await new Promise((r) => setTimeout(r, 100));
      tries++;
    }
    if (!window.THREE) return;

    buildScene();
    startAudio();
  };

  // ── Web Audio — oscillator simulating piano ───────────────────────────────
  const startAudio = () => {
    try {
      const ctx      = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      // Simple arpeggio oscillator for ambient piano vibe
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25]; // C4 E4 G4 C5 E5
      let noteIdx = 0;

      const playNote = () => {
        const osc    = ctx.createOscillator();
        const gainNd = ctx.createGain();
        osc.type      = "triangle";
        osc.frequency.value = notes[noteIdx % notes.length] * speedRef.current;
        gainNd.gain.setValueAtTime(0.18, ctx.currentTime);
        gainNd.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gainNd);
        gainNd.connect(analyser);
        analyser.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.9);
        noteIdx++;
      };

      const scheduleNotes = () => {
        const intervalMs = (60 / (bpm * speedRef.current)) * 1000;
        playNote();
        sourceRef.current = setTimeout(scheduleNotes, intervalMs);
      };

      scheduleNotes();
      audioCtxRef.current  = ctx;
      analyserRef.current  = analyser;
    } catch {
      setAudioErr(true);
    }
  };

  // ── Three.js Scene ────────────────────────────────────────────────────────
  const buildScene = () => {
    const THREE  = window.THREE;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);

    // Scene + Camera
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // ── Lights ──
    const ambient = new THREE.AmbientLight(0x1a0533, 2);
    scene.add(ambient);

    const pointL = new THREE.PointLight(0x6633ff, 4, 20);
    pointL.position.set(2, 3, 3);
    scene.add(pointL);

    const rimL = new THREE.PointLight(0x00ffcc, 2, 15);
    rimL.position.set(-3, -1, 2);
    scene.add(rimL);

    // ── Hand — built from primitives (fingers + palm) ──
    const handGroup = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xccaa88,
      roughness: 0.85,
      metalness: 0.05,
      wireframe: false,
    });

    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x6633ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });

    // Palm
    const palmGeo  = new THREE.BoxGeometry(1.4, 1.0, 0.3);
    const palm     = new THREE.Mesh(palmGeo, skinMat);
    const palmWire = new THREE.Mesh(palmGeo, wireframeMat);
    palm.add(palmWire);
    handGroup.add(palm);

    // Fingers — 5 cylinders
    const fingerData = [
      { x: -0.55, len: 0.9, name: "pinky"  },
      { x: -0.27, len: 1.1, name: "ring"   },
      { x:  0.0,  len: 1.2, name: "middle" },
      { x:  0.27, len: 1.1, name: "index"  },
      { x:  0.55, len: 0.7, name: "thumb"  },
    ];

    const fingers = [];
    fingerData.forEach(({ x, len }) => {
      const geo    = new THREE.CylinderGeometry(0.1, 0.12, len, 8);
      const mesh   = new THREE.Mesh(geo, skinMat);
      const wire   = new THREE.Mesh(geo, wireframeMat);
      mesh.add(wire);
      mesh.position.set(x, 0.5 + len / 2, 0);
      mesh.userData.baseY    = mesh.position.y;
      mesh.userData.baseRotX = 0;
      handGroup.add(mesh);
      fingers.push(mesh);
    });

    // Knuckles
    fingerData.forEach(({ x }) => {
      const geo  = new THREE.SphereGeometry(0.13, 8, 8);
      const knuc = new THREE.Mesh(geo, skinMat);
      knuc.position.set(x, 0.5, 0);
      handGroup.add(knuc);
    });

    handGroup.position.set(0, -0.5, 0);
    scene.add(handGroup);

    // ── Floating Particles (notes / fluid) ──
    const PARTICLE_COUNT = 800;
    const pGeo  = new THREE.BufferGeometry();
    const pPos  = new Float32Array(PARTICLE_COUNT * 3);
    const pCol  = new Float32Array(PARTICLE_COUNT * 3);
    const pVel  = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 14;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      pVel[i * 3]     = (Math.random() - 0.5) * 0.01;
      pVel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      pVel[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
      // Color: indigo to cyan gradient
      const t = Math.random();
      pCol[i * 3]     = 0.2 + t * 0.3;
      pCol[i * 3 + 1] = 0.1 + t * 0.6;
      pCol[i * 3 + 2] = 0.6 + t * 0.4;
    }

    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color",    new THREE.BufferAttribute(pCol, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    });

    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── Dither overlay plane (post-effect simulation) ──
    const ditherGeo = new THREE.PlaneGeometry(14, 10);
    const ditherMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.0,
    });
    const ditherPlane = new THREE.Mesh(ditherGeo, ditherMat);
    ditherPlane.position.z = 4;
    scene.add(ditherPlane);

    // Store refs
    threeRef.current = { renderer, scene, camera, handGroup, fingers, particles, pPos, pVel, pointL, rimL, ditherMat };

    // ── Resize handler ──
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ── Animate ──
    let t = 0;
    const dataArr = new Uint8Array(analyserRef.current?.frequencyBinCount || 64);

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      t += 0.016 * speedRef.current;

      // Audio data
      let bass = 0.3, mid = 0.2, treble = 0.1;
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArr);
        const len = dataArr.length;
        bass   = dataArr.slice(0,  len / 4).reduce((a, b) => a + b, 0) / (len / 4) / 255;
        mid    = dataArr.slice(len / 4, len / 2).reduce((a, b) => a + b, 0) / (len / 4) / 255;
        treble = dataArr.slice(len / 2).reduce((a, b) => a + b, 0) / (len / 2) / 255;
      }

      const sp = speedRef.current;

      // ── Hand animation ──
      handGroup.rotation.y = Math.sin(t * 0.4) * 0.3;
      handGroup.rotation.x = Math.sin(t * 0.25) * 0.15 + bass * 0.3;
      handGroup.rotation.z = Math.sin(t * 0.18) * 0.08;
      handGroup.position.y = -0.5 + Math.sin(t * 0.5) * 0.2 + bass * 0.4;
      handGroup.position.x = Math.sin(t * 0.3) * 0.3;

      // Fingers wave like playing piano
      fingers.forEach((f, i) => {
        const phase = i * 0.6;
        const press = Math.sin(t * 2.5 * sp + phase) * 0.5 + 0.5;
        f.rotation.x         = press * 0.5 + mid * 0.4;
        f.position.y         = f.userData.baseY - press * 0.15 - bass * 0.1;
      });

      // ── Particles ──
      const pos = pGeo.attributes.position.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i * 3]     += pVel[i * 3]     * sp + Math.sin(t + i) * 0.001 * bass * 5;
        pos[i * 3 + 1] += pVel[i * 3 + 1] * sp + Math.cos(t + i) * 0.001 * mid  * 5;
        pos[i * 3 + 2] += pVel[i * 3 + 2] * sp;

        // Wrap
        if (Math.abs(pos[i * 3])     > 7)  pos[i * 3]     *= -0.95;
        if (Math.abs(pos[i * 3 + 1]) > 5)  pos[i * 3 + 1] *= -0.95;
        if (Math.abs(pos[i * 3 + 2]) > 4)  pos[i * 3 + 2] *= -0.95;
      }
      pGeo.attributes.position.needsUpdate = true;

      // ── Lights pulse ──
      pointL.intensity = 3 + bass * 8 * sp;
      pointL.position.x = Math.sin(t * 0.7) * 3;
      pointL.position.y = Math.cos(t * 0.5) * 2 + 2;
      rimL.intensity    = 1.5 + mid * 4;
      rimL.color.setHSL(0.5 + treble * 0.2, 1, 0.5);

      // ── Dither flicker at high speed ──
      if (sp > 2.5) {
        ditherMat.opacity = Math.random() * 0.08 * (sp - 2);
      } else {
        ditherMat.opacity = 0;
      }

      // ── Camera subtle drift ──
      camera.position.x = Math.sin(t * 0.15) * 0.3;
      camera.position.y = Math.cos(t * 0.12) * 0.2;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animRef.current);
      renderer.dispose();
    };
  };

  // ── Speed control ─────────────────────────────────────────────────────────
  const increaseSpeed = () => {
    setSpeed((s) => {
      const next = Math.min(s + 0.08, 5);
      speedRef.current = next;
      setBpm(Math.round(80 * next));

      if (next >= 3.5) {
        setTooFast(true);
        clearTimeout(tooFastTimer.current);
        tooFastTimer.current = setTimeout(() => setTooFast(false), 1200);
      }
      return next;
    });
  };

  const handleHoldStart = () => {
    setHolding(true);
    holdInterval.current = setInterval(increaseSpeed, 60);
  };

  const handleHoldEnd = () => {
    setHolding(false);
    clearInterval(holdInterval.current);
  };

  const handleClick = () => {
    increaseSpeed();
    increaseSpeed();
    increaseSpeed();
  };

  const handleSlowDown = () => {
    setSpeed((s) => {
      const next = Math.max(s - 0.5, 0.5);
      speedRef.current = next;
      setBpm(Math.round(80 * next));
      setTooFast(false);
      return next;
    });
  };

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(holdInterval.current);
      clearTimeout(tooFastTimer.current);
      clearTimeout(sourceRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  const speedPct = ((speed - 0.5) / 4.5) * 100;

  // ── ENTER SCREEN ─────────────────────────────────────────────────────────
  if (!entered) {
    return (
      <div
        className="fixed inset-0 bg-black flex flex-col items-center justify-center cursor-pointer select-none"
        onClick={handleEnter}
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        {/* Grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
            opacity: 0.4,
          }}
        />

        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
          }}
        />

        {/* Glowing orb */}
        <div
          className="absolute rounded-full"
          style={{
            width: 400,
            height: 400,
            background: "radial-gradient(circle, rgba(102,51,255,0.15) 0%, transparent 70%)",
            animation: "pulse 3s ease-in-out infinite",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-8 text-center px-8">
          <div className="flex flex-col gap-1">
            <p className="text-neutral-600 text-xs tracking-[0.5em] uppercase">
              [SIGNAL. LOST. BEAUTY. FOUND.]
            </p>
          </div>

          <h1
            className="text-white text-7xl md:text-9xl font-black tracking-tighter leading-none"
            style={{
              textShadow: "0 0 40px rgba(102,51,255,0.6), 0 0 80px rgba(102,51,255,0.3)",
              fontFamily: "'Courier New', monospace",
            }}
          >
            SONIC<br />
            <span style={{ color: "#6633ff" }}>VIBE</span>
          </h1>

          <p className="text-neutral-500 text-sm tracking-widest max-w-xs">
            A piano hand. A song. Speed it up until it breaks.
          </p>

          <div
            className="border border-neutral-700 text-neutral-300 px-8 py-4 text-sm tracking-[0.3em] uppercase"
            style={{
              animation: "blink 2s ease-in-out infinite",
              boxShadow: "0 0 20px rgba(102,51,255,0.2)",
            }}
          >
            :: CLICK TO ENTER + ENABLE AUDIO ::
          </div>
        </div>

        <style>{`
          @keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.1); opacity: 1; } }
          @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        `}</style>
      </div>
    );
  }

  // ── MAIN VIBE SCENE ───────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black overflow-hidden" style={{ fontFamily: "'Courier New', monospace" }}>

      {/* Three.js Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
          opacity: speed > 2 ? 0.6 : 0.25,
          transition: "opacity 0.5s",
        }}
      />

      {/* Scanlines at high speed */}
      {speed > 2 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 6px)",
            opacity: (speed - 2) * 0.4,
          }}
        />
      )}

      {/* Chromatic aberration at high speed */}
      {speed > 3 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, transparent 60%, rgba(255,0,100,${(speed - 3) * 0.05}) 100%)`,
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* ── TOO FAST overlay ── */}
      {tooFast && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          style={{ animation: "glitch 0.15s steps(2) infinite" }}
        >
          <span
            className="text-white font-black select-none"
            style={{
              fontSize: "clamp(60px, 15vw, 180px)",
              letterSpacing: "-0.04em",
              textShadow: "4px 0 #ff0055, -4px 0 #00ffcc, 0 0 40px rgba(255,255,255,0.5)",
              fontFamily: "'Courier New', monospace",
            }}
          >
            TOO FAST
          </span>
        </div>
      )}

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-8 py-6 z-20">
        <a
          href="/library"
          className="text-neutral-500 text-xs tracking-widest hover:text-white transition-colors uppercase"
        >
          ← Back to App
        </a>
        <div className="text-neutral-600 text-xs tracking-widest">
          SONIC ARCHITECT — VIBE MODE
        </div>
        <div className="text-neutral-500 text-xs">
          {new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      </div>

      {/* ── Left info panel ── */}
      <div className="absolute left-8 bottom-32 z-20 flex flex-col gap-2">
        <p className="text-neutral-600 text-[10px] tracking-[0.3em] uppercase">Now Playing</p>
        <h2 className="text-white text-2xl font-black tracking-tight" style={{ textShadow: "0 0 20px rgba(102,51,255,0.8)" }}>
          PIANO VIBE
        </h2>
        <p className="text-neutral-500 text-xs">{bpm} BPM · {speed.toFixed(1)}x</p>

        {/* Speed bar */}
        <div className="w-40 mt-2">
          <div className="flex justify-between text-[9px] text-neutral-600 mb-1 uppercase tracking-widest">
            <span>Slow</span>
            <span>Fast</span>
          </div>
          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${speedPct}%`,
                background: speed > 3 ? "#ff0055" : speed > 2 ? "#ffaa00" : "#6633ff",
                boxShadow: `0 0 8px ${speed > 3 ? "#ff0055" : "#6633ff"}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Right info panel ── */}
      <div className="absolute right-8 bottom-32 z-20 flex flex-col items-end gap-3">
        <p className="text-neutral-600 text-[10px] tracking-[0.3em] uppercase">Controls</p>
        <p className="text-neutral-500 text-xs">HOLD — speed up slowly</p>
        <p className="text-neutral-500 text-xs">CLICK — speed burst</p>
        <button
          onClick={handleSlowDown}
          className="text-neutral-600 text-xs hover:text-white transition-colors border border-neutral-800 px-4 py-1.5 hover:border-neutral-600 mt-1"
        >
          SLOW DOWN
        </button>
        {audioErr && (
          <p className="text-red-500 text-[10px]">Audio unavailable</p>
        )}
      </div>

      {/* ── Main Speed Button ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3">
        <p className="text-neutral-600 text-[10px] tracking-[0.4em] uppercase">
          HOLD FOR SPEED · CLICK FOR BURST · {speed.toFixed(1)}x
        </p>
        <button
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onMouseLeave={handleHoldEnd}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldEnd}
          onClick={handleClick}
          className="relative px-16 py-5 border text-white text-sm tracking-[0.3em] uppercase transition-all select-none"
          style={{
            borderColor: holding ? "#6633ff" : "rgba(255,255,255,0.2)",
            boxShadow: holding
              ? "0 0 30px rgba(102,51,255,0.5), inset 0 0 30px rgba(102,51,255,0.1)"
              : "none",
            background: holding ? "rgba(102,51,255,0.1)" : "transparent",
            transition: "all 0.1s",
          }}
        >
          {holding ? "SPEEDING UP..." : "HOLD / CLICK"}
        </button>
      </div>

      <style>{`
        @keyframes glitch {
          0%   { transform: translate(0);       clip-path: inset(10% 0 80% 0); }
          25%  { transform: translate(-4px, 2px); clip-path: inset(60% 0 20% 0); }
          50%  { transform: translate(4px, -2px); clip-path: inset(30% 0 50% 0); }
          75%  { transform: translate(-2px, 4px); clip-path: inset(80% 0 5%  0); }
          100% { transform: translate(0);       clip-path: inset(10% 0 80% 0); }
        }
      `}</style>
    </div>
  );
}