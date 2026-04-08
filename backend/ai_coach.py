# ai_coach.py
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2"


def get_coaching(summary: dict, song_name: str) -> str:
    """
    Called at end of song. Returns AI coaching feedback based on session summary.
    """
    wrong_notes = [m for m in summary["mistakes"] if m["type"] == "wrong_note"]
    timing_issues = [m for m in summary["mistakes"] if m["type"] == "timing_error"]

    missed_detail = ""
    if summary["most_missed_notes"]:
        notes_str = ", ".join(
            f"{m['note']} ({m['times']} times)"
            for m in summary["most_missed_notes"]
        )
        missed_detail = f"Most missed notes: {notes_str}"

    timing_detail = ""
    if timing_issues:
        late = sum(1 for m in timing_issues if m["direction"] == "too slow")
        early = sum(1 for m in timing_issues if m["direction"] == "too fast")
        timing_detail = f"Timing: {late} notes too slow, {early} notes too fast"

    prompt = f"""You are a warm and encouraging piano teacher giving feedback after practice.

Song practiced: {song_name}
Final score: {summary['final_score']}%
Note accuracy: {summary['note_accuracy']}%
Timing accuracy: {summary['timing_accuracy']}%
Wrong notes: {summary['wrong']}
{missed_detail}
{timing_detail}
Max streak: {summary['max_streak']} correct in a row

Give specific, actionable coaching in 2-3 sentences.
- If score is above 85%: celebrate and suggest next challenge
- If score is 60-85%: encourage and give one specific tip
- If score is below 60%: be very encouraging, suggest slowing down
Mention specific notes or timing issues if relevant. Be warm, not robotic."""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 100,
                },
            },
            timeout=30,
        )
        return response.json()["response"].strip()
    except requests.exceptions.Timeout:
        return "Great practice session! Keep working on those tricky notes and your accuracy will improve."
    except Exception:
        return "Well done for practicing! Consistency is the key to improvement."


def get_next_note_hint(expected_note: str, finger_number: int = None) -> str:
    """Quick static hint for what to play next — no LLM needed."""
    hints = {
        "C": "white key, far left of each group",
        "D": "white key between two black keys",
        "E": "white key right of the two black keys",
        "F": "white key left of three black keys",
        "G": "middle of three black keys group",
        "A": "right side of three black keys",
        "B": "last white key before next C",
    }
    note_name = expected_note.replace("#", "").replace("b", "")[0]
    hint = hints.get(note_name, "")
    finger_str = f" Use finger {finger_number}." if finger_number else ""
    return f"Play {expected_note}. {hint}.{finger_str}"