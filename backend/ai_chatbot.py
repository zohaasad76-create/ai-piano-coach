# ai_chatbot.py
import requests
from fastapi import APIRouter
from pydantic import BaseModel

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2"

router = APIRouter()

SYSTEM_PROMPT = """You are an expert AI piano tutor assistant named "The Architect". You ONLY answer questions related to:
- Piano playing techniques and tips
- Music theory (scales, chords, rhythm, notation)
- Song recommendations and practice advice
- Piano lessons for beginners, intermediate, or advanced players
- Specific songs to learn, their difficulty, and how to approach them
- Finger placement, posture, and hand position
- Practice routines and schedules
- Music genres and styles on piano
- Piano equipment (keyboards, digital pianos, pedals, etc.)

If the user asks ANYTHING not related to piano or music, you MUST respond with ONLY this exact message:
"I'm your piano tutor — I can only help with piano and music questions! 🎹 Try asking me which song to learn next, or how to improve your technique."

Do NOT answer questions about coding, math, general knowledge, news, sports, or anything unrelated to piano/music.
Stay strictly on topic no matter how the user phrases the request.

Be warm, encouraging, and specific. Keep answers concise (2-4 sentences) unless a detailed explanation is truly needed."""


# ── Models ───

class ChatMessage(BaseModel):
    role: str        # "user" or "assistant"
    text: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []   # full conversation so far for context


# ── Helpers ───

def build_prompt(message: str, history: list[ChatMessage]) -> str:
    """
    Builds the full prompt:
      system instructions + conversation history + new user message
    """
    lines = [SYSTEM_PROMPT, ""]

    if history:
        lines.append("Conversation so far:")
        for turn in history:
            label = "User" if turn.role == "user" else "Assistant"
            lines.append(f"{label}: {turn.text}")
        lines.append("")

    lines.append(f"User: {message}")
    lines.append("Assistant:")

    return "\n".join(lines)


def call_ollama(prompt: str) -> str:
    """
    Sends prompt to local Ollama and returns response text.
    """
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "num_predict": 250,
            },
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["response"].strip()


# ── Routes ───

@router.post("/chat")
def chat(payload: ChatRequest):
    """
    Main chatbot endpoint.

    Request:
        {
            "message": "What song should I learn as a beginner?",
            "history": [
                { "role": "user",      "text": "Hi!" },
                { "role": "assistant", "text": "Hey! Ask me anything about piano." }
            ]
        }

    Response:
        {
            "reply": "Start with Fur Elise ...",
            "model": "llama3.2"
        }
    """
    prompt = build_prompt(payload.message, payload.history)

    try:
        reply = call_ollama(prompt)
    except requests.exceptions.Timeout:
        reply = "Sorry, the AI is taking too long right now. Please try again in a moment! 🎹"
    except requests.exceptions.ConnectionError:
        reply = "Cannot connect to Ollama. Make sure it is running with: ollama serve"
    except Exception:
        reply = "Something went wrong on my end. Please try again!"

    return {
        "reply": reply,
        "model": MODEL,
    }


@router.get("/chat/health")
def chat_health():
    """
    Health check — confirms Ollama is reachable and llama3.2 is available.

    Response:
        {
            "ollama_running": true,
            "model_ready": true,
            "model": "llama3.2",
            "available_models": ["llama3.2", ...]
        }
    """
    try:
        res = requests.get("http://localhost:11434/api/tags", timeout=5)
        models = [m["name"] for m in res.json().get("models", [])]
        model_ready = any(MODEL in m for m in models)
        return {
            "ollama_running": True,
            "model_ready": model_ready,
            "model": MODEL,
            "available_models": models,
        }
    except Exception:
        return {
            "ollama_running": False,
            "model_ready": False,
            "model": MODEL,
            "available_models": [],
        }
