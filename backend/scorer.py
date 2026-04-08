# scorer.py
from collections import Counter

class NoteEvaluator:
    def __init__(self, expected_notes: list, expected_timings: list):
        self.expected_notes = expected_notes
        self.expected_timings = expected_timings
        self.current_index = 0
        self.mistakes = []
        self.correct = 0
        self.wrong = 0
        self.timing_errors = 0
        self.streak = 0
        self.max_streak = 0

    def evaluate_note(self, played_note: str, played_at: float) -> dict:
        if self.current_index >= len(self.expected_notes):
            return {"status": "song_complete"}

        expected_note = self.expected_notes[self.current_index]
        expected_time = self.expected_timings[self.current_index]
        time_diff = played_at - expected_time  # positive = late, negative = early

        # ── Wrong note ──────────────────────────────────────
        if played_note != expected_note:
            self.wrong += 1
            self.streak = 0
            self.mistakes.append({
                "type": "wrong_note",
                "expected": expected_note,
                "played": played_note,
                "position": self.current_index,
            })
            return {
                "status": "wrong",
                "message": f"Wrong note! Expected {expected_note}, you played {played_note}",
                "expected_next": expected_note,
                "current_index": self.current_index,
                "advance": False,
            }

        # ── Correct note — check timing ──────────────────────
        timing_ok = abs(time_diff) <= 0.3  # 300ms window

        if not timing_ok:
            self.timing_errors += 1
            direction = "too fast" if time_diff < 0 else "too slow"
            timing_msg = f"Correct note but {direction} by {abs(round(time_diff, 2))}s"
            self.mistakes.append({
                "type": "timing_error",
                "note": played_note,
                "delay": round(time_diff, 2),
                "direction": direction,
                "position": self.current_index,
            })
        else:
            timing_msg = None

        self.correct += 1
        self.streak += 1
        if self.streak > self.max_streak:
            self.max_streak = self.streak

        self.current_index += 1

        next_note = (
            self.expected_notes[self.current_index]
            if self.current_index < len(self.expected_notes)
            else None
        )

        is_complete = self.current_index >= len(self.expected_notes)

        return {
            "status": "correct",
            "message": timing_msg if timing_msg else "Great!",
            "expected_next": next_note,
            "current_index": self.current_index,
            "advance": True,
            "streak": self.streak,
            "progress": f"{self.current_index}/{len(self.expected_notes)}",
            "song_complete": is_complete,
        }

    def get_summary(self) -> dict:
        total = len(self.expected_notes)
        note_accuracy = round((self.correct / total) * 100, 1) if total > 0 else 0
        timing_accuracy = round(
            ((self.correct - self.timing_errors) / total) * 100, 1
        ) if total > 0 else 0
        final_score = round((note_accuracy * 0.7) + (timing_accuracy * 0.3), 1)

        wrong_notes = [m for m in self.mistakes if m["type"] == "wrong_note"]
        most_missed = []
        if wrong_notes:
            counted = Counter(m["expected"] for m in wrong_notes)
            most_missed = [
                {"note": n, "times": c}
                for n, c in counted.most_common(3)
            ]

        return {
            "correct": self.correct,
            "wrong": self.wrong,
            "total": total,
            "note_accuracy": note_accuracy,
            "timing_accuracy": timing_accuracy,
            "final_score": final_score,
            "timing_errors": self.timing_errors,
            "max_streak": self.max_streak,
            "most_missed_notes": most_missed,
            "mistakes": self.mistakes,
        }