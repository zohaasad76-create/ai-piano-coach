# midi_parser.py
import pretty_midi
import os


def parse_midi(file_path: str) -> dict:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"MIDI file not found: {file_path}")

    midi = pretty_midi.PrettyMIDI(file_path)

    notes = []
    timings = []
    durations = []

    for instrument in midi.instruments:
        if not instrument.is_drum:
            for note in sorted(instrument.notes, key=lambda n: n.start):
                note_name = pretty_midi.note_number_to_name(note.pitch)
                notes.append(note_name)
                timings.append(round(note.start, 3))
                durations.append(round(note.end - note.start, 3))

    tempo = midi.estimate_tempo()

    return {
        "notes": notes,
        "timings": timings,
        "durations": durations,
        "tempo": round(float(tempo), 1),
        "duration": round(midi.get_end_time(), 2),
        "total_notes": len(notes),
    }