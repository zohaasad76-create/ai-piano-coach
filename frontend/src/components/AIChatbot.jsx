// src/components/AIChatbot.jsx
import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../api";

const SUGGESTED = [
  "What song should I learn as a beginner?",
  "How do I improve my timing?",
  "Explain major scales simply",
  "Best 30-min practice routine?",
  "How do I play chords smoothly?",
];

export default function AIChatbot() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hey! I'm The Architect 🎹 Ask me anything about piano — songs, technique, theory, practice tips.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", text: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      // Build history excluding the latest user message (already appended above)
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const data = await sendChatMessage(msg, history);
      setMessages([...updated, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages([
        ...updated,
        { role: "assistant", text: "Couldn't reach the AI. Is Ollama running? 🎹" },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 mb-2 rounded-xl bg-neutral-50">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg">
          <span
            className="material-symbols-outlined text-white text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
        </div>
        <div>
          <h3 className="font-headline font-bold text-on-surface">The Architect</h3>
          <p className="text-xs text-neutral-500 italic">Listening to your rhythm...</p>
        </div>
        <div className="ml-auto w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#4ade80]" title="Ollama connected" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-2 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 items-end ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {m.role === "assistant" && (
              <span className="text-xl mb-1">🎹</span>
            )}
            <div
              className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                ${m.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-neutral-100 text-neutral-800 rounded-bl-sm"
                }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-end">
            <span className="text-xl mb-1">🎹</span>
            <div className="bg-neutral-100 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-indigo-400 inline-block animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested chips — only at start */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 py-3">
          {SUGGESTED.map((q, i) => (
            <button
              key={i}
              onClick={() => send(q)}
              className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 items-end pt-3 border-t border-neutral-100">
        <textarea
          ref={inputRef}
          className="flex-1 bg-neutral-100 border-none rounded-xl px-4 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-400 font-body"
          placeholder="Ask about piano, songs, technique..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          disabled={loading}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <span className="material-symbols-outlined text-lg">arrow_upward</span>
        </button>
      </div>
    </div>
  );
}