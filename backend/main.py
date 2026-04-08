# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from midi_parser import parse_midi
from scorer import NoteEvaluator
from ai_coach import get_coaching, get_next_note_hint
from ai_chatbot import router as chat_router
import os

app = FastAPI(title="Sonic Architect — AI Piano Tutor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ───────────────────────────────────
app.include_router(chat_router, prefix="/tutor", tags=["AI Chatbot"])

# ── In-memory sessions — one per song ─────────────────
sessions: dict[str, NoteEvaluator] = {}
song_data_cache: dict[str, dict] = {}

# ── Models ────────────────────────────────────────────
class NoteInput(BaseModel):
    song_name: str
    note: str
    timestamp: float  # seconds since song started


# ── Routes ────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "Sonic Architect backend running"}


@app.get("/songs")
def list_songs():
    """List all available MIDI songs with metadata"""
    songs_dir = "songs"
    if not os.path.exists(songs_dir):
        return {"songs": []}

    result = []
    for f in os.listdir(songs_dir):
        if not f.endswith(".mid"):
            continue
        name = f.replace(".mid", "")
        try:
            data = parse_midi(f"{songs_dir}/{f}")
            result.append({
                "name": name,
                "tempo": data["tempo"],
                "total_notes": data["total_notes"],
                "duration": data["duration"],
            })
        except Exception:
            result.append({"name": name})

    return {"songs": result}


@app.get("/song/{song_name}")
def load_song(song_name: str):
    """Load a song and create a fresh session for it"""
    path = f"songs/{song_name}.mid"
    try:
        data = parse_midi(path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Song '{song_name}' not found")

    sessions[song_name] = NoteEvaluator(data["notes"], data["timings"])
    song_data_cache[song_name] = data

    return {
        "song_name": song_name,
        "notes": data["notes"],
        "timings": data["timings"],
        "durations": data["durations"],
        "tempo": data["tempo"],
        "duration": data["duration"],
        "total_notes": data["total_notes"],
        "first_note": data["notes"][0] if data["notes"] else None,
    }


@app.post("/note")
def evaluate_note(payload: NoteInput):
    """
    Evaluate a note the user just played — called on every keypress.
    Returns real-time feedback immediately.
    """
    evaluator = sessions.get(payload.song_name)
    if not evaluator:
        raise HTTPException(status_code=400, detail="No active session. Load a song first.")

    result = evaluator.evaluate_note(payload.note, payload.timestamp)

    # Song just finished — attach AI coaching summary
    if result.get("song_complete"):
        summary = evaluator.get_summary()
        ai_feedback = get_coaching(summary, payload.song_name)
        result["summary"] = summary
        result["ai_feedback"] = ai_feedback

    return result


@app.get("/hint/{song_name}")
def get_hint(song_name: str):
    """Get a hint for the current note"""
    evaluator = sessions.get(song_name)
    if not evaluator:
        raise HTTPException(status_code=400, detail="No active session")

    idx = evaluator.current_index
    notes = song_data_cache.get(song_name, {}).get("notes", [])

    if idx >= len(notes):
        return {"hint": "Song complete!"}

    return {"hint": get_next_note_hint(notes[idx])}


@app.post("/reset/{song_name}")
def reset_session(song_name: str):
    """Reset a song session to start over"""
    path = f"songs/{song_name}.mid"
    try:
        data = parse_midi(path)
        sessions[song_name] = NoteEvaluator(data["notes"], data["timings"])
        song_data_cache[song_name] = data
        return {"status": "reset", "first_note": data["notes"][0]}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Song not found")


@app.get("/progress/{song_name}")
def get_progress(song_name: str):
    """Get current progress without finishing"""
    evaluator = sessions.get(song_name)
    if not evaluator:
        raise HTTPException(status_code=400, detail="No active session")

    total = len(evaluator.expected_notes)
    return {
        "current_index": evaluator.current_index,
        "total": total,
        "correct": evaluator.correct,
        "wrong": evaluator.wrong,
        "streak": evaluator.streak,
        "percent_done": round((evaluator.current_index / total) * 100, 1),
    }


@app.get("/summary/{song_name}")
def get_summary(song_name: str):
    """Get current session summary at any point (not just end of song)"""
    evaluator = sessions.get(song_name)
    if not evaluator:
        raise HTTPException(status_code=400, detail="No active session")
    return evaluator.get_summary()