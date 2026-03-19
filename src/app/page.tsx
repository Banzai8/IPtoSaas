"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  source?: "knowledge_base" | "pdf" | "both" | "none";
}

export default function ChatPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [chatPassword, setChatPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasMessages = messages.length > 0 || loading;

  useEffect(() => {
    if (hasMessages) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, hasMessages]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/chat-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: chatPassword }),
    });
    if (res.ok) {
      setAuthenticated(true);
    } else {
      setLoginError("Incorrect password. Please try again.");
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content, source: data.source },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  }

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-2">Marketing Coach AI</h1>
          <p className="text-gray-400 mb-6 text-sm">Enter your access password to start chatting.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Access Password
              </label>
              <input
                type="password"
                value={chatPassword}
                onChange={(e) => setChatPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                required
              />
            </div>
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              Access Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Input box (shared between centered and sticky states) ─────────────────
  const inputBox = (
    <form onSubmit={handleSend} className="flex gap-3 items-end w-full">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={autoResize}
        onKeyDown={handleKeyDown}
        rows={1}
        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
        placeholder="Ask about online marketing..."
        style={{ overflowY: "auto" }}
      />
      <button
        type="submit"
        disabled={!input.trim() || loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-5 py-3 rounded-xl transition-colors font-medium text-sm shrink-0"
      >
        Send
      </button>
    </form>
  );

  // ── Chat screen ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white">Marketing Coach AI</h1>
          <p className="text-xs text-gray-400">Online Marketing Coaching App</p>
        </div>
        <button
          onClick={() => { setAuthenticated(false); setMessages([]); }}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Logout
        </button>
      </header>

      {!hasMessages ? (
        // ── CENTERED state: welcome + input in the middle ──────────────────
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">How can I help you today?</h2>
            <p className="text-gray-500 text-sm">Ask me anything about online marketing.</p>
          </div>
          <div className="w-full max-w-2xl">
            {inputBox}
          </div>
        </div>
      ) : (
        // ── CONVERSATION state: messages + sticky input ────────────────────
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6 pb-4">
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-gray-800 text-gray-100 rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && msg.source && msg.source !== "none" && (
                    <span className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      {msg.source === "knowledge_base" && "Answered from knowledge base"}
                      {msg.source === "pdf" && "Answered from PDF"}
                      {msg.source === "both" && "Answered from PDF + knowledge base"}
                    </span>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1 items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Sticky input */}
          <div className="shrink-0 border-t border-gray-800 bg-gray-900 px-4 py-4">
            <div className="max-w-2xl mx-auto">
              {inputBox}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
