"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  source?: "knowledge_base" | "pdf" | "both" | "none";
}

function Logo() {
  return (
    <span className="text-xl font-bold tracking-wide">
      <span className="text-white">IP TO </span>
      <span className="text-orange-500 italic">SaaS</span>
    </span>
  );
}

function SiteHeader({ onLogout }: { onLogout?: () => void }) {
  return (
    <header className="bg-[#0e0f17] border-b border-[#1e2030] px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left — help link */}
        <a
          href="mailto:info@iptosaas.nl"
          className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Hulp nodig? <span className="underline">Klik hier om contact op te nemen</span></span>
        </a>

        {/* Center — logo */}
        <Logo />

        {/* Right — dashboard / logout */}
        <div className="flex items-center gap-3">
          <a
            href="/admin"
            className="text-sm text-white border border-white/30 hover:border-white/60 px-4 py-1.5 rounded-lg transition-colors"
          >
            Dashboard
          </a>
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Uitloggen
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default function ChatPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [chatPassword, setChatPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
      const data = await res.json();
      setLoginError(data.error === "Password has expired"
        ? "Dit wachtwoord is verlopen. Neem contact op voor toegang."
        : "Ongeldig wachtwoord. Probeer het opnieuw.");
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

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
        { role: "assistant", content: "Er is iets misgegaan. Probeer het opnieuw." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setAuthenticated(false);
    setMessages([]);
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0b0c14] flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-[#111218] rounded-2xl p-8 w-full max-w-md border border-[#1e2030]">
            <div className="text-center mb-6">
              <Logo />
              <p className="text-gray-400 text-sm mt-3">Voer je toegangswachtwoord in om te starten.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Toegangswachtwoord
                </label>
                <input
                  type="password"
                  value={chatPassword}
                  onChange={(e) => setChatPassword(e.target.value)}
                  className="w-full bg-[#0b0c14] border border-[#1e2030] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Voer je wachtwoord in"
                  required
                />
              </div>
              {loginError && (
                <p className="text-red-400 text-sm">{loginError}</p>
              )}
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                Toegang
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c14] flex flex-col">
      <SiteHeader onLogout={handleLogout} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl w-full mx-auto">
        {messages.length === 0 && (
          <div className="text-center mt-20">
            <p className="text-lg text-white mb-2">Hoe kan ik je helpen?</p>
            <p className="text-sm text-gray-500">Stel een vraag over online marketing.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-orange-500 text-white rounded-br-sm"
                  : "bg-[#111218] border border-[#1e2030] text-gray-100 rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "assistant" && msg.source && msg.source !== "none" && (
              <span className="mt-1 text-xs text-gray-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                {msg.source === "knowledge_base" && "Beantwoord vanuit kennisbank"}
                {msg.source === "pdf" && "Beantwoord vanuit PDF"}
                {msg.source === "both" && "Beantwoord vanuit PDF + kennisbank"}
              </span>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#111218] border border-[#1e2030] rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#1e2030] bg-[#0e0f17] px-4 py-4">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            rows={1}
            className="flex-1 bg-[#111218] border border-[#1e2030] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
            placeholder="Stel een vraag over online marketing..."
            style={{ maxHeight: "160px", overflowY: "auto" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white px-5 py-3 rounded-xl transition-colors font-medium text-sm shrink-0"
          >
            Verstuur
          </button>
        </form>
      </div>
    </div>
  );
}
